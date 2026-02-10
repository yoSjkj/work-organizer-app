import { invoke } from '@tauri-apps/api/core'
import localforage from 'localforage'

/**
 * IndexedDB → 파일 마이그레이션 (최초 1회만 실행)
 */
let migrationDone = false

const migrateFromIndexedDB = async () => {
  if (migrationDone) return null

  try {
    // IndexedDB에서 기존 데이터 확인
    const indexedDBData = await localforage.getItem('workItems')

    if (indexedDBData) {
      console.log('📦 IndexedDB 데이터 발견! 파일로 마이그레이션 시작...')

      // 파일로 저장
      const jsonString = typeof indexedDBData === 'string'
        ? indexedDBData
        : JSON.stringify(indexedDBData)

      await invoke('save_data', { data: jsonString })

      console.log('✅ 마이그레이션 완료!')
      migrationDone = true

      return jsonString
    }
  } catch (error) {
    console.error('마이그레이션 실패:', error)
  }

  migrationDone = true
  return null
}

/**
 * Tauri 파일 기반 스토리지 어댑터
 * Zustand persist 미들웨어에서 사용
 */
export const tauriStorage = {
  getItem: async (name) => {
    try {
      // 1. 파일에서 데이터 로드
      const data = await invoke('load_data')

      // 2. 파일이 비어있으면 IndexedDB 마이그레이션 시도
      if (data === 'null' || !data) {
        const migratedData = await migrateFromIndexedDB()
        return migratedData
      }

      // Zustand persist는 JSON 파싱을 자동으로 하므로 문자열 그대로 반환
      return data
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      return null
    }
  },

  setItem: async (name, value) => {
    try {
      // value는 이미 JSON.stringify된 상태
      await invoke('save_data', { data: value })
    } catch (error) {
      console.error('데이터 저장 실패:', error)
    }
  },

  removeItem: async (name) => {
    try {
      await invoke('save_data', { data: 'null' })
    } catch (error) {
      console.error('데이터 삭제 실패:', error)
    }
  }
}

/**
 * 데이터 저장 경로 확인
 */
export const getDataPath = async () => {
  try {
    const path = await invoke('get_data_path')
    return path
  } catch (error) {
    console.error('경로 확인 실패:', error)
    return null
  }
}

/**
 * Tauri 환경인지 확인
 */
export const isTauri = () => {
  return typeof window !== 'undefined' &&
    (window.__TAURI_INTERNALS__ !== undefined || window.__TAURI__ !== undefined)
}
