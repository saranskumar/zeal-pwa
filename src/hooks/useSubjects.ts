import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { IS_DEMO, DEMO_SUBJECTS } from '@/lib/mock-data'
import type { CreateSubjectInput, Subject } from '@/types'

const QUERY_KEY = 'subjects'

export function useSubjects() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    enabled:  !!userId,
    queryFn: async () => {
      if (!userId) return []
      if (IS_DEMO) return DEMO_SUBJECTS
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Subject[]
    },
  })
}

export function useCreateSubject() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (input: CreateSubjectInput) => {
      const { data, error } = await supabase
        .from('subjects')
        .insert({ ...input, user_id: userId! })
        .select()
        .single()

      if (error) throw error
      return data as Subject
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] }),
  })
}

export function useUpdateSubject() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Subject> & { id: string }) => {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId!)
        .select()
        .single()

      if (error) throw error
      return data as Subject
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] }),
  })
}

export function useDeleteSubject() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (subjectId: string) => {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)
        .eq('user_id', userId!)

      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] }),
  })
}
