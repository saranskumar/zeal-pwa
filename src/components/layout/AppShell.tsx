import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { ChooseUsername } from './ChooseUsername'
import { useUIStore } from '@/store/ui.store'
import { replayOfflineQueue, getQueueLength } from '@/lib/offline-queue'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { isOnline, showOfflineBanner, setOnline, setPendingWrites, showToast, theme } = useUIStore()

  // Apply theme class correctly on mount
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  // ── Online / offline detection ──────────────────────────────────────────
  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true)
      const queueLen = await getQueueLength()
      if (queueLen > 0) {
        const { replayed, failed } = await replayOfflineQueue(() => {
          showToast('Your plan was updated while you were offline — changes saved')
        })
        setPendingWrites(0)
        if (failed === 0) {
          showToast(`Back online — ${replayed} change${replayed !== 1 ? 's' : ''} synced`)
        }
      }
    }

    const handleOffline = async () => {
      setOnline(false)
      const count = await getQueueLength()
      setPendingWrites(count)
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline, setPendingWrites, showToast])

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center h-14 max-w-lg mx-auto px-4">
          <img src="/zeal_logo.png" alt="Zeal Logo" className="w-8 h-8 rounded-lg shadow-elevation-1" />
          <span className="ml-3 font-bold text-lg tracking-tight text-foreground">Zeal</span>
        </div>
      </header>

      {/* Offline banner */}
      {showOfflineBanner && !isOnline && (
        <div
          id="offline-banner"
          className="sticky top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 text-white text-xs font-bold py-1.5"
        >
          <WifiOff size={12} />
          <span>Offline — changes will sync later</span>
        </div>
      )}

      {/* Page content area — padded for bottom nav */}
      <main
        className={cn(
          'flex-1 overflow-y-auto pb-20',
          showOfflineBanner && !isOnline && 'pt-10'
        )}
      >
        <ChooseUsername />
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
