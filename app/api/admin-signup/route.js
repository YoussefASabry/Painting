import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST(request) {
  const { token, email, password } = await request.json()

  if (!token || !email || !password) {
    return NextResponse.json({ error: 'Missing token, email, or password' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
  }

  const { data: invite, error: inviteError } = await supabase
    .from('admin_invites')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .maybeSingle()

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }
  if (!invite || (invite.expires_at && new Date(invite.expires_at) < new Date())) {
    return NextResponse.json({ error: 'This invite link is invalid, already used, or expired.' }, { status: 403 })
  }

  // Claim the invite first, guarded on used_at still being null, so two
  // concurrent requests for the same token can't both create an account.
  const { data: claimed, error: claimError } = await supabase
    .from('admin_invites')
    .update({ used_at: new Date().toISOString(), claimed_email: email })
    .eq('token', token)
    .is('used_at', null)
    .select()
    .maybeSingle()

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 })
  }
  if (!claimed) {
    return NextResponse.json({ error: 'This invite link is invalid, already used, or expired.' }, { status: 403 })
  }

  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    // Roll back the claim so the token isn't burned if account creation failed.
    await supabase.from('admin_invites').update({ used_at: null, claimed_email: null }).eq('token', token)
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
