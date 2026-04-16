import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { useTodayPlan } from '@/hooks/useDailyPlan'
import { useTodayScore } from '@/hooks/useScores'
import { useMarkTopicDone } from '@/hooks/useTopics'
import { useAuthStore } from '@/store/auth.store'
import { RescheduleEngine } from '@/core/reschedule-engine'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

// ─── Confetti guard: only fires once per day on full completion ───────────────
let confettiFiredToday = false
function tryFireConfetti() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const key   = `confetti_${today}`
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  confetti({ particleCount: 80, spread: 60, origin: { y: 0.65 }, colors: ['#10b981', '#6ee7b7'] })
  confettiFiredToday = true
  void confettiFiredToday // suppress unused warning
}

// ─── Priority helpers ─────────────────────────────────────────────────────────
function getPriorityTag(score?: number | null, carried?: boolean) {
  if (carried) return 'late'
  if (!score) return null
  if (score >= 7) return 'high'
  if (score >= 4) return 'med'
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const user     = useAuthStore((s) => s.user)
  const { data: todayPlan, isLoading } = useTodayPlan()
  const { data: score }  = useTodayScore()
  const markDone         = useMarkTopicDone()
  const prevAllDone      = useRef(false)

  const today     = format(new Date(), 'EEE, d MMM')
  const pending   = todayPlan?.filter((p) => !p.is_completed) ?? []
  const completed = todayPlan?.filter((p) => p.is_completed)  ?? []
  const overdue   = todayPlan?.filter((p) => p.carried_over && !p.is_completed) ?? []
  const today_new = pending.filter((p) => !p.carried_over)
  const total     = todayPlan?.length ?? 0

  // XP bar — cap at 100
  const xp        = Math.min(score?.daily_points ?? 0, 100)
  const streak    = score?.streak_count ?? 0
  const allDone   = total > 0 && pending.length === 0

  // Run reschedule engine once per day on open
  useEffect(() => {
    if (!user?.id) return
    const engine = new RescheduleEngine(user.id)
    engine.hasRunToday().then((has) => { if (!has) engine.run('missed_topic').catch(console.error) })
  }, [user?.id])

  // Fire confetti exactly once when all tasks flip to done
  useEffect(() => {
    if (allDone && !prevAllDone.current) tryFireConfetti()
    prevAllDone.current = allDone
  }, [allDone])

  const handleMark = (topicId: string) => markDone.mutate(topicId)

  if (isLoading) return <Skeleton />

  return (
    <div className="screen">

      {/* ── Date + header ─────────────────────────────────────────────────── */}
      <div className="mb-5 animate-fade-in">
        <p className="label-mono mb-1">{today}</p>
        <h1 className="text-[22px] font-semibold text-foreground leading-tight">
          {allDone ? 'All done.' : 'Today'}
        </h1>
      </div>

      {/* ── Daily Progress ────────────────────────────────────────────────── */}
      {total > 0 && (
        <div className="mb-6 animate-fade-in">
          {/* XP bar — 3px, no animation loop */}
          <div className="flex items-center justify-between mb-2">
            <span className="label-mono">Progress</span>
            <span className="xp-inline">{xp} xp</span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${total > 0 ? (completed.length / total) * 100 : 0}%` }} />
          </div>
          {/* Summary row */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[12px] text-muted-foreground">
              {completed.length} of {total} topics
            </span>
            {/* Streak — number only, no icon, no animation */}
            <span className="label-mono text-foreground">
              {streak > 0 ? `${streak} day streak` : '—'}
            </span>
          </div>
        </div>
      )}

      {/* ── All done state ────────────────────────────────────────────────── */}
      {allDone && (
        <div className="empty-state animate-fade-in">
          <p className="empty-state-title">You finished everything.</p>
          <p className="empty-state-desc">Come back tomorrow for your next plan.</p>
        </div>
      )}

      {/* ── Overdue / carried-over section ───────────────────────────────── */}
      {overdue.length > 0 && (
        <section className="mb-5 animate-fade-in">
          <div className="divider mb-3" />
          <p className="label-mono text-destructive mb-3">Carried over</p>
          <div className="flex flex-col gap-2">
            {overdue.map((plan) => (
              <TopicCard
                key={plan.id}
                plan={plan}
                variant="late"
                onMark={() => handleMark(plan.topic_id)}
                marking={markDone.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Today's pending topics ────────────────────────────────────────── */}
      {today_new.length > 0 && (
        <section className="mb-5 animate-fade-in">
          {overdue.length > 0 && <div className="divider mb-3" />}
          <p className="label-mono mb-3">To study</p>
          <div className="flex flex-col gap-2">
            {today_new.map((plan) => (
              <TopicCard
                key={plan.id}
                plan={plan}
                variant="default"
                onMark={() => handleMark(plan.topic_id)}
                marking={markDone.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed (sunk, dimmed) ──────────────────────────────────────── */}
      {completed.length > 0 && !allDone && (
        <section className="animate-fade-in">
          <div className="divider mb-3" />
          <p className="label-mono mb-3">Done</p>
          <div className="flex flex-col gap-2">
            {completed.map((plan) => (
              <TopicCard key={plan.id} plan={plan} variant="done" />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state — no plan at all ─────────────────────────────────── */}
      {total === 0 && (
        <div className="empty-state animate-fade-in">
          <p className="empty-state-title">No plan for today.</p>
          <p className="empty-state-desc">
            Go to Subjects, add topics, and let the planner build your day.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── TopicCard ────────────────────────────────────────────────────────────────

type PlanItem = NonNullable<ReturnType<typeof useTodayPlan>['data']>[number]

function TopicCard({
  plan,
  variant = 'default',
  onMark,
  marking,
}: {
  plan:      PlanItem
  variant?:  'default' | 'late' | 'done'
  onMark?:   () => void
  marking?:  boolean
}) {
  const topic   = plan.topics
  const subject = topic?.subjects
  const tag     = getPriorityTag(topic?.priority_score, plan.carried_over)

  return (
    <div
      className={cn(
        variant === 'done' ? 'topic-card-done' : variant === 'late' ? 'topic-card-late' : 'topic-card',
      )}
    >
      {/* Minimal checkbox */}
      {variant !== 'done' ? (
        <button
          onClick={onMark}
          disabled={marking}
          id={`mark-${plan.topic_id}`}
          aria-label={`Mark "${topic?.title}" as done`}
          className={cn(
            'zeal-checkbox',
            variant === 'late' && 'border-destructive/40',
          )}
        >
          {marking && (
            <div className="w-2.5 h-2.5 rounded-full border-2 border-border border-t-primary animate-spin" />
          )}
        </button>
      ) : (
        // Done checkbox — filled
        <div className="zeal-checkbox-done" aria-hidden="true">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Text block — single scan */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[14px] font-medium truncate leading-snug',
          variant === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
        )}>
          {topic?.title ?? '—'}
        </p>
        {subject && (
          <p className="text-[12px] text-muted-foreground truncate mt-0.5">{subject.name}</p>
        )}
      </div>

      {/* Right side — priority tag OR strength, not both */}
      {variant !== 'done' && (
        <div className="flex-shrink-0">
          {tag === 'high' && <span className="tag-high">high</span>}
          {tag === 'med'  && <span className="tag-med">med</span>}
          {tag === 'late' && <span className="tag-late">late</span>}
          {!tag && subject?.strength && (
            <span className={cn(
              subject.strength === 'weak'    && 'strength-weak',
              subject.strength === 'average' && 'strength-average',
              subject.strength === 'strong'  && 'strength-strong',
            )}>
              {subject.strength}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="screen animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-3" />
      <div className="h-6 w-20 bg-muted rounded mb-6" />
      <div className="h-[3px] bg-muted rounded-full mb-6" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[52px] bg-muted rounded-[12px] mb-2" />
      ))}
    </div>
  )
}
