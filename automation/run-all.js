const { execSync } = require('child_process')

const tasks = [
  { name: 'SSO 로그인',       script: 'scripts/sso-login.js' },
  { name: 'ITSM 일일 체크',   script: 'scripts/itsm-daily.js' },
  { name: 'AWS 개발서버',      script: 'scripts/aws-dev-server.js' },
  { name: '외부망 로그인',     script: 'scripts/external-net.js' },
]

async function runAll() {
  console.log('🚀 === 업무 자동화 전체 실행 ===\n')

  for (const task of tasks) {
    console.log(`\n▶ ${task.name} 시작...`)
    try {
      execSync(`node ${task.script}`, { stdio: 'inherit', cwd: __dirname })
      console.log(`✅ ${task.name} 완료`)
    } catch (e) {
      console.error(`❌ ${task.name} 실패:`, e.message)
    }
  }

  console.log('\n🎉 모든 작업 완료!')
}

runAll()
