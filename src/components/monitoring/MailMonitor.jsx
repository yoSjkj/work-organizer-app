import { useState } from 'react'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { useMonitoringStore } from '../../stores/useMonitoringStore'
import { isTauri } from '../../stores/tauriStorage'

const MAIL_SCRIPT = 'automation/scripts/mail-monitor.js'

function MailMonitor() {
  const mailRunning       = useMonitoringStore((s) => s.mailRunning)
  const mailItems         = useMonitoringStore((s) => s.mailItems)
  const unreadCount       = useMonitoringStore((s) => s.unreadCount)
  const mailLogs          = useMonitoringStore((s) => s.mailLogs)
  const mailKeywords      = useMonitoringStore((s) => s.mailKeywords)
  const setMailRunning    = useMonitoringStore((s) => s.setMailRunning)
  const upsertMailItem    = useMonitoringStore((s) => s.upsertMailItem)
  const setUnreadCount    = useMonitoringStore((s) => s.setUnreadCount)
  const addMailLog        = useMonitoringStore((s) => s.addMailLog)
  const addMailKeyword    = useMonitoringStore((s) => s.addMailKeyword)
  const removeMailKeyword = useMonitoringStore((s) => s.removeMailKeyword)
  const registerProcess   = useMonitoringStore((s) => s.registerProcess)
  const unregisterProcess = useMonitoringStore((s) => s.unregisterProcess)
  const getProcess        = useMonitoringStore((s) => s.getProcess)

  const [newKeyword, setNewKeyword] = useState('')

  const handleStart = async () => {
    if (!isTauri()) {
      addMailLog('Tauri 환경에서만 실행 가능합니다')
      return
    }
    try {
      const { Command } = await import('@tauri-apps/plugin-shell')
      setMailRunning(true)
      addMailLog('메일 모니터링 시작')

      const cmd = Command.create('node', [MAIL_SCRIPT])
      cmd.stdout.on('data', (line) => {
        if (!line.trim()) return
        try {
          const ev = JSON.parse(line)
          switch (ev.type) {
            case 'log':        addMailLog(ev.message); break
            case 'mail_new':
              upsertMailItem(ev.data)
              sendNotification({ title: '새 메일', body: ev.data.subject || ev.data.from }).catch(() => {})
              break
            case 'mail_count': setUnreadCount(ev.data.unread); break
          }
        } catch {
          addMailLog(line.trim())
        }
      })
      cmd.stderr.on('data', (line) => {
        if (line.trim()) addMailLog(`[오류] ${line.trim()}`)
      })
      cmd.on('close', ({ code }) => {
        setMailRunning(false)
        addMailLog(`프로세스 종료 (코드 ${code})`)
        unregisterProcess('mail')
      })

      const child = await cmd.spawn()
      registerProcess('mail', child)
    } catch (err) {
      setMailRunning(false)
      addMailLog(`실행 오류: ${err.message}`)
    }
  }

  const handleStop = async () => {
    const child = getProcess('mail')
    if (child) {
      try { await child.kill() } catch { /* ignore */ }
    }
    setMailRunning(false)
    unregisterProcess('mail')
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
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
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

        {/* 키워드 필터 */}
        <div className="monitoring-section">
          <h3 className="monitoring-section-title">키워드 필터</h3>
          <form className="keyword-form" onSubmit={handleAddKeyword}>
            <input
              type="text"
              className="keyword-input"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="키워드 추가 (Enter)"
            />
            <button type="submit" className="btn-keyword-add">추가</button>
          </form>
          <div className="keyword-list">
            {mailKeywords.length === 0 ? (
              <span className="keyword-empty">등록된 키워드 없음</span>
            ) : (
              mailKeywords.map((kw) => (
                <span key={kw} className="keyword-tag">
                  {kw}
                  <button className="keyword-remove" onClick={() => removeMailKeyword(kw)}>✕</button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* 실행 로그 */}
        <div className="monitoring-section">
          <h3 className="monitoring-section-title">실행 로그</h3>
          <div className="log-area">
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
