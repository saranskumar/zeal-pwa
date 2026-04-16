import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'

export function ChooseUsername() {
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only show if the current username is the generic 'user_...'
  if (!profile || !profile.username.startsWith('user_')) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (username.length < 3) {
      setError("Username must be at least 3 characters")
      return
    }
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    
    setError(null)
    setLoading(true)

    const { data: existing } = await supabase.from('users').select('id').eq('username', cleanUsername).maybeSingle()
    if (existing) {
      setError("Username is already taken")
      setLoading(false)
      return
    }

    const { data, error: updateError } = await supabase
      .from('users')
      .update({ username: cleanUsername })
      .eq('id', profile!.id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      setProfile(data)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-sm surface-container p-8 animate-slide-up shadow-elevation-2">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-primary-foreground font-black text-3xl shadow-elevation-1">
            Z
          </div>
          <h2 className="text-xl font-black text-foreground tracking-tight text-center">Welcome to Zeal!</h2>
          <p className="text-sm font-medium text-muted-foreground text-center">
            Pick a secure, unique username before continuing into your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              className="h-12 pl-8 pr-5 rounded-2xl bg-secondary border-2 border-transparent focus:border-primary/20 outline-none font-bold text-sm transition-all text-foreground"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-bold bg-destructive/10 px-3 py-2 rounded-lg text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || username.length < 3}
            className="h-12 w-full flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-elevation-1 transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Set Username'}
          </button>
        </form>
      </div>
    </div>
  )
}
