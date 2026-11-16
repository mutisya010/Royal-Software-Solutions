import { useState, useEffect } from 'react'

export default function Hero() {
  const [terminalLines, setTerminalLines] = useState([])
  const fullTextLines = [
    { text: 'fahari --status --verbose', prompt: true, delay: 300 },
    { text: '→ Initializing Fahari Ecosystem Core v1.0...', delay: 800 },
    { text: '→ Active Nodes: 6 Schools Live (Nakuru, Kenya)', delay: 1300 },
    { text: '→ Architecture: 17 Platforms · 4 Clusters', delay: 1800 },
    { text: '→ Market: East Africa → Pan-African', delay: 2300 },
    { text: '✓ Mission: Infrastructure of African Excellence', delay: 2800 },
  ]

  useEffect(() => {
    const timers = fullTextLines.map((line, idx) => {
      return setTimeout(() => {
        setTerminalLines((prev) => [...prev, line])
      }, line.delay)
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section id="hero" className="founder-hero-section">
      {/* Ambient Radial Lights */}
      <div className="founder-glow-teal" aria-hidden="true" />
      <div className="founder-glow-gold" aria-hidden="true" />
      <div className="founder-grid-overlay" aria-hidden="true" />

      <div className="founder-hero-container">
        {/* Left Column: Story & Narrative */}
        <div className="founder-hero-left">
          <div className="founder-eyebrow">
            <span className="founder-eyebrow-dot" />
            <span>SOFTWARE ENGINEER &middot; FOUNDER &middot; SYSTEMS THINKER</span>
          </div>

          <h1 className="founder-hero-headline">
            <span className="headline-line line-1">Building systems</span>
            <span className="headline-line line-2">Africa&apos;s institutions</span>
            <span className="headline-line line-3">deserve.</span>
          </h1>

          <p className="founder-hero-subheadline">
            Founder of Royal Software Solutions and architect of the Fahari Ecosystem &mdash; 
            enterprise software for African schools, businesses, and cooperatives.
          </p>

          <div className="founder-hero-actions">
            <a href="#projects" className="founder-btn-primary-gold">
              View My Work
            </a>
            <a href="#writing" className="founder-btn-outline-gold">
              Read The Making
            </a>
          </div>

          <div className="founder-social-proof">
            <div className="proof-indicator" />
            <span className="proof-text">
              <strong>6 schools live</strong> &middot; 2 active products &middot; 1 ecosystem &middot; Building for Africa
            </span>
          </div>
        </div>

        {/* Right Column: Visual Terminal & Ecosystem Orbit */}
        <div className="founder-hero-right">
          <div className="founder-visual-card">
            {/* Ambient Orbit Backdrop */}
            <div className="founder-orbital-ring ring-1" aria-hidden="true">
              <span className="orbit-node node-teal" />
            </div>
            <div className="founder-orbital-ring ring-2" aria-hidden="true">
              <span className="orbit-node node-gold" />
            </div>

            {/* Terminal Window */}
            <div className="founder-terminal">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="terminal-title">fahari-runtime &mdash; zsh &mdash; 80x24</div>
                <div className="terminal-badge">LIVE NODE</div>
              </div>

              <div className="terminal-body font-mono">
                <div className="terminal-meta">
                  <span className="meta-user">james@nakuru-core</span>
                  <span className="meta-sep">:</span>
                  <span className="meta-path">~/ecosystem</span>
                  <span className="meta-branch">(main)</span>
                </div>

                <div className="terminal-content">
                  <div className="terminal-line line-command">
                    <span className="terminal-prompt">$</span>
                    <span className="terminal-cmd">fahari --version</span>
                  </div>
                  <div className="terminal-output">Fahari Ecosystem v1.0</div>
                  <div className="terminal-output">Platforms: 17 &middot; Clusters: 4</div>
                  <div className="terminal-output">Status: Building &amp; Scaling</div>
                  <div className="terminal-output">Market: East Africa &rarr; Pan-African</div>
                  <div className="terminal-output gold-text">
                    Mission: Infrastructure of African Excellence
                  </div>

                  {terminalLines.map((item, idx) => (
                    <div
                      key={idx}
                      className={`terminal-line fade-in ${
                        item.prompt ? 'line-command' : 'terminal-output'
                      } ${item.text.includes('✓') ? 'teal-text' : ''}`}
                    >
                      {item.prompt && <span className="terminal-prompt">$</span>}
                      <span>{item.text}</span>
                    </div>
                  ))}

                  <div className="terminal-cursor-line">
                    <span className="terminal-prompt">$</span>
                    <span className="terminal-cursor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <a href="#about" className="founder-scroll-indicator" aria-label="Scroll down to About section">
        <span className="scroll-label">EXPLORE</span>
        <div className="scroll-line">
          <div className="scroll-dot" />
        </div>
      </a>
    </section>
  )
}
