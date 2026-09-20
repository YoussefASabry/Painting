import Link from 'next/link'
import { getCollectionBySlug } from '@/lib/db'
import { notFound } from 'next/navigation'
import ArtworkCard from '@/components/ArtworkCard'

export const dynamic = 'force-dynamic'

export default async function CollectionPage({ params }) {
  const { slug } = await params
  const collection = await getCollectionBySlug(slug)
  if (!collection) notFound()

  return (
    <main className="main-content">
      <div className="coll-detail-hero">
        {collection.cover_image ? (
          <div className="coll-detail-hero-image">
            <img src={collection.cover_image} alt="" />
          </div>
        ) : (
          <div className="coll-detail-hero-image coll-detail-hero-image-fallback">
            <span>{collection.title}</span>
          </div>
        )}
        <div className="coll-detail-hero-overlay" />
        <div className="coll-detail-hero-body">
          <h1 className="coll-detail-hero-title">{collection.title}</h1>
          {collection.description && (
            <p className="coll-detail-hero-desc">{collection.description}</p>
          )}
          <span className="coll-detail-hero-count">
            {collection.artworks.length} {collection.artworks.length === 1 ? 'work' : 'works'}
          </span>
        </div>
      </div>

      <section className="section" style={{ padding: '0 0 48px' }}>
        <div className="container">
          <div style={{ marginBottom: 16 }}>
            <Link href="/#gallery" style={{ fontSize: 13, color: 'var(--coffee)', textDecoration: 'none' }}>&larr; Back to Gallery</Link>
          </div>

          {collection.artworks.length > 0 ? (
            <div>
              {/* Mobile: 2 columns */}
              <div className="flex flex-wrap gap-6 w-full items-start justify-start md:hidden">
                <div className="flex flex-col gap-6 flex-1 w-full">
                  {collection.artworks.filter((_, idx) => idx % 2 === 0).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
                <div className="flex flex-col gap-6 flex-1 w-full">
                  {collection.artworks.filter((_, idx) => idx % 2 === 1).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
              </div>
              {/* Desktop: 4 columns */}
              <div className="hidden md:flex flex-wrap md:flex-nowrap gap-6 w-full items-start justify-start">
                <div className="flex flex-col gap-6 flex-1 w-full">
                  {collection.artworks.filter((_, idx) => idx % 4 === 0).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
                <div className="flex flex-col gap-6 flex-1 w-full">
                  {collection.artworks.filter((_, idx) => idx % 4 === 1).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
                <div className="flex flex-col gap-6 flex-1 w-full">
                  {collection.artworks.filter((_, idx) => idx % 4 === 2).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
                <div className="flex flex-col gap-6 flex-1 w-full">
                  {collection.artworks.filter((_, idx) => idx % 4 === 3).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--slate-gray)', fontSize: 14, marginTop: 40, opacity: 0.6 }}>
              No artworks in this collection yet.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
