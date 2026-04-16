import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { ScoreEngine } from '@/core/score-engine'
import type { LogStudyTimeInput, StudyLog } from '@/types'

const QUERY_KEY = 'study-logs'

export function useStudyLogs(date?: string) {
  const userId  = useAuthStore((s) => s.user?.id)
  const logDate = date ?? format(new Date(), 'yyyy-MM-dd')

  return useQuery({
    queryKey: [QUERY_KEY, userId, logDate],
    enabled:  !!userId,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', userId!)
        .eq('log_date', logDate)

      if (error) throw error
      return data as StudyLog[]
    },
  })
}

export function useLogStudyTime() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (input: LogStudyTimeInput) => {
      const { data, error } = await supabase
        .from('study_logs')
        .upsert(
          { ...input, user_id: userId! },
          { onConflict: 'user_id,subject_id,log_date' }
        )
        .select()
        .single()

      if (error) throw error

      // Recalculate score for the logged date
      const engine = new ScoreEngine(userId!)
      await engine.calculateForDay(input.log_date)

      // Insert activity event
      await supabase.from('activity_events').insert({
        user_id:    userId!,
        event_type: 'hours_logged',
        payload:    { subject_id: input.subject_id, hours: input.hours_studied },
      })

      return data as StudyLog
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId, vars.log_date] })
      qc.invalidateQueries({ queryKey: ['scores', userId] })
    },
  })
}
