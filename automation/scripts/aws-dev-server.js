const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

// Tauri에서 실행 시 FULL_CONFIG 환경변수로 설정 전달, 없으면 config.json 사용
const config = process.env.FULL_CONFIG
  ? JSON.parse(process.env.FULL_CONFIG)
  : require('../config.json')
const SESSION_PATH = path.join(__dirname, '../sessions/aws-session.json')

async function awsDevServer() {
  console.log('☁️ AWS 개발서버 기동 시작...')

  const browser = await chromium.launch({ headless: false })

  const sessionExists = fs.existsSync(SESSION_PATH)
  const context = await browser.newContext(
    sessionExists ? { storageState: SESSION_PATH } : {}
  )

  const page = await context.newPage()

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
    // 사이트 구조 파악 후 아래 코드 완성 필요
    // await page.click(sel.devServerButton)
    // await page.waitForSelector('text=실행 중', { timeout: 30000 })
    console.log('⚠️ 개발서버 기동 로직 미구현 - 선택자 설정 필요')
    console.log('  → config.json의 aws.selectors.devServerButton을 실제 버튼 선택자로 수정하세요')

    await context.storageState({ path: SESSION_PATH })

  } catch (error) {
    console.error('❌ AWS 오류:', error.message)
  } finally {
    await browser.close()
  }
}

awsDevServer().catch(console.error)
