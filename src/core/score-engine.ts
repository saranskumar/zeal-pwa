import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

// ─── Constants ───────────────────────────────────────────────────────────────

const POINTS_PER_HOUR           = 10
const POINTS_PER_TOPIC          = 5
const WEAK_SUBJECT_BONUS        = 5
const STREAK_DAILY_BONUS        = 2
const DAILY_POINTS_CAP          = 100
const ANTI_CHEAT_PENALTY_FACTOR = 0.5  // 50% reduction when no time log exists

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScoreResult {
  daily_points:      number
  raw_topic_points:  number
  raw_time_points:   number
  penalty_applied:   boolean
  streak_count:      number
  cumulative_points: number
}

// ─── Score Engine ─────────────────────────────────────────────────────────────

export class ScoreEngine {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Recalculate the score for a given day.
   * Called after every topic completion or study log entry.
   *
   * Anti-cheat: if topics are marked done but NO hours are logged,
   * topic points are reduced by 50%. The penalty flag is recorded.
   */
  async calculateForDay(date?: string): Promise<ScoreResult> {
    const scoreDate = date ?? format(new Date(), 'yyyy-MM-dd')
    const userId    = this.userId

    // Fetch today's completed topics (via daily_plans + topics join)
    const { data: completedPlans, error: planError } = await supabase
      .from('daily_plans')
      .select('topic_id, topics(subject_id, status)')
      .eq('user_id', userId)
      .eq('assigned_date', scoreDate)
      .eq('is_completed', true)

    if (planError) throw planError

    // Fetch today's study log
    const { data: studyLogs, error: logError } = await supabase
      .from('study_logs')
      .select('hours_studied, subject_id')
      .eq('user_id', userId)
      .eq('log_date', scoreDate)

    if (logError) throw logError

    const totalHours = (studyLogs ?? []).reduce(
      (sum: number, l: { hours_studied: number }) => sum + l.hours_studied,
      0
    )

    // Fetch subject strengths for weak subject bonus
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, strength')
      .eq('user_id', userId)

    const weakSubjectIds = new Set(
      (subjects ?? [])
        .filter((s: { strength: string }) => s.strength === 'weak')
        .map((s: { id: string }) => s.id)
    )

    // Calculate raw topic points
    let raw_topic_points = 0
    for (const plan of completedPlans ?? []) {
      const topic = plan.topics as any as { subject_id: string; status: string } | null
      if (!topic) continue
      raw_topic_points += POINTS_PER_TOPIC
      if (weakSubjectIds.has(topic.subject_id)) {
        raw_topic_points += WEAK_SUBJECT_BONUS
      }
    }

    // Calculate raw time points
    const raw_time_points = Math.floor(totalHours * POINTS_PER_HOUR)

    // Anti-cheat: if topics done but no time logged → 50% penalty
    const hasStudyLog      = totalHours > 0
    const hasCompletedWork = (completedPlans?.length ?? 0) > 0
    const penalty_applied  = hasCompletedWork && !hasStudyLog

    const effective_topic_points = penalty_applied
      ? Math.floor(raw_topic_points * ANTI_CHEAT_PENALTY_FACTOR)
      : raw_topic_points

    // Streak calculation
    const streak_count = await this.getStreak(scoreDate)

    // Assemble daily points
    let daily_points =
      effective_topic_points +
      raw_time_points +
      streak_count * STREAK_DAILY_BONUS

    // Hard cap
    daily_points = Math.min(daily_points, DAILY_POINTS_CAP)

    // Cumulative points — sum existing + today's
    const { data: previousScore } = await supabase
      .from('scores')
      .select('cumulative_points')
      .eq('user_id', userId)
      .lt('score_date', scoreDate)
      .order('score_date', { ascending: false })
      .limit(1)
      .single()

    const cumulativeBefore = previousScore?.cumulative_points ?? 0
    const cumulative_points = cumulativeBefore + daily_points

    // Upsert score record for today
    const { error: upsertError } = await supabase
      .from('scores')
      .upsert(
        {
          user_id:           userId,
          score_date:        scoreDate,
          daily_points,
          cumulative_points,
          streak_count,
          raw_topic_points,
          raw_time_points,
          penalty_applied,
        },
        { onConflict: 'user_id,score_date' }
      )

    if (upsertError) throw upsertError

    return {
      daily_points,
      raw_topic_points,
      raw_time_points,
      penalty_applied,
      streak_count,
      cumulative_points,
    }
  }

  /**
   * Calculate the current study streak.
   * Streak = consecutive days with at least one completed topic or study log.
   */
  async getStreak(upToDate?: string): Promise<number> {
    const toDate = upToDate ?? format(new Date(), 'yyyy-MM-dd')

    const { data: recentScores } = await supabase
      .from('scores')
      .select('score_date, daily_points')
      .eq('user_id', this.userId)
      .lte('score_date', toDate)
      .order('score_date', { ascending: false })
      .limit(60)  // max 60 days back

    if (!recentScores || recentScores.length === 0) return 0

    let streak = 0
    let cursor = toDate

    for (const record of recentScores) {
      if (record.score_date === cursor && record.daily_points > 0) {
        streak++
        // Move cursor back one day
        const prev = new Date(cursor)
        prev.setDate(prev.getDate() - 1)
        cursor = format(prev, 'yyyy-MM-dd')
      } else {
        break
      }
    }

    return streak
  }
}
