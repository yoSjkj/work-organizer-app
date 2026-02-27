const { chromium } = require('playwright')
const path = require('path')

// Tauri에서 실행 시 FULL_CONFIG 환경변수로 설정 전달, 없으면 config.json 사용
const config = process.env.FULL_CONFIG
  ? JSON.parse(process.env.FULL_CONFIG)
  : require('../config.json')

const CHROME_USER_DATA = config.chromeUserData
  || process.env.CHROME_USER_DATA
  || path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data')

async function awsDevServer() {
  console.log('☁️ AWS 개발서버 기동 시작...')

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
    await page.goto(config.aws.url, { waitUntil: 'networkidle' })

    const sel = config.aws.selectors
    const needLogin = await page.locator(sel.username).isVisible().catch(() => false)

    if (needLogin) {
      await page.fill(sel.username, config.aws.username)
      await page.fill(sel.password, config.aws.password)
      await page.click(sel.loginButton)
      await page.waitForLoadState('networkidle')
      console.log('✅ AWS 로그인 완료')
    }

    // TODO: 개발서버 기동 버튼 선택자를 config.aws.selectors.devServerButton에 설정
    console.log('⚠️ 개발서버 기동 로직 미구현 - 선택자 설정 필요')
    console.log('  → config의 aws.selectors.devServerButton을 실제 버튼 선택자로 수정하세요')

  } catch (error) {
    console.error('❌ AWS 오류:', error.message)
  } finally {
    await context.close()
  }
}

awsDevServer().catch(console.error)
