import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarDays, Move } from 'lucide-react'
import { useFullPlan, useMoveTopic } from '@/hooks/useDailyPlan'
import { usePlanStore } from '@/store/plan.store'
import { cn } from '@/lib/utils'

export default function PlanPage() {
  const { data: plan, isLoading } = useFullPlan()
  const { intensity, setIntensity } = usePlanStore()
  const moveTopic = useMoveTopic()
  const [movingPlanId, setMovingPlanId] = useState<string | null>(null)
  const [targetDate, setTargetDate]     = useState('')

  if (isLoading) return (
    <div className="px-4 pt-10 animate-pulse space-y-4">
      {[0,1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"/>)}
    </div>
  )

  // Group by date
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
    <div className="px-4 pt-10 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Study Plan</h1>
        {/* Intensity selector */}
        <select
          id="intensity-select"
          value={intensity}
          onChange={(e) => setIntensity(e.target.value as typeof intensity)}
          className="text-xs font-bold uppercase tracking-wider border-0 bg-secondary rounded-full px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-center cursor-pointer hover:bg-secondary/80 transition-all"
        >
          <option value="chill">😌 Chill</option>
          <option value="balanced">⚡ Balanced</option>
          <option value="aggressive">🔥 Aggressive</option>
        </select>
      </div>

      {sortedDates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays size={40} className="text-zeal-200 mb-3" />
          <p className="font-semibold text-foreground">No upcoming plan</p>
          <p className="text-sm text-muted-foreground mt-1">Generate a plan from the Subjects page</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {sortedDates.map((date) => {
          const items     = byDate[date] ?? []
          const allDone   = items.every((i) => i!.is_completed)
          const dateLabel = format(new Date(date + 'T00:00:00'), 'EEE, MMM d')
          const isToday   = date === format(new Date(), 'yyyy-MM-dd')

          return (
            <div
              key={date}
              className={cn(
                'surface-container overflow-hidden transition-all duration-300',
                isToday && 'border-primary/30 ring-1 ring-primary/20 shadow-elevation-2',
                allDone  && 'opacity-50 grayscale-[0.3]'
              )}
            >
              {/* Day header */}
              <div className={cn(
                'flex items-center justify-between px-5 py-3 border-b border-border/50',
                isToday ? 'bg-primary/5' : 'bg-secondary/30'
              )}>
                <span className={cn(
                  "text-xs font-black uppercase tracking-widest",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {isToday ? 'Today — ' : ''}{dateLabel}
                </span>
                <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {items.filter(i => i!.is_completed).length}/{items.length} DONE
                </span>
              </div>

              {/* Topics */}
              <div className="flex flex-col divide-y divide-border">
                {items.map((item) => {
                  const topic   = item!.topics
                  const subject = topic?.subjects

                  return (
                    <div
                      key={item!.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3',
                        item!.is_completed && 'opacity-50'
                      )}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        item!.is_completed  ? 'bg-green-400'
                        : item!.carried_over ? 'bg-red-400'
                        : 'bg-zeal-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          item!.is_completed && 'line-through text-muted-foreground'
                        )}>
                          {topic?.title ?? '—'}
                        </p>
                        {subject && (
                          <p className="text-xs text-muted-foreground">{subject.name}</p>
                        )}
                      </div>

                      {/* Long-press style move button */}
                      {!item!.is_completed && (
                        <button
                          id={`move-topic-${item!.id}`}
                          onClick={() => setMovingPlanId(movingPlanId === item!.id ? null : item!.id)}
                          className="text-muted-foreground hover:text-zeal-600 transition p-1"
                          title="Move to another day"
                        >
                          <Move size={14} />
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

      {/* Move topic modal */}
      {movingPlanId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50 p-2" onClick={() => setMovingPlanId(null)}>
          <div
            className="w-full bg-background rounded-3xl p-6 shadow-elevation-3 animate-in slide-in-from-bottom duration-300 max-w-lg mx-auto mb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <h3 className="font-black text-xl text-foreground mb-6 text-center">Reschedule Topic</h3>
            <input
              type="date"
              value={targetDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-field w-full mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMovingPlanId(null)}
                className="flex-1 h-11 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMove(movingPlanId)}
                disabled={!targetDate || moveTopic.isPending}
                className="flex-1 h-11 rounded-xl bg-zeal-600 text-white text-sm font-semibold hover:bg-zeal-700 transition disabled:opacity-60"
              >
                {moveTopic.isPending ? 'Moving...' : 'Move topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
