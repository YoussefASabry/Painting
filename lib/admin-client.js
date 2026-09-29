'use client'

import { getBrowserSupabase, getAuthenticatedSupabase } from './supabase'

let authClient = null
let lastToken = null

export async function getAdminClient() {
  const browserSupabase = getBrowserSupabase()
  if (!browserSupabase) throw new Error('Supabase not configured or missing env vars')

  const { data: { session }, error: sessionError } = await browserSupabase.auth.getSession()
  if (sessionError) throw sessionError
  if (!session?.access_token) throw new Error('Not authenticated — please sign in')

  if (!authClient || session.access_token !== lastToken) {
    authClient = getAuthenticatedSupabase(session.access_token)
    lastToken = session.access_token
  }
  return authClient
}

export async function adminFetch(table, query) {
  const supabase = await getAdminClient()
  const q = supabase.from(table).select(query.select || '*')
  if (query.isNotNull) q.not(query.isNotNull, 'is', null)
  if (query.isNull) q.is(query.isNull, null)
  if (query.filters) for (const f of query.filters) q.filter(f.column, f.operator, f.value)
  if (query.orderBy) q.order(query.orderBy, { ascending: query.ascending !== false })
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function adminFetchOne(table, id) {
  const supabase = await getAdminClient()
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function adminUpsert(table, data, conflictField = 'id') {
  const supabase = await getAdminClient()
  const { error } = await supabase.from(table).upsert(data, { onConflict: conflictField })
  if (error) throw error
}

export async function adminUpdate(table, id, data) {
  const supabase = await getAdminClient()
  const { error } = await supabase.from(table).update(data).eq('id', id)
  if (error) throw error
}

export async function adminInsert(table, data) {
  const supabase = await getAdminClient()
  const { data: inserted, error } = await supabase.from(table).insert(data).select()
  if (error) throw error
  return inserted?.[0]
}

export async function adminSoftDelete(table, id) {
  const supabase = await getAdminClient()
  const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function adminHardDelete(table, id) {
  const supabase = await getAdminClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export async function adminUploadFile(bucket, file, folder = '') {
  const supabase = await getAdminClient()
  const ext = file.name.split('.').pop()
  const filePath = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
  const { error: uploadErr } = await supabase.storage.from(bucket).upload(filePath, file, { contentType: file.type, upsert: false })
  if (uploadErr) throw uploadErr
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return { filePath, publicUrl }
}

export async function adminSetPrimaryImage(artworkId, imageId) {
  const supabase = await getAdminClient()
  const { error: clearErr } = await supabase.from('artwork_images').update({ is_primary: false }).eq('artwork_id', artworkId)
  if (clearErr) throw clearErr
  const { error } = await supabase.from('artwork_images').update({ is_primary: true }).eq('id', imageId)
  if (error) throw error
}
