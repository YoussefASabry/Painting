import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  const { data: profile } = await supabase.from('artist_profile').select('*').maybeSingle()
  const { data: credentials } = await supabase.from('credentials').select('*').order('sort_order', { ascending: true })
  const { data: past } = await supabase.from('exhibitions').select('*').or('status.eq.past,end_date.lt.' + new Date().toISOString().split('T')[0]).order('start_date', { ascending: false })
  const { data: upcoming } = await supabase.from('exhibitions').select('*').or(`and(status.eq.upcoming,start_date.gte.${new Date().toISOString().split('T')[0]}),and(status.eq.current,start_date.gte.${new Date().toISOString().split('T')[0]})`).order('start_date', { ascending: true })
  const { data: artworks } = await supabase.from('artworks').select('*, artwork_images(*)').is('deleted_at', null).eq('is_published', true).order('sort_order', { ascending: true })
  const { data: featuredList } = await supabase.from('artworks').select('*, artwork_images(*)').is('deleted_at', null).eq('is_published', true).eq('is_featured', true).order('sort_order', { ascending: true })

  return NextResponse.json({
    profile,
    credentials: credentials || [],
    pastExhibitions: past || [],
    upcomingExhibitions: upcoming || [],
    artworks: (artworks || []).map(formatArtwork),
    featured: (featuredList || []).map(formatArtwork),
  })
}

function formatArtwork(row) {
  const primary = (row.artwork_images || []).find((img) => img.is_primary) || (row.artwork_images || [])[0]
  return {
    id: row.id, title: row.title, year: row.year, medium: row.medium, width_cm: row.width_cm, height_cm: row.height_cm, depth_cm: row.depth_cm,
    size: [row.width_cm, row.height_cm].filter(Boolean).join(' × ') + (row.width_cm ? ' cm' : ''),
    description: row.description, price: row.price, status: row.status || 'available',
    sold: row.status === 'sold', featured: row.is_featured, published: row.is_published,
    is_on_sale: row.is_on_sale || false,
    on_sale_sort_order: row.on_sale_sort_order ?? 0,
    image: primary ? primary.url : null, images: (row.artwork_images || []).map((img) => img.url), sort_order: row.sort_order,
  }
}
