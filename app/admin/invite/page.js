'use client'

import { useEffect, useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'

function makeToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '')
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export default function AdminInvitePage() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  const load = async () => {
    const supabase = getBrowserSupabase()
    const { data, error } = await supabase
      .from('admin_invites')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setInvites(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const generateInvite = async () => {
    setError('')
    setCopied(false)
    const supabase = getBrowserSupabase()
    const token = makeToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('admin_invites').insert({ token, expires_at: expiresAt })
    if (error) { setError(error.message); return }
    setLink(`${window.location.origin}/admin/setup?token=${token}`)
    load()
  }

  const revokeInvite = async (id) => {
    const supabase = getBrowserSupabase()
    const { error } = await supabase
      .from('admin_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { setError(error.message); return }
    load()
  }

  const deleteInvite = async (id) => {
    if (!window.confirm('Delete this invite? This cannot be undone.')) return
    const supabase = getBrowserSupabase()
    const { error } = await supabase.from('admin_invites').delete().eq('id', id)
    if (error) { setError(error.message); return }
    load()
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
  }

  const statusOf = (inv) => {
    if (inv.used_at) return inv.claimed_email ? `claimed by ${inv.claimed_email}` : 'revoked'
    if (inv.expires_at && new Date(inv.expires_at) < new Date()) return 'expired'
    return 'pending'
  }

  return (
    <main className="main-content" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="container">
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--space-cadet)', marginBottom: 8 }}>
            Admin Invites
          </h1>
          <p style={{ fontSize: 13, color: 'var(--slate-gray)', marginBottom: 24 }}>
            Generate a one-time link so a customer can create their own admin login. The link stops working once they finish signing up, or you revoke it below.
          </p>

          {error && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <button onClick={generateInvite} className="btn btn-primary" style={{ marginBottom: 16 }}>
            Generate New Invite Link
          </button>

          {link && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, wordBreak: 'break-all', marginBottom: 10 }}>{link}</div>
              <button onClick={copyLink} className="btn btn-secondary" style={{ fontSize: 13 }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--slate-gray)', marginTop: 8 }}>Expires in 7 days if unused.</p>
            </div>
          )}

          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 12 }}>Invite History</h2>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--slate-gray)' }}>Loading...</p>
          ) : invites.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--slate-gray)' }}>No invites yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invites.map((inv) => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
                  <span>{new Date(inv.created_at).toLocaleString()} — {statusOf(inv)}</span>
                  <span style={{ display: 'flex', gap: 14 }}>
                    {statusOf(inv) === 'pending' && (
                      <button onClick={() => revokeInvite(inv.id)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Revoke
                      </button>
                    )}
                    <button onClick={() => deleteInvite(inv.id)} style={{ background: 'none', border: 'none', color: 'var(--slate-gray)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
