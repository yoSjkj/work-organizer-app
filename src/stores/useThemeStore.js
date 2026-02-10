import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark', // 'dark' | 'light'

      setTheme: (theme) => {
        set({ theme })
        // HTML root에 테마 속성 설정
        document.documentElement.setAttribute('data-theme', theme)
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.setAttribute('data-theme', newTheme)
          return { theme: newTheme }
        })
      }
    }),
    {
      name: 'theme-storage',
      // 초기 로드 시 테마 적용
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      }
    }
  )
)
