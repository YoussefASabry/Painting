'use client'

import { useState } from 'react'

export default function ImageSlideshow({ images, title }) {
  const [index, setIndex] = useState(0)

  if (!images || images.length === 0) return null

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div>
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '4/3', background: '#E2E6EC' }}>
        <img src={images[index]} alt={`${title} ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        {images.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>&larr;</button>
            <button onClick={next} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>&rarr;</button>
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setIndex(i)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', background: i === index ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {images.map((url, i) => (
            <img key={i} src={url} alt={`${title} ${i + 1}`} onClick={() => setIndex(i)} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: i === index ? '2px solid var(--coffee)' : '2px solid transparent', flexShrink: 0 }} />
          ))}
        </div>
      )}
    </div>
  )
}
