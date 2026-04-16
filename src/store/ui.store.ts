import { create } from 'zustand'

interface UIState {
  isOnline:              boolean
  pendingOfflineWrites:  number
  showOfflineBanner:     boolean
  activeTab:             string
  toastMessage:          string | null
  theme:                 'light' | 'dark'

  setOnline:              (online: boolean) => void
  setPendingWrites:       (count: number) => void
  setActiveTab:            (tab: string) => void
  showToast:              (message: string) => void
  dismissToast:           () => void
  setTheme:               (theme: 'light' | 'dark') => void
  toggleTheme:            () => void
}

const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('zeal-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUIStore = create<UIState>()((set, get) => ({
  isOnline:              navigator.onLine,
  pendingOfflineWrites:  0,
  showOfflineBanner:     false,
  activeTab:             'home',
  toastMessage:          null,
  theme:                 getInitialTheme(),

  setOnline: (online) =>
    set({ isOnline: online, showOfflineBanner: !online }),

  setPendingWrites: (count) => set({ pendingOfflineWrites: count }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  showToast: (message) => set({ toastMessage: message }),

  dismissToast: () => set({ toastMessage: null }),

  setTheme: (theme) => {
    localStorage.setItem('zeal-theme', theme)
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    set({ theme })
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(newTheme)
  },
}))
