import { NextResponse } from 'next/server'
import { getAuthSupabase, unauthorized } from '@/lib/admin-auth'

export async function PUT(request, { params }) {
  const { id } = await params
  const supabase = await getAuthSupabase(request)
  if (!supabase) return unauthorized()
  const body = await request.json()
  const { error } = await supabase.from('artworks').update({
    title: body.title, year: body.year, medium: body.medium, width_cm: body.width_cm || null, height_cm: body.height_cm || null, depth_cm: body.depth_cm || null, description: body.description, price: body.price || 0, status: body.status || 'available', is_featured: body.is_featured || false, is_published: body.is_published !== undefined ? body.is_published : true, sort_order: body.sort_order || 0, collection_id: body.collection_id || null,
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const supabase = await getAuthSupabase(request)
  if (!supabase) return unauthorized()
  const { error } = await supabase.from('artworks').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
