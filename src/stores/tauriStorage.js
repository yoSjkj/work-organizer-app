import { invoke } from '@tauri-apps/api/core'

/**
 * Tauri 파일 기반 스토리지 어댑터
 * Zustand persist 미들웨어에서 사용
 */
export const tauriStorage = {
  getItem: async (name) => {
    try {
      const data = await invoke('load_data')
      if (data === 'null' || !data) {
        return null
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
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined
}
