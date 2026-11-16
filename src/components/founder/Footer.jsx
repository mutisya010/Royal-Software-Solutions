export default function Footer() {
  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Fahari', href: '#fahari' },
    { label: 'Writing', href: '#writing' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <footer className="founder-footer">
      <div className="founder-container">
        <div className="founder-footer-main">
          {/* Left Column: Monogram & Philosophy */}
          <div className="founder-footer-left">
            <h3 className="founder-footer-title">James Mbugua</h3>
            <p className="founder-footer-tagline">
              Building the infrastructure of African excellence.
            </p>
          </div>

          {/* Center Column: Quick Nav */}
          <div className="founder-footer-center">
            <nav className="founder-footer-nav" aria-label="Footer Quick Navigation">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="footer-nav-link">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Right Column: Company & City */}
          <div className="founder-footer-right">
            <p className="footer-company-name">Royal Software Solutions</p>
            <p className="footer-location">Nakuru, Kenya &middot; 2025</p>
            <a
              href="https://www.royalsoftwares.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-website-link"
            >
              royalsoftwares.co.ke
            </a>
          </div>
        </div>

        {/* Bottom Full-Width Bar */}
        <div className="founder-footer-bottom">
          <div className="bottom-left">
            <span>&copy; {new Date().getFullYear()} James Mbugua. All rights reserved.</span>
          </div>
          <div className="bottom-right">
            <span className="built-with-intention">Built with intention. For Africa.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
