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

const SSO_SESSION_PATH = path.join(__dirname, '../sessions/sso-session.json')
const POLL_INTERVAL_MS = 3 * 60 * 1000  // 3분

fs.mkdirSync(path.dirname(SSO_SESSION_PATH), { recursive: true })

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

/** 메일 목록 파싱 */
async function fetchMailList(page, mailConfig, keywords) {
  const sel = mailConfig.selectors || {}
  const mailUrl = mailConfig.url
  if (!mailUrl) {
    emit('log', 'config.mail.url이 설정되지 않았습니다')
    return { items: [], unread: 0 }
  }

  await page.goto(mailUrl, { waitUntil: 'networkidle', timeout: 30000 })

  const rowSelector = sel.row || 'tr.mail-row, li.mail-item'
  const fromSelector = sel.from || '.mail-from, .sender'
  const subjectSelector = sel.subject || '.mail-subject, .subject'
  const timeSelector = sel.time || '.mail-time, .date'
  const unreadSelector = sel.unread || '.unread-count'

  // 미읽음 카운트
  let unread = 0
  try {
    const unreadEl = page.locator(unreadSelector).first()
    const text = await unreadEl.textContent({ timeout: 3000 }).catch(() => '0')
    unread = parseInt(text.replace(/\D/g, '') || '0', 10)
  } catch { /* ignore */ }

  const rows = await page.locator(rowSelector).all()
  const items = []

  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const row = rows[i]
    try {
      const from    = await row.locator(fromSelector).textContent({ timeout: 1000 }).catch(() => '')
      const subject = await row.locator(subjectSelector).textContent({ timeout: 1000 }).catch(() => '')
      const time    = await row.locator(timeSelector).textContent({ timeout: 1000 }).catch(() => '')
      const isRead  = await row.getAttribute('data-read').catch(() => null)

      const matchedKeyword = matchKeyword(from + ' ' + subject, keywords)

      items.push({
        id: `mail-${Date.now()}-${i}`,
        from: from.trim(),
        subject: subject.trim(),
        time: time.trim(),
        isRead: isRead === 'true',
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

  // SSO 세션 재사용
  const sessionExists = fs.existsSync(SSO_SESSION_PATH)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext(
    sessionExists ? { storageState: SSO_SESSION_PATH } : {}
  )
  const page = await context.newPage()

  // SSO 세션 없을 경우 SSO 로그인 시도
  if (!sessionExists && config.sso?.url) {
    emit('log', 'SSO 로그인 시도')
    try {
      await page.goto(config.sso.url, { waitUntil: 'networkidle', timeout: 30000 })
      const sel = config.sso.selectors || {}
      const needLogin = sel.username
        ? await page.locator(sel.username).isVisible().catch(() => false)
        : false

      if (needLogin) {
        await page.fill(sel.username, config.sso.username || '')
        await page.fill(sel.password || 'input[type="password"]', config.sso.password || '')
        await page.click(sel.loginButton || 'button[type="submit"]')
        await page.waitForLoadState('networkidle')
        await context.storageState({ path: SSO_SESSION_PATH })
        emit('log', 'SSO 로그인 완료')
      }
    } catch (err) {
      emit('log', `SSO 로그인 오류: ${err.message}`)
    }
  }

  // 키워드는 localStorage에 저장되어 있지만 Node.js에서는 접근 불가
  // config.json에서 키워드 읽기 (옵션)
  const keywords = mailConfig.keywords || []

  const seenIds = new Set()

  const poll = async () => {
    emit('log', '메일 확인 중')
    try {
      const { items, unread } = await fetchMailList(page, mailConfig, keywords)
      emit('mail_count', { unread })

      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id)
          emit('mail_new', item)
        }
      }
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
