'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getBrowserSupabase()
    if (!supabase) { setError('Supabase not configured'); setLoading(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) { setError(signInError.message); setLoading(false); return }

    router.push('/admin')
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--space-cadet)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, textAlign: 'center', marginBottom: 8, color: 'var(--space-cadet)' }}>Admin Login</h1>
        <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--slate-gray)', marginBottom: 28 }}>Sign in to manage your gallery</p>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" placeholder="artist@example.com" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input" placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/admin/reset-password" style={{ fontSize: 13, color: 'var(--coffee)', textDecoration: 'none' }}>Forgot password?</a>
        </div>
      </div>
    </main>
  )
}
