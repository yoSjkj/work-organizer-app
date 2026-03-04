import { useState, useRef, useEffect } from 'react'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { useMonitoringStore } from '../../stores/useMonitoringStore'
import { isTauri } from '../../stores/tauriStorage'

// StrictMode 이중 등록 방지
let _mailUnlisten = null
let _mailListenerSetup = false

function MailMonitor() {
  const mailRunning       = useMonitoringStore((s) => s.mailRunning)
  const mailItems         = useMonitoringStore((s) => s.mailItems)
  const unreadCount       = useMonitoringStore((s) => s.unreadCount)
  const mailLogs          = useMonitoringStore((s) => s.mailLogs)
  const mailKeywords      = useMonitoringStore((s) => s.mailKeywords)
  const setMailRunning    = useMonitoringStore((s) => s.setMailRunning)
  const upsertMailItem    = useMonitoringStore((s) => s.upsertMailItem)
  const syncMailItems     = useMonitoringStore((s) => s.syncMailItems)
  const setUnreadCount    = useMonitoringStore((s) => s.setUnreadCount)
  const addMailLog        = useMonitoringStore((s) => s.addMailLog)
  const clearMail         = useMonitoringStore((s) => s.clearMail)
  const addMailKeyword    = useMonitoringStore((s) => s.addMailKeyword)
  const removeMailKeyword = useMonitoringStore((s) => s.removeMailKeyword)

  const [newKeyword, setNewKeyword] = useState('')

  // monitoring-event 리스너 (StrictMode 이중 등록 방지)
  useEffect(() => {
    if (_mailListenerSetup || !isTauri()) return
    _mailListenerSetup = true

    import('@tauri-apps/api/event').then(({ listen }) =>
      listen('monitoring-event', (event) => {
        const { task, line } = event.payload
        if (task !== 'mail') return
        try {
          const ev = JSON.parse(line)
          switch (ev.type) {
            case 'log':        addMailLog(ev.message); break
            case 'mail_new':
              upsertMailItem(ev.data)
              sendNotification({ title: '새 메일', body: ev.data.subject || ev.data.from }).catch(() => {})
              break
            case 'mail_count': setUnreadCount(ev.data.unread); break
            case 'mail_sync':  syncMailItems(ev.data.items); break
            case 'done':
              setMailRunning(false)
              addMailLog(`모니터링 종료 (코드 ${ev.code})`)
              break
          }
        } catch { /* JSON 파싱 실패 무시 */ }
      })
    ).then(fn => {
      if (!_mailListenerSetup || _mailUnlisten) { fn(); return }
      _mailUnlisten = fn
    })

    return () => {
      if (_mailUnlisten) { _mailUnlisten(); _mailUnlisten = null }
      _mailListenerSetup = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const logRef = useRef(null)
  useEffect(() => {
    const el = logRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    if (isNearBottom) el.scrollTop = el.scrollHeight
  }, [mailLogs])

  const handleStart = async () => {
    if (!isTauri()) {
      addMailLog('Tauri 환경에서만 실행 가능합니다')
      return
    }
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      setMailRunning(true)
      addMailLog('모니터링 시작')
      const config = await invoke('get_automation_config').catch(() => ({}))
      await invoke('run_monitoring', { task: 'mail', config })
    } catch (err) {
      setMailRunning(false)
      addMailLog(`실행 오류: ${String(err)}`)
    }
  }

  const handleStop = async () => {
    if (!isTauri()) return
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('stop_monitoring', { task: 'mail' })
    } catch { /* 무시 */ }
    setMailRunning(false)
    addMailLog('모니터링 중지')
  }

  const handleAddKeyword = (e) => {
    e.preventDefault()
    if (newKeyword.trim()) {
      addMailKeyword(newKeyword)
      setNewKeyword('')
    }
  }

  return (
    <main className="main-content monitoring-view">
      <h2 className="category-title category-mail-monitor">
        메일 모니터링
      </h2>

      <div className="monitoring-container">
        {/* 메일 목록 */}
        <div className="monitoring-section">
          <div className="monitoring-section-header">
            <h3 className="monitoring-section-title">
              메일 목록
              <span className={`running-badge ${mailRunning ? 'active' : ''}`}>
                {mailRunning ? '● 모니터링 중' : '○ 중지'}
              </span>
            </h3>
            <div className="monitoring-section-actions">
              {!mailRunning
                ? <button className="btn-monitor-start" onClick={handleStart}>▶ 시작</button>
                : <button className="btn-monitor-stop" onClick={handleStop}>■ 중지</button>
              }
              <button className="btn-clear" onClick={clearMail} disabled={mailRunning}>초기화</button>
            </div>
          </div>

          {mailItems.length === 0 ? (
            <div className="empty-state">모니터링을 시작하면 메일 목록이 표시됩니다</div>
          ) : (
            <div className="mail-list">
              {mailItems.map((mail, i) => (
                <div
                  key={mail.id || i}
                  className={`mail-item ${!mail.isRead ? 'unread' : ''} ${mail.matchedKeyword ? 'matched' : ''}`}
                >
                  <div className="mail-item-header">
                    <span className="mail-from">{mail.from}</span>
                    <span className="mail-time">{mail.time}</span>
                  </div>
                  <div className="mail-subject">{mail.subject}</div>
                  {mail.matchedKeyword && (
                    <span className="mail-keyword-badge">{mail.matchedKeyword}</span>
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
            {mailLogs.length === 0 ? (
              <span className="log-empty">로그 없음</span>
            ) : (
              mailLogs.map((entry, i) => (
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

export default MailMonitor
