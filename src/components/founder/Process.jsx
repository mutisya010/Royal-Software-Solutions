export default function Process() {
  const steps = [
    {
      number: '01',
      title: 'Understand the Institution',
      description:
        'Before any code, I spend time inside the institution. Understanding how the bursar reconciles fees. How the principal makes decisions. What operational chaos actually looks like from the inside.',
      tag: 'Field Immersion',
    },
    {
      number: '02',
      title: 'Map the System',
      description:
        'Every institution is a system. I map the inputs, the outputs, the bottlenecks, and the data flows before designing a single screen. The architecture comes from the operational reality — not from existing software templates.',
      tag: 'Systems Architecture',
    },
    {
      number: '03',
      title: 'Build the Infrastructure',
      description:
        'I build foundations, not features. Every module in Fahari shares a unified authentication, billing, and data layer. What looks like a school fee system from the outside is actually an institutional operating system from the inside.',
      tag: 'Foundational Engineering',
    },
    {
      number: '04',
      title: 'Iterate from Inside the Market',
      description:
        'I am in Nakuru. My clients are in Nakuru. When something is not working, I hear about it the same day. That proximity is not a limitation — it is the competitive advantage.',
      tag: 'Proximity Advantage',
    },
  ]

  return (
    <section id="process" className="founder-section founder-process-section">
      <div className="founder-container">
        <div className="founder-section-header">
          <span className="founder-section-tag">06 &mdash; METHODOLOGY</span>
          <h2 className="founder-section-title">How I Build</h2>
          <p className="founder-section-subtitle">The thinking behind the systems.</p>
        </div>

        {/* Timeline Container */}
        <div className="founder-timeline-wrapper">
          <div className="timeline-connecting-track" aria-hidden="true" />

          <div className="founder-timeline-steps">
            {steps.map((step) => (
              <div key={step.number} className="founder-timeline-step">
                <div className="step-node-wrapper">
                  <div className="step-circle font-mono">
                    <span>{step.number}</span>
                  </div>
                  <div className="step-pulse-ring" aria-hidden="true" />
                </div>

                <div className="step-content-card">
                  <span className="step-tag">{step.tag}</span>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
