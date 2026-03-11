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

/** 승인 상태 조회: 상세 페이지 직접 접근 */
async function fetchApproval(page, baseUrl, sysId) {
  if (!sysId) return null
  try {
    await page.goto(`${baseUrl}/sc_req_item.do?sys_id=${sysId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await page.waitForTimeout(1500)

    const value = await page.evaluate(() => {
      // 읽기전용 한국어 표시값 우선
      const ro = document.querySelector('#sys_readonly\\.sc_req_item\\.approval')
      if (ro?.value) return ro.value
      // 내부 영문값
      const en = document.querySelector('input[name="sc_req_item.approval"]')
      return en?.value || null
    })

    if (value === '요청됨') return 'requested'
    if (value === '승인됨') return 'approved'
    if (value === '거부됨') return 'rejected'
    return value || null  // 이미 영문이거나 null
  } catch {
    return null
  }
}

/** CSR 목록을 파싱하여 반환 */
async function fetchCsrList(page, baseUrl) {
  const csrConfig = config.csr
  if (!csrConfig || !csrConfig.listUrl) {
    emit('log', 'config.csr.listUrl이 설정되지 않았습니다')
    return []
  }

  await page.goto(csrConfig.listUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // RITM 텍스트가 실제로 렌더링될 때까지 대기 (비동기 렌더링 대응)
  await page.locator('a').filter({ hasText: /^RITM/ }).first().waitFor({ timeout: 20000 }).catch(() => {})

  const rows = await page.locator('tr.list_row').all()
  const items = []

  for (const row of rows) {
    try {
      const ritmLink = row.locator('a').filter({ hasText: /^RITM/ }).first()
      const ritm = (await ritmLink.textContent({ timeout: 2000 }).catch(() => ''))?.trim()
      if (!ritm) continue

      // td.vt 셀은 위치 기반: [0]=RITM, [1]=고객사, [2]=제목, [3]=담당자, [4]=그룹
      const vtCells = await row.evaluate(tr =>
        Array.from(tr.querySelectorAll('td.vt')).map(td => td.textContent.trim())
      )

      // ⓘ 링크(RITM 링크 바로 앞 a태그)에서 sys_id 추출
      const sysId = await ritmLink.evaluate(el => {
        let tr = el
        while (tr && tr.tagName !== 'TR') tr = tr.parentElement
        if (!tr) return ''
        const links = Array.from(tr.querySelectorAll('a'))
        const idx = links.indexOf(el)
        if (idx <= 0) return ''
        const href = links[idx - 1].getAttribute('href') || ''
        const m = href.match(/sys_id=([a-f0-9]+)/i)
        return m ? m[1] : ''
      })

      items.push({
        ritm,
        sysId,
        title: vtCells[2] || '',
        assignee: vtCells[3] || '',
        status: '',
        approval: null,
      })
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

  const baseUrl = new URL(csrConfig.listUrl).origin
  const knownItems = new Map()

  const APPROVAL_KO = {
    requested: '요청됨',
    approved:  '승인됨',
    rejected:  '거부됨',
  }

  const poll = async () => {
    emit('log', 'CSR 목록 확인 중')
    try {
      const items = await fetchCsrList(page, baseUrl)
      emit('log', `${items.length}건 확인됨`)

      for (const item of items) {
        // approval 조회 (sys_id 있을 때만)
        const approval = await fetchApproval(page, baseUrl, item.sysId)
        item.approval = approval
        item.approvalKo = APPROVAL_KO[approval] || approval || ''

        const existing = knownItems.get(item.ritm)
        if (!existing) {
          knownItems.set(item.ritm, item)
          emit('csr_new', item)
        } else if (existing.status !== item.status || existing.approval !== item.approval) {
          knownItems.set(item.ritm, item)
          emit('csr_update', item)
        }
      }

      // 사라진 항목 제거: 현재 목록 기준으로 동기화
      for (const ritm of knownItems.keys()) {
        if (!items.find((i) => i.ritm === ritm)) {
          knownItems.delete(ritm)
        }
      }
      emit('csr_sync', { ritms: items.map((i) => i.ritm) })
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
