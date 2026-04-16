import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LoginSchema, OTPSchema } from '@/types'
import { useAuthStore } from '@/store/auth.store'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep]     = useState<Step>('email')
  const [email, setEmail]   = useState('')
  const [otp, setOtp]       = useState('')
  const [error, setError]   = useState<string | null>(null)
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

  async function handleGoogleLogin() {
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    
    if (error) {
      setLoading(false)
      setError(error.message)
    }
  }

  function handleDemoLogin() {
    useAuthStore.getState().enableDemo()
    navigate('/onboarding')
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4 mb-10 animate-fade-in">
        <img src="/zeal_logo.png" alt="Zeal" className="w-24 h-24 rounded-3xl shadow-elevation-2" />
        <h1 className="text-4xl font-black text-foreground tracking-tight">Zeal</h1>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          Structured exam prep that keeps you accountable
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm surface-container p-8 animate-slide-up shadow-elevation-1">
        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <div className="mb-2">
              <h2 className="text-xl font-black text-foreground tracking-tight text-center">Sign In</h2>
              <p className="text-xs font-bold text-muted-foreground mt-2 text-center uppercase tracking-widest">
                Verification code via email
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="university@email.com"
                className="h-12 px-5 rounded-2xl bg-secondary border-2 border-transparent focus:border-primary/20 outline-none font-bold text-sm transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              id="send-otp-btn"
              className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-elevation-1 hover:shadow-elevation-2 transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Processing...' : 'Get Code'}
            </button>

            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-border"></div>
              <span className="relative bg-background px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground rounded-full">Or</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="h-12 w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border-2 border-slate-200 transition-all active:scale-95 disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-digit code or <strong className="text-primary">click the secure link</strong> we sent to <strong>{email}</strong>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="otp" className="text-sm font-medium text-foreground">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000 000"
                className="h-14 px-3 rounded-2xl bg-secondary border-2 border-transparent focus:border-primary/20 outline-none font-black text-xl tracking-[0.5em] text-center transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              id="verify-otp-btn"
              className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-elevation-1 hover:shadow-elevation-2 transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(null) }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>

      {import.meta.env.VITE_DEMO_MODE === 'true' && (
        <button
          onClick={handleDemoLogin}
          className="mt-6 text-xs font-black uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 px-6 py-3 rounded-full transition-all animate-fade-in active:scale-95"
        >
          Explore Demo Mode
        </button>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center">
        No password needed. We use secure one-time codes.
      </p>
    </div>
  )
}
