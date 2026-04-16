import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { ChevronRight, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { usePlanStore } from '@/store/plan.store'
import { useCreateSubject } from '@/hooks/useSubjects'
import { useCreateTopic } from '@/hooks/useTopics'
import { useCommitPlan } from '@/hooks/useDailyPlan'
import { generatePlan, generatePlanPreview } from '@/core/planning-engine'
import { cn } from '@/lib/utils'
import type { Subject, Topic, PlanIntensity, SubjectStrength } from '@/types'

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9



export default function OnboardingPage() {
  const navigate   = useNavigate()
  const user       = useAuthStore((s) => s.user)
  const { setIntensity, confirmPlan } = usePlanStore()

  const createSubject = useCreateSubject()
  const createTopic   = useCreateTopic()
  const commitPlan    = useCommitPlan()

  const [step, setStep]               = useState<OnboardingStep>(1)
  const [subjects, setSubjects]       = useState<Subject[]>([])
  const [topics, setTopics]           = useState<Topic[]>([])
  const [previewPlan, setPreviewPlan] = useState<ReturnType<typeof generatePlanPreview>>([])

  // Step 1 — subject form
  const [subjectName, setSubjectName]   = useState('')
  const [examDate, setExamDate]         = useState('')
  const [strength, setStrength]         = useState<SubjectStrength>('average')

  // Step 2 — topics
  const [topicTitle, setTopicTitle]     = useState('')
  const [pendingTopics, setPendingTopics] = useState<string[]>([])

  // Step 5 — intensity
  const [intensity, setIntensityLocal]  = useState<PlanIntensity>('balanced')

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // ── Step 1: Save subject ──────────────────────────────────────────────────
  async function handleSaveSubject() {
    if (!subjectName.trim()) { setError('Enter a subject name'); return }
    setLoading(true); setError(null)

    try {
      const s = await createSubject.mutateAsync({
        name:      subjectName.trim(),
        exam_date: examDate || null,
        strength,
      })
      setSubjects((prev) => [...prev, s])
      setStep(2)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Save topics ───────────────────────────────────────────────────
  async function handleSaveTopics() {
    if (pendingTopics.length < 1) { setError('Add at least 1 topic'); return }
    setLoading(true); setError(null)

    const currentSubject = subjects[subjects.length - 1]
    try {
      const created: Topic[] = []
      for (const title of pendingTopics) {
        const t = await createTopic.mutateAsync({
          subject_id: currentSubject.id,
          title,
        })
        created.push(t)
      }
      setTopics((prev) => [...prev, ...created])
      setPendingTopics([])
      // Generate preview
      const preview = generatePlanPreview({
        userId:    user!.id,
        subjects,
        topics:    [...topics, ...created],
        intensity: 'balanced',
        startDate: format(new Date(), 'yyyy-MM-dd'),
      })
      setPreviewPlan(preview)
      setStep(3)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 5→6: Commit plan ─────────────────────────────────────────────────
  async function handleFinish() {
    setLoading(true); setError(null)

    const finalPlan = generatePlan({
      userId:    user!.id,
      subjects,
      topics,
      intensity,
      startDate: format(new Date(), 'yyyy-MM-dd'),
    })

    try {
      await commitPlan.mutateAsync(finalPlan)
      setIntensity(intensity)
      confirmPlan()
      navigate('/')
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/zeal_logo.png" alt="Zeal" className="w-10 h-10 rounded-xl shadow-elevation-1" />
            <span className="font-black text-xl tracking-tight text-foreground">Zeal</span>
          </div>
        </div>

          {import.meta.env.VITE_DEMO_MODE === 'true' && (
            <button
              onClick={() => {
                confirmPlan() // Bypass any strict local gates
                navigate('/')
              }}
              className="text-xs font-semibold text-zeal-600 bg-zeal-100 hover:bg-zeal-200 px-3 py-1.5 rounded-lg animate-fade-in"
            >
              Skip Demo Onboarding
            </button>
          )}
        </div>

        {/* Progress pills */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                step >= s ? 'bg-primary' : 'bg-secondary'
              )}
            />
          ))}
        </div>

        <h1 className="text-3xl font-black text-foreground tracking-tight animate-fade-in leading-tight">
          {step === 1 && "Plan your comeback"}
          {step === 2 && 'Break it down'}
          {step === 3 && "Fast preview"}
          {step === 4 && 'Fill your slate'}
          {step === 5 && 'Pick your pace'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {step === 1 && 'Start with one subject — you can add more after previewing your plan'}
          {step === 2 && `For ${subjects[subjects.length - 1]?.name ?? 'this subject'}`}
          {step === 3 && 'This is what your first 3 days look like'}
          {step === 4 && 'Each subject you add improves your plan'}
          {step === 5 && 'You can change this anytime'}
        </p>

      {/* Step content */}
      <div className="flex-1 px-6 pb-32 animate-slide-up">
        {error && (
          <div className="mb-4 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Step 1 — Subject */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Field label="Subject name">
              <input
                id="subject-name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Engineering Mathematics"
                className="input-field"
              />
            </Field>

            <Field label="Exam date (optional)">
              <input
                id="exam-date"
                type="date"
                value={examDate}
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                onChange={(e) => setExamDate(e.target.value)}
                className="input-field"
              />
              {!examDate && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠ No date set — defaulting to 14 days from today
                </p>
              )}
            </Field>

            <Field label="Your strength in this subject">
              <div className="flex gap-2">
                {(['weak', 'average', 'strong'] as SubjectStrength[]).map((s) => (
                  <button
                    key={s}
                    id={`strength-${s}`}
                    onClick={() => setStrength(s)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all',
                      strength === s
                        ? s === 'weak'
                          ? 'bg-destructive text-destructive-foreground border-destructive'
                          : s === 'average'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground border-transparent hover:border-primary/20'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* Step 2 — Topics */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                id="topic-title"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && topicTitle.trim()) {
                    setPendingTopics((p) => [...p, topicTitle.trim()])
                    setTopicTitle('')
                  }
                }}
                placeholder="e.g. Integration by Parts"
                className="input-field flex-1"
              />
              <button
                onClick={() => {
                  if (topicTitle.trim()) {
                    setPendingTopics((p) => [...p, topicTitle.trim()])
                    setTopicTitle('')
                  }
                }}
                id="add-topic-btn"
                className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-elevation-1 hover:shadow-elevation-2 active:scale-95 transition-all"
              >
                <Plus size={22} strokeWidth={3} />
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {pendingTopics.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-border shadow-sm"
                >
                  <span className="text-sm text-foreground">{t}</span>
                  <button
                    onClick={() => setPendingTopics((p) => p.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Preview */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            {previewPlan.length === 0 ? (
              <p className="text-muted-foreground text-sm">No plan generated — add more topics</p>
            ) : (
              Object.entries(
                previewPlan.reduce<Record<string, typeof previewPlan>>((acc, item) => {
                  acc[item.assigned_date] = [...(acc[item.assigned_date] ?? []), item]
                  return acc
                }, {})
              ).map(([date, items]) => (
                <div key={date} className="surface-container p-5 transition-all duration-300 shadow-elevation-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                    {format(new Date(date), 'EEE, MMM d')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => {
                      const topic = topics.find((t) => t.id === item.topic_id)
                      return (
                        <div key={item.topic_id} className="flex items-center gap-3 text-sm font-bold text-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {topic?.title ?? item.topic_id}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Step 4 — More subjects */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border"
                >
                  <CheckCircle2 size={16} className="text-zeal-500" />
                  <span className="text-sm font-medium">{s.name}</span>
                  <span
                    className={cn(
                      'ml-auto text-xs px-2 py-0.5 rounded-full',
                      s.strength === 'weak'    && 'strength-weak',
                      s.strength === 'average' && 'strength-average',
                      s.strength === 'strong'  && 'strength-strong',
                    )}
                  >
                    {s.strength}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setSubjectName(''); setExamDate(''); setStrength('average'); setStep(1) }}
              id="add-another-subject"
              className="flex items-center justify-center gap-3 h-14 rounded-2xl border-2 border-dashed border-primary/30 text-primary text-sm font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
            >
              <Plus size={18} strokeWidth={3} />
              Add more
            </button>
          </div>
        )}

        {/* Step 5 — Intensity */}
        {step === 5 && (
          <div className="flex flex-col gap-3">
            {([
              { value: 'chill',      label: 'Chill',      desc: '2 topics/day — steady pace',      emoji: '😌' },
              { value: 'balanced',   label: 'Balanced',   desc: '3 topics/day — recommended',      emoji: '⚡' },
              { value: 'aggressive', label: 'Aggressive', desc: '4+ topics/day — exam crunch mode', emoji: '🔥' },
            ] as { value: PlanIntensity; label: string; desc: string; emoji: string }[]).map((opt) => (
              <button
                key={opt.value}
                id={`intensity-${opt.value}`}
                onClick={() => setIntensityLocal(opt.value)}
                className={cn(
                  'flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all duration-200',
                  intensity === opt.value
                    ? 'border-primary bg-primary/5 shadow-elevation-1'
                    : 'border-transparent bg-secondary/50 hover:bg-secondary transition-all'
                )}
              >
                <span className="text-3xl grayscale-[0.2]">{opt.emoji}</span>
                <div className="ml-2">
                  <p className="font-black text-foreground tracking-tight">{opt.label}</p>
                  <p className="text-xs text-muted-foreground font-medium">{opt.desc}</p>
                </div>
                {intensity === opt.value && (
                  <CheckCircle2 size={24} className="text-primary ml-auto" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-safe pt-4 bg-background/90 backdrop-blur-xl border-t border-border/50">
        <button
          id="onboarding-next-btn"
          disabled={loading}
          onClick={() => {
            if (step === 1) handleSaveSubject()
            else if (step === 2) handleSaveTopics()
            else if (step === 3) setStep(4)
            else if (step === 4) setStep(5)
            else if (step === 5) handleFinish()
          }}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-elevation-2 active:scale-95 transition-all duration-300 disabled:opacity-60"
        >
          {loading ? (
            <div className="w-6 h-6 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          ) : (
            <>
              {step === 5 ? 'Launch Plan' : 'Continue'}
              {step !== 5 && <ChevronRight size={20} strokeWidth={3} />}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}
