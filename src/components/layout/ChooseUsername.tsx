import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

export function ChooseUsername() {
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null)
      return
    }

    setChecking(true)
    const timeoutId = setTimeout(async () => {
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
      const { data } = await supabase.from('users').select('id').eq('username', cleanUsername).maybeSingle()
      setIsAvailable(!data)
      setChecking(false)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [username])

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

    if (isAvailable === false) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-md">
      <div className="w-full max-w-sm surface p-8 animate-slide-up">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-[16px] flex items-center justify-center flex-shrink-0">
            <span className="text-[24px] font-bold text-primary">Z</span>
          </div>
          <div className="text-center">
            <h2 className="text-[22px] font-semibold text-foreground mb-1">Welcome to Zeal</h2>
            <p className="text-[14px] text-muted-foreground mt-1">Pick a unique username to continue.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label htmlFor="username" className="label-mono">Username</label>
              
              {/* Availability Indicator */}
              <div className="h-4">
                {username.length > 0 && username.length < 3 ? (
                  <span className="text-[11px] text-muted-foreground font-mono">Min 3 chars</span>
                ) : username.length >= 3 ? (
                  checking ? (
                    <span className="text-[11px] text-amber-500 font-mono animate-pulse">Checking…</span>
                  ) : isAvailable === true ? (
                    <span className="text-[11px] text-primary font-mono">Available</span>
                  ) : isAvailable === false ? (
                    <span className="text-[11px] text-destructive font-mono">Taken</span>
                  ) : null
                ) : null}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                className="w-full h-12 bg-background border border-border rounded-[10px] pl-8 pr-4 text-[14px] text-foreground font-mono placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-destructive label-mono bg-destructive/10 px-3 py-2 rounded-[8px]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || checking || !isAvailable || username.length < 3}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-[10px] transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
