import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

interface AuthState {
  session:  Session | null
  user:     User | null
  profile:  UserProfile | null
  loading:  boolean
  isDemo:   boolean

  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  enableDemo: () => void
  reset:      () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user:    null,
      profile: null,
      loading: true,
      isDemo:  false,

      setSession: (session) =>
        set({ session, user: session?.user ?? null }),

      setProfile: (profile) => set({ profile }),

      setLoading: (loading) => set({ loading }),

      enableDemo: () => {
        const mockId = '123e4567-e89b-12d3-a456-426614174000'
        set({
          isDemo: true,
          session: {
            access_token: 'dummy', refresh_token: 'dummy', expires_in: 9999, expires_at: 9999, token_type: 'bearer',
            user: { id: mockId, email: 'preview@zeal.local', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(), factors: [] } as any
          },
          user: { id: mockId } as any,
          profile: { id: mockId, username: 'demo_student', display_name: 'Local Demo', avatar_url: null, created_at: new Date().toISOString() },
          loading: false
        })
      },

      reset: () =>
        set({ session: null, user: null, profile: null, loading: false, isDemo: false }),
    }),
    {
      name:    'zeal-auth',
      partialize: (state) => ({
        // Persist profile and demo state across reloads
        profile: state.profile,
        isDemo: state.isDemo
      }),
    }
  )
)
