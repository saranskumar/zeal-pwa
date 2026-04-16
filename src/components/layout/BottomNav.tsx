import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Text-only navigation per spec — no icons, no visual noise
const NAV_ITEMS = [
  { id: 'home',     label: 'Today',    path: '/'         },
  { id: 'subjects', label: 'Subjects', path: '/subjects' },
  { id: 'plan',     label: 'Plan',     path: '/plan'     },
  { id: 'social',   label: 'Social',   path: '/social'   },
  { id: 'you',      label: 'You',      path: '/profile'  },
]

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-safe"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-[60px] max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn('bottom-nav-item', isActive && 'active')}
            >
              <span className="bottom-nav-label">{item.label}</span>
              {isActive && <span className="bottom-nav-indicator" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
