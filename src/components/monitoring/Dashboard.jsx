import { useState, useEffect } from 'react'
import { useMonitoringStore } from '../../stores/useMonitoringStore'
import { useUIStore } from '../../stores/useUIStore'
import { isTauri } from '../../stores/tauriStorage'

function formatRelativeTime(date) {
  if (!date) return null
  const ms = Date.now() - (date instanceof Date ? date.getTime() : Number(date))
  const min = Math.floor(ms / 60000)
  const hr  = Math.floor(min / 60)
  if (hr >= 24) return `${Math.floor(hr / 24)}일 전`
  if (hr > 0)   return `${hr}시간 전`
  if (min > 0)  return `${min}분 전`
  return '방금 전'
}

// 폴링 간격 기준으로 세션 상태 판단
// running + 최근 폴링 → active / running + 오래됨 → stale / 중지 → stopped
function getSessionHealth(running, lastPoll, intervalMin) {
  if (!running) return 'stopped'
  if (!lastPoll) return 'waiting'
  const elapsed = (Date.now() - lastPoll) / 60000
  if (elapsed < intervalMin * 2) return 'active'
  return 'stale'
}

const HEALTH_LABEL = {
  active:  { dot: '●', text: '세션 유지 중',   color: 'var(--success-text)' },
  waiting: { dot: '◌', text: '확인 대기 중',   color: 'var(--text-muted)'   },
  stale:   { dot: '●', text: '응답 지연',       color: 'var(--warning-text, #f59e0b)' },
  stopped: { dot: '○', text: '모니터링 중지됨', color: 'var(--text-muted)'   },
}

const TASK_META = {
  itsm: { label: 'ITSM 일일 체크' },
}

const STATUS_ICON = { idle: '⏸', running: '↻', done: '✓', error: '✕' }

async function spawnTask(taskId, store) {
  const { updateTask, addTaskLog } = store
  if (!isTauri()) {
    addTaskLog(taskId, 'Tauri 환경에서만 실행 가능합니다')
    return
  }
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const { listen } = await import('@tauri-apps/api/event')
    const meta = TASK_META[taskId]

    updateTask(taskId, { status: 'running', lastRun: Date.now() })
    addTaskLog(taskId, `${meta.label} 시작`)

    let unlisten, unlistenEvent

    unlisten = await listen('automation-log', (event) => {
      const { task, message } = event.payload
      if (task !== taskId) return
      addTaskLog(taskId, message)
    })

    unlistenEvent = await listen('automation-event', (event) => {
      const { task, payload } = event.payload
      if (task !== taskId) return

      switch (payload.type) {
        case 'found':
          addTaskLog(taskId, `📋 Task ${payload.count}개 발견`)
          break
        case 'progress':
          addTaskLog(taskId, `[${payload.current}/${payload.total}] ${payload.name}`)
          break
        case 'done':
          addTaskLog(taskId, payload.failed === 0
            ? `✅ 완료: ${payload.processed}개 처리됨`
            : `완료: ${payload.processed}개 성공, ${payload.failed}개 실패`)
          break
        case 'exit':
          updateTask(taskId, { status: payload.success ? 'done' : 'error' })
          unlisten?.()
          unlistenEvent?.()
          break
      }
    })

    await invoke('run_automation', { task: taskId, config: {} })
  } catch (err) {
    updateTask(taskId, { status: 'error' })
    addTaskLog(taskId, `실행 오류: ${err.message}`)
  }
}

function TaskCard({ taskId, task, onRun }) {
  const { label } = TASK_META[taskId]
  return (
    <div className={`automation-task-card status-${task.status}`}>
      <span className={`task-status-icon status-${task.status}`}>
        {STATUS_ICON[task.status]}
      </span>
      <span className="task-label">{label}</span>
      {task.lastRun && (
        <span className="task-last-run">
          {new Date(task.lastRun).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      <button
        className="btn-task-run"
        onClick={() => onRun(taskId)}
        disabled={task.status === 'running'}
      >
        {task.status === 'running' ? '실행 중' : task.status === 'done' ? '재실행' : '실행'}
      </button>
    </div>
  )
}

async function extractSessions(setStatus) {
  if (!isTauri()) return
  setStatus('running')
  try {
    const { Command } = await import('@tauri-apps/plugin-shell')
    const { invoke } = await import('@tauri-apps/api/core')
    const automationDir = await invoke('get_automation_dir_path')
    const cmd = Command.create('node', ['scripts/extract-sessions.js'], { cwd: automationDir })
    let output = ''
    cmd.stdout.on('data', (line) => { output += line })
    cmd.stderr.on('data', (line) => { output += line })
    await new Promise((resolve, reject) => {
      cmd.on('close', ({ code }) => code === 0 ? resolve() : reject(new Error(output)))
      cmd.spawn().catch(reject)
    })
    setStatus('done')
  } catch (err) {
    console.error(err)
    setStatus('error')
  }
}

function Dashboard() {
  const tasks             = useMonitoringStore((s) => s.tasks)
  const csrItems          = useMonitoringStore((s) => s.csrItems)
  const unreadCount       = useMonitoringStore((s) => s.unreadCount)
  const csrRunning        = useMonitoringStore((s) => s.csrRunning)
  const csrLastPoll       = useMonitoringStore((s) => s.csrLastPoll)
  const mailRunning       = useMonitoringStore((s) => s.mailRunning)
  const mailLastPoll      = useMonitoringStore((s) => s.mailLastPoll)
  const updateTask        = useMonitoringStore((s) => s.updateTask)
  const addTaskLog        = useMonitoringStore((s) => s.addTaskLog)
  const clearAllLogs      = useMonitoringStore((s) => s.clearAllLogs)
  const setSelectedCategory = useUIStore((s) => s.setSelectedCategory)
  const [sessionStatus, setSessionStatus] = useState('idle') // idle | running | done | error
  const [sessionMtime, setSessionMtime]   = useState(null)

  const isMonitoring = csrRunning || mailRunning

  // 세션 파일 마지막 갱신 시간 확인
  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false
    const check = async () => {
      try {
        const { invoke }  = await import('@tauri-apps/api/core')
        const { stat }    = await import('@tauri-apps/plugin-fs')
        const automationDir = await invoke('get_automation_dir_path')
        const info = await stat(`${automationDir}/sessions/browser-session.json`)
        if (!cancelled) setSessionMtime(info.mtime)
      } catch {
        if (!cancelled) setSessionMtime(null)
      }
    }
    check()
    return () => { cancelled = true }
  }, [sessionStatus])

  const store = { updateTask, addTaskLog }

  const handleRun = (taskId) => spawnTask(taskId, store)
  const handleRunAll = () => {
    Object.keys(tasks).forEach((id) => {
      if (tasks[id].status !== 'running') spawnTask(id, store)
    })
  }

  const lastRun = Object.values(tasks)
    .map((t) => t.lastRun)
    .filter(Boolean)
    .sort()
    .at(-1)

  const newCsrCount = csrItems.filter((i) => i.isNew).length

  const allLogs = Object.entries(tasks)
    .flatMap(([id, t]) => t.log.map((e) => ({ ...e, label: TASK_META[id].label })))
    .sort((a, b) => a.ts - b.ts)
    .slice(-50)

  return (
    <main className="main-content monitoring-view">
      <h2 className="category-title category-dashboard">Dashboard</h2>

      <div className="monitoring-container">
        {/* 세션 설정 */}
        <div className="monitoring-section">
          <div className="monitoring-section-header">
            <h3 className="monitoring-section-title">세션</h3>
            {sessionMtime && (
              <span className="session-last-updated">
                마지막 갱신: {formatRelativeTime(sessionMtime)}
              </span>
            )}
            <button
              className={`btn-session-extract status-${sessionStatus}`}
              onClick={() => extractSessions(setSessionStatus)}
              disabled={sessionStatus === 'running' || isMonitoring}
            >
              {sessionStatus === 'running' ? '추출 중...'
                : sessionStatus === 'done' ? '✓ 세션 갱신 완료'
                : sessionStatus === 'error' ? '✕ 실패 (재시도)'
                : '세션 갱신'}
            </button>
          </div>
          <div className="session-setup">
            <div className="session-health-list">
              {[
                { label: 'CSR',  running: csrRunning,  lastPoll: csrLastPoll,  interval: 5 },
                { label: '메일', running: mailRunning, lastPoll: mailLastPoll, interval: 3 },
              ].map(({ label, running, lastPoll, interval }) => {
                const health = getSessionHealth(running, lastPoll, interval)
                const { dot, text, color } = HEALTH_LABEL[health]
                return (
                  <div key={label} className="session-health-item">
                    <span className="session-health-label">{label}</span>
                    <span className="session-health-status" style={{ color }}>
                      {dot} {text}
                    </span>
                    {lastPoll && (
                      <span className="session-health-time">
                        {formatRelativeTime(lastPoll)} 폴링
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="session-desc">Chrome이 열려 있는 상태에서 세션을 추출하면, 이후 모니터링이 백그라운드에서 자동 실행됩니다.</p>
            {isMonitoring && (
              <p className="session-warning">⚠ 모니터링 실행 중에는 세션을 갱신할 수 없습니다. 먼저 모니터링을 중지하세요.</p>
            )}
          </div>
        </div>

        {/* 현황 요약 */}
        <div className="monitoring-section">
          <div className="monitoring-section-header">
            <h3 className="monitoring-section-title">현황</h3>
          </div>
          <div className="summary-list">
            <button className="summary-item" onClick={() => setSelectedCategory('csr-monitor')}>
              <span className="summary-icon">◉</span>
              <span className="summary-label">CSR</span>
              <span className="summary-values">
                {newCsrCount > 0 && <span className="badge-new">신규 {newCsrCount}건</span>}
                <span className="summary-total">총 {csrItems.length}건</span>
              </span>
              <span className="summary-arrow">→</span>
            </button>
            <button className="summary-item" onClick={() => setSelectedCategory('mail-monitor')}>
              <span className="summary-icon">✉</span>
              <span className="summary-label">메일</span>
              <span className="summary-values">
                {unreadCount > 0
                  ? <span className="badge-unread">미읽음 {unreadCount}건</span>
                  : <span className="summary-total">없음</span>
                }
              </span>
              <span className="summary-arrow">→</span>
            </button>
          </div>
        </div>

        {/* 자동화 루틴 */}
        <div className="monitoring-section">
          <div className="monitoring-section-header">
            <h3 className="monitoring-section-title">자동화</h3>
            <div className="monitoring-section-actions">
              {lastRun && (
                <span className="last-run-time">
                  마지막: {new Date(lastRun).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <div className="task-list">
            {Object.entries(tasks).map(([id, task]) => (
              <TaskCard key={id} taskId={id} task={task} onRun={handleRun} />
            ))}
          </div>
        </div>

        {/* 실행 로그 */}
        {allLogs.length > 0 && (
          <div className="monitoring-section">
            <div className="monitoring-section-header">
              <h3 className="monitoring-section-title">실행 로그</h3>
              <button className="btn-log-clear" onClick={clearAllLogs} title="로그 지우기">✕</button>
            </div>
            <div className="log-area">
              {allLogs.map((entry, i) => (
                <div key={i} className="log-line">
                  <span className="log-label">[{entry.label}]</span>
                  <span className="log-message">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default Dashboard
