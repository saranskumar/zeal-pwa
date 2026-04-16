import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import type { DailyPlan, GeneratedPlanItem } from '@/types'

const QUERY_KEY = 'daily-plan'

// Extended type joining topic + subject data for display
export interface DailyPlanWithDetails extends DailyPlan {
  topics: {
    id:             string
    title:          string
    status:         string
    subject_id:     string
    priority_score: number
    subjects: {
      id:       string
      name:     string
      strength: string
    } | null
  } | null
}

export function useTodayPlan() {
  const userId = useAuthStore((s) => s.user?.id)
  const today  = format(new Date(), 'yyyy-MM-dd')

  return useQuery({
    queryKey: [QUERY_KEY, userId, today],
    enabled:  !!userId,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*, topics(id, title, status, subject_id, priority_score, subjects(id, name, strength))')
        .eq('user_id', userId!)
        .eq('assigned_date', today)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as DailyPlanWithDetails[]
    },
  })
}

export function useFullPlan() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [QUERY_KEY, userId, 'full'],
    enabled:  !!userId,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*, topics(id, title, status, subject_id, priority_score, subjects(id, name, strength))')
        .eq('user_id', userId!)
        .gte('assigned_date', format(new Date(), 'yyyy-MM-dd'))
        .order('assigned_date', { ascending: true })

      if (error) throw error
      return data as DailyPlanWithDetails[]
    },
  })
}

export function useCommitPlan() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (planItems: GeneratedPlanItem[]) => {
      const { error } = await supabase
        .from('daily_plans')
        .insert(planItems.map((item) => ({ ...item, user_id: userId! })))

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] })
    },
  })
}

export function useMoveTopic() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async ({
      planId,
      newDate,
    }: {
      planId:  string
      newDate: string
    }) => {
      const { error } = await supabase
        .from('daily_plans')
        .update({ assigned_date: newDate })
        .eq('id', planId)
        .eq('user_id', userId!)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] })
    },
  })
}
