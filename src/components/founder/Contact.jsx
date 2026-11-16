import { useState } from 'react'

export default function Contact() {
  /* [JAMES TO ADD: Your personal email and social URLs here] */
  const contactInfo = {
    email: 'info@royalsoftwares.co.ke', // [JAMES TO ADD: personal founder email]
    phone: '+254 759 437 978',
    whatsapp: 'https://wa.me/254759437978?text=Hi%20James%2C%20I%20am%20reaching%20out%20from%20your%20portfolio.',
    website: 'https://www.royalsoftwares.co.ke',
    location: 'Nakuru, Kenya',
    linkedin: 'https://www.linkedin.com/in/james-mbugua', // [JAMES TO ADD: LinkedIn profile]
    github: 'https://github.com/james-royalty', // [JAMES TO ADD: GitHub profile]
    twitter: 'https://twitter.com/james_royalty', // [JAMES TO ADD: Twitter / X handle]
  }

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    projectType: 'School',
    message: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

    try {
      // Simulate or send via Formspree / EmailJS
      // James can plug in his Formspree ID or EmailJS keys easily
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubmitted(true)
    } catch {
      setErrorMsg('Failed to send message. Please reach out via WhatsApp directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="contact" className="founder-section founder-contact-section">
      <div className="founder-container">
        <div className="founder-section-header">
          <span className="founder-section-tag">07 &mdash; CONNECT</span>
          <h2 className="founder-section-title">Let&apos;s Build Something</h2>
          <p className="founder-section-subtitle">
            For collaborations, consulting, product partnerships, and conversations about African technology infrastructure.
          </p>
        </div>

        <div className="founder-contact-grid">
          {/* Left Column: Direct Info */}
          <div className="founder-contact-left">
            <div className="contact-credo">
              <p className="credo-line">I am based in Nakuru, Kenya.</p>
              <p className="credo-line highlight-gold">I build for East Africa.</p>
              <p className="credo-line">I think in systems.</p>
            </div>

            <div className="founder-contact-items">
              <a href={`mailto:${contactInfo.email}`} className="contact-item-row">
                <div className="contact-icon-box">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="contact-item-details">
                  <span className="item-label">Direct Email</span>
                  <span className="item-val">{contactInfo.email}</span>
                </div>
              </a>

              <a href="tel:+254759437978" className="contact-item-row">
                <div className="contact-icon-box">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="contact-item-details">
                  <span className="item-label">Direct Phone</span>
                  <span className="item-val">{contactInfo.phone}</span>
                </div>
              </a>

              <a
                href={contactInfo.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-item-row"
              >
                <div className="contact-icon-box whatsapp-box">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.85-.38-4.09-1.11l-.29-.17-3.05.8 1.11-2.97-.19-.3A8.19 8.19 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.9 2.41 1.02 2.58.13.17 1.76 2.69 4.27 3.77.6.26 1.06.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.19-.06-.11-.23-.17-.48-.29" />
                  </svg>
                </div>
                <div className="contact-item-details">
                  <span className="item-label">WhatsApp (Preferred)</span>
                  <span className="item-val">{contactInfo.phone}</span>
                </div>
              </a>

              <div className="contact-item-row static">
                <div className="contact-icon-box">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="contact-item-details">
                  <span className="item-label">Base</span>
                  <span className="item-val">{contactInfo.location}</span>
                </div>
              </div>
            </div>

            {/* Social Links Row */}
            <div className="founder-social-row">
              <span className="social-label">PROFILES:</span>
              <div className="social-icons">
                <a
                  href={contactInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="James Mbugua on LinkedIn"
                  className="social-icon-btn"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                  </svg>
                </a>
                <a
                  href={contactInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="James Mbugua on GitHub"
                  className="social-icon-btn"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                </a>
                <a
                  href={contactInfo.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="James Mbugua on Twitter"
                  className="social-icon-btn"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="founder-contact-right">
            <div className="contact-form-wrapper">
              {submitted ? (
                <div className="contact-success-state">
                  <div className="success-icon-ring">✓</div>
                  <h3 className="success-title">Message Received</h3>
                  <p className="success-body">
                    Thank you for reaching out. I personally review all inquiries and will be in touch within 24 hours.
                  </p>
                  <div className="success-whatsapp-alt">
                    <p className="alt-label">Need an immediate response?</p>
                    <a
                      href={contactInfo.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="founder-btn-outline-gold"
                    >
                      Prefer WhatsApp? Message directly &rarr;
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="founder-form">
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Dr. Arthur Kibera"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      required
                      placeholder="arthur@institution.co.ke"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="projectType" className="form-label">
                      What are you building?
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="projectType"
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="School">School / Educational Institution</option>
                        <option value="Business">Business / SME Enterprise</option>
                        <option value="SACCO">SACCO / Microfinance / Chama</option>
                        <option value="NGO">NGO / Public Organization</option>
                        <option value="Partnership">Product Partnership / Investment</option>
                        <option value="Other">Other Strategic Initiative</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message" className="form-label">
                      Message / Operational Challenge
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      placeholder="Describe your current system bottleneck, project scope, or conversation focus..."
                      value={formData.message}
                      onChange={handleChange}
                      className="form-textarea"
                    />
                  </div>

                  {errorMsg && <p className="form-error">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="founder-btn-submit"
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>

                  <div className="form-direct-whatsapp-note">
                    <span>Prefer direct chat? </span>
                    <a
                      href={contactInfo.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wa-link"
                    >
                      Message James on WhatsApp &rarr;
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
