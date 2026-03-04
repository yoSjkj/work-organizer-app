/**
 * ITSM 일일 Task 자동화
 *
 * 흐름:
 *   1. browser-session.json 세션으로 홈 접속
 *   2. gsft_main iframe에서 TASK 링크 목록 수집
 *   3. 각 Task: Effort(0h 20m) → 진행결과 "정상" → 작업 완료
 *
 * 실행: node automation/scripts/itsm-daily.js
 * Tauri: FULL_CONFIG 환경변수로 config 전달
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const config = process.env.FULL_CONFIG
  ? JSON.parse(process.env.FULL_CONFIG)
  : require('../config.json')

const SESSION_PATH = path.join(__dirname, '../sessions/browser-session.json')

// ServiceNow AngularJS 필드 값 설정 (fill + 이벤트 트리거 필수)
async function setFieldValue(frame, selector, value) {
  const locator = frame.locator(selector)
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

// Task 상세 페이지 처리
async function processTask(frame, taskName) {
  // Effort: 0시간 20분
  await setFieldValue(frame, 'input[name="ni.u_daily_operational_task.u_effortdur_hour"]', '0')
  await setFieldValue(frame, 'input[name="ni.u_daily_operational_task.u_effortdur_min"]', '20')
  console.log('  Effort 입력 완료 (0h 20m)')

  // 진행결과 "정상" 선택
  const resultSelect = frame.locator('select[name="u_daily_operational_task.u_check_result"]')
  const normalValue = await resultSelect.evaluate(sel => {
    const opt = Array.from(sel.options).find(o => o.text.includes('정상'))
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
    console.log('  진행결과 "정상" 선택 완료')
  } else {
    const options = await resultSelect.evaluate(sel =>
      Array.from(sel.options).map(o => `${o.value}=${o.text}`).join(', ')
    )
    console.log(`  ⚠️ "정상" 옵션 없음. 사용 가능한 옵션: ${options}`)
  }

  await frame.waitForTimeout(500)

  // 작업 완료 버튼 클릭
  const completeBtn = frame.locator('button#close_sc_task')
  const isVisible = await completeBtn.isVisible({ timeout: 3000 }).catch(() => false)
  if (isVisible) {
    await completeBtn.click()
    await frame.waitForTimeout(2000)
    console.log('  ✅ 작업 완료')
  } else {
    console.log('  ⚠️ 작업 완료 버튼 없음 (이미 처리됐거나 권한 없음)')
  }
}

async function itsmDaily() {
  console.log('=== ITSM 일일 Task 자동화 시작 ===')

  if (!fs.existsSync(SESSION_PATH)) {
    console.error('❌ 세션 파일 없음. 앱에서 "세션 갱신" 먼저 실행하세요.')
    process.exit(1)
  }

  const homeUrl = config.itsm?.url
  if (!homeUrl) {
    console.error('❌ config.itsm.url 없음')
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  const context  = await browser.newContext({ storageState: SESSION_PATH })
  const page     = await context.newPage()

  try {
    // 홈 접속
    console.log('홈화면 접속 중...')
    await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // gsft_main iframe DOM에 추가될 때까지 대기 (JS 동적 생성)
    await page.waitForSelector('iframe[name="gsft_main"]', { timeout: 20000 })
      .catch(() => { console.log('  iframe 대기 타임아웃 — 계속 시도') })

    const gsftFrame = page.frames().find(f => f.name() === 'gsft_main')
    if (!gsftFrame) {
      console.error('❌ gsft_main iframe 없음')
      return
    }
    await gsftFrame.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {})

    // TASK 링크가 렌더링될 때까지 대기 (AngularJS 비동기 렌더링)
    await gsftFrame.locator('a').filter({ hasText: /^TASK/ }).first()
      .waitFor({ timeout: 15000 }).catch(() => {})

    // Task 목록 수집 (href 기반 — 클릭 후 DOM이 바뀌므로 미리 수집)
    const baseUrl = new URL(homeUrl).origin
    const taskItems = []
    const taskLinks = await gsftFrame.locator('a').filter({ hasText: /^TASK/ }).all()

    for (const link of taskLinks) {
      const name = (await link.textContent().catch(() => '')).trim()
      const href = await link.getAttribute('href').catch(() => null)
      if (name && href) {
        taskItems.push({
          name,
          url: baseUrl + (href.startsWith('/') ? href : '/' + href),
        })
      }
    }

    console.log(`📋 Task ${taskItems.length}개 발견`)
    if (taskItems.length === 0) {
      console.log('✅ 오늘 처리할 Task 없음')
      return
    }

    taskItems.forEach((t, i) => console.log(`  [${i + 1}] ${t.name}`))

    // 각 Task 처리
    let processed = 0
    let failed = 0

    for (const task of taskItems) {
      console.log(`\n[${processed + failed + 1}/${taskItems.length}] ${task.name}`)
      try {
        await gsftFrame.goto(task.url, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await gsftFrame.waitForTimeout(1500)

        await processTask(gsftFrame, task.name)
        processed++
      } catch (err) {
        console.error(`  ❌ 처리 실패: ${err.message}`)
        failed++
      }
    }

    if (failed === 0) {
      console.log(`\n✅ 완료: ${processed}개 처리됨`)
    } else {
      console.log(`\n완료: ${processed}개 성공, ${failed}개 실패`)
    }

  } catch (err) {
    console.error(`❌ 오류: ${err.message}`)
  } finally {
    await browser.close()
  }
}

itsmDaily().catch(console.error)
