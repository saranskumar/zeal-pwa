import { useState } from 'react'
import { useSubjects, useCreateSubject } from '@/hooks/useSubjects'
import { useTopics, useCreateTopic, useSoftDeleteTopic } from '@/hooks/useTopics'
import { cn } from '@/lib/utils'
import type { Subject, SubjectStrength } from '@/types'

// ─── Subjects list ────────────────────────────────────────────────────────────
export default function SubjectsPage() {
  const { data: subjects, isLoading } = useSubjects()
  const [selected, setSelected]       = useState<Subject | null>(null)
  const [showAdd, setShowAdd]         = useState(false)

  if (isLoading) return <Skeleton />
  if (selected) return <SubjectDetail subject={selected} onBack={() => setSelected(null)} />

  return (
    <div className="screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-[22px] font-semibold text-foreground">Subjects</h1>
        <button
          id="add-subject-btn"
          onClick={() => setShowAdd((v) => !v)}
          className="label-mono px-3 py-1.5 rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* ── Add subject inline form ───────────────────────────────────────── */}
      {showAdd && <AddSubjectForm onDone={() => setShowAdd(false)} />}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {(subjects?.length ?? 0) === 0 && !showAdd && (
        <div className="empty-state animate-fade-in">
          <p className="empty-state-title">No subjects yet.</p>
          <p className="empty-state-desc">Add a subject to start building your plan.</p>
        </div>
      )}

      {/* ── Subject cards ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {subjects?.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} onClick={() => setSelected(subject)} />
        ))}
      </div>
    </div>
  )
}

// ─── Subject card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const { data: topics } = useTopics(subject.id)
  const total    = topics?.length ?? 0
  const done     = topics?.filter((t) => t.status === 'completed').length ?? 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <button
      id={`subject-card-${subject.id}`}
      onClick={onClick}
      className="surface w-full p-4 text-left hover:shadow-elevation-2 transition-all duration-200 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-medium text-foreground truncate">{subject.name}</span>
        <span className={cn(
          'flex-shrink-0 ml-3',
          subject.strength === 'weak'    && 'strength-weak',
          subject.strength === 'average' && 'strength-average',
          subject.strength === 'strong'  && 'strength-strong',
        )}>
          {subject.strength}
        </span>
      </div>

      {/* 3px progress bar */}
      <div className="xp-bar-track mb-1.5">
        <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="label-mono">{done} of {total} done</span>
        {subject.exam_date && (
          <span className="label-mono">
            {new Date(subject.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Subject detail (topic list) ──────────────────────────────────────────────
function SubjectDetail({ subject, onBack }: { subject: Subject; onBack: () => void }) {
  const { data: topics, isLoading } = useTopics(subject.id)
  const createTopic   = useCreateTopic()
  const deleteTopicFn = useSoftDeleteTopic()
  const [title, setTitle] = useState('')

  async function handleAdd() {
    const t = title.trim()
    if (!t) return
    await createTopic.mutateAsync({ subject_id: subject.id, title: t })
    setTitle('')
  }

  return (
    <div className="screen">
      {/* ── Back + title row ────────────────────────────────────────────── */}
      <button
        onClick={onBack}
        className="label-mono text-muted-foreground hover:text-foreground transition-colors mb-5 flex items-center gap-1"
      >
        ← Subjects
      </button>

      <div className="flex items-start justify-between mb-1 animate-fade-in">
        <h1 className="text-[22px] font-semibold text-foreground">{subject.name}</h1>
        <span className={cn(
          'mt-1 flex-shrink-0',
          subject.strength === 'weak'    && 'strength-weak',
          subject.strength === 'average' && 'strength-average',
          subject.strength === 'strong'  && 'strength-strong',
        )}>
          {subject.strength}
        </span>
      </div>
      {subject.exam_date && (
        <p className="label-mono mb-5">
          Exam {new Date(subject.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      )}

      {/* ── Add topic row ───────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5">
        <input
          id="new-topic-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Topic name"
          className="flex-1 h-11 bg-background border border-border rounded-[10px] px-4 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all"
        />
        <button
          id="save-topic-btn"
          onClick={handleAdd}
          disabled={createTopic.isPending || !title.trim()}
          className="h-11 px-4 rounded-[10px] bg-primary text-primary-foreground label-mono hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>

      {/* ── Topic list ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-muted rounded-[10px]" />)}
        </div>
      ) : (topics?.length ?? 0) === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No topics yet.</p>
          <p className="empty-state-desc">Type a topic name above and press Enter.</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-border">
            {topics?.map((topic) => (
              <div
                key={topic.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  topic.status === 'completed' && 'opacity-40',
                )}
              >
                {/* Status dot */}
                <div className={cn(
                  'status-dot flex-shrink-0',
                  topic.status === 'completed' && 'status-dot-done',
                  topic.status === 'overdue'   && 'status-dot-late',
                  topic.status === 'pending'   && 'bg-border',
                )} />

                {/* Title + status */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-[14px] font-medium truncate',
                    topic.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground',
                  )}>
                    {topic.title}
                  </p>
                </div>

                {/* Delete — text only */}
                {topic.status !== 'completed' && (
                  <button
                    onClick={() => deleteTopicFn.mutate(topic.id)}
                    className="label-mono text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-[5px] hover:bg-destructive/10 flex-shrink-0"
                    aria-label={`Remove topic ${topic.title}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add subject form ─────────────────────────────────────────────────────────
function AddSubjectForm({ onDone }: { onDone: () => void }) {
  const createSubject = useCreateSubject()
  const [name, setName]         = useState('')
  const [examDate, setExamDate] = useState('')
  const [strength, setStrength] = useState<SubjectStrength>('average')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createSubject.mutateAsync({ name: name.trim(), exam_date: examDate || null, strength })
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface p-4 mb-4 flex flex-col gap-3 animate-slide-up"
    >
      <input
        id="add-subject-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Subject name"
        className="h-11 bg-background border border-border rounded-[10px] px-4 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all"
        required
      />
      <div>
        <p className="label-mono mb-2">Exam date (optional)</p>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="h-11 w-full bg-background border border-border rounded-[10px] px-4 text-[14px] text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all"
        />
      </div>
      {/* Strength selector — 3 text buttons */}
      <div>
        <p className="label-mono mb-2">Strength</p>
        <div className="flex gap-2">
          {(['weak', 'average', 'strong'] as SubjectStrength[]).map((s) => (
            <button
              key={s} type="button"
              onClick={() => setStrength(s)}
              className={cn(
                'flex-1 py-2 rounded-[8px] label-mono border transition-all',
                strength === s
                  ? s === 'weak'    ? 'bg-destructive/10 text-destructive border-destructive/30'
                    : s === 'average' ? 'bg-amber-500/10 text-amber-700 border-amber-400/30 dark:text-amber-400'
                    : 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-background text-muted-foreground border-border hover:bg-secondary',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button" onClick={onDone}
          className="flex-1 h-10 rounded-[10px] border border-border label-mono text-muted-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createSubject.isPending || !name.trim()}
          className="flex-1 h-10 rounded-[10px] bg-primary text-primary-foreground label-mono hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {createSubject.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function Skeleton() {
  return (
    <div className="screen animate-pulse">
      <div className="h-6 w-24 bg-muted rounded mb-6" />
      {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-muted rounded-[12px] mb-2" />)}
    </div>
  )
}
