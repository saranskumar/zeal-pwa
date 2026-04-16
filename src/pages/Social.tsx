import { useState } from 'react'
import { Search, UserPlus, Check, X, Trophy, Users } from 'lucide-react'
import { useLeaderboard, useActivityFeed } from '@/hooks/useLeaderboard'
import { usePendingRequests, useSearchUsers, useSendFriendRequest, useRespondToRequest } from '@/hooks/useFriends'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/types'

type SocialTab = 'feed' | 'leaderboard' | 'friends'

export default function SocialPage() {
  const [tab, setTab]     = useState<SocialTab>('feed')
  const [search, setSearch] = useState('')

  const { data: pending } = usePendingRequests()

  return (
    <div className="px-4 pt-10 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Social</h1>
        {(pending?.length ?? 0) > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {pending!.length} request{pending!.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-secondary/50 p-1.5 rounded-[20px]">
        {([
          { id: 'feed',        label: 'Feed'        },
          { id: 'leaderboard', label: 'Leaderboard' },
          { id: 'friends',     label: 'Friends'     },
        ] as { id: SocialTab; label: string }[]).map((t) => (
          <button
            key={t.id}
            id={`social-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all duration-300',
              tab === t.id
                ? 'bg-background text-primary shadow-elevation-1'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'feed'        && <ActivityFeedTab />}
      {tab === 'leaderboard' && <LeaderboardTab />}
      {tab === 'friends'     && (
        <FriendsTab search={search} onSearchChange={setSearch} />
      )}
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeedTab() {
  const { data: events, isLoading } = useActivityFeed()

  if (isLoading) return <FeedSkeleton />

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users size={40} className="text-zeal-200 mb-3" />
        <p className="font-semibold text-foreground">No activity yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add friends to see their study activity here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map((event) => {
        const timeAgo = getTimeAgo(event.created_at)
        let text = ''
        let icon = '👋'

        if (event.event_type === 'topic_completed') {
          text = `finished a topic in ${(event.payload as { subject_name: string }).subject_name}`
          icon = '✅'
        } else if (event.event_type === 'hours_logged') {
          text = `put in ${(event.payload as { hours: number }).hours} hours of deep work`
          icon = '💡'
        } else if (event.event_type === 'streak_milestone') {
          text = `is on fire with a ${(event.payload as { streak_count: number }).streak_count}-day streak!`
          icon = '🔥'
        }

        return (
          <div
            key={event.id}
            className="surface-container flex items-center gap-4 px-5 py-4 animate-fade-in hover:shadow-elevation-2 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                <span className="text-primary">Someone</span> {text}
              </p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{timeAgo}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function LeaderboardTab() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')
  const { data: entries, isLoading } = useLeaderboard(period)

  return (
    <div>
      <div className="flex gap-3 mb-6">
        {(['daily', 'weekly'] as const).map((p) => (
          <button
            key={p}
            id={`leaderboard-${p}`}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300',
              period === p
                ? 'bg-primary text-primary-foreground border-primary shadow-elevation-1'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary/20'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading && <FeedSkeleton />}

      {!isLoading && (entries?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy size={40} className="text-zeal-200 mb-3" />
          <p className="font-semibold text-foreground">Invite 1 friend to unlock the leaderboard</p>
          <p className="text-sm text-muted-foreground mt-1">Find friends in the Friends tab</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {entries?.map((entry, idx) => (
          <div
            key={entry.user.id}
            className={cn(
              'surface-container flex items-center gap-4 p-4 transition-all duration-300 hover:shadow-elevation-2',
              idx === 0 && 'border-amber-500/20 bg-amber-500/5 shadow-elevation-1'
            )}
          >
            <div className={cn(
              'w-8 text-center font-black italic',
              idx === 0 ? 'text-2xl text-amber-500' : idx === 1 ? 'text-xl text-slate-400' : idx === 2 ? 'text-lg text-amber-700' : 'text-sm text-muted-foreground'
            )}>
              {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : idx + 1}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-lg font-black text-primary flex-shrink-0 shadow-inner">
              {entry.user.display_name?.[0]?.toUpperCase() ?? entry.user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-foreground truncate">
                {entry.user.display_name ?? entry.user.username}
              </p>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-0.5">@{entry.user.username}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-primary">{entry.score.daily_points}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">POINTS</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Friends ──────────────────────────────────────────────────────────────────

function FriendsTab({
  search,
  onSearchChange,
}: {
  search: string
  onSearchChange: (v: string) => void
}) {
  const { data: pending }     = usePendingRequests()
  const { data: results }     = useSearchUsers(search)
  const sendRequest           = useSendFriendRequest()
  const respondRequest        = useRespondToRequest()
  const userId                = useAuthStore((s) => s.user?.id)

  const profile = useAuthStore((s) => s.profile)
  const inviteLink = profile ? `https://zeal.app/join/${profile.username}` : ''

  return (
    <div className="flex flex-col gap-5">
      {/* Invite link */}
      <div className="surface-container p-6 bg-primary/5 border-primary/10 text-center animate-fade-in">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-1">Spread the Zeal</h3>
        <p className="text-xs text-muted-foreground mb-5">Building a study group increases consistency by 40%.</p>
        <div className="flex items-center gap-2 p-1 bg-background rounded-2xl border border-border shadow-inner">
          <input
            readOnly
            value={inviteLink || 'Complete profile to get link'}
            className="bg-transparent border-0 outline-none flex-1 text-xs px-4 font-bold text-muted-foreground truncate"
          />
          <button
            id="copy-invite-link"
            onClick={() => navigator.clipboard.writeText(inviteLink)}
            className="text-[10px] font-black uppercase bg-primary text-primary-foreground px-5 py-2.5 rounded-[14px] shadow-elevation-1 hover:shadow-elevation-2 transition-all active:scale-95"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Pending requests */}
      {(pending?.length ?? 0) > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Friend requests</p>
          <div className="flex flex-col gap-2">
            {pending!.map((req) => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-border shadow-sm">
                <div className="w-9 h-9 rounded-full bg-zeal-100 flex items-center justify-center text-sm font-bold text-zeal-600">
                  ?
                </div>
                <p className="flex-1 text-sm font-medium text-foreground">{req.requester_id.slice(0, 8)}...</p>
                <button
                  id={`accept-${req.id}`}
                  onClick={() => respondRequest.mutate({ friendshipId: req.id, action: 'accepted' })}
                  className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition"
                >
                  <Check size={14} />
                </button>
                <button
                  id={`decline-${req.id}`}
                  onClick={() => respondRequest.mutate({ friendshipId: req.id, action: 'declined' })}
                  className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Find friends</p>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="friend-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by username or name"
            className="input-field pl-9 w-full"
          />
        </div>

        {search.length >= 2 && (
          <div className="flex flex-col gap-2 mt-3">
            {(results?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}
            {results?.map((user: UserProfile) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-border shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-zeal-100 flex items-center justify-center text-sm font-bold text-zeal-600 flex-shrink-0">
                  {(user.display_name?.[0] ?? user.username[0]).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{user.display_name ?? user.username}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                {user.id !== userId && (
                  <button
                    id={`add-friend-${user.id}`}
                    onClick={() => sendRequest.mutate(user.id)}
                    disabled={sendRequest.isPending}
                    className="flex items-center gap-1 text-xs text-zeal-600 font-semibold px-3 py-1.5 rounded-xl bg-zeal-50 border border-zeal-200 hover:bg-zeal-100 transition disabled:opacity-60"
                  >
                    <UserPlus size={12} />
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function FeedSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[0,1,2].map(i => <div key={i} className="h-16 bg-muted rounded-2xl"/>)}
    </div>
  )
}
