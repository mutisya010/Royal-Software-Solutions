export default function TheMaking() {
  /* [JAMES TO ADD: Your LinkedIn profile URL below] */
  const linkedInUrl = 'https://www.linkedin.com/in/james-mbugua'

  const posts = [
    {
      entry: '01',
      headline: 'The product is built. No one has seen it yet.',
      excerpt:
        'Most founders rush to launch before they are ready. I stayed too long in the building phase. Both are real risks.',
      readTime: '3 min read',
      tag: 'Founder Diary',
    },
    {
      entry: '03',
      headline: 'I went out today and knocked on real doors.',
      excerpt:
        'Some were closed. Some said not now. One bursar said: how long has this existed? We have needed this for years.',
      readTime: '4 min read',
      tag: 'Field Notes',
    },
    {
      entry: '08',
      headline: 'Infrastructure is invisible. Until it breaks.',
      excerpt:
        'Nobody thinks about the road until there is a pothole. That is what Fahari fixes. Before the break.',
      readTime: '5 min read',
      tag: 'Systems Thinking',
    },
  ]

  return (
    <section id="writing" className="founder-section founder-making-section">
      <div className="founder-container">
        <div className="founder-section-header">
          <span className="founder-section-tag">05 &mdash; WRITING &amp; ESSAYS</span>
          <h2 className="founder-section-title">The Making</h2>
          <p className="founder-section-subtitle">
            A founder&apos;s documentary series on building in public.
          </p>
        </div>

        <div className="making-intro-box">
          <p className="making-intro-lead">
            <em>The Making</em> is my personal writing series on LinkedIn &mdash; documenting the honest, 
            unpolished experience of building something significant from Nakuru, Kenya. 
            Not motivation. Not performance. <strong>Founder documentary.</strong>
          </p>
        </div>

        {/* 3 Featured Post Cards */}
        <div className="making-posts-grid">
          {posts.map((post) => (
            <article key={post.entry} className="making-post-card">
              <div className="post-card-top-accent" />
              <div className="post-card-meta">
                <span className="post-tag-pill">{post.tag}</span>
                <span className="post-entry-num font-mono">Entry {post.entry}</span>
              </div>

              <h3 className="post-card-headline">{post.headline}</h3>
              <p className="post-card-excerpt">&ldquo;{post.excerpt}&rdquo;</p>

              <div className="post-card-footer">
                <span className="post-read-time">{post.readTime}</span>
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="post-linkedin-link"
                >
                  Read on LinkedIn &rarr;
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA to LinkedIn */}
        <div className="making-bottom-cta">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="founder-btn-outline-gold"
          >
            Follow The Making on LinkedIn &rarr;
          </a>
        </div>
      </div>
    </section>
  )
}
