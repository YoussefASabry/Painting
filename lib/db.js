import { getServiceSupabase } from './supabase'

export const ON_SALE_COLLECTION_ID = '00000000-0000-0000-0000-000000000001'

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function getDb() {
  const s = getServiceSupabase()
  if (!s) throw new Error('Supabase not configured')
  return s
}

export async function getArtistProfile() {
  const { data } = await getDb().from('artist_profile').select('*').maybeSingle()
  return data
}

export async function getExhibitions() {
  const { data } = await getDb()
    .from('exhibitions')
    .select('*')
    .eq('category', 'exhibition')
    .order('sort_order', { ascending: true })
  return data || []
}

export async function getEvents() {
  const { data } = await getDb()
    .from('exhibitions')
    .select('*')
    .eq('category', 'event')
    .order('sort_order', { ascending: true })
  return data || []
}

export async function getCollections() {
  const { data } = await getDb()
    .from('collections')
    .select('*, artworks(*, artwork_images(*))')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
  return (data || []).map(formatCollection)
}

export async function getCollectionById(id) {
  if (id === 'on-sale') return getOnSaleCollection()
  const { data } = await getDb()
    .from('collections')
    .select('*, artworks(*, artwork_images(*))')
    .eq('id', id)
    .maybeSingle()
  return data ? formatCollection(data) : null
}

export async function getCollectionBySlug(slug) {
  if (slug === 'on-sale') return getOnSaleCollection()
  const { data } = await getDb()
    .from('collections')
    .select('*, artworks(*, artwork_images(*))')
    .eq('is_published', true)
  const match = (data || []).find((c) => toSlug(c.title) === slug)
  return match ? formatCollection(match) : null
}

export async function getOnSaleCollection() {
  const [artsPromise, collPromise] = await Promise.all([
    getDb()
      .from('artworks')
      .select('*, artwork_images(*)')
      .eq('is_on_sale', true)
      .neq('status', 'sold')
      .is('deleted_at', null)
      .eq('is_published', true)
      .order('on_sale_sort_order', { ascending: true, nullsFirst: false }),
    getDb()
      .from('collections')
      .select('title, description, cover_image, sort_order')
      .eq('id', ON_SALE_COLLECTION_ID)
      .maybeSingle(),
  ])
  const artsData = artsPromise.data || []
  const collData = collPromise.data
  return {
    id: 'on-sale',
    slug: 'on-sale',
    title: collData?.title || 'On Sale',
    description: collData?.description || 'Artworks currently on sale',
    cover_image: collData?.cover_image || null,
    sort_order: collData?.sort_order ?? -1,
    artworks: artsData.map(formatArtwork),
  }
}

function formatCollection(row) {
  return {
    id: row.id,
    slug: toSlug(row.title),
    title: row.title,
    description: row.description,
    cover_image: row.cover_image,
    sort_order: row.sort_order,

    artworks: (row.artworks || [])
      .filter((a) => !a.deleted_at && a.is_published)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      .map(formatArtwork),
  }
}

export async function getArtworks() {
  const { data } = await getDb()
    .from('artworks')
    .select('*, artwork_images(*), collection_id')
    .is('deleted_at', null)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
  return (data || []).map(formatArtwork)
}

export async function getArtworkById(id) {
  const { data } = await getDb()
    .from('artworks')
    .select('*, artwork_images(*), collections(title)')
    .is('deleted_at', null)
    .eq('is_published', true)
    .eq('id', id)
    .maybeSingle()
  return data ? formatArtwork(data) : null
}

export async function getFeaturedArtworks() {
  const { data } = await getDb()
    .from('artworks')
    .select('*, artwork_images(*), collection_id')
    .is('deleted_at', null)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
  return (data || []).map(formatArtwork)
}

function cmToIn(cm) {
  return cm ? (cm * 0.393701).toFixed(1) : null
}

function formatArtwork(row) {
  const primary = (row.artwork_images || []).find((img) => img.is_primary) || (row.artwork_images || [])[0]
  const hasW = row.width_cm != null
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    medium: row.medium,
    width_cm: row.width_cm,
    height_cm: row.height_cm,
    depth_cm: row.depth_cm,
    weight_kg: row.weight_kg,
    size: hasW ? [row.width_cm, row.height_cm].filter(v => v != null).join(' × ') + ' cm' : null,
    size_inches: hasW ? [cmToIn(row.width_cm), cmToIn(row.height_cm)].filter(Boolean).join(' × ') + ' in' : null,
    size_full: hasW ? `${[row.width_cm, row.height_cm].filter(v => v != null).join(' × ')} cm${cmToIn(row.width_cm) ? ` (${[cmToIn(row.width_cm), cmToIn(row.height_cm)].filter(Boolean).join(' × ')} in)` : ''}` : null,
    description: row.description,
    price: row.price,
    status: row.status || 'available',
    sold: row.status === 'sold',
    featured: row.is_featured,
    published: row.is_published,
    collection_id: row.collection_id,
    collection_name: row.collections?.title || null,
    collection_slug: row.collections?.title ? toSlug(row.collections.title) : null,
    is_on_sale: row.is_on_sale || false,
    on_sale_sort_order: row.on_sale_sort_order ?? 0,
    image: primary ? primary.url : null,
    images: (row.artwork_images || []).map((img) => img.url),
    sort_order: row.sort_order,
  }
}
