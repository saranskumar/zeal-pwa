import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
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
      {/* Offline indicator — 3px amber bar, calm not alarming */}
      {showOfflineBanner && !isOnline && (
        <div id="offline-banner" className="offline-bar" aria-label="Offline mode active" />
      )}

      {/* Top App Bar — wordmark only */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center h-12 max-w-lg mx-auto px-4">
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Zeal</span>
        </div>
      </header>

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
