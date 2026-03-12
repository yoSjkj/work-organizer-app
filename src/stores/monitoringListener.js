/**
 * 모니터링 이벤트 리스너 - 모듈 레벨 초기화
 *
 * React useEffect 밖에서 한 번만 실행 → 화면 이동과 완전히 독립적
 */
import { useMonitoringStore } from './useMonitoringStore'
import { isTauri } from './tauriStorage'

if (isTauri() && !window.__monitoringListenerReady) {
  window.__monitoringListenerReady = true
  import('@tauri-apps/api/event').then(({ listen }) => {
    listen('monitoring-event', (event) => {
      const { task, line } = event.payload
      try {
        const ev = JSON.parse(line)
        const store = useMonitoringStore.getState()

        if (task === 'csr') {
          switch (ev.type) {
            case 'log': store.addCsrLog(ev.message); break
            case 'csr_new':
              store.upsertCsrItem(ev.data)
              store.addCsrLog(`신규 CSR: ${ev.data.ritm}`)
              import('@tauri-apps/plugin-notification').then(({ sendNotification }) =>
                sendNotification({ title: 'CSR 신규 접수', body: ev.data.title || ev.data.ritm }).catch(() => {})
              )
              break
            case 'csr_update': {
              const existing = store.csrItems.find(i => i.ritm === ev.data.ritm)
              store.upsertCsrItem(ev.data)
              if (ev.data.approval && existing?.approval !== ev.data.approval) {
                import('@tauri-apps/plugin-notification').then(({ sendNotification }) =>
                  sendNotification({
                    title: 'CSR 승인 상태 변경',
                    body: `${ev.data.ritm}: ${ev.data.approvalKo || ev.data.approval}`,
                  }).catch(() => {})
                )
              }
              break
            }
            case 'csr_sync':   store.syncCsrItems(ev.data.ritms); store.setCsrLastPoll(Date.now()); break
            case 'done':
              store.setCsrRunning(false)
              store.addCsrLog(`모니터링 종료 (코드 ${ev.code})`)
              break
          }
        } else if (task === 'mail') {
          switch (ev.type) {
            case 'log': store.addMailLog(ev.message); break
            case 'mail_new':
              store.upsertMailItem(ev.data)
              import('@tauri-apps/plugin-notification').then(({ sendNotification }) =>
                sendNotification({ title: '새 메일', body: ev.data.subject || ev.data.from }).catch(() => {})
              )
              break
            case 'mail_count': store.setUnreadCount(ev.data.unread); store.setMailLastPoll(Date.now()); break
            case 'mail_sync':  store.syncMailItems(ev.data.items); break
            case 'done':
              store.setMailRunning(false)
              store.addMailLog(`모니터링 종료 (코드 ${ev.code})`)
              break
          }
        }
      } catch { /* JSON 파싱 실패 무시 */ }
    })
  })
}
