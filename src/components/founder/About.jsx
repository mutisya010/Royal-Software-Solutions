export default function About() {
  const stats = [
    {
      number: '6+',
      label: 'Schools Live',
      detail: 'on Fahari Academia',
    },
    {
      number: '17',
      label: 'Platforms',
      detail: 'in the Fahari Ecosystem',
    },
    {
      number: '1',
      label: 'Mission',
      detail: 'African Excellence',
    },
  ]

  const skills = [
    'React',
    'Node.js',
    'Python',
    'PostgreSQL',
    'MySQL',
    'REST APIs',
    'System Architecture',
    'ERP Design',
    'SaaS',
    'Cloud Infrastructure',
    'M-Pesa Integration',
    'AI/ML Integration',
    'Business Analysis',
    'Product Strategy',
    'African Market Strategy',
  ]

  return (
    <section id="about" className="founder-section founder-about-section">
      <div className="founder-container">
        <div className="founder-section-header-compact">
          <span className="founder-section-tag">01 &mdash; IDENTITY &amp; PHILOSOPHY</span>
        </div>

        {/* Main 2-column About Row */}
        <div className="founder-about-grid">
          {/* Left Column: Pull Quote */}
          <div className="founder-about-left">
            <div className="founder-quote-mark">&ldquo;</div>
            <blockquote className="founder-pull-quote">
              I build systems that give African institutions the operational clarity they deserve.
            </blockquote>
            <div className="founder-quote-author">
              <span className="author-name">James Mbugua</span>
              <span className="author-role">Founder, Royal Software Solutions</span>
            </div>
          </div>

          {/* Right Column: Bio Narrative */}
          <div className="founder-about-right">
            <p className="founder-bio-lead">
              James Mbugua is a Kenyan software engineer and founder based in Nakuru, Kenya. 
              He is the founder of Royal Software Solutions and the architect of the Fahari Ecosystem 
              &mdash; a suite of enterprise software platforms serving schools, businesses, SACCOs, 
              healthcare providers, and institutions across East Africa.
            </p>
            <p className="founder-bio-body">
              His work sits at the intersection of systems thinking, African institutional infrastructure, 
              and technology &mdash; building software that reduces operational chaos and creates clarity 
              for the organisations that serve everyday people.
            </p>
            <p className="founder-bio-sub">
              He writes about the founder journey, African innovation, and systems thinking in a personal 
              series called <em>The Making</em>.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="founder-stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="founder-stat-card">
              <div className="stat-number-wrap">
                <span className="stat-number">{stat.number}</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-detail">{stat.detail}</span>
              </div>
              <div className="stat-card-glow" aria-hidden="true" />
            </div>
          ))}
        </div>

        {/* Skills Tag Cloud */}
        <div className="founder-skills-container">
          <div className="founder-skills-header">
            <span className="founder-subheading-tag">TECHNICAL &amp; STRATEGIC CAPABILITIES</span>
          </div>
          <div className="founder-skills-cloud">
            {skills.map((skill, idx) => (
              <span key={idx} className="founder-skill-pill">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
