import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { isTauri, getDataPath } from '../stores/tauriStorage'
import { useItemsStore } from '../stores/useItemsStore'
import { useThemeStore } from '../stores/useThemeStore'
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'
import styles from '../styles/modules/SettingsModal.module.css'

export default function SettingsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('data')
  const [dataPath, setDataPath] = useState(null)
  const [autoStartEnabled, setAutoStartEnabled] = useState(false)

  // 백업 관련 상태
  const [backups, setBackups] = useState([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupMessage, setBackupMessage] = useState('')

  // 테마
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const exportData = useItemsStore((state) => state.exportData)
  const importData = useItemsStore((state) => state.importData)

  useEffect(() => {
    if (isTauri()) {
      getDataPath().then(path => setDataPath(path))

      isEnabled().then(enabled => {
        setAutoStartEnabled(enabled)
      }).catch(err => {
        console.error('자동 시작 상태 확인 실패:', err)
      })

      // 백업 목록 로드
      loadBackups()
    }
  }, [])

  const loadBackups = async () => {
    if (!isTauri()) return
    try {
      const list = await invoke('list_backups')
      setBackups(list)
    } catch (error) {
      console.error('백업 목록 로드 실패:', error)
    }
  }

  const handleBackup = async () => {
    setBackupLoading(true)
    setBackupMessage('')
    try {
      const filename = await invoke('backup_data', { isManual: true })
      setBackupMessage(`✓ 수동 백업 완료: ${filename}`)
      await loadBackups()
    } catch (error) {
      setBackupMessage(`✗ 백업 실패: ${error}`)
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestore = async (filename) => {
    if (!confirm(`"${filename}" 백업으로 복구하시겠습니까?\n\n현재 데이터는 자동으로 백업됩니다.`)) {
      return
    }

    setBackupLoading(true)
    setBackupMessage('')
    try {
      await invoke('restore_backup', { backupFilename: filename })
      setBackupMessage('✓ 복구 완료! 페이지를 새로고침하세요.')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setBackupMessage(`✗ 복구 실패: ${error}`)
    } finally {
      setBackupLoading(false)
    }
  }

  const formatBackupName = (filename) => {
    const isManual = filename.includes('_manual_')
    const match = filename.match(/backup_(manual|auto)?_?(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/)
    if (match) {
      const [, type, year, month, day, hour, minute, second] = match
      const dateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`
      const badge = isManual ? ' (수동)' : ' (자동)'
      return dateStr + badge
    }
    return filename
  }

  const toggleAutoStart = async () => {
    try {
      if (autoStartEnabled) {
        await disable()
        setAutoStartEnabled(false)
      } else {
        await enable()
        setAutoStartEnabled(true)
      }
    } catch (error) {
      console.error('자동 시작 설정 실패:', error)
      alert('자동 시작 설정에 실패했습니다.')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h2>설정</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* 왼쪽 사이드 탭 */}
          <div className={styles.sidebar}>
            <button
              className={`${styles.tab} ${activeTab === 'data' ? styles.active : ''}`}
              onClick={() => setActiveTab('data')}
            >
              데이터 관리
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
              onClick={() => setActiveTab('general')}
            >
              기타
            </button>
          </div>

          {/* 오른쪽 내용 */}
          <div className={styles.content}>
            {activeTab === 'data' && (
              <div className={styles.panel}>
                <h3>데이터 관리</h3>

                {isTauri() ? (
                  <>
                    {/* 백업 버튼 */}
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <label className={styles.sectionLabel}>백업 및 복원</label>
                        <button
                          className={styles.backupBtn}
                          onClick={handleBackup}
                          disabled={backupLoading}
                        >
                          {backupLoading ? '처리 중...' : '수동 백업'}
                        </button>
                      </div>
                      <p className={styles.backupInfo}>
                        자동: 24시간마다, 7일 후 삭제 • 수동: 영구 보존
                      </p>
                    </div>

                    {/* 메시지 */}
                    {backupMessage && (
                      <div className={backupMessage.startsWith('✓') ? styles.success : styles.error}>
                        {backupMessage}
                      </div>
                    )}

                    {/* 백업 목록 */}
                    <div className={styles.section}>
                      <label className={styles.sectionLabel}>백업 목록 ({backups.length}개)</label>
                      {backups.length === 0 ? (
                        <p className={styles.empty}>백업 파일이 없습니다.</p>
                      ) : (
                        <div className={styles.backupList}>
                          {backups.map((filename) => (
                            <div key={filename} className={styles.backupItem}>
                              <span className={styles.backupName}>
                                {formatBackupName(filename)}
                              </span>
                              <button
                                className={styles.restoreBtn}
                                onClick={() => handleRestore(filename)}
                                disabled={backupLoading}
                              >
                                복구
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 저장 위치 */}
                    {dataPath && (
                      <div className={styles.section}>
                        <label className={styles.sectionLabel}>저장 위치</label>
                        <div className={styles.pathBox}>
                          <span className={styles.pathText}>{dataPath}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* 웹: 수동 백업/복원 */
                  <div className={styles.section}>
                    <label className={styles.sectionLabel}>백업 및 복원</label>
                    <div className={styles.buttonGroup}>
                      <button onClick={exportData} className={styles.primaryBtn}>
                        백업
                      </button>
                      <label className={styles.secondaryBtn}>
                        복원
                        <input
                          type="file"
                          accept=".json"
                          onChange={importData}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'general' && (
              <div className={styles.panel}>
                <h3>기타 설정</h3>

                {/* 테마 */}
                <div className={styles.section}>
                  <label className={styles.toggleLabel}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>다크 모드</span>
                      <span className={styles.toggleDesc}>어두운 테마로 눈의 피로를 줄입니다</span>
                    </div>
                    <input
                      type="checkbox"
                      className={styles.toggle}
                      checked={theme === 'dark'}
                      onChange={toggleTheme}
                    />
                  </label>
                </div>

                {/* 자동 시작 */}
                {isTauri() && (
                  <div className={styles.section}>
                    <label className={styles.toggleLabel}>
                      <div className={styles.toggleInfo}>
                        <span className={styles.toggleTitle}>Windows 시작 시 자동 실행</span>
                        <span className={styles.toggleDesc}>PC 부팅 시 트레이에 자동으로 시작합니다</span>
                      </div>
                      <input
                        type="checkbox"
                        className={styles.toggle}
                        checked={autoStartEnabled}
                        onChange={toggleAutoStart}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
