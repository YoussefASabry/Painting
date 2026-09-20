'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase'

function SetupForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(token ? 'form' : 'invalid')
  const [busy, setBusy] = useState(token ? true : false)

  useEffect(() => {
    if (!token) return
    ;(async () => {
      const supabase = getBrowserSupabase()
      const { data, error } = await supabase
        .from('admin_invites')
        .select('used_at, expires_at')
        .eq('token', token)
        .is('used_at', null)
        .maybeSingle()
      setBusy(false)
      if (error || !data || (data.expires_at && new Date(data.expires_at) < new Date())) {
        setStep('invalid')
        setError('This invite link is invalid, already used, or expired.')
        return
      }
      setStep('form')
    })()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)

    const res = await fetch('/api/admin-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, password }),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // Sign the new admin in immediately.
    const supabase = getBrowserSupabase()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (!signInError) {
      window.location.href = '/admin'
    } else {
      setStep('done')
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--space-cadet)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, textAlign: 'center', marginBottom: 8, color: 'var(--space-cadet)' }}>
          {step === 'form' ? 'Create Admin Login' : 'Invalid Invite'}
        </h1>
        <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--slate-gray)', marginBottom: 28 }}>
          {step === 'form' ? 'Your invite has been verified. Choose your login details.' : 'This invite link is invalid, already used, or expired.'}
        </p>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>{error}</div>}

        {busy && <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--slate-gray)' }}>Verifying invite...</p>}

        {step === 'invalid' && (
          <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--slate-gray)' }}>
            Contact the gallery admin to request a new invite link.
          </p>
        )}

        {step === 'form' && !busy && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="form-input" placeholder="Minimum 6 characters" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="form-input" placeholder="Re-enter password" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--slate-gray)', marginBottom: 20 }}>Your account was created. Please sign in.</p>
            <a href="/admin/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%' }}>Go to Login</a>
          </div>
        )}
      </div>
    </main>
  )
}

export default function AdminSetupPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--space-cadet)' }}><p style={{ color: '#fff' }}>Loading...</p></main>}>
      <SetupForm />
    </Suspense>
  )
}