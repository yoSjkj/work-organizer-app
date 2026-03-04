/**
 * ITSM Task 페이지 DOM 구조 진단 스크립트
 *
 * 실행:
 *   node automation/scripts/debug-itsm.js
 *
 * 출력:
 *   screenshots/itsm-task-list.png  — Task 목록 페이지
 *   screenshots/itsm-task-detail.png — Task 상세 페이지
 *   sessions/itsm-task-dom.html     — Task 상세 페이지 HTML 덤프
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

let config
try {
  config = require('../config.json')
} catch {
  console.error('❌ config.json 없음')
  process.exit(1)
}

const SESSION_PATH   = path.join(__dirname, '../sessions/browser-session.json')
const SCREENSHOT_DIR = path.join(__dirname, '../../screenshots')
const HTML_PATH      = path.join(__dirname, '../sessions/itsm-task-dom.html')

// ── 로그인 처리 ────────────────────────────────────────────────────
async function loginIfNeeded(page) {
  const sel = config.itsm?.selectors || {}
  const usernameSel = sel.username || "input[name='user_name']"

  const isLoginPage = await page.locator(usernameSel).isVisible({ timeout: 3000 }).catch(() => false)
  if (!isLoginPage) {
    console.log('   세션 유효 — 로그인 불필요')
    return
  }

  console.log('   로그인 필요 — ID/PW 자동 입력 중...')
  const { username, password } = config.itsm || {}
  if (!username || !password) {
    console.error('❌ config.itsm.username / password 없음')
    process.exit(1)
  }

  await page.fill(usernameSel, username)
  await page.fill(sel.password || "input[name='user_password']", password)
  await page.click(sel.loginButton || '#sysverb_login')

  // OTP 화면 감지 → 수동 입력 대기
  const otpSel = sel.otpInput || "input[name='answer']"
  const otpVisible = await page.locator(otpSel).isVisible({ timeout: 5000 }).catch(() => false)
  if (otpVisible) {
    console.log('   OTP 화면 감지 — 90초 안에 OTP를 입력하고 제출하세요...')
    await page.waitForURL((url) => !url.href.includes('login'), { timeout: 90000 }).catch(() => {})
  } else {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
  }
  console.log('   로그인 완료')
}

// ── iframe 포함 전체 frame에서 Task 링크 탐색 ─────────────────────
async function findTaskLinks(page) {
  const frames = page.frames()
  console.log(`   전체 frame 수: ${frames.length}`)
  frames.forEach((f, i) => {
    const url = f.url()
    if (url && url !== 'about:blank')
      console.log(`   [frame ${i}] name="${f.name()}" → ${url.slice(0, 100)}`)
  })

  for (const frame of frames) {
    try {
      const links = await frame.locator('a').filter({ hasText: /^TASK/i }).all()
      if (links.length > 0) {
        console.log(`   ✅ frame "${frame.name()}"에서 TASK 링크 ${links.length}개 발견`)
        return { frame, links }
      }
    } catch { /* 접근 불가 frame 무시 */ }
  }
  return { frame: null, links: [] }
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

  const sessionOpts = fs.existsSync(SESSION_PATH) ? { storageState: SESSION_PATH } : {}
  if (!fs.existsSync(SESSION_PATH)) console.log('⚠️  세션 파일 없음 — 새 세션으로 시작')

  console.log('브라우저 시작 중...')
  const browser = await chromium.launch({ headless: false, slowMo: 200 })
  const context  = await browser.newContext(sessionOpts)
  const page     = await context.newPage()

  // ── 1. Task 목록 페이지 이동 ────────────────────────────────────
  // config.itsm.taskListUrl 우선, 없으면 itsm.url (홈)
  const listUrl = config.itsm?.taskListUrl || config.itsm?.url
  if (!listUrl) {
    console.error('❌ config.itsm.taskListUrl 또는 config.itsm.url 없음')
    await browser.close()
    process.exit(1)
  }

  console.log(`\n[1] 이동: ${listUrl}`)
  await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await loginIfNeeded(page)

  // gsft_main iframe이 있으면 그 안이 로드될 때까지 대기
  const gsftFrame = page.frames().find(f => f.name() === 'gsft_main')
  if (gsftFrame) {
    console.log('   gsft_main iframe 감지 — 콘텐츠 로드 대기 중...')
    await gsftFrame.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {})
  }
  // 추가 렌더링 대기
  await page.waitForTimeout(5000)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'itsm-task-list.png'), fullPage: true })
  console.log('📸 screenshots/itsm-task-list.png')

  // ── 2. Task 링크 탐색 (전체 frame) ──────────────────────────────
  console.log('\n[2] Task 링크 탐색 중...')
  const { frame: taskFrame, links: taskLinks } = await findTaskLinks(page)

  if (taskLinks.length === 0) {
    console.log('\n⚠️  TASK 링크를 찾지 못했습니다.')
    console.log('   가능한 원인:')
    console.log('   1. config.itsm.taskListUrl이 없음 → Task 목록 URL을 직접 config에 추가하세요')
    console.log('   2. 오늘 처리할 Task가 없음')
    console.log('   3. Task 번호 패턴이 TASK가 아닌 다른 형식')
    console.log('\n   현재 페이지의 모든 링크:')

    for (const frame of page.frames()) {
      try {
        const allLinks = await frame.locator('a').all()
        for (const link of allLinks.slice(0, 40)) {
          const text = (await link.textContent().catch(() => '')).trim()
          if (text && text.length < 60 && text.length > 2)
            console.log(`     [${frame.name() || 'main'}] "${text}"`)
        }
      } catch { /* 무시 */ }
    }

    await browser.close()
    return
  }

  // Task 링크 목록 출력
  for (let i = 0; i < Math.min(taskLinks.length, 5); i++) {
    const text = (await taskLinks[i].textContent().catch(() => '')).trim()
    const href = await taskLinks[i].getAttribute('href').catch(() => '')
    console.log(`   Task[${i}]: "${text}" → ${href?.slice(0, 100)}`)
  }

  // ── 3. 첫 번째 Task 클릭 → 상세 페이지 분석 ────────────────────
  const firstTaskText = (await taskLinks[0].textContent()).trim()
  console.log(`\n[3] 첫 번째 Task 클릭: "${firstTaskText}"`)
  await taskLinks[0].click()
  await page.waitForTimeout(5000)

  // 상세 페이지도 iframe 안일 수 있으므로 대기
  const detailFrame = page.frames().find(f => f.name() === 'gsft_main') || page
  await (detailFrame === page
    ? page.waitForLoadState('domcontentloaded', { timeout: 10000 })
    : detailFrame.waitForLoadState('domcontentloaded', { timeout: 10000 })
  ).catch(() => {})
  await page.waitForTimeout(3000)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'itsm-task-detail.png'), fullPage: true })
  console.log('📸 screenshots/itsm-task-detail.png')

  // ── 4. 상세 페이지 필드 분석 ────────────────────────────────────
  console.log('\n[4] 상세 페이지 입력 필드 분석...')

  async function analyzeFrame(frame, label) {
    try {
      const inputs = await frame.evaluate(() =>
        Array.from(document.querySelectorAll('input, select, textarea'))
          .filter(el => el.name || el.id)
          .map(el => ({
            tag: el.tagName,
            name: el.name || '',
            id: el.id || '',
            type: el.type || '',
            value: el.value?.slice(0, 30) || '',
          }))
      )
      if (inputs.length > 0) {
        console.log(`\n   [${label}] 필드 ${inputs.length}개:`)
        inputs.forEach(el =>
          console.log(`     ${el.tag}[name="${el.name}"] id="${el.id}" value="${el.value}"`)
        )
      }

      const buttons = await frame.evaluate(() =>
        Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
          .map(el => ({
            tag: el.tagName,
            id: el.id || '',
            text: (el.textContent || el.value || '').trim().slice(0, 50),
          }))
          .filter(el => el.text)
      )
      if (buttons.length > 0) {
        console.log(`\n   [${label}] 버튼 ${buttons.length}개:`)
        buttons.forEach(b => console.log(`     ${b.tag}[id="${b.id}"] "${b.text}"`))
      }

      // Effort/결과 관련 필드 특별 탐색
      const effortFields = await frame.evaluate(() => {
        const keywords = ['effort', 'effortdur', 'result', 'check_result', 'state', 'close_code', 'work_note']
        return Array.from(document.querySelectorAll('[name]'))
          .filter(el => keywords.some(k => (el.getAttribute('name') || '').toLowerCase().includes(k)))
          .map(el => ({ tag: el.tagName, name: el.name, value: el.value?.slice(0, 30) || '' }))
      })
      if (effortFields.length > 0) {
        console.log(`\n   [${label}] ⭐ Effort/Result 관련 필드:`)
        effortFields.forEach(f => console.log(`     ${f.tag}[name="${f.name}"] value="${f.value}"`))
      }

      return inputs.length + buttons.length
    } catch { return 0 }
  }

  // 메인 페이지 + 모든 frame 분석
  let totalFound = await analyzeFrame(page, 'main')
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue
    const count = await analyzeFrame(frame, frame.name() || 'frame')
    totalFound += count
  }

  if (totalFound === 0) {
    console.log('   ⚠️  필드 없음 — 페이지 로딩이 덜 됐을 수 있습니다')
  }

  // ── 5. HTML 덤프 ─────────────────────────────────────────────────
  const targetFrame = page.frames().find(f => f.name() === 'gsft_main') || page.mainFrame()
  const html = await targetFrame.content().catch(() => page.content())
  fs.mkdirSync(path.dirname(HTML_PATH), { recursive: true })
  fs.writeFileSync(HTML_PATH, html, 'utf-8')
  console.log(`\n📄 HTML 덤프: sessions/itsm-task-dom.html`)

  console.log('\n✅ 분석 완료')
  await browser.close()
}

main().catch((err) => {
  console.error(`❌ 오류: ${err.message}`)
  process.exit(1)
})
