import { differenceInCalendarDays, addDays, format } from 'date-fns'
import type {
  Subject,
  Topic,
  PlanIntensity,
  ScoredTopic,
  GeneratedPlanItem,
} from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const WEAKNESS_WEIGHT: Record<string, number> = {
  weak:    3,
  average: 2,
  strong:  1,
}

const TOPICS_PER_DAY: Record<PlanIntensity, number> = {
  chill:      2,
  balanced:   3,
  aggressive: 4,
}

const DEFAULT_DAYS_WINDOW = 14
const MISSED_PENALTY_CAP  = 10

// ─── Priority scoring ────────────────────────────────────────────────────────

function calcWeaknessWeight(subject: Subject): number {
  return WEAKNESS_WEIGHT[subject.strength] ?? 2
}

function calcExamUrgency(subject: Subject, today: Date): number {
  if (!subject.exam_date) return 10 / DEFAULT_DAYS_WINDOW
  const daysLeft = differenceInCalendarDays(new Date(subject.exam_date), today)
  return 10 / Math.max(daysLeft, 1)
}

function calcDaysRemaining(subject: Subject, today: Date): number | null {
  if (!subject.exam_date) return null
  return differenceInCalendarDays(new Date(subject.exam_date), today)
}

function calcMissedPenalty(topic: Topic): number {
  if (topic.status !== 'overdue') return 0
  // Approximate missed days from created_at vs now
  const daysMissed = differenceInCalendarDays(
    new Date(),
    new Date(topic.created_at)
  )
  return Math.min(daysMissed * 1.5, MISSED_PENALTY_CAP)
}

/**
 * Score a topic using the priority formula:
 * Priority = (WeaknessWeight × 2) + ExamUrgency + RemainingTopicsCount + MissedDaysPenalty
 */
function scoreTopic(
  topic: Topic,
  subject: Subject,
  remainingTopicsCount: number,
  today: Date
): ScoredTopic {
  const weaknessWeight  = calcWeaknessWeight(subject)
  const examUrgency     = calcExamUrgency(subject, today)
  const missedPenalty   = calcMissedPenalty(topic)
  const days_remaining  = calcDaysRemaining(subject, today)

  const priority_score =
    weaknessWeight * 2 + examUrgency + remainingTopicsCount + missedPenalty

  return {
    topic: { ...topic, priority_score },
    subject,
    priority_score,
    exam_urgency: examUrgency,
    days_remaining,
  }
}

// ─── Plan generator ──────────────────────────────────────────────────────────

export interface PlanGeneratorInput {
  userId:    string
  subjects:  Subject[]
  topics:    Topic[]
  intensity: PlanIntensity
  startDate: string  // 'YYYY-MM-DD'
}

/**
 * Pure, deterministic planning engine.
 * Runs entirely client-side — no network calls.
 *
 * Returns an array of daily_plan insert records sorted by date ascending.
 */
export function generatePlan(input: PlanGeneratorInput): GeneratedPlanItem[] {
  const { userId, subjects, topics, intensity, startDate } = input
  const today       = new Date(startDate)
  const perDay      = TOPICS_PER_DAY[intensity]
  const subjectMap  = new Map(subjects.map((s) => [s.id, s]))

  // Only plan pending + overdue topics (not completed, not soft-deleted)
  const plannable = topics.filter(
    (t) => (t.status === 'pending' || t.status === 'overdue') && !t.deleted_at
  )

  // Count remaining topics per subject for the formula
  const remainingBySubject = new Map<string, number>()
  for (const t of plannable) {
    remainingBySubject.set(t.subject_id, (remainingBySubject.get(t.subject_id) ?? 0) + 1)
  }

  // Score all plannable topics
  const scored = plannable
    .map((topic) => {
      const subject = subjectMap.get(topic.subject_id)
      if (!subject) return null
      return scoreTopic(topic, subject, remainingBySubject.get(topic.subject_id) ?? 0, today)
    })
    .filter(Boolean) as ScoredTopic[]

  // Sort by priority descending (highest first)
  scored.sort((a, b) => b.priority_score - a.priority_score)

  // Determine total days needed
  const totalDays = Math.ceil(scored.length / perDay)

  // Distribute topics across days
  const plan: GeneratedPlanItem[] = []

  scored.forEach((item, index) => {
    const dayOffset = Math.floor(index / perDay)
    // Don't schedule past exam date
    const subject = item.subject
    if (subject.exam_date) {
      const examDay  = new Date(subject.exam_date)
      const planDay  = addDays(today, dayOffset)
      if (planDay > examDay) return  // skip — too late
    }

    plan.push({
      topic_id:      item.topic.id,
      user_id:       userId,
      assigned_date: format(addDays(today, dayOffset), 'yyyy-MM-dd'),
      is_completed:  false,
      carried_over:  item.topic.status === 'overdue',
      version:       1,
    })
  })

  // Log window for debugging
  console.debug(
    `[PlanningEngine] Generated ${plan.length} items across ${totalDays} days (intensity: ${intensity})`
  )

  return plan
}

/**
 * Preview — generates plan but only returns first 3 days.
 * Used in progressive onboarding before user commits.
 */
export function generatePlanPreview(input: PlanGeneratorInput): GeneratedPlanItem[] {
  const full = generatePlan(input)
  const previewDates = [...new Set(full.map((p) => p.assigned_date))].slice(0, 3)
  return full.filter((p) => previewDates.includes(p.assigned_date))
}
