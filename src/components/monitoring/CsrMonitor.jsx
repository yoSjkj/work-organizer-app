import { sendNotification } from '@tauri-apps/plugin-notification'
import { useMonitoringStore } from '../../stores/useMonitoringStore'
import { isTauri } from '../../stores/tauriStorage'

const CSR_SCRIPT = 'scripts/csr-monitor.js'

function CsrMonitor() {
  const csrRunning        = useMonitoringStore((s) => s.csrRunning)
  const csrItems          = useMonitoringStore((s) => s.csrItems)
  const csrLogs           = useMonitoringStore((s) => s.csrLogs)
  const setCsrRunning     = useMonitoringStore((s) => s.setCsrRunning)
  const upsertCsrItem     = useMonitoringStore((s) => s.upsertCsrItem)
  const syncCsrItems      = useMonitoringStore((s) => s.syncCsrItems)
  const addCsrLog         = useMonitoringStore((s) => s.addCsrLog)
  const clearCsr          = useMonitoringStore((s) => s.clearCsr)
  const registerProcess   = useMonitoringStore((s) => s.registerProcess)
  const unregisterProcess = useMonitoringStore((s) => s.unregisterProcess)
  const getProcess        = useMonitoringStore((s) => s.getProcess)

  const handleStart = async () => {
    if (!isTauri()) {
      addCsrLog('Tauri 환경에서만 실행 가능합니다')
      return
    }
    try {
      const { Command } = await import('@tauri-apps/plugin-shell')
      const { invoke } = await import('@tauri-apps/api/core')
      setCsrRunning(true)

      const automationDir = await invoke('get_automation_dir_path')
      const cmd = Command.create('node', [CSR_SCRIPT], { cwd: automationDir })
      cmd.stdout.on('data', (line) => {
        if (!line.trim()) return
        try {
          const ev = JSON.parse(line)
          switch (ev.type) {
            case 'log':        addCsrLog(ev.message); break
            case 'csr_new':
              upsertCsrItem(ev.data)
              addCsrLog(`신규 CSR: ${ev.data.ritm}`)
              sendNotification({ title: 'CSR 신규 접수', body: ev.data.title || ev.data.ritm }).catch(() => {})
              break
            case 'csr_update': upsertCsrItem(ev.data); break
            case 'csr_sync':   syncCsrItems(ev.data.ritms); break
          }
        } catch {
          addCsrLog(line.trim())
        }
      })
      cmd.stderr.on('data', (line) => {
        if (line.trim()) addCsrLog(`[오류] ${line.trim()}`)
      })
      cmd.on('close', ({ code }) => {
        setCsrRunning(false)
        addCsrLog(`프로세스 종료 (코드 ${code})`)
        unregisterProcess('csr')
      })

      const child = await cmd.spawn()
      registerProcess('csr', child)
    } catch (err) {
      setCsrRunning(false)
      addCsrLog(`실행 오류: ${err.message}`)
    }
  }

  const handleDebug = async () => {
    if (!isTauri()) return
    try {
      const { Command } = await import('@tauri-apps/plugin-shell')
      const { invoke } = await import('@tauri-apps/api/core')
      addCsrLog('DOM 진단 시작...')
      const automationDir = await invoke('get_automation_dir_path')
      const cmd = Command.create('node', ['scripts/debug-csr.js'], { cwd: automationDir })
      cmd.stdout.on('data', (line) => { if (line.trim()) addCsrLog(line.trim()) })
      cmd.stderr.on('data', (line) => { if (line.trim()) addCsrLog(`[오류] ${line.trim()}`) })
      cmd.on('close', ({ code }) => addCsrLog(code === 0 ? '✅ 진단 완료' : `❌ 종료 (코드 ${code})`))
      await cmd.spawn()
    } catch (err) {
      addCsrLog(`실행 오류: ${err.message}`)
    }
  }

  const handleStop = async () => {
    const child = getProcess('csr')
    if (child) {
      try { await child.kill() } catch { /* ignore */ }
    }
    setCsrRunning(false)
    unregisterProcess('csr')
    addCsrLog('모니터링 중지')
  }

  const newCount = csrItems.filter((i) => i.isNew).length

  return (
    <main className="main-content monitoring-view">
      <h2 className="category-title category-csr-monitor">
        CSR 모니터링
        {newCount > 0 && <span className="unread-badge">{newCount}</span>}
      </h2>

      <div className="monitoring-container">
        {/* CSR 목록 */}
        <div className="monitoring-section">
          <div className="monitoring-section-header">
            <h3 className="monitoring-section-title">
              CSR 목록
              <span className={`running-badge ${csrRunning ? 'active' : ''}`}>
                {csrRunning ? '● 모니터링 중' : '○ 중지'}
              </span>
            </h3>
            <div className="monitoring-section-actions">
              {!csrRunning
                ? <button className="btn-monitor-start" onClick={handleStart}>▶ 시작</button>
                : <button className="btn-monitor-stop" onClick={handleStop}>■ 중지</button>
              }
              <button className="btn-monitor-debug" onClick={handleDebug} disabled={csrRunning}>🔍 DOM 진단</button>
              <button className="btn-clear" onClick={clearCsr} disabled={csrRunning}>초기화</button>
            </div>
          </div>

          {csrItems.length === 0 ? (
            <div className="empty-state">모니터링을 시작하면 CSR 항목이 표시됩니다</div>
          ) : (
            <div className="csr-list">
              {csrItems.map((item) => (
                <div key={item.ritm} className={`csr-item ${item.isNew ? 'is-new' : ''}`}>
                  <div className="csr-item-header">
                    <span className="csr-ritm">{item.ritm}</span>
                    {item.isNew && <span className="badge-new">NEW</span>}
                    {item.status && (
                      <span className="csr-status">{item.status}</span>
                    )}
                  </div>
                  <div className="csr-item-title">{item.title}</div>
                  {item.assignee && (
                    <div className="csr-item-meta">담당: {item.assignee}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 실행 로그 */}
        <div className="monitoring-section">
          <h3 className="monitoring-section-title">실행 로그</h3>
          <div className="log-area">
            {csrLogs.length === 0 ? (
              <span className="log-empty">로그 없음</span>
            ) : (
              csrLogs.map((entry, i) => (
                <div key={i} className="log-line">
                  <span className="log-time">
                    {new Date(entry.ts).toLocaleTimeString('ko-KR', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </span>
                  <span className="log-message">{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default CsrMonitor
