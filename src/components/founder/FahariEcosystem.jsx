export default function FahariEcosystem() {
  const clusters = [
    {
      id: 'cluster-education',
      title: 'Education',
      status: 'Academia LIVE',
      statusType: 'live',
      platforms: ['Fahari Academia', 'Fahari Campus'],
      icon: (
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
      description: 'Comprehensive academic administration, exams, fees, and institution operating platforms.',
    },
    {
      id: 'cluster-enterprise',
      title: 'Enterprise',
      status: 'Nexus LIVE',
      statusType: 'live',
      platforms: [
        'Nexus',
        'Financials',
        'Workforce',
        'Connect',
        'Flow',
        'Pulse',
        'Zenith',
        'Vault',
      ],
      icon: (
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      ),
      description: 'The core commercial engine: inventory, payroll, CRM, workflow automation, and financial audit.',
    },
    {
      id: 'cluster-industry',
      title: 'Industry',
      status: 'Roadmap 2027+',
      statusType: 'roadmap',
      platforms: [
        'Hospitality',
        'Industrial',
        'Transporter',
        'Construct',
        'Care',
        'Aid',
      ],
      icon: (
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        </svg>
      ),
      description: 'Specialized vertical operating systems for logistics, manufacturing, clinics, and hospitality.',
    },
    {
      id: 'cluster-financial',
      title: 'Financial Inclusion',
      status: 'Roadmap 2026',
      statusType: 'upcoming',
      platforms: ['Fahari Ledger'],
      icon: (
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" />
          <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
          <path d="M7 6h1v4" />
          <path d="M16.5 14.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
      description: 'SASRA-compliant core banking and micro-credit systems for community SACCOs and chamas.',
    },
  ]

  return (
    <section id="fahari" className="founder-section founder-ecosystem-section">
      <div className="founder-container">
        <div className="founder-section-header">
          <span className="founder-section-tag">04 &mdash; THE ARCHITECTURE</span>
          <h2 className="founder-section-title">The Fahari Ecosystem</h2>
          <p className="founder-section-subtitle">
            17 platforms. 4 clusters. One infrastructure layer for African institutions.
          </p>
        </div>

        <div className="ecosystem-intro-box">
          <p className="ecosystem-intro-text">
            The Fahari Ecosystem is the life&apos;s work behind all the individual projects. 
            A unified, modular enterprise software platform serving every type of African institution 
            &mdash; from a primary school in Nakuru to a manufacturing plant in Nairobi to a SACCO in Kampala.
          </p>
        </div>

        {/* 4 Clusters 2x2 Grid */}
        <div className="founder-clusters-grid">
          {clusters.map((cluster) => (
            <div key={cluster.id} className="founder-cluster-card">
              <div className="cluster-card-top">
                <div className="cluster-icon-box">{cluster.icon}</div>
                <span className={`cluster-status-pill pill-${cluster.statusType}`}>
                  {cluster.status}
                </span>
              </div>

              <h3 className="cluster-card-title">{cluster.title}</h3>
              <p className="cluster-card-desc">{cluster.description}</p>

              <div className="cluster-platforms-block">
                <span className="platforms-label">Platforms &amp; Modules:</span>
                <div className="platforms-tags-list">
                  {cluster.platforms.map((p) => (
                    <span key={p} className="cluster-platform-chip">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="cluster-border-accent" />
            </div>
          ))}
        </div>

        {/* Bold Statement Banner */}
        <div className="ecosystem-statement-banner">
          <div className="statement-lines">
            <span className="stat-line">Built in Nakuru, Kenya.</span>
            <span className="stat-line highlight-gold">For East Africa first.</span>
            <span className="stat-line">Then the continent.</span>
          </div>

          <div className="statement-cta">
            <a
              href="https://www.royalsoftwares.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="founder-btn-primary-gold"
            >
              Explore the Full Ecosystem &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
