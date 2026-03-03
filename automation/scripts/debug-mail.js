/**
 * 메일 페이지 DOM 구조 진단 스크립트
 * 실행 후 screenshots/mail-debug.png 와 sessions/mail-dom.html 생성
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const config = require('../config.json')
const SESSION_PATH = path.join(__dirname, '../sessions/browser-session.json')
const SCREENSHOT_PATH = path.join(__dirname, '../../screenshots/mail-debug.png')
const HTML_PATH = path.join(__dirname, '../sessions/mail-dom.html')

async function dumpFrameInfo(target, label) {
  console.log(`\n=== [${label}] 구조 분석 ===`)

  // 최종 URL 확인
  try { console.log(`현재 URL: ${target.url()}`) } catch {}

  // tr 개수
  const trCount = await target.locator('tr').count().catch(() => 0)
  console.log(`tr 개수: ${trCount}`)

  // iframe 목록
  if (target.frames) {
    const frames = target.frames()
    console.log(`\n프레임 수: ${frames.length}`)
    frames.forEach((f, i) => console.log(`  [${i}] name="${f.name()}" url=${f.url().slice(0, 100)}`))
  }

  // tr 클래스 샘플
  if (trCount > 0) {
    const trClasses = await target.evaluate(() => {
      return Array.from(document.querySelectorAll('tr')).slice(0, 15).map(tr =>
        `class="${tr.className || ''}" | id="${tr.id || ''}" | ${tr.textContent.trim().slice(0, 60)}`
      ).join('\n')
    }).catch(() => '(평가 실패)')
    console.log(`\ntr 샘플:\n${trClasses}`)
  }

  // 링크 샘플 (메일 목록일 가능성)
  const linkTexts = await target.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).slice(0, 20).map(a =>
      `href="${a.getAttribute('href')?.slice(0, 60) || ''}" text="${a.textContent.trim().slice(0, 50)}"`
    ).join('\n')
  }).catch(() => '(평가 실패)')
  console.log(`\n링크 샘플 (상위 20개):\n${linkTexts}`)

  // 미읽음 카운트 후보 탐색
  const unreadCandidates = await target.evaluate(() => {
    const candidates = []
    document.querySelectorAll('[class*="unread"], [class*="count"], [id*="unread"], [id*="count"]').forEach(el => {
      candidates.push(`tag=${el.tagName} class="${el.className}" text="${el.textContent.trim().slice(0, 30)}"`)
    })
    return candidates.slice(0, 10).join('\n') || '(없음)'
  }).catch(() => '(평가 실패)')
  console.log(`\n미읽음 후보:\n${unreadCandidates}`)
}

async function main() {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error('❌ 세션 파일 없음. 먼저 세션 갱신을 실행하세요.')
    process.exit(1)
  }

  console.log('브라우저 시작 중...')
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const context = await browser.newContext({ storageState: SESSION_PATH })
  const page = await context.newPage()

  const url = config.mail?.url
  if (!url) {
    console.error('❌ config.json에 mail.url이 없습니다')
    await browser.close()
    process.exit(1)
  }

  console.log(`페이지 이동: ${url}`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

  console.log('10초 대기 중 (리다이렉트/SSO 처리)...')
  await page.waitForTimeout(10000)

  console.log(`\n최종 URL: ${page.url()}`)

  // 스크린샷
  fs.mkdirSync(path.dirname(SCREENSHOT_PATH), { recursive: true })
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true })
  console.log(`📸 스크린샷: ${SCREENSHOT_PATH}`)

  // 메인 페이지 분석
  await dumpFrameInfo(page, '메인 페이지')

  // iframe 내부 분석
  const frames = page.frames().filter(f => f !== page.mainFrame())
  for (let i = 0; i < frames.length; i++) {
    try {
      await dumpFrameInfo(frames[i], `iframe[${i}] ${frames[i].name() || frames[i].url().slice(0, 40)}`)
    } catch (e) {
      console.log(`iframe[${i}] 분석 실패: ${e.message}`)
    }
  }

  // HTML 저장 (가장 내용 많은 프레임)
  const allFrames = page.frames()
  let richestFrame = page
  let maxLen = 0
  for (const f of allFrames) {
    try {
      const html = await f.content()
      if (html.length > maxLen) { maxLen = html.length; richestFrame = f }
    } catch {}
  }
  const html = await richestFrame.content().catch(() => '')
  fs.writeFileSync(HTML_PATH, html, 'utf-8')
  console.log(`\n📄 HTML 저장 (${richestFrame.url().slice(0, 60)}): ${HTML_PATH}`)

  console.log('\n✅ 진단 완료. 브라우저를 닫습니다.')
  await browser.close()
}

main().catch((err) => {
  console.error(`❌ 오류: ${err.message}`)
  process.exit(1)
})
