import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  Code2,
  Layers3,
  Menu,
  PenTool,
  ShieldCheck,
  X,
} from "lucide-react";
import { AdminApp } from "./Admin";
import { api, type Block, type Post } from "./lib/api";

const nav = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Portfolio", "/portfolio"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
] as const;
const services = [
  {
    no: "01",
    icon: PenTool,
    title: "Brand & Strategy",
    text: "A distinct point of view, shaped into a brand people recognize and trust.",
  },
  {
    no: "02",
    icon: Layers3,
    title: "Digital Experiences",
    text: "Beautiful, useful digital homes built to make the next step feel effortless.",
  },
  {
    no: "03",
    icon: BarChart3,
    title: "Growth Marketing",
    text: "Thoughtful campaigns that connect your message with the people who need it.",
  },
  {
    no: "04",
    icon: Code2,
    title: "Content & Creative",
    text: "Clear stories, memorable visuals, and creative that works hard across channels.",
  },
];
const projects = [
  {
    type: "Brand strategy · Digital",
    title: "Northline",
    text: "A sharper story for a new generation of independent makers.",
    initials: "N",
  },
  {
    type: "Digital experience · Growth",
    title: "Aster House",
    text: "A calmer booking experience for a hospitality brand on the move.",
    initials: "A",
  },
  {
    type: "Creative · Content",
    title: "Goodwell",
    text: "A confident launch system for everyday wellness.",
    initials: "G",
  },
  {
    type: "Strategy · Campaign",
    title: "Fieldwork",
    text: "Bringing a modern food collective closer to its community.",
    initials: "F",
  },
];

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      className={`brand ${footer ? "brand-footer" : ""}`}
      to="/"
      aria-label="BaiNest Studio home"
    >
      <img src="/logo.svg" alt="" />
      <span>
        BAINEST<small>DIGITAL STUDIO</small>
      </span>
    </Link>
  );
}
function LocalDomainNotice() {
  const [params, setParams] = useSearchParams();
  const hostname = params.get("previewDomain");
  const [blog, setBlog] = useState("");
  useEffect(() => {
    if (!hostname) {
      setBlog("");
      return;
    }
    api<{ mappedBlog: string | null }>(
      `/api/site?host=${encodeURIComponent(hostname)}`,
    )
      .then((value) => setBlog(value.mappedBlog || ""))
      .catch(() => setBlog(""));
  }, [hostname]);
  if (!hostname || !blog) return null;
  return (
    <div className="domain-preview-notice">
      <span>
        <strong>LOCAL DOMAIN PREVIEW</strong> · {blog}{" "}
        <small>({hostname})</small>
      </span>
      <button
        onClick={() => {
          params.delete("previewDomain");
          setParams(params);
        }}
        aria-label="Close domain preview"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <header className="site-header">
      <div className="brand-row">
        <div className="wrap brand-inner">
          <Brand />
          <span className="brand-note">Innovate. Elevate. Connect.</span>
          <Link className="header-work" to="/contact">
            Let’s talk <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <div className="nav-sticky">
        <div className="wrap nav-inner">
          <button
            className="menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            className={`main-nav ${open ? "open" : ""}`}
            aria-label="Primary navigation"
          >
            {nav.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {label.toUpperCase()}
              </NavLink>
            ))}
          </nav>
          <Link className="nav-cta" to="/contact">
            Start a project <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Brand footer />
            <p className="footer-copy">
              Digital strategy, creative solutions, and thoughtful experiences
              for businesses ready to grow.
            </p>
            <span className="footer-tagline">Innovate. Elevate. Connect.</span>
          </div>
          <div className="footer-links">
            <h4>Explore</h4>
            {nav.slice(1, 5).map(([label, to]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </div>
          <div className="footer-links">
            <h4>Connect</h4>
            <p>Have a good idea? Let’s find its next step.</p>
            <Link to="/contact">
              Start a conversation <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} BaiNest Studio. All rights reserved.
          </span>
          <span>Thoughtful strategy. Work that moves you forward.</span>
          <Link
            className="admin-footer-link"
            to="/admin/login"
            aria-label="Admin login"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
function Eyebrow({ children }: { children: string }) {
  return <div className="eyebrow">{children}</div>;
}
function PageFrame({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.main
      className="page-transition"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {children}
    </motion.main>
  );
}
function PageHeading({
  label,
  title,
  copy,
}: {
  label: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="page-hero">
      <div className="wrap">
        <Eyebrow>{label}</Eyebrow>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
    </div>
  );
}
function ArticleCard({ post, index = 0 }: { post: Post; index?: number }) {
  return (
    <motion.article
      className="post-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.42, delay: index * 0.06 }}
    >
      <Link
        className={`post-thumb thumb-${index % 3}`}
        to={`/blog/${post.slug}`}
        aria-label={`Read ${post.title}`}
      >
        {post.cover_image ? (
          <img className="post-thumb-image" src={post.cover_image} alt="" />
        ) : (
          <>
            <span className="thumb-mark">
              {post.category?.slice(0, 2).toUpperCase() || "BN"}
            </span>
            <span className="thumb-lines" />
          </>
        )}
      </Link>
      <div className="post-card-body">
        <div className="post-meta">
          <span>{post.category}</span>
          <i />{" "}
          <time>
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "New insight"}
          </time>
        </div>
        <h3>
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="post-excerpt">{post.excerpt}</p>
        <Link className="text-link" to={`/blog/${post.slug}`}>
          Read the story <ArrowRight size={14} />
        </Link>
      </div>
    </motion.article>
  );
}
function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Post[]>("/api/posts")
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);
  return { posts, loading };
}
function Home() {
  const { posts } = usePosts();
  return (
    <PageFrame>
      <section className="hero">
        <div className="hero-glow" />
        <div className="wrap hero-grid">
          <div className="hero-copy-wrap">
            <Eyebrow>Independent digital studio</Eyebrow>
            <h1>
              Make your digital presence <span>work harder.</span>
            </h1>
            <p className="hero-copy">
              We bring strategy, creative, and digital together to help
              ambitious businesses move forward with clarity.
            </p>
            <div className="hero-actions">
              <Link className="btn" to="/contact">
                Let’s build what’s next <ArrowRight size={16} />
              </Link>
              <Link className="btn btn-outline" to="/portfolio">
                Explore our work
              </Link>
            </div>
            <p className="hero-note">
              <span className="online-dot" /> Thoughtful by design. Built for
              momentum.
            </p>
          </div>
          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-panel">
              <div className="visual-top">
                <span>Clarity in motion</span>
                <span className="visual-dot" />
              </div>
              <div className="visual-headline">
                Small moves.
                <br />
                <span>Lasting impact.</span>
              </div>
              <div className="visual-chart">
                <div className="chart-label">
                  <span>Digital momentum</span>
                  <b>+38%</b>
                </div>
                <div className="chart-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className="visual-foot">
                <span>STRATEGY</span>
                <span>CREATIVE</span>
                <span>GROWTH</span>
              </div>
            </div>
            <div className="floating-note">
              <span className="floating-icon">
                <Check size={15} />
              </span>
              <span>
                <b>Made to connect</b>
                <small>From first click to next step</small>
              </span>
            </div>
          </div>
        </div>
        <a className="hero-scroll" href="#intro">
          <span>Scroll to explore</span>
          <ArrowDown size={15} />
        </a>
      </section>
      <section className="section intro-section" id="intro">
        <div className="wrap intro-grid">
          <div className="intro-title">
            <Eyebrow>A clearer way forward</Eyebrow>
            <h2>
              Good work starts with <em>good questions.</em>
            </h2>
          </div>
          <div className="intro-copy">
            <p>
              There’s a lot competing for attention. We help you find what
              matters, say it with confidence, and make it easier for the right
              people to choose you.
            </p>
            <Link className="text-link" to="/about">
              Get to know BaiNest <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="wrap">
          <div className="section-head">
            <div>
              <Eyebrow>What we do</Eyebrow>
              <h2>
                Ideas with a clear
                <br />
                line to impact.
              </h2>
            </div>
            <p className="section-intro">
              From the first strategic question to the final pixel, our work
              keeps your business goals in view.
            </p>
          </div>
          <div className="services-grid">
            {services.map((s, i) => (
              <motion.article
                className="service-card"
                key={s.no}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.22 }}
              >
                <div className="service-card-top">
                  <span className="service-no">{s.no}</span>
                  <s.icon size={21} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span
                  className="service-line"
                  style={{ "--line-index": i } as React.CSSProperties}
                />
              </motion.article>
            ))}
          </div>
          <Link className="text-link section-more" to="/services">
            Explore our services <ArrowRight size={14} />
          </Link>
        </div>
      </section>
      <section className="section work-section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <Eyebrow>Selected work</Eyebrow>
              <h2>
                Good thinking.
                <br />
                <em>Real momentum.</em>
              </h2>
            </div>
            <Link className="text-link" to="/portfolio">
              View all work <ArrowRight size={14} />
            </Link>
          </div>
          <div className="projects-grid">
            {projects.slice(0, 2).map((p, i) => (
              <Link
                className={`project-card project-${i}`}
                key={p.title}
                to="/portfolio"
              >
                <div className="project-art">
                  <span>{p.initials}</span>
                  <div className="project-orbit" />
                </div>
                <div className="project-content">
                  <span className="project-type">{p.type}</span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                  <ArrowUpRight className="project-arrow" size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-soft why-section">
        <div className="wrap why-grid">
          <div>
            <Eyebrow>How we think</Eyebrow>
            <h2>
              Small team.
              <br />
              <em>Wide perspective.</em>
            </h2>
            <p className="section-intro">
              We build close partnerships and bring the right mix of thinking
              and making to each challenge.
            </p>
            <Link className="text-link" to="/about">
              Our approach <ArrowRight size={14} />
            </Link>
          </div>
          <div className="why-list">
            {[
              {
                n: "01",
                t: "Listen before we leap",
                p: "We start with your people, your context, and the real challenge underneath the brief.",
              },
              {
                n: "02",
                t: "Make the complex clear",
                p: "We find the essential idea and build a path that is easy to understand and act on.",
              },
              {
                n: "03",
                t: "Build for what comes next",
                p: "We design flexible systems that keep delivering after launch day.",
              },
            ].map((x) => (
              <div className="why-item" key={x.n}>
                <span>{x.n}</span>
                <div>
                  <h3>{x.t}</h3>
                  <p>{x.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section blog-section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <Eyebrow>Ideas & insight</Eyebrow>
              <h2>
                Notes for moving
                <br />
                <em>good work forward.</em>
              </h2>
            </div>
            <Link className="text-link" to="/blog">
              Visit the journal <ArrowRight size={14} />
            </Link>
          </div>
          <div className="blog-posts">
            {posts.slice(0, 3).map((p, i) => (
              <ArticleCard key={p.id} post={p} index={i} />
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </PageFrame>
  );
}
function CtaBand() {
  return (
    <section className="cta-band">
      <div className="wrap cta-inner">
        <div>
          <Eyebrow>Have a good idea?</Eyebrow>
          <h2>
            Let’s give it
            <br />
            <em>some momentum.</em>
          </h2>
          <p>
            Tell us what you’re working toward. We’ll help you find a thoughtful
            next step.
          </p>
        </div>
        <Link className="btn" to="/contact">
          Start a conversation <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
function About() {
  return (
    <PageFrame>
      <PageHeading
        label="About BaiNest"
        title="Thoughtful partners for your next chapter."
        copy="We bring the right questions, clear strategy, and considered creative to help your business move forward."
      />
      <section className="section">
        <div className="wrap about-story">
          <div className="about-quote">
            “Good work should feel clear from the first conversation to the
            final detail.”
          </div>
          <div>
            <Eyebrow>Our point of view</Eyebrow>
            <h2>
              Strategy and making,
              <br />
              <em>working as one.</em>
            </h2>
            <p>
              BaiNest is an independent digital studio for businesses ready to
              grow with intention. We connect the dots between what you stand
              for, what you make, and how people experience it.
            </p>
            <p>
              We believe the strongest work is generous with clarity, ambitious
              with purpose, and practical enough to make a real difference.
            </p>
            <Link className="text-link" to="/services">
              See how we can help <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="wrap values-grid">
          <div>
            <Eyebrow>What guides us</Eyebrow>
            <h2>
              Good work is
              <br />
              <em>good partnership.</em>
            </h2>
          </div>
          {[
            {
              icon: ShieldCheck,
              title: "Care in the details",
              copy: "Thoughtful craft earns trust one useful decision at a time.",
            },
            {
              icon: Layers3,
              title: "Connected thinking",
              copy: "Strategy and execution belong in the same conversation.",
            },
            {
              icon: ArrowUpRight,
              title: "Momentum over noise",
              copy: "We choose meaningful progress over busywork and buzzwords.",
            },
          ].map((v) => (
            <article className="value-card" key={v.title}>
              <v.icon />
              <h3>{v.title}</h3>
              <p>{v.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBand />
    </PageFrame>
  );
}
function Services() {
  return (
    <PageFrame>
      <PageHeading
        label="Services"
        title="A clear path from good idea to real impact."
        copy="Bring us the challenge, the ambition, or the part that still feels a little unclear. We’ll find the right way forward together."
      />
      <section className="section">
        <div className="wrap services-detail">
          {services.map((s, i) => (
            <article className="service-detail" key={s.no}>
              <span className="service-no">{s.no}</span>
              <div className="service-detail-icon">
                <s.icon />
              </div>
              <div>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                <ul>
                  {[
                    [
                      "Positioning & brand foundations",
                      "Visual identity & design systems",
                      "Messaging & brand direction",
                    ],
                    [
                      "Website strategy & experience design",
                      "Responsive web development",
                      "Conversion-focused digital journeys",
                    ],
                    [
                      "Campaign planning & creative",
                      "Audience & channel strategy",
                      "Measurement and iteration",
                    ],
                    [
                      "Content strategy & production",
                      "Editorial and social content",
                      "Creative systems for your team",
                    ],
                  ][i].map((t) => (
                    <li key={t}>
                      <Check size={15} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <ChevronRight className="service-detail-arrow" />
            </article>
          ))}
        </div>
      </section>
      <CtaBand />
    </PageFrame>
  );
}
function Portfolio() {
  return (
    <PageFrame>
      <PageHeading
        label="Portfolio"
        title="Work that moves good ideas forward."
        copy="A selection of strategic, creative, and digital work made in close partnership with ambitious teams."
      />
      <section className="section">
        <div className="wrap portfolio-grid">
          {projects.map((p, i) => (
            <article className={`portfolio-card portfolio-${i}`} key={p.title}>
              <div className="portfolio-art">
                <span>{p.initials}</span>
                <div className="portfolio-shape" />
              </div>
              <div className="portfolio-copy">
                <span className="project-type">{p.type}</span>
                <h2>{p.title}</h2>
                <p>{p.text}</p>
                <span className="text-link">Strategy · Design · Digital</span>
              </div>
            </article>
          ))}
        </div>
        <p className="portfolio-note wrap">
          Selected project names are illustrative placeholders. Replace them
          with approved client work before launch.
        </p>
      </section>
      <CtaBand />
    </PageFrame>
  );
}
function Blog() {
  const { posts, loading } = usePosts();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      posts.filter((p) =>
        `${p.title} ${p.excerpt} ${p.category} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [posts, query],
  );
  return (
    <PageFrame>
      <PageHeading
        label="The journal"
        title="Ideas to help good work move."
        copy="Notes on brand, digital, and creative work—written to be useful long after the tab is closed."
      />
      <section className="section">
        <div className="wrap">
          <div className="blog-toolbar">
            <span>
              {filtered.length} {filtered.length === 1 ? "story" : "stories"}
            </span>
            <label className="search-field">
              <span className="sr-only">Search articles</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the journal…"
              />
            </label>
          </div>
          {loading ? (
            <div className="empty-state">Loading the journal…</div>
          ) : filtered.length ? (
            <div className="blog-list">
              {filtered.map((p, i) => (
                <ArticleCard key={p.id} post={p} index={i % 3} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {posts.length
                ? "No stories match that search yet."
                : "Your first story is taking shape."}
            </div>
          )}
        </div>
      </section>
    </PageFrame>
  );
}
function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="post-body">
      {blocks.map((b, i) => {
        if (b.type === "heading") return <h2 key={i}>{b.text}</h2>;
        if (b.type === "paragraph") return <p key={i}>{b.text}</p>;
        if (b.type === "quote")
          return <blockquote key={i}>{b.text}</blockquote>;
        if (b.type === "columns")
          return (
            <div className="post-columns" key={i}>
              <p>{b.left}</p>
              <p>{b.right}</p>
            </div>
          );
        if (b.type === "list")
          return (
            <ul key={i}>
              {b.items?.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        if (b.type === "image")
          return (
            <figure key={i}>
              {b.src ? (
                <img src={b.src} alt={b.alt || ""} />
              ) : (
                <div className="inline-image-placeholder">
                  Image block · add a local image URL in the editor
                </div>
              )}
              {b.caption && <figcaption>{b.caption}</figcaption>}
            </figure>
          );
        if (b.type === "cta")
          return (
            <div className="post-cta" key={i}>
              <h3>{b.text}</h3>
              <Link className="btn" to={b.href || "/contact"}>
                {b.label || "Get in touch"} <ArrowRight size={14} />
              </Link>
            </div>
          );
        return <hr key={i} />;
      })}
    </div>
  );
}
function PostDetail() {
  const { slug = "" } = useParams();
  const [search] = useSearchParams();
  const preview = search.get("preview") === "1";
  const previewId = search.get("id");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const endpoint =
      preview && previewId
        ? `/api/admin/posts/${encodeURIComponent(previewId)}/preview`
        : `/api/posts/${encodeURIComponent(slug)}`;
    api<Post>(endpoint)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, preview, previewId]);
  if (loading)
    return (
      <PageFrame>
        <div className="wrap article-not-found">Loading story…</div>
      </PageFrame>
    );
  if (!post)
    return (
      <PageFrame>
        <div className="wrap article-not-found">
          <Eyebrow>The journal</Eyebrow>
          <h1>We couldn’t find that story.</h1>
          <Link className="btn" to="/blog">
            Back to the journal
          </Link>
        </div>
      </PageFrame>
    );
  return (
    <PageFrame>
      <article className="article-page">
        <div className="wrap article-wrap">
          {preview && (
            <div className="private-preview-label">
              PRIVATE DRAFT PREVIEW · Only visible while signed in
            </div>
          )}
          <Link className="back-link" to="/blog">
            ← Back to the journal
          </Link>
          <div className="post-meta">
            <span>{post.category}</span>
            <i />
            <time>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("en", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}
            </time>
            <i />
            {post.author}
          </div>
          <h1>{post.title}</h1>
          <p className="article-excerpt">{post.excerpt}</p>
          <div className="article-rule" />
          <BlockRenderer blocks={post.blocks} />
          <div className="article-end">
            <span>Filed under {post.category}</span>
            <Link className="text-link" to="/contact">
              Talk with BaiNest <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </article>
    </PageFrame>
  );
}
function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setError("");
    setBusy(true);
    const form = new FormData(formElement);
    try {
      await api("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          company: form.get("company"),
          message: form.get("message"),
        }),
      });
      setSent(true);
      formElement.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageFrame>
      <PageHeading
        label="Contact"
        title="Tell us what you’re working toward."
        copy="A good conversation can make the next step clearer. Share a little about your idea and we’ll take it from there."
      />
      <section className="section">
        <div className="wrap contact-grid">
          <div className="contact-aside">
            <Eyebrow>Start here</Eyebrow>
            <h2>
              Good things start
              <br />
              with a <em>hello.</em>
            </h2>
            <p>
              Use the form to tell us a bit about your goals, timing, or the
              question you’re trying to answer.
            </p>
            <div className="contact-note">
              <span>01</span>
              <p>
                Your message is saved to the local inbox in this development
                version.
              </p>
            </div>
            <div className="contact-note">
              <span>02</span>
              <p>
                Real contact details can be added in site settings before
                launch.
              </p>
            </div>
          </div>
          <form className="contact-form" onSubmit={submit}>
            {sent ? (
              <div className="form-success">
                <span>
                  <Check />
                </span>
                <h3>Thanks for reaching out.</h3>
                <p>Your note is in the local inbox. We’ll be in touch.</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setSent(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="form-head">
                  <h2>Tell us a little more.</h2>
                  <p>Fields marked * are required.</p>
                </div>
                <div className="form-row">
                  <label>
                    Your name *
                    <input
                      name="name"
                      required
                      minLength={2}
                      placeholder="Name"
                    />
                  </label>
                  <label>
                    Email address *
                    <input
                      name="email"
                      required
                      type="email"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>
                <label>
                  Company or organization
                  <input name="company" placeholder="Optional" />
                </label>
                <label>
                  What would you like to work on? *
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    rows={5}
                    placeholder="A few details about your goals or question…"
                  />
                </label>
                {error && <p className="form-error">{error}</p>}
                <button className="btn" disabled={busy}>
                  {busy ? "Sending…" : "Send your note"}{" "}
                  <ArrowRight size={15} />
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </PageFrame>
  );
}
function NotFound() {
  return (
    <PageFrame>
      <div className="wrap article-not-found">
        <Eyebrow>Page not found</Eyebrow>
        <h1>Looks like this page took a different route.</h1>
        <Link className="btn" to="/">
          Return home <ArrowRight size={15} />
        </Link>
      </div>
    </PageFrame>
  );
}
export function App() {
  const location = useLocation();
  const admin = location.pathname.startsWith("/admin");
  return (
    <>
      {!admin && (
        <>
          <LocalDomainNotice />
          <Header />
        </>
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<PostDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      {!admin && <Footer />}
    </>
  );
}
