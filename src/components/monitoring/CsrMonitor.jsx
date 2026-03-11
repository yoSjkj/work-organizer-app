import { useRef, useEffect } from 'react'
import { useMonitoringStore } from '../../stores/useMonitoringStore'
import { isTauri } from '../../stores/tauriStorage'

function CsrMonitor() {
  const csrRunning        = useMonitoringStore((s) => s.csrRunning)
  const csrItems          = useMonitoringStore((s) => s.csrItems)
  const csrLogs           = useMonitoringStore((s) => s.csrLogs)
  const setCsrRunning     = useMonitoringStore((s) => s.setCsrRunning)
  const addCsrLog         = useMonitoringStore((s) => s.addCsrLog)
  const clearCsr          = useMonitoringStore((s) => s.clearCsr)
  const markCsrSeen       = useMonitoringStore((s) => s.markCsrSeen)

  const handleStart = async () => {
    if (!isTauri()) {
      addCsrLog('Tauri 환경에서만 실행 가능합니다')
      return
    }
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      setCsrRunning(true)
      addCsrLog('모니터링 시작')
      const config = await invoke('get_automation_config').catch(() => ({}))
      await invoke('run_monitoring', { task: 'csr', config })
    } catch (err) {
      setCsrRunning(false)
      addCsrLog(`실행 오류: ${String(err)}`)
    }
  }

  const handleStop = async () => {
    if (!isTauri()) return
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('stop_monitoring', { task: 'csr' })
    } catch { /* 무시 */ }
    setCsrRunning(false)
    addCsrLog('모니터링 중지')
  }

  const logRef = useRef(null)
  useEffect(() => {
    const el = logRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    if (isNearBottom) el.scrollTop = el.scrollHeight
  }, [csrLogs])

  return (
    <main className="main-content monitoring-view">
      <h2 className="category-title category-csr-monitor">
        CSR 모니터링
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
              <button className="btn-clear" onClick={clearCsr} disabled={csrRunning}>초기화</button>
            </div>
          </div>

          {csrItems.length === 0 ? (
            <div className="empty-state">모니터링을 시작하면 CSR 항목이 표시됩니다</div>
          ) : (
            <div className="csr-list">
              {csrItems.map((item) => (
                <div key={item.ritm} className={`csr-item ${item.isNew ? 'is-new' : ''}`} onClick={() => item.isNew && markCsrSeen(item.ritm)}>
                  <div className="csr-item-header">
                    <span className="csr-ritm">{item.ritm}</span>
                    {item.isNew && <span className="badge-new" title="클릭하여 확인">NEW</span>}
                    {item.approvalKo && (
                      <span className={`badge-approval approval-${item.approval}`}>{item.approvalKo}</span>
                    )}
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
          <div className="log-area" ref={logRef}>
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
