import Link from 'next/link'
import { getArtistProfile, getExhibitions, getEvents, getArtworks, getFeaturedArtworks, getCollections, ON_SALE_COLLECTION_ID } from '@/lib/db'
import ContactCard from '@/components/ContactCard'
import CollectionShowcase from '@/components/CollectionShowcase'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [profile, exhibitions, events, artworks, featuredList, collections] = await Promise.all([
    getArtistProfile(), getExhibitions(), getEvents(), getArtworks(), getFeaturedArtworks(), getCollections(),
  ])

  const featured = featuredList.length > 0 ? featuredList[0] : artworks[0]
  const onSaleArtworks = artworks.filter((a) => a.is_on_sale && a.status !== 'sold')
  const onSaleDb = collections.find((c) => c.id === ON_SALE_COLLECTION_ID)
  const regularColls = collections.filter((c) => c.id !== ON_SALE_COLLECTION_ID)

  // Build the On Sale collection from DB metadata + dynamic artworks
  const onSaleEntry = onSaleArtworks.length > 0 ? {
    id: 'on-sale',
    slug: 'on-sale',
    title: onSaleDb?.title || 'On Sale',
    description: onSaleDb?.description || 'Artworks currently on sale',
    cover_image: onSaleDb?.cover_image || null,
    sort_order: onSaleDb?.sort_order ?? -1,
    artworks: onSaleArtworks,
  } : null

  const allCollections = [onSaleEntry, ...regularColls].filter(Boolean).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      {/* HERO */}
      <section id="home" className="hero">
        <div className="hero-content">
          <h1>{profile?.name || 'Hala Salah'}</h1>
          <p>Portfolio &amp; Painting Store</p>
          <div className="hero-buttons">
            <a href="#gallery" className="btn-square" title="Browse Gallery">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </a>
            <a href="#statement" className="btn-square" title="Artist Statement">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </a>
            <a href="#contacts" className="btn-square" title="Contact">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* BIOGRAPHY */}
      <section id="biography" className="section">
        <div className="container">
          <div className="section-header"><h2>Biography</h2></div>
          <div className="info-card free-text" style={{ maxWidth: 900, margin: '0 auto' }}>
            {profile?.biography ? (
              profile.biography.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} style={{ marginBottom: 20 }} dir="auto">{p}</p>
              ))
            ) : (
              <p style={{ fontSize: 16, lineHeight: 1.9, color: 'var(--text-muted)', textAlign: 'center' }}>
                Biography coming soon.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ARTIST STATEMENT */}
      <section id="statement" className="section-dark">
        <div className="container">
          <div className="section-header"><h2>Artist Statement</h2></div>
          <div className="info-card-dark free-text" style={{ maxWidth: 900, margin: '0 auto' }}>
            {profile?.artist_statement ? (
              profile.artist_statement.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} style={{ marginBottom: 20 }} dir="auto">{p}</p>
              ))
            ) : (
              <p style={{ fontSize: 16, lineHeight: 1.9, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                Artist statement coming soon.
              </p>
            )}
            {profile?.name && (
              <div style={{ textAlign: 'right', marginTop: 30, fontStyle: 'italic', color: 'var(--tan)' }}>
                — {profile.name}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* GALLERY — COLLECTIONS SHOWCASE */}
      <section id="gallery" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Collections</h2>
            <p style={{ fontSize: 14, color: 'var(--slate-gray)' }}>Click a collection to explore its artworks</p>
          </div>
          {(allCollections.length > 0) ? (
            <CollectionShowcase collections={allCollections} />
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--slate-gray)', padding: 60 }}>No collections yet — check back soon.</p>
          )}
        </div>
      </section>

      {/* FEATURED ARTWORK */}
      <section id="featured" className="section-dark">
        <div className="container">
          <div className="section-header"><h2>Featured Artwork</h2></div>
          {!featured ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 40 }}>No featured artwork selected yet.</p>
          ) : (
            <div className="grid grid-2" style={{ gap: 40, alignItems: 'center', maxWidth: 900, margin: '0 auto' }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', background: '#f5f0e8', padding: 12 }}>
                {featured.image ? <img src={featured.image} alt={featured.title} style={{ width: '100%', height: 400, objectFit: 'contain', display: 'block' }} />
                  : <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0e8', color: '#999' }}>No Image</div>}
              </div>
              <div>
                <h2 style={{ fontSize: 28, marginBottom: 8, color: '#fff' }}>{featured.title}</h2>
                <p style={{ fontSize: 14, color: 'var(--tan)', fontStyle: 'italic', marginBottom: 16 }}>{featured.medium} — {featured.size} — {featured.year}</p>
                {featured.collection_name && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Collection: {featured.collection_name}</p>}
                <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 20, color: 'rgba(255,255,255,0.85)' }}>{featured.description}</p>
                <div style={{ fontSize: 24, fontWeight: 900, color: featured.status === 'sold' ? 'var(--caput-mortuum)' : 'var(--tan)', marginBottom: 16 }}>
                  {featured.status === 'sold' ? 'SOLD' : `EGP ${(featured.price || 0).toLocaleString()}`}
                </div>
                {featured.status !== 'sold' && <Link href={`/painting/${featured.id}`} className="btn btn-primary">View Artwork</Link>}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RESEARCH & ACADEMIC */}
      <section id="research" className="section">
        <div className="container">
          <div className="section-header"><h2>Research & Academic Work</h2></div>
          {profile?.research_academic ? (
            <div className="info-card" style={{ maxWidth: 900, margin: '0 auto' }}>
              <ul className="research-list">
                {profile.research_academic.split('\n').filter(Boolean).map((p, i) => (
                  <li key={i} dir="auto">{p}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--slate-gray)', padding: 40 }}>Research & academic work coming soon.</p>
          )}
        </div>
      </section>

      {/* EXHIBITIONS */}
      <section id="exhibitions" className="section-dark">
        <div className="container">
          <div className="section-header"><h2>Exhibitions</h2></div>
          {exhibitions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 40 }}>No exhibitions yet.</p>
          ) : (
            <div className="grid grid-2" style={{ gap: 30, maxWidth: 1000, margin: '0 auto' }}>
              {exhibitions.map((ex) => {
                const d = (s) => s ? new Date(s + 'T00:00:00') : null
                const fmt = (dt) => dt ? dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''
                const start = d(ex.start_date)
                const end = d(ex.end_date)
                const dateRange = start && end && start.toDateString() === end.toDateString() ? fmt(start)
                  : start && end ? `${fmt(start)} — ${fmt(end)}`
                  : start ? fmt(start) : end ? `Until ${fmt(end)}` : ''
                return (
                  <div className="info-card-dark" key={ex.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{ex.title}</h3>
                    </div>
                    {dateRange && <p style={{ fontSize: 12, color: 'var(--coffee)', fontWeight: 600, marginBottom: 6 }}>{dateRange}</p>}
                    <p style={{ fontSize: 13, marginBottom: 8, color: 'rgba(255,255,255,0.6)' }}>{[ex.venue, ex.location].filter(Boolean).join(', ')}</p>
                    {ex.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{ex.description}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* NEWS & EVENTS */}
      <section id="news" className="section">
        <div className="container">
          <div className="section-header"><h2>News & Events</h2></div>
          {events.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--slate-gray)', padding: 40 }}>No events at this time.</p>
          ) : (
            <div className="grid grid-2" style={{ gap: 30, maxWidth: 1000, margin: '0 auto' }}>
              {events.map((ex) => {
                const d = (s) => s ? new Date(s + 'T00:00:00') : null
                const fmt = (dt) => dt ? dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''
                const start = d(ex.start_date)
                const end = d(ex.end_date)
                const dateRange = start && end && start.toDateString() === end.toDateString() ? fmt(start)
                  : start && end ? `${fmt(start)} — ${fmt(end)}`
                  : start ? fmt(start) : end ? `Until ${fmt(end)}` : ''
                return (
                  <div className="info-card" key={ex.id}>
                    <h3 style={{ fontSize: 16, marginBottom: 8 }}>{ex.title}</h3>
                    {dateRange && <p style={{ fontSize: 13, marginBottom: 6, color: 'var(--slate-gray)' }}>{dateRange}</p>}
                    <p style={{ fontSize: 13, marginBottom: 8, color: 'var(--slate-gray)' }}>{[ex.venue, ex.location].filter(Boolean).join(', ')}</p>
                    {ex.description && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ex.description}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="section-dark">
        <div className="container">
          <div className="section-header"><h2>Contacts</h2></div>
          <div className="contact-grid" style={{ maxWidth: 900, margin: '0 auto' }}>
            <ContactCard icon="&#9993;" label="Email" value={profile?.contact_email || 'Not set'} type="email" />
            <ContactCard icon="&#9743;" label="Phone" value={profile?.contact_phone || 'Not set'} type="phone" />
            <ContactCard icon="&#9670;" label="Instagram" value={profile?.instagram_url || 'Not set'} type="instagram" />
            <ContactCard icon="&#9835;" label="TikTok" value={profile?.tiktok_url || 'Not set'} type="tiktok" />
          </div>
        </div>
      </section>
    </>
  )
}
