const { chromium } = require('playwright')
const path = require('path')

// Tauri에서 실행 시 FULL_CONFIG 환경변수로 설정 전달, 없으면 config.json 사용
const config = process.env.FULL_CONFIG
  ? JSON.parse(process.env.FULL_CONFIG)
  : require('../config.json')

const CHROME_USER_DATA = config.chromeUserData
  || process.env.CHROME_USER_DATA
  || path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data')

async function externalNetLogin() {
  console.log('🌐 외부망 로그인 시작...')

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

  let keepOpen = false
  const page = context.pages()[0] || await context.newPage()

  try {
    const sel = config.external.selectors || {}
    await page.goto(config.external.url, { waitUntil: 'networkidle' })

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
        console.error('❌ 로그인 실패 (아이디/비밀번호 확인 필요) — 창을 직접 닫아주세요')
        keepOpen = true
        return
      }
      console.log('✅ 외부망 로그인 완료 — VM 시작 대기 중...')
      await page.waitForTimeout(3000)
    } else {
      console.log('✅ 기존 세션 유효, 로그인 스킵')
    }

  } catch (error) {
    console.error('❌ 외부망 오류:', error.message)
    keepOpen = true
  } finally {
    if (!keepOpen) {
      await context.close()
    } else {
      // 실패 시 창 유지 — 사용자가 닫을 때까지 대기
      await new Promise(resolve => context.once('close', resolve))
    }
  }
}

externalNetLogin().catch(console.error)
