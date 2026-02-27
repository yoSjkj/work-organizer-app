const { chromium } = require('playwright')
const path = require('path')

// Tauri에서 실행 시 FULL_CONFIG 환경변수로 설정 전달, 없으면 config.json 사용
const config = process.env.FULL_CONFIG
  ? JSON.parse(process.env.FULL_CONFIG)
  : require('../config.json')

const CHROME_USER_DATA = config.chromeUserData
  || process.env.CHROME_USER_DATA
  || path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data')

async function ssoLogin() {
  console.log('🔐 SSO 로그인 시작...')

  let context
  try {
    context = await chromium.launchPersistentContext(CHROME_USER_DATA, {
      channel: 'chrome',
      headless: false,
    })
  } catch (e) {
    if (e.message.includes('user data directory is already in use')) {
      console.error('❌ Chrome이 이미 실행 중입니다. Chrome을 닫고 다시 시도하세요.')
      return
    }
    throw e
  }

  const page = context.pages()[0] || await context.newPage()

  try {
    await page.goto(config.sso.url, { waitUntil: 'networkidle' })

    const sel = config.sso.selectors
    const needLogin = await page.locator(sel.username).isVisible().catch(() => false)

    if (needLogin) {
      await page.fill(sel.username, config.sso.username)
      await page.fill(sel.password, config.sso.password)
      await page.click(sel.loginButton)
      await page.waitForLoadState('networkidle')
      console.log('✅ SSO 로그인 완료 — 브라우저를 닫으면 종료됩니다')
    } else {
      console.log('✅ 기존 세션 유효 — 브라우저를 닫으면 종료됩니다')
    }

    // 로그인 후 브라우저를 열어둔 채 대기 (사용자가 닫을 때까지)
    await new Promise(resolve => context.once('close', resolve))

  } catch (error) {
    console.error('❌ SSO 오류:', error.message)
    await new Promise(resolve => context.once('close', resolve))
  }
}

ssoLogin().catch(console.error)
