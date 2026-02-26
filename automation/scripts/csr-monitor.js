/**
 * CSR 모니터링 스크립트
 *
 * stdout에 JSON Lines 형식으로 이벤트 출력:
 *   {"type": "log",        "message": "...", "ts": 1234}
 *   {"type": "csr_new",    "data": {ritm, title, status, assignee, category}}
 *   {"type": "csr_update", "data": {ritm, title, status, assignee, category}}
 *
 * 사용: node automation/scripts/csr-monitor.js
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

// config.json이 없으면 template으로 대체
let config
try {
  config = require('../config.json')
} catch {
  emit('log', 'config.json 없음. automation/config.json을 먼저 설정하세요.')
  process.exit(1)
}

const SESSION_PATH = path.join(__dirname, '../sessions/csr-session.json')
const POLL_INTERVAL_MS = 5 * 60 * 1000  // 5분

// sessions 디렉토리 생성
fs.mkdirSync(path.dirname(SESSION_PATH), { recursive: true })

/** JSON Lines 이벤트 출력 */
function emit(type, messageOrData) {
  if (type === 'log') {
    process.stdout.write(JSON.stringify({ type: 'log', message: messageOrData, ts: Date.now() }) + '\n')
  } else {
    process.stdout.write(JSON.stringify({ type, data: messageOrData, ts: Date.now() }) + '\n')
  }
}

/** CSR 목록을 파싱하여 반환 */
async function fetchCsrList(page) {
  const csrConfig = config.csr
  if (!csrConfig || !csrConfig.listUrl) {
    emit('log', 'config.csr.listUrl이 설정되지 않았습니다')
    return []
  }

  await page.goto(csrConfig.listUrl, { waitUntil: 'networkidle', timeout: 30000 })

  const sel = csrConfig.selectors || {}
  const rowSelector = sel.row || 'tr[data-record]'
  const titleSelector = sel.title || 'td.col-short_description'
  const statusSelector = sel.status || 'td.col-state'
  const assigneeSelector = sel.assignee || 'td.col-assigned_to'

  const rows = await page.locator(rowSelector).all()
  const items = []

  for (const row of rows) {
    try {
      const ritm = await row.getAttribute('data-record') || await row.getAttribute('sys_id') || ''
      const title = await row.locator(titleSelector).textContent().catch(() => '')
      const status = await row.locator(statusSelector).textContent().catch(() => '')
      const assignee = await row.locator(assigneeSelector).textContent().catch(() => '')

      if (ritm) {
        items.push({
          ritm: ritm.trim(),
          title: title.trim(),
          status: status.trim(),
          assignee: assignee.trim(),
        })
      }
    } catch { /* 행 파싱 오류 무시 */ }
  }

  return items
}

async function main() {
  emit('log', 'CSR 모니터링 시작')

  const csrConfig = config.csr
  if (!csrConfig) {
    emit('log', 'config.json에 csr 설정이 없습니다')
    process.exit(1)
  }

  const sessionExists = fs.existsSync(SESSION_PATH)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext(
    sessionExists ? { storageState: SESSION_PATH } : {}
  )
  const page = await context.newPage()

  // 로그인 처리
  const loginUrl = csrConfig.loginUrl || csrConfig.url
  if (loginUrl) {
    emit('log', `${loginUrl} 접속 중`)
    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 30000 })

    const sel = csrConfig.selectors || {}
    const needLogin = sel.username
      ? await page.locator(sel.username).isVisible().catch(() => false)
      : false

    if (needLogin) {
      emit('log', '로그인 시도')
      await page.fill(sel.username, csrConfig.username || '')
      await page.fill(sel.password || 'input[type="password"]', csrConfig.password || '')
      await page.click(sel.loginButton || 'button[type="submit"]')
      await page.waitForLoadState('networkidle')
      await context.storageState({ path: SESSION_PATH })
      emit('log', '로그인 완료, 세션 저장됨')
    } else {
      emit('log', '기존 세션 사용')
    }
  }

  const knownItems = new Map()

  const poll = async () => {
    emit('log', 'CSR 목록 확인 중')
    try {
      const items = await fetchCsrList(page)
      emit('log', `${items.length}건 확인됨`)

      for (const item of items) {
        const existing = knownItems.get(item.ritm)
        if (!existing) {
          knownItems.set(item.ritm, item)
          emit('csr_new', item)
        } else if (existing.status !== item.status) {
          knownItems.set(item.ritm, item)
          emit('csr_update', item)
        }
      }
    } catch (err) {
      emit('log', `폴링 오류: ${err.message}`)
    }
  }

  // 첫 폴링 즉시 실행
  await poll()

  // 주기적 폴링
  const timer = setInterval(poll, POLL_INTERVAL_MS)

  // 종료 처리
  const cleanup = async () => {
    clearInterval(timer)
    emit('log', 'CSR 모니터링 종료')
    await browser.close()
    process.exit(0)
  }

  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
}

main().catch((err) => {
  emit('log', `치명적 오류: ${err.message}`)
  process.exit(1)
})
