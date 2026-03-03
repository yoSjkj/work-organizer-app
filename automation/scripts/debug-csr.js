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

  for (let i = 0; i < Math.min(ritmLinks.length, 3); i++) {
    const text = await ritmLinks[i].textContent()
    const href = await ritmLinks[i].getAttribute('href')
    // 링크의 부모 tr까지 올라가서 HTML 확인
    const rowHtml = await ritmLinks[i].evaluate(el => {
      let node = el
      while (node && node.tagName !== 'TR') node = node.parentElement
      return node ? node.outerHTML.slice(0, 800) : '(tr 없음)'
    })
    console.log(`\n--- RITM[${i}]: ${text?.trim()} ---`)
    console.log(`href: ${href}`)
    console.log(`row HTML:\n${rowHtml}`)
  }

  // tr 전체 개수 및 첫 data row 확인
  const trCount = await target.locator('tr').count()
  console.log(`\n전체 tr 개수: ${trCount}`)

  // 클래스명 있는 tr 샘플
  const trClasses = await target.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr')).slice(0, 20)
    return trs.map(tr => `${tr.className || '(no class)'} | ${tr.getAttribute('data-record') || ''}`).join('\n')
  })
  console.log(`\ntr 클래스 샘플:\n${trClasses}`)

  const html = await (gsftFrame ? gsftFrame.content() : page.content())
  fs.writeFileSync(HTML_PATH, html, 'utf-8')
  console.log(`\n📄 HTML 저장: ${HTML_PATH}`)

  console.log('\n✅ 진단 완료. 브라우저를 닫습니다.')
  await browser.close()
}

main().catch((err) => {
  console.error(`❌ 오류: ${err.message}`)
  process.exit(1)
})
