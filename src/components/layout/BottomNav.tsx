import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, CalendarDays, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',     icon: Home,          path: '/'          },
  { id: 'subjects', label: 'Subjects', icon: BookOpen,       path: '/subjects'  },
  { id: 'plan',     label: 'Plan',     icon: CalendarDays,   path: '/plan'      },
  { id: 'social',   label: 'Social',   icon: Users,          path: '/social'    },
  { id: 'profile',  label: 'Profile',  icon: User,           path: '/profile'   },
]

interface BottomNavProps {
  friendRequestCount?: number
}

export function BottomNav({ friendRequestCount = 0 }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          const Icon     = item.icon

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all duration-300',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Material 3 active indicator pill */}
              <div className="relative">
                {isActive && (
                  <div className="absolute inset-x-[-12px] inset-y-[-2px] bg-primary/10 rounded-full animate-in fade-in zoom-in-75 duration-300" />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    'relative transition-transform duration-300',
                    isActive && 'scale-110'
                  )}
                />
                {item.id === 'social' && friendRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {friendRequestCount > 9 ? '9+' : friendRequestCount}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  'text-[11px] font-semibold transition-all duration-300',
                  isActive ? 'opacity-100' : 'opacity-70'
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
