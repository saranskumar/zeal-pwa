import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'

import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

import LoginPage from '@/pages/auth/Login'
import OnboardingPage from '@/pages/Onboarding'
import HomePage from '@/pages/Home'
import SubjectsPage from '@/pages/Subjects'
import PlanPage from '@/pages/Plan'
import SocialPage from '@/pages/Social'
import ProfilePage from '@/pages/Profile'

export default function App() {
  const { setSession, setLoading, setProfile } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Don't override demo session if we are natively in demo mode
      if (useAuthStore.getState().isDemo) {
        setLoading(false)
        return
      }

      setSession(session)
      if (session) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (useAuthStore.getState().isDemo) return

        setSession(session)
        if (session) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          navigate('/login', { replace: true })
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate, setSession, setLoading, setProfile])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* App Shell routing */}
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  )
}
