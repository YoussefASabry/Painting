'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { label: 'Biography', href: '/#biography' },
  { label: 'Statement', href: '/#statement' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Featured', href: '/#featured' },
  { label: 'Research', href: '/#research' },
  { label: 'Exhibitions', href: '/#exhibitions' },
  { label: 'News', href: '/#news' },
  { label: 'Contacts', href: '/#contacts' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('gallery');
  const [artistName, setArtistName] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    getBrowserSupabase()?.from('artist_profile').select('name').maybeSingle().then(({ data }) => {
      if (data?.name) setArtistName(data.name);
    });
  }, []);

  useEffect(() => {
    if (pathname === '/admin') return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) setActiveSection(hash);
  }, []);

  const handleNavClick = (e, href) => {
    if (href.startsWith('/#')) {
      const id = href.slice(2);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(id);
      }
    }
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="logo">
          {artistName || 'Hala Salah Elhosary'}
        </Link>
        <ul className={`nav-links${menuOpen ? ' active' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={activeSection === item.href.slice(2) ? 'active' : ''}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          className={`menu-toggle${menuOpen ? ' active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}
