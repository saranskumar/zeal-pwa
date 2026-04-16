import { useState } from 'react'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { useSubjects, useCreateSubject } from '@/hooks/useSubjects'
import { useTopics, useCreateTopic, useSoftDeleteTopic } from '@/hooks/useTopics'
import { cn } from '@/lib/utils'
import type { Subject, SubjectStrength } from '@/types'

export default function SubjectsPage() {
  const { data: subjects, isLoading } = useSubjects()
  const [selected, setSelected]       = useState<Subject | null>(null)
  const [showAdd, setShowAdd]         = useState(false)

  if (isLoading) return <div className="px-4 pt-10 animate-pulse space-y-3">
    {[0,1,2].map(i => <div key={i} className="h-20 bg-muted rounded-2xl"/>)}
  </div>

  if (selected) {
    return (
      <SubjectDetail
        subject={selected}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="px-4 pt-10 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
        <button
          id="add-subject-btn"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground bg-primary px-4 py-2 rounded-full shadow-elevation-1 hover:shadow-elevation-2 active:scale-95 transition-all"
        >
          <Plus size={16} />
          Add Subject
        </button>
      </div>

      {showAdd && (
        <AddSubjectForm onDone={() => setShowAdd(false)} />
      )}

      {(subjects?.length ?? 0) === 0 && !showAdd && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={40} className="text-zeal-200 mb-3" />
          <p className="font-semibold text-foreground">No subjects yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first subject to get started</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {subjects?.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onClick={() => setSelected(subject)}
          />
        ))}
      </div>
    </div>
  )
}

function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const { data: topics } = useTopics(subject.id)
  const total     = topics?.length ?? 0
  const done      = topics?.filter((t) => t.status === 'completed').length ?? 0
  const progress  = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <button
      id={`subject-card-${subject.id}`}
      onClick={onClick}
      className="surface-container w-full flex flex-col gap-4 p-5 hover:shadow-elevation-2 hover:border-primary/20 transition-all duration-300 group text-left"
    >
      <div className="flex items-start justify-between w-full">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">{subject.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{total} topics total</p>
        </div>
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex-shrink-0',
          subject.strength === 'weak'    && 'strength-weak',
          subject.strength === 'average' && 'strength-average',
          subject.strength === 'strong'  && 'strength-strong',
        )}>
          {subject.strength}
        </span>
      </div>

      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
          <span>PROGRESS</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </button>
  )
}

function SubjectDetail({ subject, onBack }: { subject: Subject; onBack: () => void }) {
  const { data: topics, isLoading } = useTopics(subject.id)
  const createTopic   = useCreateTopic()
  const deleteTopicFn = useSoftDeleteTopic()
  const [title, setTitle] = useState('')

  async function handleAdd() {
    if (!title.trim()) return
    await createTopic.mutateAsync({ subject_id: subject.id, title: title.trim() })
    setTitle('')
  }

  return (
    <div className="px-4 pt-10 pb-4 max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">
        ← Back
      </button>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
        <span className={cn(
          'text-xs font-semibold px-2.5 py-1 rounded-full mt-1',
          subject.strength === 'weak'    && 'strength-weak',
          subject.strength === 'average' && 'strength-average',
          subject.strength === 'strong'  && 'strength-strong',
        )}>
          {subject.strength}
        </span>
      </div>
      {subject.exam_date && (
        <p className="text-sm text-muted-foreground mb-6">
          Exam: {new Date(subject.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      )}

      {/* Add topic */}
      <div className="flex gap-3 mb-8">
        <input
          id="new-topic-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New topic name..."
          className="flex-1 bg-surface-container rounded-2xl px-5 border-2 border-transparent focus:border-primary/20 outline-none font-medium h-12 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={createTopic.isPending}
          id="save-topic-btn"
          className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-elevation-1 hover:shadow-elevation-2 active:scale-95 transition-all disabled:opacity-60"
        >
          <Plus size={22} strokeWidth={3} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0,1,2].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(topics?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">No topics yet — add some above</p>
          )}
          {topics?.map((topic) => (
            <div
              key={topic.id}
              className={cn(
                'surface-container flex items-center gap-4 px-4 py-4 transition-all duration-300',
                topic.status === 'completed' && 'bg-secondary/40 opacity-60 grayscale-[0.2]',
                topic.status === 'overdue'   && 'border-destructive/20 bg-destructive/5',
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                topic.status === 'completed' && 'bg-primary',
                topic.status === 'overdue'   && 'bg-destructive',
                topic.status === 'pending'   && 'bg-primary/40',
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-bold',
                  topic.status === 'completed' && 'line-through text-muted-foreground'
                )}>
                  {topic.title}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{topic.status}</p>
              </div>
              {topic.status !== 'completed' && (
                <button
                  onClick={() => deleteTopicFn.mutate(topic.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddSubjectForm({ onDone }: { onDone: () => void }) {
  const createSubject = useCreateSubject()
  const [name, setName]       = useState('')
  const [examDate, setExamDate] = useState('')
  const [strength, setStrength] = useState<SubjectStrength>('average')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createSubject.mutateAsync({ name: name.trim(), exam_date: examDate || null, strength })
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zeal-50 border border-zeal-200 rounded-2xl p-4 mb-5 flex flex-col gap-3">
      <input
        id="add-subject-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Subject name"
        className="input-field"
        required
      />
      <input
        type="date"
        value={examDate}
        onChange={(e) => setExamDate(e.target.value)}
        className="input-field"
      />
      <div className="flex gap-2">
        {(['weak', 'average', 'strong'] as SubjectStrength[]).map((s) => (
          <button
            key={s} type="button"
            onClick={() => setStrength(s)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-semibold border transition',
              strength === s
                ? s === 'weak' ? 'bg-red-500 text-white border-red-500'
                  : s === 'average' ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-green-500 text-white border-green-500'
                : 'bg-white text-muted-foreground border-border'
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition">Cancel</button>
        <button type="submit" disabled={createSubject.isPending} className="flex-1 h-10 rounded-xl bg-zeal-600 text-white text-sm font-semibold hover:bg-zeal-700 transition disabled:opacity-60">
          {createSubject.isPending ? 'Saving...' : 'Save subject'}
        </button>
      </div>
    </form>
  )
}
