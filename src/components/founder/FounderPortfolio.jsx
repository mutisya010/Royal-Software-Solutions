import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import Nav from './Nav'
import Hero from './Hero'
import About from './About'
import Expertise from './Expertise'
import Projects from './Projects'
import FahariEcosystem from './FahariEcosystem'
import TheMaking from './TheMaking'
import Process from './Process'
import Contact from './Contact'
import Footer from './Footer'
import './founder.css'

export default function FounderPortfolio() {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)

    // Setup IntersectionObserver for smooth fade-up on scroll
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('founder-in-view')
          observer.unobserve(entry.target)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    })

    const elementsToAnimate = document.querySelectorAll(
      '.founder-section-header, .founder-about-grid, .founder-stat-card, .founder-expertise-card, .founder-project-card, .founder-cluster-card, .making-post-card, .founder-timeline-step, .founder-contact-grid'
    )

    elementsToAnimate.forEach((el) => {
      el.classList.add('founder-fade-init')
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'James Mbugua',
    alternateName: '@james_royalty',
    jobTitle: 'Founder, Software Engineer & Systems Thinker',
    worksFor: {
      '@type': 'Organization',
      name: 'Royal Software Solutions',
      url: 'https://www.royalsoftwares.co.ke',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nakuru',
      addressCountry: 'Kenya',
    },
    description:
      'Kenyan software engineer, founder of Royal Software Solutions, and architect of the Fahari Ecosystem.',
    knowsAbout: [
      'Enterprise Software',
      'ERP Architecture',
      'Systems Thinking',
      'African Institutional Infrastructure',
      'React',
      'Node.js',
      'Python',
      'M-Pesa Integration',
    ],
    url: 'https://www.royalsoftwares.co.ke/founder',
    sameAs: [
      'https://www.linkedin.com/in/james-mbugua',
      'https://github.com/james-royalty',
      'https://twitter.com/james_royalty',
    ],
  }

  return (
    <div className="founder-portfolio-root">
      {/* Dynamic SEO Tags */}
      <Helmet>
        <title>James Mbugua — Software Engineer, Founder &amp; African Infrastructure Builder</title>
        <meta
          name="description"
          content="James Mbugua is a Kenyan software engineer and founder of Royal Software Solutions, building the Fahari Ecosystem — enterprise software for African institutions."
        />
        <link rel="canonical" href="https://www.royalsoftwares.co.ke/founder" />

        {/* Open Graph / LinkedIn */}
        <meta property="og:type" content="profile" />
        <meta
          property="og:title"
          content="James Mbugua — Software Engineer, Founder & African Infrastructure Builder"
        />
        <meta
          property="og:description"
          content="Architect of the Fahari Ecosystem. Building the enterprise software that gives African institutions the operational clarity they deserve."
        />
        <meta property="og:url" content="https://www.royalsoftwares.co.ke/founder" />
        <meta property="og:site_name" content="James Mbugua Portfolio" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@james_royalty" />
        <meta
          name="twitter:title"
          content="James Mbugua — Software Engineer, Founder & African Infrastructure Builder"
        />
        <meta
          name="twitter:description"
          content="Architect of the Fahari Ecosystem. Building the enterprise software that gives African institutions the operational clarity they deserve."
        />

        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      {/* Accessibility Skip Link */}
      <a href="#about" className="founder-skip-link">
        Skip to main content
      </a>

      {/* Main Portfolio Layout */}
      <Nav />
      <main id="main-content">
        <Hero />
        <About />
        <Expertise />
        <Projects />
        <FahariEcosystem />
        <TheMaking />
        <Process />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
