import { useState } from 'react'
import { format } from 'date-fns'
import { useFullPlan, useMoveTopic } from '@/hooks/useDailyPlan'
import { usePlanStore } from '@/store/plan.store'
import { cn } from '@/lib/utils'

export default function PlanPage() {
  const { data: plan, isLoading }   = useFullPlan()
  const { intensity, setIntensity } = usePlanStore()
  const moveTopic = useMoveTopic()
  const [movingPlanId, setMovingPlanId] = useState<string | null>(null)
  const [targetDate, setTargetDate]     = useState('')

  if (isLoading) return <Skeleton />

  // Group by date, sorted ascending
  const byDate = (plan ?? []).reduce<Record<string, typeof plan>>((acc, item) => {
    acc[item!.assigned_date] = [...(acc[item!.assigned_date] ?? []), item]
    return acc
  }, {})
  const sortedDates = Object.keys(byDate).sort()

  async function handleMove(planId: string) {
    if (!targetDate) return
    await moveTopic.mutateAsync({ planId, newDate: targetDate })
    setMovingPlanId(null)
    setTargetDate('')
  }

  return (
    <div className="screen">

      {/* ── Header row ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-[22px] font-semibold text-foreground">Plan</h1>
        {/* Intensity — no emoji, just text */}
        <select
          id="intensity-select"
          value={intensity}
          onChange={(e) => setIntensity(e.target.value as typeof intensity)}
          className="label-mono border border-border bg-background rounded-[8px] px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer hover:bg-secondary transition-colors"
        >
          <option value="chill">Chill</option>
          <option value="balanced">Balanced</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {sortedDates.length === 0 && (
        <div className="empty-state animate-fade-in">
          <p className="empty-state-title">No upcoming plan.</p>
          <p className="empty-state-desc">Add topics to subjects and generate a plan.</p>
        </div>
      )}

      {/* ── Day groups ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {sortedDates.map((date) => {
          const items     = byDate[date] ?? []
          const allDone   = items.every((i) => i!.is_completed)
          const doneCount = items.filter((i) => i!.is_completed).length
          const dateLabel = format(new Date(date + 'T00:00:00'), 'EEE, d MMM')
          const isToday   = date === format(new Date(), 'yyyy-MM-dd')

          return (
            <div
              key={date}
              className={cn(
                'surface overflow-hidden transition-opacity duration-200',
                allDone && 'opacity-40',
              )}
            >
              {/* Day header */}
              <div className={cn(
                'flex items-center justify-between px-4 py-2.5 border-b border-border',
                isToday ? 'bg-primary/5' : 'bg-secondary/40',
              )}>
                <span className={cn(
                  'label-mono',
                  isToday ? 'text-primary' : 'text-muted-foreground',
                )}>
                  {isToday ? 'Today' : dateLabel}
                </span>
                <span className="label-mono text-muted-foreground">
                  {doneCount}/{items.length}
                </span>
              </div>

              {/* Topic rows */}
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const topic   = item!.topics
                  const subject = topic?.subjects

                  return (
                    <div
                      key={item!.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 transition-opacity duration-200',
                        item!.is_completed && 'opacity-40',
                      )}
                    >
                      {/* Status dot */}
                      <div className={cn(
                        'status-dot flex-shrink-0',
                        item!.is_completed  ? 'status-dot-done'
                        : item!.carried_over ? 'status-dot-late'
                        : 'bg-border',
                      )} />

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-[14px] font-medium truncate',
                          item!.is_completed
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground',
                        )}>
                          {topic?.title ?? '—'}
                        </p>
                        {subject && (
                          <p className="text-[12px] text-muted-foreground">{subject.name}</p>
                        )}
                      </div>

                      {/* Move action — text, no icon */}
                      {!item!.is_completed && (
                        <button
                          id={`move-topic-${item!.id}`}
                          onClick={() => setMovingPlanId(movingPlanId === item!.id ? null : item!.id)}
                          className="label-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-[6px] hover:bg-secondary flex-shrink-0"
                        >
                          Move
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Reschedule bottom sheet ───────────────────────────────────────── */}
      {movingPlanId && (
        <div
          className="fixed inset-0 bg-foreground/30 flex items-end z-50 p-3"
          onClick={() => setMovingPlanId(null)}
        >
          <div
            className="w-full bg-background rounded-[16px] p-5 shadow-elevation-3 max-w-lg mx-auto mb-safe animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-8 h-[3px] bg-border rounded-full mx-auto mb-5" />
            <p className="label-mono mb-3">Move to date</p>
            <input
              type="date"
              value={targetDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full border border-border rounded-[10px] px-4 py-3 text-[14px] text-foreground bg-background outline-none focus:ring-1 focus:ring-primary/40 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMovingPlanId(null)}
                className="flex-1 h-11 rounded-[10px] border border-border text-[13px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMove(movingPlanId)}
                disabled={!targetDate || moveTopic.isPending}
                className="flex-1 h-11 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {moveTopic.isPending ? 'Moving…' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="screen animate-pulse">
      <div className="h-6 w-16 bg-muted rounded mb-6" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 bg-muted rounded-[12px] mb-3" />
      ))}
    </div>
  )
}
