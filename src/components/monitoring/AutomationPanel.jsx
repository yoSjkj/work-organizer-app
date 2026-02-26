import { useMonitoringStore } from '../../stores/useMonitoringStore'
import { isTauri } from '../../stores/tauriStorage'

const TASK_META = {
  sso:      { label: 'SSO 로그인',     script: 'automation/scripts/sso-login.js',      desc: 'SSO 포털 로그인 및 세션 저장' },
  itsm:     { label: 'ITSM 일일 체크', script: 'automation/scripts/itsm-daily.js',     desc: 'ITSM 일일 업무 처리' },
  aws:      { label: 'AWS 개발서버',   script: 'automation/scripts/aws-dev-server.js', desc: 'AWS 개발 서버 시작' },
  external: { label: '외부망 로그인',  script: 'automation/scripts/external-net.js',   desc: '외부망 포털 로그인' },
}

const STATUS_LABEL = { idle: '대기', running: '실행 중', done: '완료', error: '오류' }

async function spawnTask(taskId, store) {
  const { updateTask, addTaskLog, registerProcess, unregisterProcess } = store
  if (!isTauri()) {
    addTaskLog(taskId, 'Tauri 환경에서만 실행 가능합니다')
    return
  }
  try {
    const { Command } = await import('@tauri-apps/plugin-shell')
    const meta = TASK_META[taskId]
    updateTask(taskId, { status: 'running', lastRun: Date.now() })
    addTaskLog(taskId, `${meta.label} 시작`)

    const cmd = Command.create('node', [meta.script])
    cmd.stdout.on('data', (line) => {
      if (!line.trim()) return
      try {
        const ev = JSON.parse(line)
        addTaskLog(taskId, ev.message || line.trim())
      } catch {
        addTaskLog(taskId, line.trim())
      }
    })
    cmd.stderr.on('data', (line) => {
      if (line.trim()) addTaskLog(taskId, `[오류] ${line.trim()}`)
    })
    cmd.on('close', ({ code }) => {
      updateTask(taskId, { status: code === 0 ? 'done' : 'error' })
      addTaskLog(taskId, `완료 (종료코드 ${code})`)
      unregisterProcess(taskId)
    })

    const child = await cmd.spawn()
    registerProcess(taskId, child)
  } catch (err) {
    updateTask(taskId, { status: 'error' })
    addTaskLog(taskId, `실행 오류: ${err.message}`)
  }
}

function TaskPanel({ taskId, task }) {
  const updateTask        = useMonitoringStore((s) => s.updateTask)
  const addTaskLog        = useMonitoringStore((s) => s.addTaskLog)
  const clearTaskLog      = useMonitoringStore((s) => s.clearTaskLog)
  const registerProcess   = useMonitoringStore((s) => s.registerProcess)
  const unregisterProcess = useMonitoringStore((s) => s.unregisterProcess)
  const getProcess        = useMonitoringStore((s) => s.getProcess)

  const meta = TASK_META[taskId]
  const store = { updateTask, addTaskLog, registerProcess, unregisterProcess }

  const handleRun = () => spawnTask(taskId, store)

  const handleStop = async () => {
    const child = getProcess(taskId)
    if (child) {
      try { await child.kill() } catch { /* ignore */ }
    }
    updateTask(taskId, { status: 'idle' })
    unregisterProcess(taskId)
    addTaskLog(taskId, '중지됨')
  }

  return (
    <div className={`automation-panel-card status-${task.status}`}>
      <div className="panel-card-header">
        <div className="panel-card-info">
          <span className="panel-card-title">{meta.label}</span>
          <span className="panel-card-desc">{meta.desc}</span>
        </div>
        <div className="panel-card-actions">
          <span className={`task-status-label status-${task.status}`}>
            {STATUS_LABEL[task.status]}
          </span>
          {task.lastRun && (
            <span className="task-last-run">
              {new Date(task.lastRun).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {task.status !== 'running' ? (
            <button className="btn-task-run" onClick={handleRun}>
              {task.status === 'done' ? '재실행' : '실행'}
            </button>
          ) : (
            <button className="btn-task-stop" onClick={handleStop}>중지</button>
          )}
        </div>
      </div>

      {task.log.length > 0 && (
        <div className="panel-card-log">
          <div className="log-area compact">
            {task.log.slice(-20).map((entry, i) => (
              <div key={i} className="log-line">
                <span className="log-time">
                  {new Date(entry.ts).toLocaleTimeString('ko-KR', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </span>
                <span className="log-message">{entry.message}</span>
              </div>
            ))}
          </div>
          <button className="btn-clear-log" onClick={() => clearTaskLog(taskId)}>로그 지우기</button>
        </div>
      )}
    </div>
  )
}

function AutomationPanel() {
  const tasks             = useMonitoringStore((s) => s.tasks)
  const updateTask        = useMonitoringStore((s) => s.updateTask)
  const addTaskLog        = useMonitoringStore((s) => s.addTaskLog)
  const registerProcess   = useMonitoringStore((s) => s.registerProcess)
  const unregisterProcess = useMonitoringStore((s) => s.unregisterProcess)

  const store = { updateTask, addTaskLog, registerProcess, unregisterProcess }
  const anyRunning = Object.values(tasks).some((t) => t.status === 'running')

  const handleRunAll = () => {
    Object.keys(tasks).forEach((id) => {
      if (tasks[id].status !== 'running') spawnTask(id, store)
    })
  }

  return (
    <main className="main-content monitoring-view">
      <h2 className="category-title category-automation">Automation</h2>

      <div className="monitoring-container">
        <div className="monitoring-section">
          <div className="monitoring-section-header">
            <h3 className="monitoring-section-title">자동화 스크립트</h3>
            <button className="btn-run-all" onClick={handleRunAll} disabled={anyRunning}>
              전체 실행
            </button>
          </div>
          <div className="automation-panel-list">
            {Object.entries(tasks).map(([id, task]) => (
              <TaskPanel key={id} taskId={id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default AutomationPanel
