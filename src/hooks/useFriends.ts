import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { IS_DEMO } from '@/lib/mock-data'
import type { Friendship, UserProfile } from '@/types'

const FRIENDS_KEY = 'friends'

export interface FriendWithProfile {
  friendship: Friendship
  profile:    UserProfile
}

export function useFriends() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [FRIENDS_KEY, userId],
    enabled:  !!userId,
    queryFn:  async () => {
      if (!userId) return []
      if (IS_DEMO) return [{ status: 'accepted', requester_id: '123e4567-e89b-12d3-a456-426614174000', addressee_id: 'usr_b', updated_at: new Date().toISOString() }] as any[]
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId!},addressee_id.eq.${userId!}`)

      if (error) throw error
      return data as Friendship[]
    },
  })
}

export function usePendingRequests() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [FRIENDS_KEY, userId, 'pending'],
    enabled:  !!userId,
    queryFn:  async () => {
      if (!userId) return []
      if (IS_DEMO) return []
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', userId!)
        .eq('status', 'pending')

      if (error) throw error
      return data as Friendship[]
    },
  })
}

export function useSearchUsers(query: string) {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [FRIENDS_KEY, 'search', query],
    enabled:  query.length >= 2,
    queryFn:  async () => {
      if (!userId) return []
      if (IS_DEMO) return []
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', userId!)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20)

      if (error) throw error
      return data as UserProfile[]
    },
  })
}

export function useSendFriendRequest() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (addresseeId: string) => {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: userId!,
          addressee_id: addresseeId,
          status: 'pending',
        })

      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FRIENDS_KEY, userId] }),
  })
}

export function useRespondToRequest() {
  const qc     = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async ({
      friendshipId,
      action,
    }: {
      friendshipId: string
      action: 'accepted' | 'declined'
    }) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: action })
        .eq('id', friendshipId)
        .eq('addressee_id', userId!)

      if (error) throw error

      if (action === 'accepted') {
        await supabase.from('activity_events').insert({
          user_id:    userId!,
          event_type: 'friend_joined',
          payload:    { friend_user_id: friendshipId },
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FRIENDS_KEY, userId] })
      qc.invalidateQueries({ queryKey: [FRIENDS_KEY, userId, 'pending'] })
    },
  })
}
