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
// (2026-07-13) Clean up unused Menu icon import. Prev: Menu included
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Facebook,
  Instagram,
  Layers3,
  Mail,
  MessageCircle,
  PenTool,
  Phone,
  RotateCcw,
  Share2,
  ShieldCheck,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import { AdminApp } from "./Admin";
// (2026-07-13) Remove unused defaultTags from App imports. Prev: defaultTags
import {
  api,
  subscribeToPosts,
  subscribeToSettings,
  defaultSettings,
  type Block,
  type Post,
  type SiteSettings,
} from "./lib/api";

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
// (2026-07-13) Purge sample projects for real client showcase. Prev: dummy data
const projects: { type: string; title: string; text: string; initials: string }[] = [];

// (2026-07-13) Auto-detect asset base path. Prev: static BASE_URL
const assetBase =
  typeof window !== "undefined" && window.location.pathname.startsWith("/BaiNest")
    ? "/BaiNest/"
    : "/";

// (2026-07-13) Rebrand title to bainest digital marketing agency & new logo
function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      className={`brand ${footer ? "brand-footer" : ""}`}
      to="/"
      aria-label="bainest digital marketing agency"
    >
      <img src={`${assetBase}bainest-logo.jpg`} alt="bainest" />
      <span>
        bainest<small>digital marketing agency</small>
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

// (2026-07-13) Header state without mobile hamburger toggle. Prev: open state
function Header() {
  const [recentOpen, setRecentOpen] = useState(false);
  const { posts } = usePosts();
  const loc = useLocation();
  useEffect(() => {
    setRecentOpen(false);
  }, [loc.pathname]);

  const customNavPosts = useMemo(
    () => posts.filter((p) => p.include_in_nav && p.status === "published"),
    [posts]
  );
  const recentPosts = useMemo(() => posts.slice(0, 5), [posts]);

  return (
    <header className="site-header">
      <div className="brand-row">
        <div className="wrap brand-inner">
          <Brand />
          <span className="brand-note">Innovate. Elevate. Connect.</span>
          {/* (2026-07-13) Move Start a project to top bar replacing Let's talk. Prev: text */}
          <Link className="header-work header-work-btn" to="/contact">
            Start a project <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <div className="nav-sticky">
        <div className="wrap nav-inner">
          <nav
            className="main-nav"
            aria-label="Primary navigation"
          >
            {/* (2026-07-13) Attach recent posts dropdown directly to Blog. Prev: separate nav */}
            {nav.map(([label, to]) => {
              if (label === "Blog") {
                return (
                  <div
                    key={to}
                    className={`blog-nav-wrapper recent-posts-dropdown ${recentOpen ? "open" : ""}`}
                    onMouseEnter={() => setRecentOpen(true)}
                    onMouseLeave={() => setRecentOpen(false)}
                  >
                    <NavLink
                      to={to}
                      className={({ isActive }) => (isActive ? "active" : "")}
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      {label.toUpperCase()} <ChevronDown size={13} />
                    </NavLink>
                    {recentOpen && recentPosts.length > 0 && (
                      <div className="recent-posts-mega">
                        <div className="recent-posts-grid">
                          {recentPosts.map((rp) => (
                            <Link
                              key={rp.id}
                              to={`/blog/${rp.slug}`}
                              className="recent-mega-card"
                              onClick={() => setRecentOpen(false)}
                            >
                              <div className="recent-mega-thumb">
                                {rp.cover_image ? (
                                  <img src={rp.cover_image} alt={rp.title} />
                                ) : (
                                  <div className="recent-mega-ph">
                                    <span>{rp.category?.slice(0, 2).toUpperCase() || "BN"}</span>
                                  </div>
                                )}
                              </div>
                              <h4 className="recent-mega-title">{rp.title}</h4>
                              <span className="recent-mega-date">
                                {rp.published_at
                                  ? new Date(rp.published_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Recent"}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {label.toUpperCase()}
                </NavLink>
              );
            })}

            {/* Custom pages toggled to include in header */}
            {customNavPosts.map((cp) => (
              <NavLink
                key={cp.id}
                to={`/blog/${cp.slug}`}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {cp.title.toUpperCase()}
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
// (2026-07-13) Footer with dynamic social profiles and contact info. Prev: static links
function Footer() {
  const settings = useSettings();
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
            {/* Social media profile links */}
            <div className="footer-social-row">
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
              )}
              {settings.twitter && (
                <a href={settings.twitter} target="_blank" rel="noreferrer" aria-label="Twitter">
                  <Twitter size={18} />
                </a>
              )}
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
              )}
              {settings.youtube && (
                <a href={settings.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                  <Youtube size={18} />
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} aria-label="Email">
                  <Mail size={18} />
                </a>
              )}
            </div>
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
            <p>{settings.email || "Have a good idea? Let’s find its next step."}</p>
            {settings.phone && <p className="footer-phone">{settings.phone}</p>}
            <Link to="/contact">
              Start a conversation <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {settings.siteName || "BaiNest Studio"}. All rights reserved.
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
// (2026-07-13) Real-time live posts via onSnapshot. Prev: one-time fetch
function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeToPosts((livePosts) => {
      setPosts(livePosts);
      setLoading(false);
    }, true);
    return () => unsub();
  }, []);
  return { posts, loading };
}
// (2026-07-13) Real-time settings hook via onSnapshot. Prev: none
function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  useEffect(() => {
    const unsub = subscribeToSettings(setSettings);
    return () => unsub();
  }, []);
  return settings;
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
          {/* (2026-07-13) Show clean teaser when projects is empty. Prev: empty map */}
          {projects.length > 0 ? (
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
          ) : (
            <div className="portfolio-teaser-box">
              <p>
                Our real client portfolio and case studies are being published here shortly.
              </p>
              <Link className="text-link" to="/portfolio">
                Learn more about our showcase <ArrowRight size={14} />
              </Link>
            </div>
          )}
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
// (2026-07-13) Clean showcase ready for client portfolio posts. Prev: mock projects
function Portfolio() {
  return (
    <PageFrame>
      <PageHeading
        label="Portfolio"
        title="Work that moves good ideas forward."
        copy="A curated showcase of strategic, creative, and digital builds made in close partnership with ambitious brands."
      />
      <section className="section">
        <div className="wrap">
          <div className="portfolio-empty-state">
            <span className="empty-badge">Curated Showcase</span>
            <h2>Client Case Studies Coming Soon</h2>
            <p>
              We are currently curating and uploading our real client case studies and digital project launches directly to this gallery. Check back shortly or reach out to explore our private deck.
            </p>
            <Link className="btn" to="/contact">
              Talk with our team <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <CtaBand />
    </PageFrame>
  );
}
// (2026-07-13) Blogs page with category chips and card images. Prev: The journal
function Blog() {
  const { posts, loading } = usePosts();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category.trim());
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => t && set.add(t.trim()));
      }
    });
    return ["All", ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesQuery = `${p.title} ${p.excerpt} ${p.category} ${(p.tags || []).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesTag =
        selectedTag === "All" ||
        p.category?.toLowerCase() === selectedTag.toLowerCase() ||
        (p.tags || []).some((t) => t.toLowerCase() === selectedTag.toLowerCase());
      return matchesQuery && matchesTag;
    });
  }, [posts, query, selectedTag]);

  return (
    <PageFrame>
      <PageHeading
        label="Blogs"
        title="Ideas to help good work move."
        copy="Notes on brand, digital, and creative strategy—written to be useful long after the tab is closed."
      />
      <section className="section">
        <div className="wrap">
          {/* Category Chips Bar */}
          {allTags.length > 1 && (
            <div className="category-chips-bar">
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`category-chip ${selectedTag === t ? "active" : ""}`}
                  onClick={() => setSelectedTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="blog-toolbar">
            <span>
              {filtered.length} {filtered.length === 1 ? "story" : "stories"}
            </span>
            <label className="search-field">
              <span className="sr-only">Search articles</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search blogs…"
              />
            </label>
          </div>
          {loading ? (
            <div className="empty-state">Loading blogs…</div>
          ) : filtered.length ? (
            <div className="blog-list">
              {filtered.map((p, i) => (
                <ArticleCard key={p.id} post={p} index={i % 3} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {posts.length
                ? "No stories match that category or search."
                : "No blogs published yet. Add your first story from the admin dashboard."}
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
// (2026-07-13) Blog post detail with widgets, social bar, and sidebar. Prev: basic article
function PostDetail() {
  const { slug = "" } = useParams();
  const [search] = useSearchParams();
  const preview = search.get("preview") === "1";
  const previewId = search.get("id");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  // (2026-07-13) Clean up unused sidebar states & tags in PostDetail. Prev: kept
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [commentDone, setCommentDone] = useState(false);

  const { posts: allPosts } = usePosts();

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

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allPosts
      .filter((p) => p.id !== post.id && p.status === "published")
      .slice(0, 3);
  }, [allPosts, post]);

  const latestPosts = useMemo(() => {
    return allPosts.filter((p) => p.status === "published").slice(0, 4);
  }, [allPosts]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function copyShareLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  }

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
          <Eyebrow>Blogs</Eyebrow>
          <h1>We couldn’t find that story.</h1>
          <Link className="btn" to="/blog">
            Back to blogs
          </Link>
        </div>
      </PageFrame>
    );

  return (
    <PageFrame>
      <div className="article-layout-wrap wrap">
        {/* Main Article Content */}
        <article className="article-main-col">
          {preview && (
            <div className="private-preview-label">
              PRIVATE DRAFT PREVIEW · Only visible while signed in
            </div>
          )}

          {/* Breadcrumb */}
          <div className="post-breadcrumbs">
            <Link to="/">Home</Link>
            <ChevronRight size={13} />
            <Link to="/blog">Blogs</Link>
            <ChevronRight size={13} />
            <span>{post.title}</span>
          </div>

          <header className="post-detail-header">
            <h1>{post.title}</h1>
            <div className="post-meta-row">
              <span className="post-meta-author">
                By <b>{post.author || "BaiNest"}</b>
              </span>
              <span className="meta-sep">·</span>
              <time className="post-meta-date">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Draft"}
              </time>
              {post.category && (
                <>
                  <span className="meta-sep">·</span>
                  <span className="post-meta-cat">{post.category}</span>
                </>
              )}
            </div>
          </header>

          {post.cover_image && (
            <div className="post-featured-hero">
              <img src={post.cover_image} alt={post.title} />
            </div>
          )}

          {post.excerpt && <p className="post-lead-excerpt">{post.excerpt}</p>}

          <div className="post-content-blocks">
            <BlockRenderer blocks={post.blocks || []} />
          </div>

          {/* Social Share Bar */}
          <div className="post-share-bar">
            <span className="share-bar-label">
              <Share2 size={16} />
            </span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="share-btn share-fb"
              title="Share on Facebook"
            >
              <Facebook size={15} /> Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noreferrer"
              className="share-btn share-tw"
              title="Share on Twitter"
            >
              <Twitter size={15} /> Twitter
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="share-btn share-wa"
              title="Share on WhatsApp"
            >
              <MessageCircle size={15} />
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareUrl)}`}
              className="share-btn share-em"
              title="Share via Email"
            >
              <Mail size={15} />
            </a>
            <button
              type="button"
              className="share-btn share-cp"
              onClick={copyShareLink}
              title="Copy page link"
            >
              <Copy size={15} /> {copied ? "Copied!" : ""}
            </button>
          </div>

          {/* You Might Like Section */}
          {relatedPosts.length > 0 && (
            <div className="related-section">
              <div className="related-header">
                <h3>You might like &gt;</h3>
                <Link to="/blog" className="related-view-all">
                  View all
                </Link>
              </div>
              <div className="related-grid">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.id}
                    to={`/blog/${rp.slug}`}
                    className="related-post-card"
                  >
                    <div className="related-card-thumb">
                      {rp.cover_image ? (
                        <img src={rp.cover_image} alt={rp.title} />
                      ) : (
                        <div className="related-thumb-ph">
                          <span>{rp.category?.slice(0, 2).toUpperCase() || "BN"}</span>
                        </div>
                      )}
                    </div>
                    <h4>{rp.title}</h4>
                    <time>
                      {rp.published_at
                        ? new Date(rp.published_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recent"}
                    </time>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Post a Comment Section */}
          <div className="comment-section-card">
            <h3>Post a Comment &gt;</h3>
            {commentDone ? (
              <div className="comment-success-notice">
                <Check size={16} /> Thank you! Your response has been submitted for review.
              </div>
            ) : (
              <form
                className="comment-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commentText.trim()) setCommentDone(true);
                }}
              >
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts on this story…"
                  required
                />
                <div className="comment-form-row">
                  <input
                    type="text"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    placeholder="Your Name (optional)"
                  />
                  <button type="submit" className="comment-submit-btn">
                    Submit Comment
                  </button>
                </div>
              </form>
            )}
          </div>
        </article>

        {/* Right Sidebar Widgets */}
        <aside className="article-sidebar">
          {/* (2026-07-13) Remove Follow Us, MailChimp, and Main Tags cards. Prev: present */}
          {/* Latest Posts Widget */}
          {latestPosts.length > 0 && (
            <div className="sidebar-widget-card">
              <h3 className="widget-title">Latest Posts</h3>
              <div className="latest-posts-list">
                {latestPosts.map((lp) => (
                  <Link
                    key={lp.id}
                    to={`/blog/${lp.slug}`}
                    className="latest-post-row"
                  >
                    <div className="latest-post-thumb">
                      {lp.cover_image ? (
                        <img src={lp.cover_image} alt={lp.title} />
                      ) : (
                        <div className="latest-post-ph">
                          <span>{lp.category?.slice(0, 2).toUpperCase() || "BN"}</span>
                        </div>
                      )}
                    </div>
                    <div className="latest-post-info">
                      <h5>{lp.title}</h5>
                      <time>
                        {lp.published_at
                          ? new Date(lp.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Recent"}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Popular Posts Widget */}
          {latestPosts.length > 0 && (
            <div className="sidebar-widget-card">
              <h3 className="widget-title">Popular Posts</h3>
              <div className="popular-posts-list">
                {latestPosts.map((pp, idx) => (
                  <Link
                    key={pp.id}
                    to={`/blog/${pp.slug}`}
                    className="popular-post-row"
                  >
                    <div className="popular-post-thumb-wrap">
                      {pp.cover_image ? (
                        <img src={pp.cover_image} alt={pp.title} />
                      ) : (
                        <div className="popular-post-ph">
                          <span>{pp.category?.slice(0, 2).toUpperCase() || "BN"}</span>
                        </div>
                      )}
                      <span className="popular-badge">{idx + 1}</span>
                    </div>
                    <div className="popular-post-info">
                      <h5>{pp.title}</h5>
                      <time>
                        {pp.published_at
                          ? new Date(pp.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Popular"}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* (2026-07-13) Remove Main Tags widget from blog sidebar. Prev: tag cloud */}
        </aside>
      </div>
    </PageFrame>
  );
}
// (2026-07-13) Contact page with requested pillars and improved cards. Prev: basic form
function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const settings = useSettings();

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

            {/* Requested Pillars */}
            <div className="contact-pillar-card">
              <span className="pillar-num">01</span>
              <div className="pillar-body">
                <h4>Built around your goals.</h4>
                <p>
                  We take time to understand your brand, audience, and business
                  objectives.
                </p>
              </div>
            </div>

            <div className="contact-pillar-card">
              <span className="pillar-num">02</span>
              <div className="pillar-body">
                <h4>Strategy starts with a conversation.</h4>
                <p>
                  Tell us what you need. We'll help you explore the right
                  solutions for your business.
                </p>
              </div>
            </div>

            {/* (2026-07-13) Upgrade direct contact links with icons. Prev: plain text */}
            <div className="contact-direct-card">
              <h5>Direct Inquiries</h5>
              <a href={`mailto:${settings.email}`} className="direct-link">
                <Mail size={16} /> <span>{settings.email}</span>
              </a>
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="direct-link">
                  <Phone size={16} /> <span>{settings.phone}</span>
                </a>
              )}
            </div>
          </div>
          <form className="contact-form" onSubmit={submit}>
            {/* (2026-07-13) Polished success card with roadmap and styled reset. Prev: plain box */}
            {sent ? (
              <div className="form-success">
                <div className="success-icon-wrap">
                  <Check size={32} />
                </div>
                <h3>Message Sent Successfully!</h3>
                <p className="success-copy">
                  Thank you for reaching out. We have received your note and our team will get back to you with next steps within 24 hours.
                </p>
                <div className="success-steps-box">
                  <div className="success-step-item">
                    <span className="step-dot" />
                    <div>
                      <b>Prompt Response</b>
                      <small>We'll review your goals and reply directly via email.</small>
                    </div>
                  </div>
                  <div className="success-step-item">
                    <span className="step-dot" />
                    <div>
                      <b>Discovery Alignment</b>
                      <small>If aligned, we'll set up a short strategy call to explore solutions.</small>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="success-reset-btn"
                  onClick={() => setSent(false)}
                >
                  <RotateCcw size={15} /> Send another message
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
// (2026-07-13) Scroll window to top on route change. Prev: stay scrolled
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export function App() {
  const location = useLocation();
  const admin = location.pathname.startsWith("/admin");
  return (
    <>
      <ScrollToTop />
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
