import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { IS_DEMO, DEMO_SCORE_HISTORY } from '@/lib/mock-data'
import { useAuthStore } from '@/store/auth.store'
import type { Score } from '@/types'

const QUERY_KEY = 'scores'

export function useTodayScore() {
  const userId = useAuthStore((s) => s.user?.id)
  const today  = format(new Date(), 'yyyy-MM-dd')

  return useQuery({
    queryKey: [QUERY_KEY, userId, today],
    enabled:  !!userId,
    queryFn: async () => {
      if (!userId) return null
      if (IS_DEMO) return DEMO_SCORE_HISTORY.find(s => s.score_date === today) || DEMO_SCORE_HISTORY[0]
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId!)
        .eq('score_date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as Score | null
    },
  })
}

export function useScoreHistory(days = 30) {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [QUERY_KEY, userId, 'history', days],
    enabled:  !!userId,
    queryFn:  async () => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId!)
        .gte('score_date', format(cutoff, 'yyyy-MM-dd'))
        .order('score_date', { ascending: true })

      if (error) throw error
      return data as Score[]
    },
  })
}
