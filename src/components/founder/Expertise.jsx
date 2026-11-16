export default function Expertise() {
  const cards = [
    {
      id: 'software-engineering',
      title: 'Software Engineering',
      description:
        'Full-stack development with a focus on enterprise systems, ERP architecture, and SaaS platforms built for scale. From database schema to deployed product.',
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      id: 'systems-architecture',
      title: 'Systems Architecture',
      description:
        'Designing interconnected systems where data flows intelligently between modules. Every Fahari product shares a unified architecture layer.',
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="16" y="2" width="6" height="6" rx="1" />
          <rect x="9" y="16" width="6" height="6" rx="1" />
          <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <line x1="12" y1="13" x2="12" y2="16" />
        </svg>
      ),
    },
    {
      id: 'product-strategy',
      title: 'Product Strategy',
      description:
        "From problem discovery to roadmap to go-to-market. Building products that solve real African institutional problems — not software for software's sake.",
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      id: 'business-analysis',
      title: 'Business Analysis',
      description:
        'Translating institutional operational challenges into precise technical specifications. Speaking both the language of the boardroom and the codebase.',
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: 'african-market-strategy',
      title: 'African Market Strategy',
      description:
        'Understanding how East African institutions make decisions, what they trust, and how to build products for contexts the global software industry ignores.',
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      ),
    },
    {
      id: 'founder-leadership',
      title: 'Founder Leadership',
      description:
        'Building and leading a technology company from zero — product, team, clients, and vision — in one of the most underserved technology markets on earth.',
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  return (
    <section id="expertise" className="founder-section founder-expertise-section">
      <div className="founder-container">
        <div className="founder-section-header">
          <span className="founder-section-tag">02 &mdash; EXPERTISE</span>
          <h2 className="founder-section-title">What I Do</h2>
          <p className="founder-section-subtitle">
            At the intersection of engineering, business, and African innovation.
          </p>
        </div>

        <div className="founder-expertise-grid">
          {cards.map((card, idx) => (
            <div key={card.id} className="founder-expertise-card">
              <div className="expertise-card-header">
                <div className="expertise-icon-box">{card.icon}</div>
                <span className="expertise-num">0{idx + 1}</span>
              </div>
              <h3 className="expertise-card-title">{card.title}</h3>
              <p className="expertise-card-desc">{card.description}</p>
              <div className="expertise-card-bottom-line" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
