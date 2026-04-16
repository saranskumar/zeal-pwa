import { useEffect } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Clock, AlertCircle, Flame, BookOpen, Target } from 'lucide-react'
import { useTodayPlan } from '@/hooks/useDailyPlan'
import { useTodayScore } from '@/hooks/useScores'
import { useMarkTopicDone } from '@/hooks/useTopics'
import { useAuthStore } from '@/store/auth.store'
import { RescheduleEngine } from '@/core/reschedule-engine'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

export default function HomePage() {
  const user       = useAuthStore((s) => s.user)
  const { data: todayPlan, isLoading: planLoading } = useTodayPlan()
  const { data: score }  = useTodayScore()
  const markDone         = useMarkTopicDone()

  const handleMarkDone = (topicId: string) => {
    markDone.mutate(topicId, {
      onSuccess: () => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        })
      }
    })
  }

  const today          = format(new Date(), 'EEEE, MMMM d')
  const pending        = todayPlan?.filter((p) => !p.is_completed) ?? []
  const completed      = todayPlan?.filter((p) => p.is_completed)  ?? []
  const overdueTopics  = todayPlan?.filter((p) => p.carried_over && !p.is_completed) ?? []

  // Run rescheduler once per day on app open
  useEffect(() => {
    if (!user?.id) return
    const engine = new RescheduleEngine(user.id)
    engine.hasRunToday().then((hasRun) => {
      if (!hasRun) engine.run('missed_topic').catch(console.error)
    })
  }, [user?.id])

  if (planLoading) return <PageSkeleton />

  return (
    <div className="px-4 pt-10 pb-4 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="mb-6 animate-fade-in">
        <p className="text-sm text-muted-foreground font-medium">{today}</p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          {pending.length === 0 ? "You're all caught up! 🎉" : "Today's Plan"}
        </h1>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
        <StatCard
          icon={<Flame size={16} className="text-orange-500" />}
          label="Streak"
          value={`${score?.streak_count ?? 0}d`}
          color="orange"
        />
        <StatCard
          icon={<Target size={16} className="text-zeal-500" />}
          label="Points"
          value={score?.daily_points ?? 0}
          color="zeal"
        />
        <StatCard
          icon={<CheckCircle2 size={16} className="text-green-500" />}
          label="Done"
          value={`${completed.length}/${todayPlan?.length ?? 0}`}
          color="green"
        />
      </div>

      {/* Overdue / carried-over topics */}
      {overdueTopics.length > 0 && (
        <section className="mb-5 animate-slide-up">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertCircle size={14} className="text-destructive" />
            <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
              Overdue from yesterday
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {overdueTopics.map((plan) => (
              <TopicCard
                key={plan.id}
                plan={plan}
                overdue
                onMarkDone={() => handleMarkDone(plan.topic_id)}
                loading={markDone.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's pending topics */}
      {pending.filter((p) => !p.carried_over).length > 0 && (
        <section className="mb-5 animate-slide-up">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            To study today
          </h2>
          <div className="flex flex-col gap-2">
            {pending
              .filter((p) => !p.carried_over)
              .map((plan) => (
                <TopicCard
                  key={plan.id}
                  plan={plan}
                  onMarkDone={() => handleMarkDone(plan.topic_id)}
                  loading={markDone.isPending}
                />
              ))}
          </div>
        </section>
      )}

      {/* Completed topics */}
      {completed.length > 0 && (
        <section className="animate-fade-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Completed
          </h2>
          <div className="flex flex-col gap-2">
            {completed.map((plan) => (
              <TopicCard key={plan.id} plan={plan} done />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(todayPlan?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <BookOpen size={40} className="text-zeal-200 mb-3" />
          <p className="font-semibold text-foreground">No plan for today</p>
          <p className="text-sm text-muted-foreground mt-1">
            Go to Subjects and add topics to generate your plan
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, color,
}: {
  icon:  React.ReactNode
  label: string
  value: string | number
  color: 'orange' | 'zeal' | 'green'
}) {
  return (
    <div className="surface-container py-4 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:shadow-elevation-2 active:scale-95">
      <div className="flex items-center justify-center p-2 rounded-full bg-secondary">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
        <p className={cn(
          'text-2xl font-black mt-0.5',
          color === 'orange' && 'text-orange-500',
          color === 'zeal'   && 'text-primary',
          color === 'green'  && 'text-emerald-500',
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}

type PlanItem = NonNullable<ReturnType<typeof useTodayPlan>['data']>[number]

function TopicCard({
  plan,
  done,
  overdue,
  onMarkDone,
  loading,
}: {
  plan:        PlanItem
  done?:       boolean
  overdue?:    boolean
  onMarkDone?: () => void
  loading?:    boolean
}) {
  const topic   = plan.topics
  const subject = topic?.subjects

  return (
    <div
      className={cn(
        'surface-container flex items-center gap-4 px-4 py-4 transition-all duration-300',
        done    && 'bg-secondary/50 opacity-60 grayscale-[0.2]',
        overdue && 'border-destructive/20 bg-destructive/5',
        !done && !overdue && 'hover:shadow-elevation-2 hover:border-primary/20',
      )}
    >
      {/* Check button or done indicator */}
      <button
        disabled={done || loading}
        onClick={onMarkDone}
        id={`mark-done-${plan.topic_id}`}
        className={cn(
          'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
          done
            ? 'bg-primary border-primary'
            : overdue
            ? 'border-destructive/50 hover:bg-destructive/10'
            : 'border-primary/30 hover:bg-primary/10 hover:border-primary',
        )}
      >
        {done && <CheckCircle2 size={16} className="text-primary-foreground" />}
        {loading && <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          done ? 'line-through text-muted-foreground' : 'text-foreground'
        )}>
          {topic?.title ?? '—'}
        </p>
        {subject && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subject.name}</p>
        )}
      </div>

      {/* Strength badge */}
      {subject && (
        <span
          className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
            subject.strength === 'weak'    && 'strength-weak',
            subject.strength === 'average' && 'strength-average',
            subject.strength === 'strong'  && 'strength-strong',
          )}
        >
          {subject.strength}
        </span>
      )}

      {overdue && <Clock size={13} className="text-red-400 flex-shrink-0" />}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="px-4 pt-10 max-w-lg mx-auto animate-pulse">
      <div className="h-5 w-40 bg-muted rounded-lg mb-2" />
      <div className="h-7 w-56 bg-muted rounded-lg mb-6" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
      </div>
      {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-2xl mb-2" />)}
    </div>
  )
}
