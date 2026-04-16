import { useState } from 'react'
import { useLeaderboard, useActivityFeed } from '@/hooks/useLeaderboard'
import { usePendingRequests, useSearchUsers, useSendFriendRequest, useRespondToRequest } from '@/hooks/useFriends'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/types'

type SocialTab = 'feed' | 'leaderboard' | 'friends'

export default function SocialPage() {
  const [tab, setTab]       = useState<SocialTab>('feed')
  const [search, setSearch] = useState('')
  const { data: pending }   = usePendingRequests()

  return (
    <div className="screen">

      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-[22px] font-semibold text-foreground">Social</h1>
        {(pending?.length ?? 0) > 0 && (
          <span className="label-mono bg-destructive/10 text-destructive px-2 py-1 rounded-[6px]">
            {pending!.length} pending
          </span>
        )}
      </div>

      {/* ── Tabs (minimal text only) ────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 animate-fade-in">
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
              'flex-1 py-1.5 rounded-[8px] label-mono transition-colors border',
              tab === t.id
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:bg-secondary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'feed'        && <ActivityFeedTab />}
      {tab === 'leaderboard' && <LeaderboardTab />}
      {tab === 'friends'     && <FriendsTab search={search} onSearchChange={setSearch} />}
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeedTab() {
  const { data: events, isLoading } = useActivityFeed()

  if (isLoading) return <FeedSkeleton />

  if (!events || events.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <p className="empty-state-title">No activity yet.</p>
        <p className="empty-state-desc">Add friends to see their progress.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
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
          <div key={event.id} className="surface p-4 flex items-center gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-[10px] bg-secondary flex items-center justify-center text-[16px] flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-foreground leading-snug">
                <span className="font-semibold text-primary">Someone</span> {text}
              </p>
              <p className="label-mono mt-1">{timeAgo}</p>
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
    <div className="animate-fade-in">
      <div className="flex gap-2 mb-5">
        {(['daily', 'weekly'] as const).map((p) => (
          <button
            key={p}
            id={`leaderboard-${p}`}
            onClick={() => setPeriod(p)}
            className={cn(
              'label-mono px-3 py-1 rounded-[6px] border transition-colors',
              period === p
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-background border-border text-muted-foreground hover:bg-secondary'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading && <FeedSkeleton />}

      {!isLoading && (entries?.length ?? 0) === 0 && (
        <div className="empty-state">
          <p className="empty-state-title">Leaderboard locked.</p>
          <p className="empty-state-desc">Invite 1 friend to unlock ranking.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {entries?.map((entry, idx) => (
          <div key={entry.user.id} className="surface p-3 flex items-center gap-4">
            <div className="w-6 text-center text-[12px] font-semibold text-muted-foreground">
              #{idx + 1}
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center text-[15px] font-semibold flex-shrink-0">
              {(entry.user.display_name?.[0] ?? entry.user.username[0]).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground truncate">
                {entry.user.display_name ?? entry.user.username}
              </p>
              <p className="label-mono mt-0.5">@{entry.user.username}</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-semibold font-mono tabular-nums text-foreground">
                {entry.score.daily_points}
              </p>
              <p className="label-mono text-[9px]">XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Friends ──────────────────────────────────────────────────────────────────
function FriendsTab({ search, onSearchChange }: { search: string, onSearchChange: (v: string) => void }) {
  const { data: pending } = usePendingRequests()
  const { data: results } = useSearchUsers(search)
  const sendRequest       = useSendFriendRequest()
  const respondRequest    = useRespondToRequest()
  const userId            = useAuthStore((s) => s.user?.id)

  const profile = useAuthStore((s) => s.profile)
  const inviteLink = profile ? `zeal.app/join/${profile.username}` : ''

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Invite link */}
      <div>
        <p className="label-mono mb-2">Invite link</p>
        <div className="flex items-center gap-2 bg-secondary rounded-[8px] px-3 py-2">
          <span className="flex-1 text-[12px] text-muted-foreground font-mono truncate border-0 bg-transparent outline-none">
            {inviteLink || 'Complete profile first'}
          </span>
          <button
            id="copy-invite-link"
            onClick={() => navigator.clipboard.writeText(`https://${inviteLink}`)}
            className="label-mono px-3 py-1 rounded-[6px] bg-background border border-border hover:bg-white dark:hover:bg-accent transition-colors flex-shrink-0"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Pending requests */}
      {(pending?.length ?? 0) > 0 && (
        <div>
          <p className="label-mono mb-2">Requests</p>
          <div className="flex flex-col gap-2">
            {pending!.map((req) => (
              <div key={req.id} className="surface p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-secondary flex items-center justify-center text-[15px] font-semibold flex-shrink-0 text-muted-foreground">
                  ?
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">
                    {req.requester_id.slice(0, 8)}...
                  </p>
                  <p className="label-mono mt-0.5">Pending</p>
                </div>
                <button
                  id={`accept-${req.id}`}
                  onClick={() => respondRequest.mutate({ friendshipId: req.id, action: 'accepted' })}
                  className="label-mono px-3 py-1 rounded-[6px] bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  Accept
                </button>
                <button
                  id={`decline-${req.id}`}
                  onClick={() => respondRequest.mutate({ friendshipId: req.id, action: 'declined' })}
                  className="label-mono px-3 py-1 rounded-[6px] bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                >
                  Decline
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div>
        <p className="label-mono mb-2">Find friends</p>
        <input
          id="friend-search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Username..."
          className="w-full h-11 bg-background border border-border rounded-[10px] px-4 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
        />

        {search.length >= 2 && (
          <div className="flex flex-col gap-2 mt-4">
            {(results?.length ?? 0) === 0 && (
              <p className="label-mono text-center py-4">No users found</p>
            )}
            {results?.map((user: UserProfile) => (
              <div key={user.id} className="surface p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center text-[15px] font-semibold flex-shrink-0">
                  {(user.display_name?.[0] ?? user.username[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground truncate">
                    {user.display_name ?? user.username}
                  </p>
                  <p className="label-mono mt-0.5">@{user.username}</p>
                </div>
                {user.id !== userId && (
                  <button
                    id={`add-friend-${user.id}`}
                    onClick={() => sendRequest.mutate(user.id)}
                    disabled={sendRequest.isPending}
                    className="label-mono px-3 py-1 rounded-[6px] bg-secondary border border-border text-foreground hover:bg-background transition-colors disabled:opacity-50"
                  >
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
    <div className="space-y-2 animate-pulse">
      {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-[12px]" />)}
    </div>
  )
}
