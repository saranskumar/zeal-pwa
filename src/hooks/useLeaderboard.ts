import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { IS_DEMO, DEMO_LEADERBOARD, DEMO_ACTIVITY } from '@/lib/mock-data'
import { useFriends } from './useFriends'
import type { Score, UserProfile, ActivityEvent } from '@/types'

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  user:    UserProfile
  score:   Score
  rank:    number
}

export function useLeaderboard(period: 'daily' | 'weekly' = 'daily') {
  const userId = useAuthStore((s) => s.user?.id)
  const { data: friendships } = useFriends()

  return useQuery({
    queryKey: ['leaderboard', userId, period],
    enabled:  !!userId && !!friendships,
    queryFn:  async () => {
      if (!userId) return []
      if (IS_DEMO) {
        return DEMO_LEADERBOARD.map((entry, idx) => ({
          ...entry, rank: idx + 1
        })) as LeaderboardEntry[]
      }

      const friendIds = (friendships ?? []).map((f) =>
        f.requester_id === userId ? f.addressee_id : f.requester_id
      )
      const allIds = [userId!, ...friendIds]

      const today = new Date().toISOString().split('T')[0]
      let dateFilter = today

      if (period === 'weekly') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter = weekAgo.toISOString().split('T')[0]
      }

      const { data: scores, error } = await supabase
        .from('scores')
        .select('*')
        .in('user_id', allIds)
        .gte('score_date', dateFilter)
        .order('daily_points', { ascending: false })

      if (error) throw error

      // Aggregate by user if weekly
      const userTotals = new Map<string, number>()
      for (const s of scores ?? []) {
        userTotals.set(s.user_id, (userTotals.get(s.user_id) ?? 0) + s.daily_points)
      }

      const sorted = [...userTotals.entries()].sort((a, b) => b[1] - a[1])

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('users')
        .select('*')
        .in('id', allIds)

      const profileMap = new Map((profiles ?? []).map((p: UserProfile) => [p.id, p]))

      return sorted
        .map(([uid, total], idx) => {
          const profile = profileMap.get(uid)
          if (!profile) return null
          return {
            user:  profile,
            score: { daily_points: total } as Score,
            rank:  idx + 1,
          }
        })
        .filter(Boolean) as LeaderboardEntry[]
    },
  })
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export function useActivityFeed() {
  const userId = useAuthStore((s) => s.user?.id)
  const { data: friendships } = useFriends()

  return useQuery({
    queryKey: ['activity-feed', userId],
    enabled:  !!userId && !!friendships,
    queryFn: async () => {
      if (!userId) return []
      if (IS_DEMO) return DEMO_ACTIVITY as ActivityEvent[]
      const friendIds = (friendships ?? []).map((f) =>
        f.requester_id === userId ? f.addressee_id : f.requester_id
      )

      if (friendIds.length === 0) return []

      const { data, error } = await supabase
        .from('activity_events')
        .select('*')
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as ActivityEvent[]
    },
  })
}
