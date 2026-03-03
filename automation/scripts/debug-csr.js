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
  if (gsftFrame) {
    const html = await gsftFrame.content()
    fs.writeFileSync(HTML_PATH, html, 'utf-8')
    console.log(`\n📄 iframe HTML 저장: ${HTML_PATH} (${Math.round(html.length / 1024)}KB)`)

    // 테이블 구조 요약 출력
    const rows = await gsftFrame.locator('tr').count()
    console.log(`\niframe 내 tr 개수: ${rows}`)

    if (rows > 0) {
      const firstRow = await gsftFrame.locator('tr').nth(1).innerHTML().catch(() => '(읽기 실패)')
      console.log('\n--- 첫 번째 tr HTML ---')
      console.log(firstRow.slice(0, 1000))
      console.log('--- 끝 ---')
    }
  } else {
    console.log('\n⚠️ gsft_main iframe을 찾지 못했습니다')
    // 전체 페이지 HTML 저장
    const html = await page.content()
    fs.writeFileSync(HTML_PATH, html, 'utf-8')
    console.log(`📄 전체 페이지 HTML 저장: ${HTML_PATH}`)
  }

  console.log('\n✅ 진단 완료. 브라우저를 닫습니다.')
  await browser.close()
}

main().catch((err) => {
  console.error(`❌ 오류: ${err.message}`)
  process.exit(1)
})
