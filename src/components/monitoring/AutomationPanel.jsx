import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useMonitoringStore } from '../../stores/useMonitoringStore'
import { isTauri } from '../../stores/tauriStorage'

const TASK_META = {
  sso:      { label: 'SSO 로그인',     desc: 'SSO 포털 로그인 및 세션 저장' },
  itsm:     { label: 'ITSM 일일 체크', desc: 'ITSM 일일 업무 처리 (OTP 포함)' },
  aws:      { label: 'AWS 개발서버',   desc: 'AWS 개발 서버 시작' },
  external: { label: '내부망 로그인',  desc: '내부망 포털 로그인' },
}

const STATUS_LABEL = { idle: '대기', running: '실행 중', done: '완료', error: '오류' }

async function loadAutomationConfig() {
  return invoke('get_automation_config')
}

async function openConfigFile() {
  if (!isTauri()) return
  try {
    await invoke('open_automation_config_file')
  } catch (err) {
    alert(String(err))
  }
}


async function runTask(taskId, store, debug = false) {
  const { updateTask, addTaskLog } = store
  if (!isTauri()) {
    addTaskLog(taskId, 'Tauri 환경에서만 실행 가능합니다')
    return
  }

  updateTask(taskId, { status: 'running', lastRun: Date.now() })
  addTaskLog(taskId, `${TASK_META[taskId].label} 시작${debug ? ' [디버그]' : ''}`)

  try {
    const config = await loadAutomationConfig()
    await invoke('run_automation', { task: taskId, config, debug })
  } catch (err) {
    updateTask(taskId, { status: 'error' })
    const msg = String(err)
    if (msg.includes('automation-config.json')) {
      addTaskLog(taskId, '⚠️ automation-config.json 파일이 필요합니다')
      addTaskLog(taskId, '%APPDATA%\\work-organizer\\automation-config.json')
    } else {
      addTaskLog(taskId, `오류: ${msg}`)
    }
  }
}

async function stopTask(taskId, store) {
  const { updateTask, addTaskLog } = store
  try {
    await invoke('stop_automation', { task: taskId })
  } catch (err) {
    addTaskLog(taskId, `중지 오류: ${err}`)
  }
  updateTask(taskId, { status: 'idle' })
  addTaskLog(taskId, '중지됨')
}

// ── 로그 이벤트 리스너 ──────────────────────────────────────────
let _unlistenFn = null
let _listenerSetup = false // React StrictMode 이중 실행 방지 (동기 플래그)

async function ensureLogListener(store) {
  if (_listenerSetup || !isTauri()) return
  _listenerSetup = true // 비동기 호출 전에 즉시 잠금
  const { updateTask, addTaskLog } = store

  const unlisten = await listen('automation-log', (event) => {
    const { task, level, message } = event.payload || {}
    if (!task) return
    addTaskLog(task, message)
    if (level === 'success') updateTask(task, { status: 'done' })
    else if (level === 'error') updateTask(task, { status: 'error' })
  })

  // await 완료 전에 cleanup이 실행됐으면 즉시 해제 (StrictMode race 방지)
  if (!_listenerSetup || _unlistenFn) {
    unlisten()
    return
  }
  _unlistenFn = unlisten
}

// ── TaskPanel ────────────────────────────────────────────────────
function TaskPanel({ taskId, task, debugMode }) {
  const updateTask   = useMonitoringStore((s) => s.updateTask)
  const addTaskLog   = useMonitoringStore((s) => s.addTaskLog)
  const clearTaskLog = useMonitoringStore((s) => s.clearTaskLog)
  const store = { updateTask, addTaskLog }
  const meta = TASK_META[taskId]

  const handleRun      = () => runTask(taskId, store, false)
  const handleRunDebug = () => runTask(taskId, store, true)
  const handleStop     = () => stopTask(taskId, store)

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
            <>
<button className="btn-task-run" onClick={handleRun}>
                {task.status === 'done' ? '재실행' : '실행'}
              </button>
              {debugMode && (
                <button className="btn-task-debug" onClick={handleRunDebug} title="창 표시 + DevTools">
                  🔍 디버그
                </button>
              )}
            </>
          ) : (
            <button className="btn-task-stop" onClick={handleStop}>중지</button>
          )}
        </div>
      </div>

      {task.log.length > 0 && (
        <div className="panel-card-log">
          <div className="log-area compact">
            {task.log.slice(-30).map((entry, i) => (
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

// ── AutomationPanel ──────────────────────────────────────────────
function AutomationPanel() {
  const tasks      = useMonitoringStore((s) => s.tasks)
  const updateTask = useMonitoringStore((s) => s.updateTask)
  const addTaskLog = useMonitoringStore((s) => s.addTaskLog)
  const store      = { updateTask, addTaskLog }

  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    ensureLogListener(store)
    return () => {
      if (_unlistenFn) { _unlistenFn(); _unlistenFn = null; }
      _listenerSetup = false // cleanup 시 리셋 → 재마운트 시 listener 재생성 가능
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const anyRunning = Object.values(tasks).some((t) => t.status === 'running')

  const handleRunAll = () => {
    Object.keys(tasks).forEach((id) => {
      if (tasks[id].status !== 'running') runTask(id, store)
    })
  }

  return (
    <main className="main-content monitoring-view">
      <h2 className="category-title category-automation">Automation</h2>

      <div className="monitoring-container">
        <div className="monitoring-section">
          <div className="monitoring-section-header">
            <h3 className="monitoring-section-title">자동화 스크립트</h3>
            <div className="monitoring-header-actions">
              <label className="debug-toggle">
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                />
                디버그 모드
              </label>
              <button className="btn-open-config" onClick={openConfigFile} title="automation-config.json 열기">
                ⚙ 설정 파일
              </button>
              <button className="btn-run-all" onClick={handleRunAll} disabled={anyRunning}>
                전체 실행
              </button>
            </div>
          </div>
          <div className="automation-panel-list">
            {Object.entries(tasks).map(([id, task]) => (
              <TaskPanel key={id} taskId={id} task={task} debugMode={debugMode} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default AutomationPanel
