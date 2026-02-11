import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import styles from '../styles/modules/BackupManager.module.css'

export default function BackupManager({ onClose }) {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      const list = await invoke('list_backups')
      setBackups(list)
    } catch (error) {
      console.error('백업 목록 로드 실패:', error)
    }
  }

  const handleBackup = async () => {
    setLoading(true)
    setMessage('')
    try {
      const filename = await invoke('backup_data', { isManual: true })
      setMessage(`✓ 수동 백업 완료 (영구 보존): ${filename}`)
      await loadBackups()
    } catch (error) {
      setMessage(`✗ 백업 실패: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (filename) => {
    if (!confirm(`"${filename}" 백업으로 복구하시겠습니까?\n\n현재 데이터는 자동으로 백업됩니다.`)) {
      return
    }

    setLoading(true)
    setMessage('')
    try {
      await invoke('restore_backup', { backupFilename: filename })
      setMessage('✓ 복구 완료! 페이지를 새로고침하세요.')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage(`✗ 복구 실패: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const formatBackupName = (filename) => {
    // backup_manual_20260210_083015.json → 2026-02-10 08:30:15 (수동)
    // backup_auto_20260210_083015.json → 2026-02-10 08:30:15 (자동)
    const isManual = filename.includes('_manual_')
    const match = filename.match(/backup_(manual|auto)?_?(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/)
    if (match) {
      const [, type, year, month, day, hour, minute, second] = match
      const dateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`
      const badge = isManual ? ' 🔒 수동' : ' 🤖 자동'
      return dateStr + badge
    }
    return filename
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>백업 관리</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <div className={styles.actions}>
            <button
              className={styles.backupBtn}
              onClick={handleBackup}
              disabled={loading}
            >
              {loading ? '처리 중...' : '수동 백업'}
            </button>
            <p className={styles.info}>
              • 🤖 자동 백업: 앱 시작 시 24시간마다, 7일 후 자동 삭제<br />
              • 🔒 수동 백업: 영구 보존 (삭제 안 됨)
            </p>
          </div>

          {message && (
            <div className={message.startsWith('✓') ? styles.success : styles.error}>
              {message}
            </div>
          )}

          <div className={styles.backupList}>
            <h3>백업 목록 ({backups.length}개)</h3>
            {backups.length === 0 ? (
              <p className={styles.empty}>백업 파일이 없습니다.</p>
            ) : (
              <ul>
                {backups.map((filename) => (
                  <li key={filename} className={styles.backupItem}>
                    <span className={styles.backupName}>
                      {formatBackupName(filename)}
                    </span>
                    <button
                      className={styles.restoreBtn}
                      onClick={() => handleRestore(filename)}
                      disabled={loading}
                    >
                      복구
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
