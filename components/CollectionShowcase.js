import Link from 'next/link'

export default function CollectionShowcase({ collections }) {
  if (!collections || collections.length === 0) return null

  return (
    <div className="coll-grid-slot">
      {collections.map((coll) => (
        <CollectionSlot key={coll.id} collection={coll} />
      ))}
    </div>
  )
}

function CollectionSlot({ collection }) {
  const coverImg = collection.cover_image || (collection.artworks[0]?.image)
  const isOnSale = collection.id === 'on-sale'

  return (
    <Link
      href={`/collection/${collection.slug}`}
      className="coll-grid-item coll-collection-slot"
      style={isOnSale ? { background: '#fecaca' } : undefined}
    >
      <div className="coll-grid-item-inner" style={isOnSale ? {} : undefined}>
        <div className="coll-gi-cover">
          {coverImg ? (
            <img src={coverImg} alt={collection.title} />
          ) : (
            <div className="coll-gi-nocover">No Cover</div>
          )}
        </div>
        <div className="coll-gi-info">
          <div className="coll-gi-title" style={isOnSale ? { color: '#dc2626' } : undefined}>{collection.title}</div>
          {collection.description && (
            <div className="coll-gi-desc">{collection.description}</div>
          )}
          <span className="coll-gi-count" style={isOnSale ? { color: '#dc2626' } : undefined}>
            {collection.artworks.length}{' '}
            {collection.artworks.length === 1 ? 'work' : 'works'}
          </span>
        </div>
      </div>
    </Link>
  )
}
