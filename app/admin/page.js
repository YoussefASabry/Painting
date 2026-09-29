'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase'
import { getAdminClient } from '@/lib/admin-client'
import { ON_SALE_COLLECTION_ID } from '@/lib/db'

const TABS = ['Artworks', 'Collections', 'Profile', 'Exhibitions', 'Events']

export default function AdminPage() {
  const [tab, setTab] = useState('Artworks')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = getBrowserSupabase()
    if (supabase) await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <main className="main-content" style={{ paddingTop: 100 }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <button onClick={handleLogout} style={{ padding: '6px 16px', border: '1px solid var(--slate-gray)', borderRadius: 6, background: 'transparent', color: 'var(--slate-gray)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Log Out</button>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}
        {success && <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{success}</div>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 30, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
              style={{ padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tab === t ? 'var(--coffee)' : 'transparent', color: tab === t ? '#fff' : 'var(--slate-gray)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Artworks' && <ArtworksManager setError={setError} setSuccess={setSuccess} />}
        {tab === 'Collections' && <CollectionsManager setError={setError} setSuccess={setSuccess} />}
        {tab === 'Profile' && <ProfileManager setError={setError} setSuccess={setSuccess} />}
        {tab === 'Exhibitions' && <ExhibitionsManager setError={setError} setSuccess={setSuccess} />}
        {tab === 'Events' && <EventsManager setError={setError} setSuccess={setSuccess} />}
      </div>
    </main>
  )
}

/* ─── Artworks ─── */
function ArtworksManager({ setError, setSuccess }) {
  const [grouped, setGrouped] = useState([])
  const [uncollected, setUncollected] = useState([])
  const [collections, setCollections] = useState([])
  const [onSaleArts, setOnSaleArts] = useState([])
  const [edit, setEdit] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tick, setTick] = useState(0)
  const dragSrc = useRef(null)
  const allArtsRef = useRef([])

  const load = async () => {
    try {
      const supabase = await getAdminClient()
      const [arts, colls] = await Promise.all([
        supabase.from('artworks').select('*, artwork_images(*)').is('deleted_at', null).order('sort_order', { ascending: true }),
        supabase.from('collections').select('*').order('sort_order', { ascending: true }),
      ])
      if (arts.error) throw arts.error
      if (colls.error) throw colls.error

      const sortedColls = [...(colls.data || [])].sort((a, b) => a.sort_order - b.sort_order)
      const allArts = arts.data || []

      const grp = sortedColls.map((c) => ({
        collection: c,
        artworks: allArts.filter((a) => a.collection_id === c.id).sort((a, b) => a.sort_order - b.sort_order),
      }))
      const unc = allArts.filter((a) => !a.collection_id).sort((a, b) => a.sort_order - b.sort_order)

      const onSaleArts = allArts.filter((a) => a.is_on_sale).sort((a, b) => (a.on_sale_sort_order ?? 0) - (b.on_sale_sort_order ?? 0))
      allArtsRef.current = allArts
      setOnSaleArts(onSaleArts)
      setGrouped(grp)
      setUncollected(unc)
      setCollections(sortedColls)
      setDirty(false)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  /* ── local reorder helpers (no DB save) ── */
  const moveUp = (items, idx) => {
    if (idx <= 0) return items
    const next = [...items]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    return next
  }
  const moveDown = (items, idx) => {
    if (idx >= items.length - 1) return items
    const next = [...items]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    return next
  }

  /* ── drag-and-drop ── */
  const handleDragStart = (e, groupId, index, isUncollected) => {
    dragSrc.current = { groupId, index, isUncollected }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop = (e, targetGroupId, targetIndex, targetIsUncollected) => {
    e.preventDefault()
    const src = dragSrc.current
    dragSrc.current = null
    if (!src) return
    if (src.groupId !== targetGroupId || src.isUncollected !== targetIsUncollected) return
    if (src.index === targetIndex) return

    if (src.isUncollected) {
      setUncollected(prev => {
        const next = [...prev]
        const [moved] = next.splice(src.index, 1)
        next.splice(targetIndex, 0, moved)
        return next
      })
    } else if (src.groupId === 'on-sale') {
      setOnSaleArts(prev => {
        const next = [...prev]
        const [moved] = next.splice(src.index, 1)
        next.splice(targetIndex, 0, moved)
        return next
      })
    } else {
      setGrouped(prev => prev.map(g => {
        if (g.collection.id !== src.groupId) return g
        const artworks = [...g.artworks]
        const [moved] = artworks.splice(src.index, 1)
        artworks.splice(targetIndex, 0, moved)
        return { ...g, artworks }
      }))
    }
    setDirty(true)
  }

  /* ── local arrow reorder ── */
  const arrowUp = (groupId, index, isUncollected) => {
    if (isUncollected) {
      setUncollected(prev => moveUp(prev, index))
    } else if (groupId === 'on-sale') {
      setOnSaleArts(prev => moveUp(prev, index))
    } else {
      setGrouped(prev => prev.map(g => {
        if (g.collection.id !== groupId) return g
        return { ...g, artworks: moveUp(g.artworks, index) }
      }))
    }
    setDirty(true)
  }
  const arrowDown = (groupId, index, isUncollected) => {
    if (isUncollected) {
      setUncollected(prev => moveDown(prev, index))
    } else if (groupId === 'on-sale') {
      setOnSaleArts(prev => moveDown(prev, index))
    } else {
      setGrouped(prev => prev.map(g => {
        if (g.collection.id !== groupId) return g
        return { ...g, artworks: moveDown(g.artworks, index) }
      }))
    }
    setDirty(true)
  }

  /* ── batch save order ── */
  const saveOrder = async () => {
    setBusy(true)
    try {
      const supabase = await getAdminClient()
      const updates = []
      for (const g of grouped) {
        g.artworks.forEach((a, i) => updates.push(supabase.from('artworks').update({ sort_order: i }).eq('id', a.id)))
      }
      uncollected.forEach((a, i) => updates.push(supabase.from('artworks').update({ sort_order: i }).eq('id', a.id)))
      onSaleArts.forEach((a, i) => updates.push(supabase.from('artworks').update({ on_sale_sort_order: i }).eq('id', a.id)))
      await Promise.all(updates)
      setSuccess('Order saved!')
      setDirty(false)
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const handleSave = async (form) => {
    setBusy(true); setError(''); setSuccess('')
    try {
      const supabase = await getAdminClient()
      const artworkId = form.id || (crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16) }))
      const payload = {
        id: artworkId, title: form.title, year: form.year, medium: form.medium,
        width_cm: form.width_cm || null, height_cm: form.height_cm || null, depth_cm: form.depth_cm || null, weight_kg: form.weight_kg || null,
        description: form.description, price: form.price || 0,
        status: form.status || 'available',
        is_featured: form.is_featured || false, is_on_sale: form.is_on_sale || false,
        is_published: form.is_published !== undefined ? form.is_published : true,
        sort_order: form.sort_order || 0, collection_id: form.collection_id || null,
      }
      const { error } = await supabase.from('artworks').upsert(payload)
      if (error) throw error

      if (form.files && form.files.length > 0) {
        const { count } = await supabase.from('artwork_images').select('*', { count: 'exact', head: true }).eq('artwork_id', artworkId)
        for (let i = 0; i < form.files.length; i++) {
          const file = form.files[i]
          const ext = file.name.split('.').pop()
          const filePath = `artwork_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
          const { error: uploadErr } = await supabase.storage.from('artworks').upload(filePath, file, { contentType: file.type })
          if (uploadErr) throw uploadErr
          const { data: { publicUrl } } = supabase.storage.from('artworks').getPublicUrl(filePath)
          const { error: insertErr } = await supabase.from('artwork_images').insert({
            artwork_id: artworkId, url: publicUrl, is_primary: (count + i) === 0, sort_order: count + i,
          })
          if (insertErr) throw insertErr
        }
      }
      setSuccess('Saved'); setEdit(null); load()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Soft-delete this artwork?')) return
    setBusy(true)
    try {
      const supabase = await getAdminClient()
      const { error } = await supabase.from('artworks').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setSuccess('Deleted'); load()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const handleExport = () => {
    const allItems = []
    grouped.forEach((g) => g.artworks.forEach((a) => allItems.push(a)))
    uncollected.forEach((a) => allItems.push(a))
    const blob = new Blob([JSON.stringify(allItems, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'artworks-export.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const toggleField = (id, field) => {
    const item = allArtsRef.current.find(a => a.id === id)
    if (!item) return
    const newVal = !item[field]
    item[field] = newVal
    setTick((c) => c + 1)
    setBusy(true)
    const supabasePromise = getAdminClient()
    supabasePromise.then((supabase) => {
      const ops = [supabase.from('artworks').update({ [field]: newVal }).eq('id', id)]
      if (field === 'is_featured' && newVal) {
        allArtsRef.current.forEach((a) => {
          if (a.id !== id && a.is_featured) {
            a.is_featured = false
            ops.push(supabase.from('artworks').update({ is_featured: false }).eq('id', a.id))
          }
        })
      }
      return Promise.all(ops)
    }).then((results) => {
      const err = results.find((r) => r.error)
      if (err) throw err
      setTick((c) => c + 1)
    }).catch((e) => {
      allArtsRef.current.forEach((a) => {
        if (a.id === id) a.is_featured = !newVal
        else if (field === 'is_featured' && newVal && a.is_featured === false) a.is_featured = true
      })
      setTick((c) => c + 1)
      setError(e.message)
    }).finally(() => setBusy(false))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setEdit({})} disabled={busy}>+ New Artwork</button>
        <button className="btn btn-secondary" onClick={handleExport}>Export JSON</button>
        {dirty && (
          <button className="btn btn-primary" onClick={saveOrder} disabled={busy} style={{ background: 'var(--coffee)', color: '#fff' }}>
            {busy ? 'Saving...' : 'Save Order'}
          </button>
        )}
        {dirty && <span style={{ fontSize: 12, color: 'var(--slate-gray)', alignSelf: 'center' }}>Unsaved changes</span>}
      </div>

      {edit && <ArtworkForm item={edit} collections={collections}
        onSave={handleSave} onCancel={() => setEdit(null)} busy={busy} />}

      <div className="admin-table-wrap artworks-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: 70 }}>#</th><th>Image</th><th>Title</th><th>Collection</th><th>Year</th><th>Status</th><th>Price</th><th>Featured</th><th>On Sale</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {onSaleArts.length > 0 && (
              <Fragment>
                <tr className="admin-group-header">
                  <td colSpan={10} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 13, color: '#dc2626', background: '#fef2f2' }}>
                    On Sale
                  </td>
                </tr>
                {onSaleArts.map((a, ai) => (
                  <tr key={a.id} draggable={!busy}
                    onDragStart={(e) => handleDragStart(e, 'on-sale', ai, false)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'on-sale', ai, false)}
                    style={{ cursor: 'grab' }}
                  >
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ cursor: 'grab', fontSize: 14, color: 'var(--slate-gray)', marginRight: 4 }}>&#x22EE;</span>
                      <button disabled={busy} onClick={() => arrowUp('on-sale', ai, false)} style={arrowMini}>&#9650;</button>
                      <button disabled={busy} onClick={() => arrowDown('on-sale', ai, false)} style={arrowMini}>&#9660;</button>
                    </td>
                    <td>{a.artwork_images?.[0]?.url ? <img src={a.artwork_images[0].url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '—'}</td>
                    <td>{a.title}</td>
                    <td style={{ fontSize: 12, color: 'var(--slate-gray)' }}>{a.collection_id ? 'Mixed' : '—'}</td>
                    <td>{a.year}</td>
                    <td>{a.status}</td>
                    <td>EGP {a.price?.toLocaleString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <label style={{ marginRight: 10 }}><input type="checkbox" checked={!!a.is_featured} disabled={busy} onChange={() => toggleField(a.id, 'is_featured')} /><span className="ml">Featured</span></label>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <label style={{ marginRight: 10 }}><input type="checkbox" checked={!!a.is_on_sale} disabled={busy} onChange={() => toggleField(a.id, 'is_on_sale')} /><span className="ml">On Sale</span></label>
                    </td>
                    
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px', marginRight: 6 }} onClick={() => setEdit(a)}>Edit</button>
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px', background: 'var(--caput-mortuum)', color: '#fff' }} onClick={() => handleDelete(a.id)} disabled={busy}>Delete</button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            )}
            {grouped.map((g) => (
              <Fragment key={g.collection.id}>
                <tr className="admin-group-header">
                  <td colSpan={10} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 13, color: 'var(--coffee)', background: '#f5f0e8' }}>
                    {g.collection.title}
                  </td>
                </tr>
                {g.artworks.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 6, fontSize: 12, color: 'var(--slate-gray)', fontStyle: 'italic' }}>No artworks in this collection</td></tr>
                )}
                {g.artworks.map((a, ai) => (
                  <tr key={a.id} draggable={!busy}
                    onDragStart={(e) => handleDragStart(e, g.collection.id, ai, false)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, g.collection.id, ai, false)}
                    style={{ cursor: 'grab' }}
                  >
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ cursor: 'grab', fontSize: 14, color: 'var(--slate-gray)', marginRight: 4 }}>&#x22EE;</span>
                      <button disabled={busy} onClick={() => arrowUp(g.collection.id, ai, false)} style={arrowMini}>&#9650;</button>
                      <button disabled={busy} onClick={() => arrowDown(g.collection.id, ai, false)} style={arrowMini}>&#9660;</button>
                    </td>
                    <td>{a.artwork_images?.[0]?.url ? <img src={a.artwork_images[0].url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '—'}</td>
                    <td>{a.title}</td>
                    <td style={{ fontSize: 12, color: 'var(--slate-gray)' }}>{g.collection.title}</td>
                    <td>{a.year}</td>
                    <td>{a.status}</td>
                    <td>EGP {a.price?.toLocaleString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <label style={{ marginRight: 10 }}><input type="checkbox" checked={!!a.is_featured} disabled={busy} onChange={() => toggleField(a.id, 'is_featured')} /><span className="ml">Featured</span></label>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <label style={{ marginRight: 10 }}><input type="checkbox" checked={!!a.is_on_sale} disabled={busy} onChange={() => toggleField(a.id, 'is_on_sale')} /><span className="ml">On Sale</span></label>
                    </td>
                    
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px', marginRight: 6 }} onClick={() => setEdit(a)}>Edit</button>
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px', background: 'var(--caput-mortuum)', color: '#fff' }} onClick={() => handleDelete(a.id)} disabled={busy}>Delete</button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {uncollected.length > 0 && (
              <Fragment>
                <tr className="admin-group-header">
                  <td colSpan={10} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 13, color: 'var(--slate-gray)', background: '#f5f0e8', fontStyle: 'italic' }}>No Collection</td>
                </tr>
                {uncollected.map((a, ai) => (
                  <tr key={a.id} draggable={!busy}
                    onDragStart={(e) => handleDragStart(e, 'unc', ai, true)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'unc', ai, true)}
                    style={{ cursor: 'grab' }}
                  >
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ cursor: 'grab', fontSize: 14, color: 'var(--slate-gray)', marginRight: 4 }}>&#x22EE;</span>
                      <button disabled={busy} onClick={() => arrowUp('unc', ai, true)} style={arrowMini}>&#9650;</button>
                      <button disabled={busy} onClick={() => arrowDown('unc', ai, true)} style={arrowMini}>&#9660;</button>
                    </td>
                    <td>{a.artwork_images?.[0]?.url ? <img src={a.artwork_images[0].url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '—'}</td>
                    <td>{a.title}</td>
                    <td style={{ fontSize: 12, color: 'var(--slate-gray)' }}>—</td>
                    <td>{a.year}</td>
                    <td>{a.status}</td>
                    <td>EGP {a.price?.toLocaleString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <label style={{ marginRight: 10 }}><input type="checkbox" checked={!!a.is_featured} disabled={busy} onChange={() => toggleField(a.id, 'is_featured')} /><span className="ml">Featured</span></label>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <label style={{ marginRight: 10 }}><input type="checkbox" checked={!!a.is_on_sale} disabled={busy} onChange={() => toggleField(a.id, 'is_on_sale')} /><span className="ml">On Sale</span></label>
                    </td>
                    
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px', marginRight: 6 }} onClick={() => setEdit(a)}>Edit</button>
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px', background: 'var(--caput-mortuum)', color: '#fff' }} onClick={() => handleDelete(a.id)} disabled={busy}>Delete</button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const arrowMini = {
  border: 'none', background: 'transparent', cursor: 'pointer',
  fontSize: 9, padding: '1px 3px', color: 'var(--slate-gray)',
}

function cmToIn(cm) {
  return cm ? (parseFloat(cm) * 0.393701).toFixed(1) : null
}

function ArtworkForm({ item, collections, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    id: item.id || null, title: item.title || '', collection_id: item.collection_id || '',
    year: item.year || '', medium: item.medium || '',
    width_cm: item.width_cm || '', height_cm: item.height_cm || '', depth_cm: item.depth_cm || '', weight_kg: item.weight_kg || '',
    description: item.description || '', price: item.price || '',
    status: item.status || 'available', is_featured: item.is_featured || false, is_on_sale: item.is_on_sale || false,
    is_published: item.is_published !== undefined ? item.is_published : true,
    sort_order: item.sort_order ?? (item.id ? item.sort_order : 0), files: null,
  })
  const [existingImages, setExistingImages] = useState(item.artwork_images || [])
  const [imageBusy, setImageBusy] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const setNum = (key) => (e) => setForm({ ...form, [key]: e.target.value === '' ? '' : e.target.value })

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image?')) return
    setImageBusy(true)
    try {
      const supabase = await getAdminClient()
      await supabase.from('artwork_images').delete().eq('id', imageId)
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
    } catch (e) { alert(e.message) }
    setImageBusy(false)
  }

  const handleSetPrimary = async (imageId) => {
    if (!form.id) return
    setImageBusy(true)
    try {
      const supabase = await getAdminClient()
      await supabase.from('artwork_images').update({ is_primary: false }).eq('artwork_id', form.id)
      await supabase.from('artwork_images').update({ is_primary: true }).eq('id', imageId)
      setExistingImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === imageId })))
    } catch (e) { alert(e.message) }
    setImageBusy(false)
  }

  return (
    <div className="admin-form-card">
      <h4>{form.id ? 'Edit Artwork' : 'New Artwork'}</h4>
      <div className="admin-form-grid">
        <div className="admin-field">
          <label>Title</label>
          <input placeholder="e.g. Sunset over Cairo" value={form.title} onChange={set('title')} />
        </div>
        <div className="admin-field">
          <label>Collection</label>
          <select value={form.collection_id} onChange={set('collection_id')}>
            <option value="">No collection</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="admin-field">
          <label>Year</label>
          <input placeholder="e.g. 2025" value={form.year} onChange={set('year')} />
        </div>
        <div className="admin-field">
          <label>Medium</label>
          <input placeholder="e.g. Oil on canvas" value={form.medium} onChange={set('medium')} />
        </div>
        <div className="admin-field">
          <label>Width (cm)</label>
          <input placeholder="0" type="number" value={form.width_cm} onChange={setNum('width_cm')} />
          {form.width_cm && <span className="inch-hint">≈ {cmToIn(form.width_cm)} in</span>}
        </div>
        <div className="admin-field">
          <label>Height (cm)</label>
          <input placeholder="0" type="number" value={form.height_cm} onChange={setNum('height_cm')} />
          {form.height_cm && <span className="inch-hint">≈ {cmToIn(form.height_cm)} in</span>}
        </div>
        <div className="admin-field">
          <label>Depth (cm)</label>
          <input placeholder="Depth in cm" type="number" value={form.depth_cm} onChange={setNum('depth_cm')} />
        </div>
        <div className="admin-field">
          <label>Weight (kg)</label>
          <input placeholder="e.g., 2.5" type="number" value={form.weight_kg} onChange={setNum('weight_kg')} />
        </div>
        <div className="admin-field">
          <label>Price</label>
          <input placeholder="0" type="number" value={form.price} onChange={setNum('price')} />
        </div>
        <div className="admin-field">
          <label>Status</label>
          <select value={form.status} onChange={set('status')}>
            <option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="not_for_sale">Not for Sale</option>
          </select>
        </div>
        <div className="admin-checkboxes">
          <label><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
          <label><input type="checkbox" checked={form.is_on_sale} onChange={(e) => setForm({ ...form, is_on_sale: e.target.checked })} /> Mark Painting as On Sale</label>
          <label><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Published</label>
        </div>
        <div className="admin-field full">
          <label>Images — select multiple</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setForm({ ...form, files: e.target.files })} />
        </div>
      </div>
      <div className="admin-field" style={{ marginTop: 12 }}>
        <label>Description</label>
        <textarea placeholder="Describe the artwork..." value={form.description} onChange={set('description')} />
      </div>

      {existingImages.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Images ({existingImages.length})</p>
          <div className="admin-image-grid">
            {existingImages.map((img) => (
              <div key={img.id} className="admin-image-thumb">
                <img src={img.url} alt="" style={{ border: img.is_primary ? '2px solid var(--coffee)' : '2px solid transparent' }} />
                {img.is_primary && <span style={{ position: 'absolute', top: 2, left: 2, fontSize: 9, background: 'var(--coffee)', color: '#fff', padding: '1px 5px', borderRadius: 3 }}>PRIMARY</span>}
                <div style={{ position: 'absolute', bottom: 2, right: 2, display: 'flex', gap: 2 }}>
                  {!img.is_primary && <button onClick={() => handleSetPrimary(img.id)} disabled={imageBusy} style={{ fontSize: 10, padding: '2px 5px', border: 'none', borderRadius: 3, background: 'var(--space-cadet)', color: '#fff', cursor: 'pointer' }}>P</button>}
                  <button onClick={() => handleDeleteImage(img.id)} disabled={imageBusy} style={{ fontSize: 10, padding: '2px 5px', border: 'none', borderRadius: 3, background: 'var(--caput-mortuum)', color: '#fff', cursor: 'pointer' }}>X</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ─── Collections ─── */
function CollectionsManager({ setError, setSuccess }) {
  const [items, setItems] = useState([])
  const [edit, setEdit] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const dragSrc = useRef(null)

  const load = async () => {
    try {
      const supabase = await getAdminClient()
      const [collsResp, onSaleCountResp] = await Promise.all([
        supabase.from('collections').select('*, artworks(*)').order('sort_order', { ascending: true }),
        supabase.from('artworks').select('id', { count: 'exact', head: true }).eq('is_on_sale', true).is('deleted_at', null),
      ])
      if (collsResp.error) throw collsResp.error

      const allColls = collsResp.data || []
      const onSaleDb = allColls.find((c) => c.id === ON_SALE_COLLECTION_ID)
      const dbColls = allColls.filter((c) => c.id !== ON_SALE_COLLECTION_ID)

      // If the On Sale DB row is missing, re-create it
      if (!onSaleDb) {
        const { data: profile } = await supabase.from('artist_profile').select('id').maybeSingle()
        await supabase.from('collections').insert({
          id: ON_SALE_COLLECTION_ID,
          artist_id: profile?.id || '00000000-0000-0000-0000-000000000000',
          title: 'On Sale',
          description: 'Artworks currently on sale',
          sort_order: -1,
          is_published: true,
        })
        return load()
      }

      // Build the On Sale entry using DB data but with dynamic artwork count
      const onSaleEntry = {
        ...onSaleDb,
        artworks: [],
        _onSaleCount: onSaleCountResp.count || 0,
      }

      // Insert at correct position based on sort_order
      dbColls.sort((a, b) => a.sort_order - b.sort_order)
      const insertIdx = dbColls.findIndex((c) => c.sort_order > onSaleEntry.sort_order)
      if (insertIdx === -1) {
        setItems([...dbColls, onSaleEntry])
      } else {
        const sorted = [...dbColls]
        sorted.splice(insertIdx, 0, onSaleEntry)
        setItems(sorted)
      }
      setDirty(false)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  /* ── drag-and-drop ── */
  const handleDragStart = (e, index) => {
    dragSrc.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    const src = dragSrc.current
    dragSrc.current = null
    if (src === null || src === targetIndex) return
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(src, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDirty(true)
  }

  /* ── local arrow reorder ── */
  const arrowUp = (idx) => {
    if (idx <= 0) return
    setItems(prev => { const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n })
    setDirty(true)
  }
  const arrowDown = (idx) => {
    if (idx >= items.length - 1) return
    setItems(prev => { const n = [...prev]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n })
    setDirty(true)
  }

  /* ── batch save order ── */
  const saveOrder = async () => {
    setBusy(true)
    try {
      const supabase = await getAdminClient()
      await Promise.all(items.map((item, i) => supabase.from('collections').update({ sort_order: i }).eq('id', item.id)))
      setSuccess('Order saved!')
      setDirty(false)
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const handleSave = async (form) => {
    setBusy(true); setError(''); setSuccess('')
    try {
      const supabase = await getAdminClient()
      let coverUrl = form.cover_image

      if (form.coverFile) {
        const ext = form.coverFile.name.split('.').pop()
        const filePath = `collections/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('artworks').upload(filePath, form.coverFile, { contentType: form.coverFile.type })
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage.from('artworks').getPublicUrl(filePath)
        coverUrl = publicUrl
      }

      if (form.id) {
        const payload = {
          title: form.title, description: form.description, cover_image: coverUrl,
          sort_order: form.sort_order || 0, is_published: form.is_published !== undefined ? form.is_published : true,
        }
        const { error } = await supabase.from('collections').update(payload).eq('id', form.id)
        if (error) throw error
      } else {
        const { data: profile } = await supabase.from('artist_profile').select('id').maybeSingle()
        if (!profile) throw new Error('No artist profile found')
        const { error } = await supabase.from('collections').insert({ artist_id: profile.id, title: form.title, description: form.description, cover_image: coverUrl, sort_order: form.sort_order || 0, is_published: form.is_published !== undefined ? form.is_published : true })
        if (error) throw error
      }

      setSuccess('Saved'); setEdit(null); load()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this collection? (Artworks in it will not be deleted)')) return
    try {
      const supabase = await getAdminClient()
      const { error } = await supabase.from('collections').delete().eq('id', id)
      if (error) throw error
      setSuccess('Deleted'); load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={() => setEdit({})}>+ New Collection</button>
        {dirty && (
          <>
            <button className="btn btn-primary" onClick={saveOrder} disabled={busy} style={{ background: 'var(--coffee)', color: '#fff' }}>
              {busy ? 'Saving...' : 'Save Order'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--slate-gray)' }}>Unsaved changes</span>
          </>
        )}
      </div>
      {edit && <CollectionForm item={edit} onSave={handleSave} onCancel={() => setEdit(null)} busy={busy} />}
      {items.map((c, i) => {
        const isOnSale = c.id === ON_SALE_COLLECTION_ID
        return (
        <div key={c.id} className="admin-list-item" draggable={!busy}
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, i)}
          style={{ cursor: 'grab' }}
        >
          <div className="admin-list-item-info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, color: isOnSale ? '#dc2626' : 'var(--slate-gray)' }}>{'\u22EE'}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button disabled={busy} onClick={() => arrowUp(i)} style={arrowMini}>&#9650;</button>
              <button disabled={busy} onClick={() => arrowDown(i)} style={arrowMini}>&#9660;</button>
            </div>
            <div>
              <strong style={{ color: isOnSale ? '#dc2626' : 'inherit' }}>{c.title}</strong>
              <span style={{ fontSize: 12, color: 'var(--slate-gray)', marginLeft: 6 }}>({isOnSale ? (c._onSaleCount || 0) : (c.artworks || []).length} artworks)</span>
              {c.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.description.slice(0, 100)}</p>}
            </div>
          </div>
          <div className="admin-list-item-actions">
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: '2px 10px' }} onClick={() => setEdit(c)}>Edit</button>
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: '2px 10px', background: 'var(--caput-mortuum)', color: '#fff' }} onClick={() => handleDelete(c.id)}>Del</button>
          </div>
        </div>
        )
      })}
    </div>
  )
}

function CollectionForm({ item, onSave, onCancel, busy }) {
  const [form, setForm] = useState({ id: item.id || null, title: item.title || '', description: item.description || '', cover_image: item.cover_image || '', sort_order: item.sort_order || 0, is_published: item.is_published !== undefined ? item.is_published : true, coverFile: null })
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    setUploading(true)
    await onSave(form)
    setUploading(false)
  }

  return (
    <div className="admin-form-card">
      <h4>{form.id ? 'Edit Collection' : 'New Collection'}</h4>
      <div className="admin-form-grid">
        <div className="admin-field">
          <label>Collection Title</label>
          <input placeholder="e.g. Abstract Landscapes" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="admin-field">
          <label>Cover Image</label>
          {form.cover_image && <img src={form.cover_image} alt="Cover" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 6, display: 'block' }} />}
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, coverFile: e.target.files[0] })} />
        </div>
        <div className="admin-checkboxes">
          <label><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Published</label>
        </div>
        <div className="admin-field full">
          <label>Description</label>
          <textarea placeholder="Describe the collection..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ─── Profile ─── */
function ProfileManager({ setError, setSuccess }) {
  const [form, setForm] = useState({ name: '', artist_statement: '', biography: '', research_academic: '', contact_email: '', contact_phone: '', instagram_url: '', tiktok_url: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const supabase = await getAdminClient()
        const { data, error } = await supabase.from('artist_profile').select('*').maybeSingle()
        if (error) throw error
        if (data) setForm((prev) => ({ ...prev, ...data }))
      } catch (e) { /* profile may not exist yet */ }
    })()
  }, [])

  const handleSave = async () => {
    setBusy(true); setError(''); setSuccess('')
    try {
      const supabase = await getAdminClient()
      const { data: existing } = await supabase.from('artist_profile').select('id').maybeSingle()
      if (existing) {
        const { error } = await supabase.from('artist_profile').update(form).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('artist_profile').insert(form)
        if (error) throw error
      }
      setSuccess('Profile updated')
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  return (
    <div className="admin-form-card" style={{ maxWidth: 700 }}>
      <h4>Profile</h4>
      <div className="admin-form-grid">
        <div className="admin-field full">
          <label>Name</label>
          <input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="admin-field full">
          <label>Artist Statement</label>
          <textarea placeholder="Write your artist statement..." value={form.artist_statement} onChange={(e) => setForm({ ...form, artist_statement: e.target.value })} style={{ minHeight: 120 }} />
        </div>
        <div className="admin-field full">
          <label>Biography</label>
          <textarea placeholder="Write your biography..." value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} style={{ minHeight: 120 }} />
        </div>
        <div className="admin-field full">
          <label>Research & Academic</label>
          <textarea placeholder="Academic background, research interests..." value={form.research_academic} onChange={(e) => setForm({ ...form, research_academic: e.target.value })} style={{ minHeight: 100 }} />
        </div>
        <div className="admin-field">
          <label>Contact Email</label>
          <input placeholder="email@example.com" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </div>
        <div className="admin-field">
          <label>Contact Phone</label>
          <input placeholder="+20 100 000 0000" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        </div>
        <div className="admin-field">
          <label>Instagram URL</label>
          <input placeholder="https://instagram.com/..." value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
        </div>
        <div className="admin-field">
          <label>TikTok URL</label>
          <input placeholder="https://tiktok.com/..." value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleSave} disabled={busy} style={{ marginTop: 16 }}>{busy ? 'Saving...' : 'Save Profile'}</button>
    </div>
  )
}

/* ─── Exhibitions ─── */
function ExhibitionsManager({ setError, setSuccess }) {
  return <CategoryManager category="exhibition" label="Exhibition" setError={setError} setSuccess={setSuccess} />
}

/* ─── Events ─── */
function EventsManager({ setError, setSuccess }) {
  return <CategoryManager category="event" label="Event" setError={setError} setSuccess={setSuccess} />
}

/* ─── Reusable category manager (exhibitions / events) ─── */
function CategoryManager({ category, label, setError, setSuccess }) {
  const [items, setItems] = useState([])
  const [edit, setEdit] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const dragSrc = useRef(null)

  const load = async () => {
    try {
      const supabase = await getAdminClient()
      const { data, error } = await supabase.from('exhibitions').select('*').eq('category', category).order('sort_order', { ascending: true })
      if (error) throw error
      setItems(data || [])
      setDirty(false)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const handleDragStart = (e, index) => {
    dragSrc.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    const src = dragSrc.current
    dragSrc.current = null
    if (src === null || src === targetIndex) return
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(src, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDirty(true)
  }

  const arrowUp = (idx) => {
    if (idx <= 0) return
    setItems(prev => { const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n })
    setDirty(true)
  }
  const arrowDown = (idx) => {
    if (idx >= items.length - 1) return
    setItems(prev => { const n = [...prev]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n })
    setDirty(true)
  }

  const saveOrder = async () => {
    setBusy(true)
    try {
      const supabase = await getAdminClient()
      await Promise.all(items.map((item, i) => supabase.from('exhibitions').update({ sort_order: i }).eq('id', item.id)))
      setSuccess('Order saved!')
      setDirty(false)
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const handleSave = async (form) => {
    setBusy(true); setError(''); setSuccess('')
    try {
      const supabase = await getAdminClient()
      const data = { ...form, category }
      if (data.start_date) data.start_date = convertToDbDate(data.start_date)
      if (data.end_date) data.end_date = convertToDbDate(data.end_date)
      if (form.id) {
        const { error } = await supabase.from('exhibitions').update(data).eq('id', form.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('exhibitions').insert(data)
        if (error) throw error
      }
      setSuccess('Saved'); setEdit(null); load()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return
    try {
      const supabase = await getAdminClient()
      const { error } = await supabase.from('exhibitions').delete().eq('id', id)
      if (error) throw error
      setSuccess('Deleted'); load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={() => setEdit({ category })}>+ New {label}</button>
        {dirty && (
          <>
            <button className="btn btn-primary" onClick={saveOrder} disabled={busy} style={{ background: 'var(--coffee)', color: '#fff' }}>
              {busy ? 'Saving...' : 'Save Order'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--slate-gray)' }}>Unsaved changes</span>
          </>
        )}
      </div>
      {edit && <InlineForm fields={['title', 'venue', 'location', 'start_date', 'end_date', 'description']} item={edit} onSave={handleSave} onCancel={() => setEdit(null)} busy={busy} />}
      {items.map((ex, i) => (
        <div key={ex.id} className="admin-list-item" draggable={!busy}
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, i)}
          style={{ cursor: 'grab' }}
        >
          <div className="admin-list-item-info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ cursor: 'grab', fontSize: 16, color: 'var(--slate-gray)' }}>&#x22EE;</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button disabled={busy} onClick={() => arrowUp(i)} style={arrowMini}>&#9650;</button>
              <button disabled={busy} onClick={() => arrowDown(i)} style={arrowMini}>&#9660;</button>
            </div>
            <div>
              <strong>{ex.title}</strong>{ex.venue ? ` — ${ex.venue}` : ''}
              {ex.start_date ? <span style={{ fontSize: 12, color: 'var(--slate-gray)' }}> — {new Date(ex.start_date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span> : ''}
              {ex.end_date ? <span style={{ fontSize: 12, color: 'var(--slate-gray)' }}> – {new Date(ex.end_date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span> : ''}
            </div>
          </div>
          <div className="admin-list-item-actions">
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: '2px 10px' }} onClick={() => setEdit(ex)}>Edit</button>
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: '2px 10px', background: 'var(--caput-mortuum)', color: '#fff' }} onClick={() => handleDelete(ex.id)}>Del</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function convertToDbDate(my) {
  if (!my || !my.includes('/')) return my
  const [month, year] = my.split('/')
  return `${year}-${month.padStart(2, '0')}-01`
}

/* ─── Reusable inline form ─── */
function InlineForm({ fields, item, onSave, onCancel, busy }) {
  const [form, setForm] = useState(Object.fromEntries(fields.map((f) => [f, item[f] || ''])))

  return (
    <div className="admin-form-card">
      <h4>{item.id ? 'Edit' : 'New'}</h4>
      <div className="admin-form-grid">
        {fields.map((f) => (
          f === 'description' ? (
            <div key={f} className="admin-field full">
              <label>{f.replace(/_/g, ' ')}</label>
              <textarea placeholder={f} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
            </div>
          ) : f === 'start_date' || f === 'end_date' ? (
            <div key={f} className="admin-field">
              <label>{f.replace(/_/g, ' ')}</label>
              <input type="text" placeholder="MM/YYYY" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
            </div>
          ) : (
            <div key={f} className="admin-field">
              <label>{f.replace(/_/g, ' ')}</label>
              <input placeholder={f} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
            </div>
          )
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
