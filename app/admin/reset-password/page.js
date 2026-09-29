'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState('request')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const accessToken = searchParams.get('access_token')
  const [hasCheckedToken] = useState(() => {
    if (accessToken) setStep('reset')
    return true
  })

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getBrowserSupabase()
    if (!supabase) { setError('Supabase not configured'); setLoading(false); return }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setStep('sent')
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getBrowserSupabase()
    if (!supabase) { setError('Supabase not configured'); setLoading(false); return }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setError(error.message); setLoading(false); return }
    setStep('done')
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--space-cadet)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, textAlign: 'center', marginBottom: 8, color: 'var(--space-cadet)' }}>
          {step === 'request' ? 'Reset Password' : step === 'reset' ? 'New Password' : step === 'sent' ? 'Check Your Email' : 'Password Updated'}
        </h1>
        <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--slate-gray)', marginBottom: 28 }}>
          {step === 'request' && 'Enter your email to receive a reset link'}
          {step === 'reset' && 'Enter your new password below'}
          {step === 'sent' && `We sent a reset link to ${email}`}
          {step === 'done' && 'Your password has been updated successfully'}
        </p>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>{error}</div>}

        {step === 'request' && (
          <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" placeholder="artist@example.com" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="form-input" placeholder="Minimum 6 characters" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {step === 'sent' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--slate-gray)', marginBottom: 20 }}>Click the link in the email to reset your password. The link expires in 1 hour.</p>
            <button onClick={() => setStep('request')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Back to Reset</button>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--slate-gray)', marginBottom: 20 }}>You can now sign in with your new password.</p>
            <a href="/admin/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%' }}>Go to Login</a>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <a href="/admin/login" style={{ fontSize: 13, color: 'var(--coffee)', textDecoration: 'none' }}>&larr; Back to Login</a>
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--space-cadet)' }}><p style={{ color: '#fff' }}>Loading...</p></main>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
