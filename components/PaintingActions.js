'use client'

import { useState } from 'react'
import Link from 'next/link'
import { calculateShipping, GOVERNORATE_RATES } from '@/lib/shipping'

const GOVERNORATES = Object.entries(GOVERNORATE_RATES).map(([key, v]) => ({ key, name: v.name }))

export default function PaintingActions({ artwork }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', governorate: '' })
  const [shipping, setShipping] = useState(null)
  const [step, setStep] = useState('form')

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const shareData = {
      title: `${artwork.title} by Hala Salah`,
      text: `Check out this painting by Hala Salah`,
      url,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  const set = (field) => (e) => {
    const val = e.target.value
    setForm((prev) => {
      const next = { ...prev, [field]: val }
      if (field === 'governorate' && val) {
        setShipping(calculateShipping(artwork, val))
      } else if (field === 'governorate') {
        setShipping(null)
      }
      return next
    })
  }

  const totalWithShipping = (artwork.price || 0) + (shipping?.totalShipping || 0)

  const handleBuy = () => {
    const paintingUrl = typeof window !== 'undefined' ? window.location.href : ''
    const lines = [
      `Hi Hala, I'd like to buy this painting:`,
      ``,
      `*${artwork.title}*`,
      artwork.medium ? `${artwork.medium}` : '',
      artwork.year ? `Year: ${artwork.year}` : '',
      artwork.size ? `Size: ${artwork.size}` : '',
      ``,
      `Price: EGP ${(artwork.price || 0).toLocaleString()}`,
      shipping ? `Shipping to ${GOVERNORATE_RATES[form.governorate]?.name}: EGP ${shipping.totalShipping.toLocaleString()}` : '',
      shipping ? `Total: EGP ${totalWithShipping.toLocaleString()}` : '',
      ``,
      `---`,
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Governorate: ${GOVERNORATE_RATES[form.governorate]?.name || form.governorate}`,
      ``,
      `Check out this painting by Hala Salah`,
      paintingUrl,
    ].filter(Boolean).join('\n')

    const whatsappUrl = `https://wa.me/201065390365?text=${encodeURIComponent(lines)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const handleOpenModal = (e) => {
    e.preventDefault()
    setModalOpen(true)
    setStep('form')
  }

  const handleClose = () => {
    setModalOpen(false)
    setStep('form')
    setForm({ name: '', email: '', phone: '', governorate: '' })
    setShipping(null)
  }

  const renderButton = () => {
    if (artwork.status === 'sold') {
      return <button disabled className="btn btn-secondary" style={{ background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed', border: 'none' }}>Sold</button>
    }
    if (artwork.status === 'not_for_sale') {
      return <button disabled className="btn btn-secondary" style={{ background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed', border: 'none' }}>Not for Sale</button>
    }
    if (artwork.status === 'reserved') {
      return <button disabled className="btn btn-secondary" style={{ background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed', border: 'none' }}>Reserved</button>
    }
    return (
      <button className="btn btn-primary" onClick={handleOpenModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        Buy
      </button>
    )
  }

  return (
    <div>
      <div className="detail-actions" style={{ gap: 10 }}>
        {renderButton()}
        <button onClick={handleShare} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </button>
        <Link href="/#gallery" className="btn btn-secondary">Back to Gallery</Link>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={handleClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--slate-gray)', lineHeight: 1 }}>&times;</button>

            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 4, color: 'var(--space-cadet)' }}>Purchase Details</h3>
            <p style={{ fontSize: 13, color: 'var(--slate-gray)', marginBottom: 20 }}>Fill in your details to get a total with shipping</p>

            <div style={{ background: '#f5f0e8', borderRadius: 8, padding: 14, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              {artwork.image && <img src={artwork.image} alt={artwork.title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--space-cadet)' }}>{artwork.title}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-gray)' }}>{artwork.medium}{artwork.year ? ` — ${artwork.year}` : ''}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--coffee)', marginTop: 2 }}>EGP {(artwork.price || 0).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Full Name *</label>
                <input type="text" value={form.name} onChange={set('name')} required placeholder="Your full name" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Email *</label>
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Phone *</label>
                <input type="tel" value={form.phone} onChange={set('phone')} required placeholder="010 000 0000" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--space-cadet)', marginBottom: 4 }}>Governorate *</label>
                <select value={form.governorate} onChange={set('governorate')} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">Select governorate</option>
                  {GOVERNORATES.map((g) => <option key={g.key} value={g.key}>{g.name}</option>)}
                </select>
              </div>
            </div>

            {shipping && (
              <div style={{ marginTop: 20, background: '#f0fdf4', borderRadius: 8, padding: 16, border: '1px solid #bbf7d0' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--space-cadet)', marginBottom: 10 }}>Order Summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--slate-gray)' }}>Painting</span>
                  <span>EGP {(artwork.price || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--slate-gray)' }}>Shipping ({GOVERNORATE_RATES[form.governorate]?.name})</span>
                  <span>EGP {shipping.totalShipping.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: 'var(--slate-gray)' }}>
                  <span style={{ paddingLeft: 8, fontSize: 12 }}>(incl. fuel surcharge + 14% VAT)</span>
                </div>
                <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--coffee)' }}>EGP {totalWithShipping.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={!form.name || !form.email || !form.phone || !form.governorate}
              className="btn btn-primary"
              style={{
                marginTop: 20, width: '100%', justifyContent: 'center',
                opacity: (!form.name || !form.email || !form.phone || !form.governorate) ? 0.5 : 1,
                cursor: (!form.name || !form.email || !form.phone || !form.governorate) ? 'not-allowed' : 'pointer',
              }}
            >
              Buy via WhatsApp
            </button>
            <p style={{ fontSize: 11, color: 'var(--slate-gray)', textAlign: 'center', marginTop: 10 }}>
              You&apos;ll be redirected to WhatsApp to complete your purchase
            </p>
          </div>
        </div>
      )}

      <p style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-cream)', borderRadius: 6, fontSize: 13, fontWeight: 500, color: 'var(--slate-gray)', border: '1px solid var(--border)' }}>
        <strong style={{ color: 'var(--coffee)' }}>Ordering from abroad?</strong> <a href="/#contacts" style={{ color: 'var(--coffee)', fontWeight: 600, textDecoration: 'underline' }}>Contact us</a> for shipping arrangements.
      </p>
    </div>
  )
}
