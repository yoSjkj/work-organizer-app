/**
 * 세션 추출 스크립트
 * 열려있는 Chrome(CDP)에서 세션을 추출해 headless 모니터링에 재사용
 *
 * 사용: node automation/scripts/extract-sessions.js
 */

const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SESSION_PATH = path.join(__dirname, '../sessions/browser-session.json')

async function extractSessions() {
  const cdpUrl = 'http://localhost:9222'
  console.log(`Chrome 연결 중... (${cdpUrl})`)

  const browser = await chromium.connectOverCDP(cdpUrl)
  const context = browser.contexts()[0]

  fs.mkdirSync(path.dirname(SESSION_PATH), { recursive: true })
  await context.storageState({ path: SESSION_PATH })

  console.log(`✅ 세션 저장 완료: ${SESSION_PATH}`)
  await browser.close()
}

extractSessions().catch((err) => {
  console.error(`❌ 오류: ${err.message}`)
  process.exit(1)
})
