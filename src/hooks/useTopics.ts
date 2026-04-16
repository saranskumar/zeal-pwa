import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import type { CreateTopicInput, Topic } from '@/types'

const QUERY_KEY = 'topics'

export function useTopics(subjectId?: string) {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [QUERY_KEY, userId, subjectId],
    enabled:  !!userId,
    queryFn:  async () => {
      let query = supabase
        .from('topics')
        .select('*')
        .eq('user_id', userId!)
        .is('deleted_at', null)
        .order('priority_score', { ascending: false })

      if (subjectId) query = query.eq('subject_id', subjectId)

      const { data, error } = await query
      if (error) throw error
      return data as Topic[]
    },
  })
}

export function useCreateTopic() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (input: CreateTopicInput) => {
      const { data, error } = await supabase
        .from('topics')
        .insert({
          ...input,
          user_id:        userId!,
          status:         'pending',
          priority_score: 0,
          completed_at:   null,
          deleted_at:     null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Topic
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] })
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId, vars.subject_id] })
    },
  })
}

export function useMarkTopicDone() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (topicId: string) => {
      const now = new Date().toISOString()

      // Optimistic: topic status update
      const { error: topicError } = await supabase
        .from('topics')
        .update({ status: 'completed', completed_at: now })
        .eq('id', topicId)
        .eq('user_id', userId!)

      if (topicError) throw topicError

      // Mark corresponding daily_plan entry complete
      const today = new Date().toISOString().split('T')[0]
      const { error: planError } = await supabase
        .from('daily_plans')
        .update({ is_completed: true })
        .eq('topic_id', topicId)
        .eq('user_id', userId!)
        .eq('assigned_date', today)

      if (planError) throw planError

      // Insert activity event
      await supabase.from('activity_events').insert({
        user_id:    userId!,
        event_type: 'topic_completed',
        payload:    { topic_id: topicId, subject_name: '' },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] })
      qc.invalidateQueries({ queryKey: ['daily-plan', userId] })
      qc.invalidateQueries({ queryKey: ['scores',    userId] })
    },
  })
}

export function useSoftDeleteTopic() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from('topics')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', topicId)
        .eq('user_id', userId!)

      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] }),
  })
}
