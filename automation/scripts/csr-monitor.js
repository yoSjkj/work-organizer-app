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

let config
try {
  config = require('../config.json')
} catch {
  emit('log', 'config.json 없음. automation/config.json을 먼저 설정하세요.')
  process.exit(1)
}

const SESSION_PATH = path.join(__dirname, '../sessions/browser-session.json')
const POLL_INTERVAL_MS = 5 * 60 * 1000  // 5분

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

  await page.goto(csrConfig.listUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // ServiceNow 클래식 UI: iframe 없이 메인 페이지에 직접 렌더링
  await page.locator('tr.list_row').first().waitFor({ timeout: 15000 }).catch(() => {})

  const rows = await page.locator('tr.list_row').all()
  const items = []

  for (const row of rows) {
    try {
      const sysId = await row.getAttribute('sys_id') || ''
      const ritm  = (await row.locator('a[href*="sc_req_item.do"]').first().textContent({ timeout: 1000 }).catch(() => ''))?.trim()
      const title = (await row.locator('td[field="short_description"]').textContent({ timeout: 1000 }).catch(() => ''))?.trim()
      const status = (await row.locator('td[field="state"]').textContent({ timeout: 1000 }).catch(() => ''))?.trim()
      const assignee = (await row.locator('td[field="assigned_to"]').textContent({ timeout: 1000 }).catch(() => ''))?.trim()

      if (sysId && ritm) {
        items.push({ ritm, title: title || '', status: status || '', assignee: assignee || '' })
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

  if (!fs.existsSync(SESSION_PATH)) {
    emit('log', '⚠️ 세션 파일 없음. 먼저 세션 갱신을 실행하세요.')
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: SESSION_PATH })
  const page = await context.newPage()

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
