/**
 * 메일 모니터링 스크립트
 *
 * stdout에 JSON Lines 형식으로 이벤트 출력:
 *   {"type": "log",        "message": "...", "ts": 1234}
 *   {"type": "mail_new",   "data": {id, from, subject, time, isRead, matchedKeyword}}
 *   {"type": "mail_count", "data": {unread: N}}
 *
 * 사용: node automation/scripts/mail-monitor.js
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
const POLL_INTERVAL_MS = 3 * 60 * 1000  // 3분

/** JSON Lines 이벤트 출력 */
function emit(type, messageOrData) {
  if (type === 'log') {
    process.stdout.write(JSON.stringify({ type: 'log', message: messageOrData, ts: Date.now() }) + '\n')
  } else {
    process.stdout.write(JSON.stringify({ type, data: messageOrData, ts: Date.now() }) + '\n')
  }
}

/** 키워드 매칭 */
function matchKeyword(text, keywords) {
  if (!keywords || keywords.length === 0) return null
  const lower = text.toLowerCase()
  return keywords.find((kw) => lower.includes(kw.toLowerCase())) || null
}

/** 메일 목록 파싱
 *
 * tmail.lxhausys.com 구조:
 *   tr[name="trMailItem"] 행마다 input.input_check에 모든 정보가 속성값으로 저장됨
 *   mid, subject, sender, senderemail, receivedate, isread 속성 사용
 */
async function fetchMailList(page, mailConfig, keywords) {
  const mailUrl = mailConfig.url
  if (!mailUrl) {
    emit('log', 'config.mail.url이 설정되지 않았습니다')
    return { items: [], unread: 0 }
  }

  await page.goto(mailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // 메일 행 렌더링 대기
  await page.locator('tr[name="trMailItem"]').first().waitFor({ timeout: 20000 }).catch(() => {})

  const rows = await page.locator('tr[name="trMailItem"]').all()
  const items = []
  let unread = 0

  for (const row of rows.slice(0, 50)) {
    try {
      // input.input_check 속성에 모든 메타데이터 포함
      const input = row.locator('input.input_check').first()
      const mid         = await input.getAttribute('mid').catch(() => '')
      if (!mid) continue

      const subject     = await input.getAttribute('subject')     || ''
      const sender      = await input.getAttribute('sender')      || ''
      const senderEmail = await input.getAttribute('senderemail') || ''
      const receivedate = await input.getAttribute('receivedate') || ''
      const isRead      = (await input.getAttribute('isread').catch(() => '1')) === '1'

      if (!isRead) unread++

      const matchedKeyword = matchKeyword(sender + ' ' + subject, keywords)

      items.push({
        id: mid,
        from: sender,
        fromEmail: senderEmail,
        subject,
        time: receivedate,
        isRead,
        matchedKeyword,
      })
    } catch { /* 행 파싱 오류 무시 */ }
  }

  return { items, unread }
}

async function main() {
  emit('log', '메일 모니터링 시작')

  const mailConfig = config.mail
  if (!mailConfig || !mailConfig.url) {
    emit('log', 'config.json에 mail.url이 설정되지 않았습니다')
    process.exit(1)
  }

  if (!fs.existsSync(SESSION_PATH)) {
    emit('log', '⚠️ 세션 파일 없음. 먼저 세션 갱신을 실행하세요.')
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: SESSION_PATH })
  const page = await context.newPage()

  const keywords = mailConfig.keywords || []

  const seenIds = new Set()

  const poll = async () => {
    emit('log', '메일 확인 중')
    try {
      const { items, unread } = await fetchMailList(page, mailConfig, keywords)
      emit('log', `총 ${items.length}건, 미읽음 ${unread}건`)
      emit('mail_count', { unread })

      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id)
          if (!item.isRead) emit('mail_new', item)
        }
      }

      // 현재 미읽음 목록 기준으로 동기화
      const unreadItems = items.filter((i) => !i.isRead)
      emit('mail_sync', { items: unreadItems })
    } catch (err) {
      emit('log', `폴링 오류: ${err.message}`)
    }
  }

  await poll()
  const timer = setInterval(poll, POLL_INTERVAL_MS)

  const cleanup = async () => {
    clearInterval(timer)
    emit('log', '메일 모니터링 종료')
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
