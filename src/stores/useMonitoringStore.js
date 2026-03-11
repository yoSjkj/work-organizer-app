import { create } from 'zustand'

const makeTaskState = () => ({
  status: 'idle', // idle | running | done | error
  lastRun: null,
  log: [],
})

export const useMonitoringStore = create((set, get) => ({
  tasks: {
    itsm: makeTaskState(),
  },

  csrRunning: false,
  csrItems: [],
  csrLogs: [],
  csrLastPoll: null,   // 마지막 폴링 성공 시각 (timestamp)

  mailRunning: false,
  mailItems: [],
  unreadCount: 0,
  mailLogs: [],
  mailLastPoll: null,  // 마지막 폴링 성공 시각 (timestamp)
  mailKeywords: JSON.parse(localStorage.getItem('monitoring-mail-keywords') || '[]'),

  // Non-reactive process map (직접 변이, 렌더링 트리거 없음)
  _processes: {},

  // --- Task actions ---
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: { ...state.tasks, [taskId]: { ...state.tasks[taskId], ...updates } },
    })),

  addTaskLog: (taskId, message) =>
    set((state) => {
      const task = state.tasks[taskId]
      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            log: [...task.log.slice(-199), { message, ts: Date.now() }],
          },
        },
      }
    }),

  clearTaskLog: (taskId) =>
    set((state) => ({
      tasks: { ...state.tasks, [taskId]: { ...state.tasks[taskId], log: [] } },
    })),

  clearAllLogs: () =>
    set((state) => ({
      tasks: Object.fromEntries(
        Object.entries(state.tasks).map(([id, t]) => [id, { ...t, log: [] }])
      ),
    })),

  // --- CSR actions ---
  setCsrRunning: (running) => set({ csrRunning: running }),

  upsertCsrItem: (item) =>
    set((state) => {
      const exists = state.csrItems.find((i) => i.ritm === item.ritm)
      if (exists) {
        return {
          csrItems: state.csrItems.map((i) =>
            i.ritm === item.ritm ? { ...i, ...item, isNew: false } : i
          ),
        }
      }
      return { csrItems: [{ ...item, isNew: true }, ...state.csrItems] }
    }),

  syncCsrItems: (ritms) =>
    set((state) => ({
      csrItems: state.csrItems.filter((i) => ritms.includes(i.ritm)),
    })),

  addCsrLog: (message) =>
    set((state) => ({
      csrLogs: [...state.csrLogs.slice(-199), { message, ts: Date.now() }],
    })),

  setCsrLastPoll: (ts) => set({ csrLastPoll: ts }),

  markCsrSeen: (ritm) =>
    set((state) => ({
      csrItems: state.csrItems.map((i) => i.ritm === ritm ? { ...i, isNew: false } : i),
    })),

  clearCsr: () => set({ csrItems: [], csrLogs: [], csrLastPoll: null }),

  // --- Mail actions ---
  setMailRunning: (running) => set({ mailRunning: running }),

  upsertMailItem: (item) =>
    set((state) => ({
      mailItems: [item, ...state.mailItems.filter((i) => i.id !== item.id)].slice(0, 200),
    })),

  syncMailItems: (items) => set({ mailItems: items }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  addMailLog: (message) =>
    set((state) => ({
      mailLogs: [...state.mailLogs.slice(-199), { message, ts: Date.now() }],
    })),

  setMailLastPoll: (ts) => set({ mailLastPoll: ts }),

  clearMail: () => set({ mailItems: [], mailLogs: [], unreadCount: 0, mailLastPoll: null }),

  addMailKeyword: (keyword) =>
    set((state) => {
      const next = [...new Set([...state.mailKeywords, keyword.trim()])].filter(Boolean)
      localStorage.setItem('monitoring-mail-keywords', JSON.stringify(next))
      return { mailKeywords: next }
    }),

  removeMailKeyword: (keyword) =>
    set((state) => {
      const next = state.mailKeywords.filter((k) => k !== keyword)
      localStorage.setItem('monitoring-mail-keywords', JSON.stringify(next))
      return { mailKeywords: next }
    }),

  // --- Process refs (비직렬화, 직접 변이) ---
  registerProcess: (id, child) => {
    get()._processes[id] = child
  },
  unregisterProcess: (id) => {
    delete get()._processes[id]
  },
  getProcess: (id) => get()._processes[id],
}))
