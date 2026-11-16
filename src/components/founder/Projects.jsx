export default function Projects() {
  const projects = [
    {
      id: 'fahari-academia',
      title: 'Fahari Academia',
      status: 'LIVE',
      statusType: 'live', // green
      tags: ['ERP', 'Education', 'React', 'Node.js', 'M-Pesa'],
      headline: 'The complete school management system for East African private schools.',
      description:
        'A full ERP covering fee management with M-Pesa integration, student information, CBC/KCSE/IGCSE exam and report card automation, HR and payroll (NHIF/NSSF/PAYE), procurement, and a live leadership dashboard. Currently serving 6 schools in Kenya.',
      links: [
        { label: 'Explore Product', url: '/fahari-academia', isInternal: true },
        { label: 'royalsoftwares.co.ke', url: 'https://www.royalsoftwares.co.ke', isInternal: false },
      ],
      metric: '6 Kenyan Schools Active',
      visualType: 'academia',
    },
    {
      id: 'fahari-nexus',
      title: 'Fahari Nexus',
      status: 'LIVE',
      statusType: 'live',
      tags: ['ERP', 'Business', 'Inventory', 'Finance'],
      headline: 'Business operations platform for East African SMEs and enterprises.',
      description:
        'Connected sales pipeline, inventory management, procurement workflows, multi-level approvals, and real-time financial dashboards. Built for businesses that are done making decisions without data.',
      links: [
        { label: 'Explore Product', url: '/fahari-nexus', isInternal: true },
        { label: 'royalsoftwares.co.ke', url: 'https://www.royalsoftwares.co.ke', isInternal: false },
      ],
      metric: 'Enterprise Operational Core',
      visualType: 'nexus',
    },
    {
      id: 'fahari-intelligence',
      title: 'Fahari Intelligence',
      status: 'IN DEVELOPMENT',
      statusType: 'development', // gold
      tags: ['AI', 'Agentic', 'Education', 'Claude API'],
      headline: 'Agentic AI generating institutional documents from live school data.',
      description:
        'An AI layer embedded inside Fahari Academia that reads student marks, attendance, and fee records to generate report card narratives, parent letters, and board reports automatically. 400 report cards generated overnight. Human review built in.',
      links: [
        { label: 'Architecture Preview', url: '#contact', isInternal: true },
      ],
      metric: '400+ Reports Generated Overnight',
      visualType: 'intelligence',
    },
    {
      id: 'fahari-ledger',
      title: 'Fahari Ledger',
      status: 'ROADMAP',
      statusType: 'roadmap', // teal
      tags: ['SACCO', 'Microfinance', 'Compliance'],
      headline: 'SACCO and microfinance management for East African cooperatives.',
      description:
        'Member management, loan lifecycle, savings tracking, and SASRA compliance reporting — built for the cooperative financial sector that global vendors have systematically ignored.',
      links: [
        { label: 'Explore Roadmap', url: '/fahari-ledger', isInternal: true },
      ],
      metric: 'SASRA Compliant Architecture',
      visualType: 'ledger',
    },
    {
      id: 'royal-software-website',
      title: 'Royal Software Solutions Digital Platform',
      status: 'LIVE',
      statusType: 'live',
      tags: ['React', 'Vite', 'SEO', 'Frontend'],
      headline: 'The digital home of the Fahari Ecosystem.',
      description:
        'Built with React 19 and Vite. Mobile-first, SEO-optimised, M-Pesa inquiry integration, and WhatsApp-native contact flow. The public face of an ecosystem built to serve African institutions.',
      links: [
        { label: 'Visit Website', url: 'https://www.royalsoftwares.co.ke', isInternal: false },
      ],
      metric: '100% Responsive & SEO Indexed',
      visualType: 'website',
    },
    {
      id: 'transport-module',
      title: 'Fahari Transport Module',
      status: 'IN DEVELOPMENT',
      statusType: 'development',
      tags: ['ERP', 'Module', 'React', 'Node.js'],
      headline: 'Route-based transport fee management for East African schools.',
      description:
        'A complete transport management module for Fahari Academia — route setup, stop management, per-zone fee charging, student assignment, and full integration with the existing fee ledger.',
      links: [
        { label: 'Inquire on Module', url: '#contact', isInternal: true },
      ],
      metric: 'Zone & Route Optimization',
      visualType: 'transport',
    },
  ]

  const renderVisualMockup = (project) => {
    switch (project.visualType) {
      case 'academia':
        return (
          <div className="project-mockup-frame">
            <div className="mockup-header-bar">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span className="mockup-title-text">academia.fahari.internal &mdash; Fee &amp; Exam Engine</span>
            </div>
            <div className="mockup-body-content">
              <div className="mockup-stats-row">
                <div className="mockup-stat-tile">
                  <span className="tile-label">M-Pesa Reconciliation</span>
                  <span className="tile-val gold">99.8%</span>
                  <span className="tile-sub">Real-time STK Push</span>
                </div>
                <div className="mockup-stat-tile">
                  <span className="tile-label">Report Generation</span>
                  <span className="tile-val teal">CBC Automated</span>
                  <span className="tile-sub">KCSE / IGCSE Matrix</span>
                </div>
              </div>
              <div className="mockup-graph-lines">
                <div className="graph-bar-row">
                  <span>Term 1 Fees</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '92%' }} /></div>
                  <span className="bar-num">92%</span>
                </div>
                <div className="graph-bar-row">
                  <span>CBC Narratives</span>
                  <div className="bar-track"><div className="bar-fill teal-bg" style={{ width: '100%' }} /></div>
                  <span className="bar-num">100%</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'nexus':
        return (
          <div className="project-mockup-frame">
            <div className="mockup-header-bar">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span className="mockup-title-text">nexus.fahari.internal &mdash; SME Multi-Branch Ledger</span>
            </div>
            <div className="mockup-body-content">
              <div className="mockup-stats-row">
                <div className="mockup-stat-tile">
                  <span className="tile-label">Inventory Turnover</span>
                  <span className="tile-val teal">Synchronized</span>
                  <span className="tile-sub">Low stock alerts</span>
                </div>
                <div className="mockup-stat-tile">
                  <span className="tile-label">Multi-Level Approvals</span>
                  <span className="tile-val gold">4 Stages</span>
                  <span className="tile-sub">Audit trail enforced</span>
                </div>
              </div>
              <div className="mockup-ledger-preview font-mono">
                <div className="ledger-row">[PO-8821] Approved &middot; Nairobi Branch &middot; KES 480,000</div>
                <div className="ledger-row">[STK-104] Dispatched &middot; Nakuru Depot &middot; 1,200 Units</div>
              </div>
            </div>
          </div>
        )
      case 'intelligence':
        return (
          <div className="project-mockup-frame">
            <div className="mockup-header-bar">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span className="mockup-title-text">fahari-ai-agent &mdash; Batch Synthesis Engine</span>
            </div>
            <div className="mockup-body-content">
              <div className="ai-agent-pulse">
                <div className="agent-status-tag">
                  <span className="agent-radar" />
                  <span>Agent Processing 400 Student Marksheets</span>
                </div>
              </div>
              <div className="ai-output-sample font-mono">
                <p className="ai-token">&gt; &quot;Demonstrates exceptional analytical aptitude in STEM with notable improvement in literacy during Term 2...&quot;</p>
                <div className="ai-meta-check">
                  <span className="teal-text">✓ Human review threshold: verified</span>
                  <span className="gold-text">Latency: 1.2s/doc</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'ledger':
        return (
          <div className="project-mockup-frame">
            <div className="mockup-header-bar">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span className="mockup-title-text">ledger.fahari.internal &mdash; Cooperative Core</span>
            </div>
            <div className="mockup-body-content">
              <div className="mockup-stats-row">
                <div className="mockup-stat-tile">
                  <span className="tile-label">SASRA Form 2A</span>
                  <span className="tile-val teal">Automated</span>
                  <span className="tile-sub">Quarterly Compliance</span>
                </div>
                <div className="mockup-stat-tile">
                  <span className="tile-label">Dividends Calculation</span>
                  <span className="tile-val gold">Pro-Rata</span>
                  <span className="tile-sub">Member Shares Ledger</span>
                </div>
              </div>
              <div className="mockup-grid-visual">
                <div className="grid-node-row">
                  <span className="node-chip">Savings</span>
                  <span className="node-arrow">&rarr;</span>
                  <span className="node-chip">Loan Engine</span>
                  <span className="node-arrow">&rarr;</span>
                  <span className="node-chip active">Disbursement</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'website':
        return (
          <div className="project-mockup-frame">
            <div className="mockup-header-bar">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span className="mockup-title-text">www.royalsoftwares.co.ke &mdash; Production Build</span>
            </div>
            <div className="mockup-body-content">
              <div className="website-preview-box">
                <div className="web-hero-slice">
                  <span className="web-badge">Royal Software Solutions</span>
                  <h4 className="web-h4">Fahari: The Operating System for African Institutions</h4>
                </div>
                <div className="web-metrics-bar">
                  <span>99+ Performance</span>
                  <span>100% Mobile Ready</span>
                  <span>WhatsApp Inquiries</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'transport':
      default:
        return (
          <div className="project-mockup-frame">
            <div className="mockup-header-bar">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span className="mockup-title-text">transport.fahari.internal &mdash; Route Engine</span>
            </div>
            <div className="mockup-body-content">
              <div className="transport-route-visual">
                <div className="route-stop">
                  <span className="stop-marker" />
                  <span className="stop-name">Route 04: Nakuru West &rarr; Milimani</span>
                </div>
                <div className="route-tags-row">
                  <span className="route-tag">Zone 2 Fee: KES 8,500</span>
                  <span className="route-tag">Capacity: 45 / 45</span>
                  <span className="route-tag teal-bg">Auto-invoiced</span>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <section id="projects" className="founder-section founder-projects-section">
      <div className="founder-container">
        <div className="founder-section-header">
          <span className="founder-section-tag">03 &mdash; SELECTED WORK</span>
          <h2 className="founder-section-title">Work</h2>
          <p className="founder-section-subtitle">Selected projects and products built.</p>
        </div>

        <div className="founder-projects-stack">
          {projects.map((project, idx) => {
            const isEven = idx % 2 === 1
            return (
              <article
                key={project.id}
                className={`founder-project-card ${isEven ? 'layout-reverse' : ''}`}
              >
                {/* Info Column */}
                <div className="project-info-column">
                  <div className="project-top-row">
                    <span className={`project-status-badge status-${project.statusType}`}>
                      <span className="badge-dot" />
                      {project.status}
                    </span>
                    <span className="project-metric-pill">{project.metric}</span>
                  </div>

                  <h3 className="project-card-title">{project.title}</h3>
                  <p className="project-headline">{project.headline}</p>
                  <p className="project-description">{project.description}</p>

                  <div className="project-tags-cloud">
                    {project.tags.map((tag) => (
                      <span key={tag} className="project-tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="project-links-row">
                    {project.links.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        target={link.isInternal ? '_self' : '_blank'}
                        rel={link.isInternal ? '' : 'noopener noreferrer'}
                        className={`project-action-btn ${lIdx === 0 ? 'primary-link' : 'secondary-link'}`}
                      >
                        {link.label}
                        <span className="btn-arrow">&rarr;</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Visual Representation Column */}
                <div className="project-visual-column">
                  <div className="visual-wrapper">
                    {renderVisualMockup(project)}
                    <div className="visual-glow-halo" aria-hidden="true" />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
