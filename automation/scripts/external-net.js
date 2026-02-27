const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

// Tauri에서 실행 시 FULL_CONFIG 환경변수로 설정 전달, 없으면 config.json 사용
const config = process.env.FULL_CONFIG
  ? JSON.parse(process.env.FULL_CONFIG)
  : require('../config.json')

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

    const sel = config.external.selectors || {}
    const needLogin = await page.locator(sel.username || '#LoginID').isVisible().catch(() => false)

    if (needLogin) {
      // U-Cloud 자동 접속 체크박스
      const cbSelector = sel.ucloudCheckbox || '#CHECKED_VM_AUTO_CONNECT'
      const checkbox = page.locator(cbSelector)
      if (await checkbox.isVisible().catch(() => false)) {
        const isChecked = await checkbox.isChecked().catch(() => false)
        if (!isChecked) {
          await checkbox.click()
          console.log('☑ U-Cloud 자동 접속 체크')
        }
      }

      await page.fill(sel.username || '#LoginID', config.external.username)
      await page.fill(sel.password || '#LoginPassword', config.external.password)
      await page.click(sel.loginButton || 'button.login-btn')
      await page.waitForLoadState('networkidle')

      // 로그인 성공 여부 확인 (로그인 폼이 사라졌으면 성공)
      const loginFailed = await page.locator(sel.username || '#LoginID').isVisible().catch(() => false)
      if (loginFailed) {
        console.error('❌ 로그인 실패 (아이디/비밀번호 확인 필요)')
        await page.waitForTimeout(5000) // 실패 화면 확인용 대기
        return
      }
      console.log('✅ 외부망 로그인 완료 — VM 시작 대기 중...')
      await page.waitForTimeout(3000) // VM 클라이언트 실행 대기
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
