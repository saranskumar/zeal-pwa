import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useScoreHistory, useTodayScore } from '@/hooks/useScores'
import { useSubjects } from '@/hooks/useSubjects'
import { useTopics } from '@/hooks/useTopics'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { LogOut, Copy, Flame, Trophy, BookOpen, Clock, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/store/ui.store'

export default function ProfilePage() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const profile   = useAuthStore((s) => s.profile)
  const reset     = useAuthStore((s) => s.reset)
  const { theme, toggleTheme } = useUIStore()

  const { data: score }        = useTodayScore()
  const { data: history }      = useScoreHistory(30)
  const { data: subjects }     = useSubjects()
  const { data: topics }       = useTopics()

  const inviteLink = profile ? `https://zeal.app/join/${profile.username}` : ''

  const chartData = (history ?? []).map((s) => ({
    date:   format(new Date(s.score_date + 'T00:00:00'), 'MMM d'),
    points: s.daily_points,
  }))

  // Stats
  const totalTopics    = topics?.length ?? 0
  const doneTopics     = topics?.filter((t) => t.status === 'completed').length ?? 0
  const avgHoursPerDay = history && history.length > 0
    ? (history.reduce((s, r) => s + r.raw_time_points / 10, 0) / history.length).toFixed(1)
    : '0.0'

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error("Logout error:", e)
    } finally {
      reset()
      navigate('/login')
    }
  }

  return (
    <div className="px-4 pt-10 pb-4 max-w-lg mx-auto">
      {/* Header with Theme Toggle */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Profile</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary border border-border/50 text-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary border border-border/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Avatar + username */}
      <div className="flex items-center gap-5 mb-8 animate-fade-in px-2">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-3xl font-black text-primary-foreground shadow-elevation-2 border-4 border-background overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          {(profile?.display_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
        </div>
        <div>
          <p className="text-2xl font-black text-foreground tracking-tight">
            {profile?.display_name ?? user?.email?.split('@')[0] ?? 'Student'}
          </p>
          {profile?.username && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">@{profile.username}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-up">
        <StatBox icon={<Flame className="text-orange-500" size={18}/>} label="Streak" value={`${score?.streak_count ?? 0} days`} />
        <StatBox icon={<Trophy className="text-amber-500" size={18}/>} label="Points" value={score?.cumulative_points ?? 0} />
        <StatBox icon={<BookOpen className="text-primary" size={18}/>} label="Topics Done" value={`${doneTopics}/${totalTopics}`} />
        <StatBox icon={<Clock className="text-blue-500" size={18}/>} label="Average" value={`${avgHoursPerDay}h`} />
      </div>

      {/* Score chart */}
      {chartData.length > 1 && (
        <div className="surface-container p-5 mb-8 animate-fade-in relative overflow-hidden">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">MOMENTUM — 30 DAYS</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="pointsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary-color)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(240,10%,90%)' }}
              />
              <Area
                type="monotone"
                dataKey="points"
                stroke="hsl(258,82%,57%)"
                strokeWidth={2}
                fill="url(#pointsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subject summary */}
      {(subjects?.length ?? 0) > 0 && (
        <div className="surface-container p-5 mb-8">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-5">Subject Accuracy</p>
          <div className="flex flex-col gap-5">
            {subjects!.map((s) => {
              const subjectTopics = topics?.filter((t) => t.subject_id === s.id) ?? []
              const done  = subjectTopics.filter((t) => t.status === 'completed').length
              const total = subjectTopics.length
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <div key={s.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{s.name}</span>
                    <span className="text-[10px] font-black bg-secondary px-2 py-0.5 rounded-full">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Invite link */}
      {inviteLink && (
        <div className="surface-container p-6 bg-primary/5 border-primary/10 animate-fade-in text-center">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-2">Build your squad</h3>
          <p className="text-xs text-muted-foreground mb-5 px-4">Study together and track each other's progress in real-time.</p>
          <div className="flex gap-2 p-1 bg-background rounded-2xl border border-border">
            <input
              readOnly
              value={inviteLink}
              className="bg-transparent border-0 outline-none flex-1 text-xs px-3 font-semibold text-muted-foreground"
            />
            <button
              id="profile-copy-invite"
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              className="flex items-center gap-2 text-xs font-black uppercase bg-primary text-primary-foreground px-5 py-2.5 rounded-[14px] shadow-elevation-1 hover:shadow-elevation-2 transition-all active:scale-95"
            >
              <Copy size={14} />
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({
  icon, label, value,
}: {
  icon:  React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="surface-container p-5 flex flex-col gap-2 hover:shadow-elevation-2 transition-all duration-300">
      <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  )
}
