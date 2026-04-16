import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useScoreHistory, useTodayScore } from '@/hooks/useScores'
import { useSubjects } from '@/hooks/useSubjects'
import { useTopics } from '@/hooks/useTopics'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/store/ui.store'

export default function ProfilePage() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const profile   = useAuthStore((s) => s.profile)
  const reset     = useAuthStore((s) => s.reset)
  const { theme, toggleTheme } = useUIStore()

  const { data: score }    = useTodayScore()
  const { data: history }  = useScoreHistory(30)
  const { data: subjects } = useSubjects()
  const { data: topics }   = useTopics()

  const chartData = (history ?? []).map((s) => ({
    date:   format(new Date(s.score_date + 'T00:00:00'), 'd MMM'),
    points: s.daily_points,
  }))

  const totalTopics = topics?.length ?? 0
  const doneTopics  = topics?.filter((t) => t.status === 'completed').length ?? 0

  async function handleLogout() {
    try { await supabase.auth.signOut() }
    catch (e) { console.error('Logout error:', e) }
    finally { reset(); navigate('/login') }
  }

  return (
    <div className="screen">

      {/* ── Header row ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-[22px] font-semibold text-foreground">You</h1>
        <div className="flex items-center gap-2">
          {/* Theme toggle — text label, no icon */}
          <button
            onClick={toggleTheme}
            id="toggle-theme"
            aria-label="Toggle theme"
            className="label-mono px-3 py-1.5 rounded-[8px] border border-border bg-background hover:bg-secondary transition-colors"
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <button
            id="logout-btn"
            onClick={handleLogout}
            aria-label="Sign out"
            className="label-mono px-3 py-1.5 rounded-[8px] border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <div className="surface p-4 mb-4 animate-fade-in">
        <div className="flex items-center gap-3">
          {/* Avatar — initial only, no gradient */}
          <div
            className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center text-[16px] font-semibold flex-shrink-0"
            aria-hidden="true"
          >
            {(profile?.display_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground truncate">
              {profile?.display_name ?? user?.email?.split('@')[0] ?? 'Student'}
            </p>
            {profile?.username && (
              <p className="label-mono mt-0.5">@{profile.username}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row — 4 numbers, no icons ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 mb-4 animate-fade-in">
        <StatCell label="Streak" value={`${score?.streak_count ?? 0}d`} />
        <StatCell label="Total XP" value={score?.cumulative_points ?? 0} />
        <StatCell label="Topics done" value={`${doneTopics} / ${totalTopics}`} />
        <StatCell label="Today" value={`${Math.min(score?.daily_points ?? 0, 100)} xp`} />
      </div>

      {/* ── Momentum chart ────────────────────────────────────────────────── */}
      {chartData.length > 1 && (
        <div className="surface p-4 mb-4 animate-fade-in">
          <p className="label-mono mb-4">30-day momentum</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  boxShadow: 'none',
                }}
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="points"
                stroke="hsl(161 72% 39%)"
                strokeWidth={1.5}
                fill="url(#xpGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Subject accuracy ──────────────────────────────────────────────── */}
      {(subjects?.length ?? 0) > 0 && (
        <div className="surface p-4 mb-4 animate-fade-in">
          <p className="label-mono mb-4">Subject accuracy</p>
          <div className="flex flex-col gap-4">
            {subjects!.map((s) => {
              const sub   = topics?.filter((t) => t.subject_id === s.id) ?? []
              const done  = sub.filter((t) => t.status === 'completed').length
              const total = sub.length
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-foreground">{s.name}</span>
                    <span className="label-mono text-foreground">{pct}%</span>
                  </div>
                  {/* 3px bar — consistent with XP bar */}
                  <div className="xp-bar-track">
                    <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Invite link ───────────────────────────────────────────────────── */}
      {profile?.username && (
        <div className="surface p-4 animate-fade-in">
          <p className="label-mono mb-3">Invite link</p>
          <div className="flex items-center gap-2 bg-secondary rounded-[8px] px-3 py-2">
            <span className="flex-1 text-[12px] text-muted-foreground font-mono truncate">
              zeal.app/join/{profile.username}
            </span>
            <button
              id="profile-copy-invite"
              onClick={() => navigator.clipboard.writeText(`https://zeal.app/join/${profile.username}`)}
              className="label-mono px-3 py-1 rounded-[6px] bg-background border border-border hover:bg-secondary transition-colors flex-shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stat cell — number-forward, no icons ─────────────────────────────────────
function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-4">
      <p className="label-mono mb-1">{label}</p>
      <p className="text-[20px] font-semibold text-foreground font-mono tabular-nums">{value}</p>
    </div>
  )
}
