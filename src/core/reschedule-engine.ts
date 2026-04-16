import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { DailyPlan } from '@/types'

export type ChangeReason =
  | 'missed_topic'
  | 'manual_recalculate'
  | 'topic_added'
  | 'intensity_changed'
  | 'subject_added'

interface RescheduleResult {
  overdueCount:   number
  newVersionDate: string
  versionNumber:  number
}

/**
 * Reschedule Engine
 *
 * Runs on every app open (once per UTC day).
 * - Detects topics assigned before today that are still incomplete → marks overdue
 * - Carries those topics forward into the current plan
 * - Writes a new daily_plan_versions snapshot for audit trail
 *
 * Never mutates data silently — every reschedule produces a versioned record.
 */
export class RescheduleEngine {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async run(reason: ChangeReason = 'missed_topic'): Promise<RescheduleResult> {
    const today     = format(new Date(), 'yyyy-MM-dd')
    const userId    = this.userId

    // 1. Find all daily_plan entries assigned before today that are not complete
    const { data: overduePlans, error: fetchError } = await supabase
      .from('daily_plans')
      .select('*, topics(*)')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .lt('assigned_date', today)

    if (fetchError) throw fetchError

    if (!overduePlans || overduePlans.length === 0) {
      return { overdueCount: 0, newVersionDate: today, versionNumber: 0 }
    }

    // 2. Mark underlying topics as overdue
    const overdueTopicIds = overduePlans.map((p: DailyPlan) => p.topic_id)

    const { error: topicError } = await supabase
      .from('topics')
      .update({ status: 'overdue' })
      .in('id', overdueTopicIds)
      .eq('user_id', userId)

    if (topicError) throw topicError

    // 3. Determine next available version number for today
    const { data: existingVersions } = await supabase
      .from('daily_plan_versions')
      .select('version_number')
      .eq('user_id', userId)
      .eq('plan_date', today)
      .order('version_number', { ascending: false })
      .limit(1)

    const latestVersion = existingVersions?.[0]?.version_number ?? 0
    const nextVersion   = latestVersion + 1

    // 4. Snapshot current plan state
    const snapshot = overduePlans.map((p: DailyPlan) => ({
      topic_id:      p.topic_id,
      assigned_date: p.assigned_date,
      carried_over:  true,
    }))

    // 5. Write versioned snapshot
    const { error: versionError } = await supabase
      .from('daily_plan_versions')
      .insert({
        user_id:        userId,
        plan_date:      today,
        version_number: nextVersion,
        snapshot,
        change_reason:  reason,
      })

    if (versionError) throw versionError

    // 6. Mark old plan entries as carried over (don't delete — audit trail)
    //    Then insert new daily_plan records for today
    const carryoverInserts = overduePlans.map((p: DailyPlan) => ({
      user_id:       userId,
      topic_id:      p.topic_id,
      assigned_date: today,
      is_completed:  false,
      carried_over:  true,
      version:       nextVersion,
    }))

    if (carryoverInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('daily_plans')
        .upsert(carryoverInserts, { onConflict: 'user_id,topic_id,assigned_date' })

      if (insertError) throw insertError
    }

    console.debug(
      `[RescheduleEngine] Carried over ${overduePlans.length} topics → version ${nextVersion} (${reason})`
    )

    return {
      overdueCount:   overduePlans.length,
      newVersionDate: today,
      versionNumber:  nextVersion,
    }
  }

  /**
   * Check if rescheduler has already run today (prevent double-run).
   * Returns true if a version record exists for today.
   */
  async hasRunToday(): Promise<boolean> {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('daily_plan_versions')
      .select('id')
      .eq('user_id', this.userId)
      .eq('plan_date', today)
      .limit(1)

    return (data?.length ?? 0) > 0
  }
}
