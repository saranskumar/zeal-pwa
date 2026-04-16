import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LoginSchema, OTPSchema } from '@/types'
import { useAuthStore } from '@/store/auth.store'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep]       = useState<Step>('email')
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const result = LoginSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)

    if (authError) { setError(authError.message); return }
    setStep('otp')
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const result = OTPSchema.safeParse({ otp })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)
    const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type:  'email',
    })
    
    if (verifyError) {
      setLoading(false)
      setError(verifyError.message)
      return
    }

    if (session) {
      useAuthStore.getState().setSession(session)
      navigate('/', { replace: true })
    } else {
      setLoading(false)
      setError("Unable to establish a secure session.")
    }
  }

  function handleDemoLogin() {
    useAuthStore.getState().enableDemo()
    navigate('/onboarding')
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
      {/* Logo block */}
      <div className="flex flex-col items-center gap-4 mb-10 animate-fade-in">
        <div className="w-16 h-16 bg-primary/10 rounded-[16px] flex items-center justify-center flex-shrink-0">
          <span className="text-[24px] font-bold text-primary">Z</span>
        </div>
        <p className="label-mono">Zeal</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm surface p-8 animate-slide-up">
        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-6">
            <div>
              <h2 className="text-[22px] font-semibold text-foreground mb-1">Sign In</h2>
              <p className="text-[14px] text-muted-foreground">Verification code sent via email</p>
            </div>

            <div>
              <p className="label-mono mb-2">Email address</p>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full h-12 bg-background border border-border rounded-[10px] px-4 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                required
              />
            </div>

            {error && (
              <p className="text-[13px] text-destructive label-mono bg-destructive/10 px-3 py-2 rounded-[8px]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              id="send-otp-btn"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-[10px] transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-6">
            <div>
              <h2 className="text-[22px] font-semibold text-foreground mb-1">Check email</h2>
              <p className="text-[14px] text-muted-foreground">
                Sent to <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div>
              <p className="label-mono mb-2">Verification code</p>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full h-14 bg-background border border-border rounded-[10px] text-center text-[20px] tracking-[0.4em] font-mono font-medium text-foreground outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-[13px] text-destructive label-mono bg-destructive/10 px-3 py-2 rounded-[8px]">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                id="verify-otp-btn"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-[10px] transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(null) }}
                className="h-10 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <button
            onClick={handleDemoLogin}
            className="label-mono px-4 py-2 border border-border bg-background hover:bg-secondary rounded-[8px] transition-colors"
          >
            Demo Mode
          </button>
        )}
      </div>
    </div>
  )
}
