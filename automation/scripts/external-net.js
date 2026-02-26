const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const config = require('../config.json')
const SESSION_PATH = path.join(__dirname, '../sessions/external-session.json')

async function externalNetLogin() {
  console.log('🌐 외부망 로그인 시작...')

  const browser = await chromium.launch({ headless: false })

  const sessionExists = fs.existsSync(SESSION_PATH)
  const context = await browser.newContext(
    sessionExists ? { storageState: SESSION_PATH } : {}
  )

  const page = await context.newPage()

  try {
    await page.goto(config.external.url, { waitUntil: 'networkidle' })

    const sel = config.external.selectors
    const needLogin = await page.locator(sel.username).isVisible().catch(() => false)

    if (needLogin) {
      await page.fill(sel.username, config.external.username)
      await page.fill(sel.password, config.external.password)
      await page.click(sel.loginButton)
      await page.waitForLoadState('networkidle')
      console.log('✅ 외부망 로그인 완료')
    } else {
      console.log('✅ 기존 세션 유효, 로그인 스킵')
    }

    await context.storageState({ path: SESSION_PATH })

  } catch (error) {
    console.error('❌ 외부망 오류:', error.message)
  } finally {
    await browser.close()
  }
}

externalNetLogin().catch(console.error)
