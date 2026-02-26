const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const config = require('../config.json')
const SESSION_PATH = path.join(__dirname, '../sessions/sso-session.json')

async function ssoLogin() {
  console.log('🔐 SSO 로그인 시작...')

  const browser = await chromium.launch({ headless: false })

  const sessionExists = fs.existsSync(SESSION_PATH)
  const context = await browser.newContext(
    sessionExists ? { storageState: SESSION_PATH } : {}
  )

  const page = await context.newPage()

  try {
    await page.goto(config.sso.url, { waitUntil: 'networkidle' })

    const sel = config.sso.selectors
    const needLogin = await page.locator(sel.username).isVisible().catch(() => false)

    if (needLogin) {
      await page.fill(sel.username, config.sso.username)
      await page.fill(sel.password, config.sso.password)
      await page.click(sel.loginButton)
      await page.waitForLoadState('networkidle')
      console.log('✅ SSO 로그인 완료')
    } else {
      console.log('✅ 기존 세션 유효, 로그인 스킵')
    }

    await context.storageState({ path: SESSION_PATH })

  } catch (error) {
    console.error('❌ SSO 로그인 오류:', error.message)
  } finally {
    await browser.close()
  }
}

ssoLogin().catch(console.error)
