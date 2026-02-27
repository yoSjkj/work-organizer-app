const { chromium } = require('playwright')
const { authenticator } = require('otplib')
const path = require('path')
const fs = require('fs')

// Tauri에서 실행 시 FULL_CONFIG 환경변수로 설정 전달, 없으면 config.json 사용
const config = process.env.FULL_CONFIG
  ? JSON.parse(process.env.FULL_CONFIG)
  : require('../config.json')

const SESSION_PATH = path.join(__dirname, '../sessions/itsm-session.json')

async function itsmDaily() {
  console.log('🚀 === ITSM 일일 Task 자동화 시작 ===')

  const browser = await chromium.launch({ headless: false, slowMo: 100 })

  const sessionExists = fs.existsSync(SESSION_PATH)
  const context = await browser.newContext(
    sessionExists ? { storageState: SESSION_PATH } : {}
  )
  const page = await context.newPage()

  try {
    await page.goto(config.itsm.url, { waitUntil: 'networkidle' })

    if (await isLoginRequired(page)) {
      await login(page)
    } else {
      console.log('✅ 기존 세션으로 자동 로그인됨')
    }

    await processTasks(page)

    await context.storageState({ path: SESSION_PATH })
    console.log('💾 세션 저장 완료')

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    await page.screenshot({ path: 'sessions/error-screenshot.png' }).catch(() => {})
  } finally {
    await browser.close()
  }
}

async function isLoginRequired(page) {
  const sel = config.itsm.selectors
  return await page.locator(sel.username).isVisible().catch(() => false)
}

async function login(page) {
  console.log('🔐 로그인 시작...')
  const sel = config.itsm.selectors

  await page.fill(sel.username, config.itsm.username)
  await page.fill(sel.password, config.itsm.password)
  await page.click(sel.loginButton)

  await page.waitForSelector(sel.otpInput, { timeout: 15000 })

  const otp = authenticator.generate(config.itsm.otpSecret)
  console.log(`🔑 OTP 생성: ${otp}`)

  await page.fill(sel.otpInput, otp)
  await page.click(sel.otpButton)

  await page.waitForLoadState('networkidle')
  console.log('✅ 로그인 완료')
}

async function processTasks(page) {
  const iframe = page.frameLocator('iframe[name="gsft_main"]')
  let totalProcessed = 0

  while (true) {
    console.log('\n🔍 Task 목록 확인 중...')
    await page.waitForTimeout(2000)

    const taskLinks = iframe.locator('a').filter({ hasText: /^TASK/ })
    const count = await taskLinks.count()
    console.log(`📋 ${count}개 Task 발견`)

    if (count === 0) {
      console.log('🎉 모든 Task 처리 완료!')
      break
    }

    const taskText = (await taskLinks.nth(0).textContent())?.trim()
    console.log(`📌 처리 중: ${taskText}`)

    await taskLinks.nth(0).click()
    await page.waitForTimeout(4000)

    await processTaskDetail(iframe, page, taskText || '')

    totalProcessed++
    console.log(`📈 완료 (총 ${totalProcessed}개)`)

    await goHome(page)
    await page.waitForTimeout(3000)
  }

  console.log(`\n📊 총 처리: ${totalProcessed}개`)
}

async function processTaskDetail(iframe, page, taskName) {
  console.log(`\n⚡ === ${taskName} 상세 처리 ===`)

  try {
    const effortHour = iframe.locator('input[name="ni.u_daily_operational_task.u_effortdur_hour"]')
    const effortMin  = iframe.locator('input[name="ni.u_daily_operational_task.u_effortdur_min"]')

    await setServiceNowValue(effortHour, '0')
    await setServiceNowValue(effortMin, '20')
    console.log('✅ Effort 입력 완료 (0시간 20분)')

    const resultSelect = iframe.locator('select[name="u_daily_operational_task.u_check_result"]')
    const normalValue = await resultSelect.evaluate(select => {
      const opt = Array.from(select.options).find(o => o.text.includes('정상'))
      return opt?.value ?? null
    })

    if (normalValue !== null) {
      await resultSelect.selectOption(normalValue)
      await resultSelect.evaluate(el => {
        ;['change', 'blur'].forEach(type =>
          el.dispatchEvent(new Event(type, { bubbles: true }))
        )
        const win = el.ownerDocument.defaultView
        if (win?.angular) win.angular.element(el).scope()?.$apply()
      })
      console.log('✅ 진행결과 "정상" 선택 완료')
    } else {
      console.warn('⚠️ "정상" 옵션 못 찾음')
    }

    await page.waitForTimeout(1000)

    const completeBtn = iframe.locator('button:has-text("작업 완료")')
    if (await completeBtn.isVisible()) {
      await completeBtn.click()
      console.log('✅ 작업 완료 버튼 클릭')
      await page.waitForTimeout(3000)
    } else {
      console.warn('⚠️ "작업 완료" 버튼 못 찾음')
    }

  } catch (error) {
    console.error(`❌ ${taskName} 처리 오류:`, error.message)
  }
}

async function setServiceNowValue(locator, value) {
  await locator.fill(value)
  await locator.evaluate((el, val) => {
    el.value = val
    ;['input', 'change', 'blur', 'keyup'].forEach(type =>
      el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }))
    )
    const win = el.ownerDocument.defaultView
    if (win?.angular) win.angular.element(el).scope()?.$apply()
  }, value)
}

async function goHome(page) {
  const homeLink = page.locator('a[href*="home.do"], a[ng-href="home.do"]').first()
  if (await homeLink.isVisible()) {
    await homeLink.click()
    console.log('🏠 홈으로 이동')
  } else {
    await page.goBack()
    console.log('🏠 뒤로가기로 이동')
  }
}

itsmDaily().catch(console.error)
