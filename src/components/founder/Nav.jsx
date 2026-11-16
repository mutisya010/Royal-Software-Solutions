import { useState, useEffect } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Expertise', href: '#expertise' },
    { label: 'Projects', href: '#projects' },
    { label: 'Fahari', href: '#fahari' },
    { label: 'Writing', href: '#writing' },
    { label: 'Contact', href: '#contact' },
  ]

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className={`founder-nav ${scrolled ? 'founder-nav-scrolled' : ''}`}>
        <div className="founder-nav-container">
          {/* Brand Monogram */}
          <a href="#hero" className="founder-brand" aria-label="James Mbugua Portfolio">
            <span className="founder-monogram">JM</span>
            <div className="founder-brand-text">
              <span className="founder-brand-name">James Mbugua</span>
              <span className="founder-brand-tag">Founder &amp; Systems Thinker</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="founder-nav-links" aria-label="Founder Portfolio Navigation">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="founder-nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action */}
          <div className="founder-nav-action">
            <a href="#contact" className="founder-btn-ghost-gold">
              Let's Build
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className={`founder-menu-toggle ${mobileMenuOpen ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="toggle-bar"></span>
            <span className="toggle-bar"></span>
          </button>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Overlay */}
      <div
        className={`founder-mobile-overlay ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="founder-mobile-overlay-inner">
          <div className="founder-mobile-header">
            <span className="founder-monogram">JM</span>
            <button
              type="button"
              className="founder-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              &times;
            </button>
          </div>

          <nav className="founder-mobile-nav">
            {navLinks.map((link, idx) => (
              <a
                key={link.href}
                href={link.href}
                className="founder-mobile-link"
                style={{ animationDelay: `${idx * 60 + 100}ms` }}
                onClick={handleLinkClick}
              >
                <span className="mobile-link-index">0{idx + 1}</span>
                <span className="mobile-link-text">{link.label}</span>
              </a>
            ))}
          </nav>

          <div className="founder-mobile-footer">
            <a
              href="#contact"
              className="founder-btn-primary-gold"
              onClick={handleLinkClick}
            >
              Let's Build Something &rarr;
            </a>
            <p className="founder-mobile-footnote">
              Nakuru, Kenya &middot; Royal Software Solutions
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
