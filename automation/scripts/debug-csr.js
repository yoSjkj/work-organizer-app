/**
 * CSR 페이지 DOM 구조 진단 스크립트
 * 실행 후 screenshots/csr-debug.png 와 sessions/csr-dom.html 생성
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const config = require('../config.json')
const SESSION_PATH = path.join(__dirname, '../sessions/browser-session.json')
const SCREENSHOT_PATH = path.join(__dirname, '../../screenshots/csr-debug.png')
const HTML_PATH = path.join(__dirname, '../sessions/csr-dom.html')

async function main() {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error('❌ 세션 파일 없음. 먼저 세션 갱신을 실행하세요.')
    process.exit(1)
  }

  console.log('브라우저 시작 중...')
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const context = await browser.newContext({ storageState: SESSION_PATH })
  const page = await context.newPage()

  const url = config.csr?.listUrl
  if (!url) {
    console.error('❌ config.json에 csr.listUrl이 없습니다')
    await browser.close()
    process.exit(1)
  }

  console.log(`페이지 이동: ${url}`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  console.log('페이지 로드 완료. 10초 대기 중 (iframe 로드)...')
  await page.waitForTimeout(10000)

  // 스크린샷 저장
  fs.mkdirSync(path.dirname(SCREENSHOT_PATH), { recursive: true })
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true })
  console.log(`📸 스크린샷: ${SCREENSHOT_PATH}`)

  // iframe 내부 HTML 덤프
  const frames = page.frames()
  console.log(`\n발견된 프레임 수: ${frames.length}`)
  frames.forEach((f, i) => console.log(`  [${i}] name="${f.name()}" url=${f.url().slice(0, 80)}`))

  const gsftFrame = frames.find(f => f.name() === 'gsft_main')
  // iframe 없음 → 메인 페이지에서 직접 분석
  const target = gsftFrame || page

  // RITM 링크 찾기
  const ritmLinks = await target.locator('a').filter({ hasText: /^RITM/ }).all()
  console.log(`\n🔍 RITM 링크 수: ${ritmLinks.length}`)

  // ── 1. 헤더 컬럼 목록 ─────────────────────────────────────────────
  console.log('\n[1] 리스트 컬럼 헤더 분석...')
  const headers = await target.evaluate(() =>
    Array.from(document.querySelectorAll('th[id]')).map(th => ({
      id: th.id,
      text: th.textContent.trim().slice(0, 40),
    }))
  )
  if (headers.length > 0) {
    console.log('   컬럼 id / 텍스트:')
    headers.forEach(h => console.log(`     th[id="${h.id}"] → "${h.text}"`))
  } else {
    console.log('   ⚠️ th[id] 없음 — 다른 구조일 수 있음')
  }

  // ── 2. 첫 번째 row의 td 셀 headers 속성 ──────────────────────────
  console.log('\n[2] 첫 번째 row td 셀 분석...')
  if (ritmLinks.length > 0) {
    const cells = await ritmLinks[0].evaluate(el => {
      let node = el
      while (node && node.tagName !== 'TR') node = node.parentElement
      if (!node) return []
      return Array.from(node.querySelectorAll('td')).map(td => ({
        headers: td.getAttribute('headers') || '',
        className: td.className || '',
        text: td.textContent.trim().slice(0, 40),
      }))
    })
    cells.forEach((c, i) =>
      console.log(`   td[${i}] headers="${c.headers}" class="${c.className}" → "${c.text}"`)
    )

    // approval 특이 탐색
    const approvalCell = cells.find(c => c.headers.toLowerCase().includes('approval'))
    if (approvalCell) {
      console.log(`\n   ✅ approval 컬럼 발견! headers="${approvalCell.headers}" → "${approvalCell.text}"`)
    } else {
      console.log('\n   ℹ️  리스트에 approval 컬럼 없음 — 상세 팝업에서 읽어야 함')
    }
  }

  // ── 3. ⓘ 버튼 클릭 → 상세 팝업 승인 필드 ───────────────────────
  // RITM 요청번호 앞 ⓘ a태그 클릭 → 인라인 팝업에서 승인 필드 확인
  console.log('\n[3] ⓘ 버튼 클릭 → 상세 팝업 승인 필드 탐색...')
  if (ritmLinks.length > 0) {
    // RITM 링크 바로 앞 a태그 정보 출력
    const infoBtnInfo = await ritmLinks[0].evaluate(el => {
      let tr = el
      while (tr && tr.tagName !== 'TR') tr = tr.parentElement
      if (!tr) return null
      const links = Array.from(tr.querySelectorAll('a'))
      const idx = links.indexOf(el)
      const prev = idx > 0 ? links[idx - 1] : null
      return prev ? { id: prev.id, href: prev.getAttribute('href'), text: prev.textContent.trim() } : null
    })
    console.log(`   ⓘ a태그: ${JSON.stringify(infoBtnInfo)}`)

    // 첫 번째 row에서 RITM 링크 이전 a태그 클릭
    await target.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr.list_row'))
      if (!rows[0]) return
      const links = Array.from(rows[0].querySelectorAll('a'))
      const ritmIdx = links.findIndex(a => /^RITM/i.test(a.textContent.trim()))
      if (ritmIdx > 0) links[ritmIdx - 1].click()
    })
    await page.waitForTimeout(4000)
    await page.waitForTimeout(4000)
    await page.screenshot({ path: SCREENSHOT_PATH.replace('.png', '-detail.png'), fullPage: false })
    console.log(`   📸 스크린샷: screenshots/csr-debug-detail.png`)

    // 팝업/인라인 뷰에서 승인 관련 필드 탐색
    const approvalFields = await page.evaluate(() => {
      const keywords = ['approval', '승인']
      const results = []
      // input/select 탐색
      document.querySelectorAll('input, select').forEach(el => {
        const name = (el.getAttribute('name') || '').toLowerCase()
        const label = document.querySelector(`label[for="${el.id}"]`)?.textContent.trim() || ''
        if (keywords.some(k => name.includes(k) || label.includes(k))) {
          results.push({
            tag: el.tagName,
            name: el.getAttribute('name') || '',
            id: el.id || '',
            value: el.value?.slice(0, 50) || '',
            label,
          })
        }
      })
      // span/td 탐색 (읽기 전용 필드)
      document.querySelectorAll('td, span, div').forEach(el => {
        const text = el.textContent.trim()
        if ((text === '요청됨' || text === '승인됨' || text === '거부됨') && el.children.length === 0) {
          const name = el.getAttribute('name') || el.id || ''
          results.push({ tag: el.tagName, name, id: el.id, value: text, label: '(텍스트 매칭)' })
        }
      })
      return results
    })

    if (approvalFields.length > 0) {
      console.log('   ✅ 승인 관련 필드:')
      approvalFields.forEach(f =>
        console.log(`     ${f.tag}[name="${f.name}" id="${f.id}"] label="${f.label}" value="${f.value}"`)
      )
    } else {
      console.log('   ⚠️ 승인 필드 못 찾음 — HTML 덤프 확인 필요')
    }

    // 팝업 HTML 덤프
    const popupHtml = await page.evaluate(() => {
      const popup = document.querySelector('.sc_req_item_list, form[name="sc_req_item"], .related-list-context, [id*="sc_req_item"]')
      return popup ? popup.outerHTML.slice(0, 5000) : document.body.innerHTML.slice(0, 5000)
    })
    fs.mkdirSync(path.dirname(HTML_PATH), { recursive: true })
    fs.writeFileSync(HTML_PATH.replace('.html', '-detail.html'), popupHtml, 'utf-8')
    console.log(`   📄 팝업 HTML: sessions/csr-dom-detail.html`)
  }

  // ── 4. 원본 HTML 덤프 ─────────────────────────────────────────────
  const html = await (gsftFrame ? gsftFrame.content() : page.content())
  fs.writeFileSync(HTML_PATH, html, 'utf-8')
  console.log(`\n📄 리스트 HTML 저장: ${HTML_PATH}`)

  console.log('\n✅ 진단 완료. 브라우저를 닫습니다.')
  await browser.close()
}

main().catch((err) => {
  console.error(`❌ 오류: ${err.message}`)
  process.exit(1)
})
