// (2026-07-13) Import Fragment for line break mapping. Prev: useEffect, useMemo, useState
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
// (2026-07-13) Clean framer-motion unused imports. Prev: AnimatePresence
import { motion } from "framer-motion";
// (2026-07-13) Import ArrowUp for blue back-to-top button. Prev: ArrowDown
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Facebook,
  FileText,
  Instagram,
  Layers3,
  Mail,
  MailCheck,
  MessageCircle,
  PenTool,
  Phone,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import { AdminApp } from "./Admin";
// (2026-07-13) Import getCachedSettings for instant settings init. Prev: none
import {
  api,
  subscribeToPosts,
  subscribeToSettings,
  getCachedSettings,
  defaultServicesList,
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
const serviceIconList = [PenTool, Layers3, BarChart3, Code2];
// (2026-07-13) Restore full services capabilities list. Prev: brief text only
const services = [
  {
    no: "01",
    icon: PenTool,
    title: "Brand & Strategy",
    text: "A distinct identity. A clear direction. A brand people recognize and remember.",
    items: [
      "Brand identity development",
      "Logo and visual branding",
      "Brand positioning and strategy",
      "Brand guidelines and design systems",
      "Brand messaging and communication",
      "Business profile and brand presentation",
      "Event branding and promotional materials",
    ],
  },
  {
    no: "02",
    icon: Layers3,
    title: "Digital Experiences",
    text: "Build a professional digital presence that makes your business easier to discover, understand, and connect with.",
    items: [
      "Business website design and development",
      "Website strategy and structure",
      "Landing page design",
      "Website content and copywriting",
      "Mobile-responsive website experiences",
      "Facebook Business Page creation and optimization",
      "Social media profile setup and optimization",
    ],
  },
  {
    no: "03",
    icon: BarChart3,
    title: "Growth Marketing",
    text: "Turn visibility into meaningful engagement and opportunities for business growth.",
    items: [
      "Social media management",
      "Social media marketing strategy",
      "Facebook and Instagram advertising",
      "Paid campaign planning and management",
      "Content calendar development",
      "Audience targeting and engagement strategy",
      "Campaign performance monitoring",
      "Monthly analytics and reporting",
    ],
  },
  {
    no: "04",
    icon: Code2,
    title: "Content & Creative",
    text: "Create meaningful content and compelling visuals that make your brand stand out.",
    items: [
      "Social media graphics and creatives",
      "Content creation and copywriting",
      "Social media captions",
      "Promotional and advertising materials",
      "Marketing collaterals",
      "Event posters and digital invitations",
      "Campaign creatives and visual concepts",
      "Content planning and production",
    ],
  },
];
// (2026-07-13) Export projects array. Prev: unexported unused
export const projects: { type: string; title: string; text: string; initials: string }[] = [];

// (2026-07-13) Auto-detect asset base path. Prev: static BASE_URL
const assetBase =
  typeof window !== "undefined" && window.location.pathname.startsWith("/BaiNest")
    ? "/BaiNest/"
    : "/";

// (2026-07-13) Capitalize brand name to BAINEST & AGENCY. Prev: lowercase
function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      className={`brand ${footer ? "brand-footer" : ""}`}
      to="/"
      aria-label="BAINEST DIGITAL MARKETING AGENCY"
    >
      <img src={`${assetBase}bainest-logo.jpg`} alt="BAINEST" />
      <span>
        BAINEST<small>DIGITAL MARKETING AGENCY</small>
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
  // (2026-07-13) Supply published blog stories excluding portfolio-only. Prev: published
  const recentPosts = useMemo(
    () => posts.filter((p) => p.status === "published" && !p.portfolio_only).slice(0, 8),
    [posts]
  );

  return (
    <header className="site-header">
      <div className="brand-row">
        <div className="wrap brand-inner">
          <Brand />
          <span className="brand-note">Innovate. Elevate. Connect.</span>
          {/* (2026-07-13) Rename CTA to Work with BaiNest. Prev: Start a project */}
          <Link className="header-work header-work-btn" to="/contact">
            Work with BaiNest <ArrowUpRight size={14} />
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
                        {/* (2026-07-13) Blog mega dropdown horizontal 5 cards. Prev: row list */}
                        <div className="recent-posts-top">
                          <span className="recent-posts-top-label">Featured stories</span>
                          <Link to="/blog" className="recent-posts-view-all" onClick={() => setRecentOpen(false)}>
                            All stories &rarr;
                          </Link>
                        </div>
                        <div className="recent-cards-grid">
                          {recentPosts.slice(0, 5).map((rp) => (
                            <Link
                              key={rp.id}
                              to={`/blog/${rp.slug}`}
                              className="recent-blog-card"
                              onClick={() => setRecentOpen(false)}
                            >
                              <div className="recent-card-thumb">
                                {rp.cover_image ? (
                                  <img src={rp.cover_image} alt={rp.title} loading="lazy" />
                                ) : (
                                  <div className="recent-card-ph">
                                    <span>{rp.category?.slice(0, 2).toUpperCase() || "BN"}</span>
                                  </div>
                                )}
                              </div>
                              <h4 className="recent-card-title" title={rp.title}>
                                {rp.title}
                              </h4>
                              <span className="recent-card-date">
                                {rp.published_at
                                  ? new Date(rp.published_at).toLocaleDateString("en-US", {
                                      month: "long",
                                      day: "2-digit",
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
            {/* (2026-07-13) Remove duplicate Start a project in nav. Prev: duplicate */}
          </nav>
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
            {/* (2026-07-13) Add Follow us on Facebook to footer. Prev: icon only */}
            <div className="footer-social-row">
              <a
                href={settings.facebook && settings.facebook.includes("facebook.com") ? settings.facebook : "https://www.facebook.com/profile.php?id=61580429522750"}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow us on Facebook"
                className="footer-facebook-link"
              >
                <Facebook size={18} />
                <b>Follow us on Facebook!</b>
              </a>
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
            {/* (2026-07-13) Update footer contact links to bainestph. Prev: placeholder */}
            <a href={`mailto:${(settings.email && !settings.email.includes("bainestdigital.com")) ? settings.email : "bainestph@gmail.com"}`}>
              {(settings.email && !settings.email.includes("bainestdigital.com")) ? settings.email : "bainestph@gmail.com"}
            </a>
            <a href={`tel:${(settings.phone && !settings.phone.includes("900 000")) ? settings.phone : "09622302015"}`}>
              {(settings.phone && !settings.phone.includes("900 000")) ? settings.phone : "09622302015"}
            </a>
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
/* (2026-07-13) Flicker-free page fade transition. Prev: double motion */
function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-transition">
      {children}
    </main>
  );
}
/* (2026-07-13) Remove subheadings from PageHeading. Prev: <p>{copy}</p> */
function PageHeading({
  label,
  title,
}: {
  label: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="page-hero">
      <div className="wrap">
        <Eyebrow>{label}</Eyebrow>
        <h1>{title}</h1>
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
          {/* (2026-07-13) Display Work label instead of Case Study. Prev: post.category */}
          <span>{post.category?.toLowerCase().includes("case study") ? "Work" : post.category}</span>
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
        {/* (2026-07-13) Add subtle description fallback for posts. Prev: post.excerpt */}
        <p className="post-excerpt">
          {post.excerpt && post.excerpt.trim()
            ? post.excerpt
            : post.slug?.toLowerCase().includes("aton") || post.title?.toLowerCase().includes("aton")
            ? "A trusted partner in legal excellence in Bogo City, building modern digital solutions to connect with the community and thrive online."
            : post.slug?.toLowerCase().includes("bainest") || post.title?.toLowerCase().includes("bainest")
            ? "Every story has a beginning, and ours starts right here in Bogo City, Cebu—empowering ambitious brands to innovate, elevate, and connect online."
            : "Strategic insight, purposeful creative, and digital execution designed to help modern businesses stand out and grow."}
        </p>
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
// (2026-07-13) Init useSettings with cached settings. Prev: defaultSettings
function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() => getCachedSettings());
  useEffect(() => {
    const unsub = subscribeToSettings(setSettings);
    return () => unsub();
  }, []);
  return settings;
}
// (2026-07-13) Derive industry, client & scope metadata; was generic badge
function getProjectCaseStudyMeta(p: Post) {
  const hay = `${p.title || ""} ${p.slug || ""} ${p.excerpt || ""}`.toLowerCase();
  const isCaseStudy = Boolean(
    p.include_in_portfolio ||
      p.portfolio_only ||
      (p.category && ["work", "case study"].includes(p.category.toLowerCase())) ||
      hay.includes("aton")
  );

  if (hay.includes("pharmacy") || hay.includes("dr. k") || hay.includes("dr-k")) {
    return {
      isCaseStudy: true,
      clientName: "Dr. K Pharmacy & Medical Supplies",
      industry: "Pharmacy & Healthcare",
      industryGroup: "Healthcare & Medical" as const,
      deliverables: ["Brand Identity", "Social Media Design", "Patient Education"],
      direction: "Clean, Trust-Driven & Approachable",
    };
  }
  if (hay.includes("aton") || hay.includes("law")) {
    return {
      isCaseStudy: true,
      clientName: "Aton & Aton Law Office",
      industry: "Legal & Law Practice",
      industryGroup: "Legal & Corporate" as const,
      deliverables: ["Visual Identity", "Corporate Branding", "Digital Presence"],
      direction: "Authoritative, Modern & Bold",
    };
  }
  if (hay.includes("doc jackie") || hay.includes("doc-jackie")) {
    return {
      isCaseStudy: true,
      clientName: "Doc Jackie",
      industry: "Healthcare Personal Brand",
      industryGroup: "Healthcare & Medical" as const,
      deliverables: ["Personal Branding", "Social Media Management", "Content Strategy"],
      direction: "Credible, Warm & Engaging",
    };
  }
  if (hay.includes("virtual assistant") || hay.includes("medical practice")) {
    return {
      isCaseStudy: true,
      clientName: "Medical Practice Support",
      industry: "Healthcare Operations",
      industryGroup: "Healthcare & Medical" as const,
      deliverables: ["Healthcare VA", "Patient Communication", "Digital Workflow"],
      direction: "Reliable, Structured & Patient-First",
    };
  }
  if (hay.includes("centrum mall") || hay.includes("mall")) {
    return {
      isCaseStudy: true,
      clientName: "Bogo City Centrum Mall",
      industry: "Shopping Mall & Commercial",
      industryGroup: "Retail & Commercial" as const,
      deliverables: ["Digital Transformation", "Campaign Strategy", "Brand Refresh"],
      direction: "Vibrant, Community-Focused & Modern",
    };
  }
  if (hay.includes("k.lee") || hay.includes("k-lee") || hay.includes("storefront")) {
    return {
      isCaseStudy: true,
      clientName: "K.LEE Essentials",
      industry: "Retail & E-Commerce",
      industryGroup: "Retail & Commercial" as const,
      deliverables: ["Digital Storefront", "Product Branding", "Social Launch"],
      direction: "Polished, Accessible & Conversion-Ready",
    };
  }
  if (hay.includes("pickleball") || hay.includes("pinktober") || hay.includes("freeway") || hay.includes("event")) {
    return {
      isCaseStudy: true,
      clientName: hay.includes("freeway")
        ? "Freeway Pickleball Tournament"
        : hay.includes("pinktober")
        ? "Clash of Clubs Pickleball"
        : "Live Event Production",
      industry: "Sports & Live Events",
      industryGroup: "Sports & Events" as const,
      deliverables: ["Event Identity", "Merch & Court Visuals", "Campaign Graphics"],
      direction: "High-Energy, Cohesive & Memorable",
    };
  }

  return {
    isCaseStudy,
    clientName: p.title?.split(":")[0]?.trim() || "Client Partner",
    industry: isCaseStudy ? "Brand & Digital Strategy" : p.category || "Insights",
    industryGroup: "Retail & Commercial" as const,
    deliverables: ["Brand Strategy", "Creative Direction", "Digital Execution"],
    direction: "Intentional, Clear & Results-Oriented",
  };
}

function Home() {
  const { posts } = usePosts();
  // (2026-07-13) Filter published portfolio stories for homepage. Prev: none
  const featuredProjects = useMemo(() => {
    return posts.filter(
      (p) =>
        p.status === "published" &&
        (p.include_in_portfolio ||
          p.portfolio_only ||
          p.slug?.toLowerCase().includes("aton") ||
          p.title?.toLowerCase().includes("aton"))
    );
  }, [posts]);
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
          {/* (2026-07-13) Expand cross-industry portfolio grid to 6; was 2 cards */}
          <div className="industry-proof-pills">
            <span>Proven across industries:</span>
            <b>Healthcare & Pharmacy</b>
            <b>Legal & Law Firms</b>
            <b>Shopping Malls & Retail</b>
            <b>Medical Practices</b>
            <b>Sports & Live Events</b>
          </div>
          {featuredProjects.length > 0 ? (
            <div className="projects-grid projects-grid-expanded">
              {featuredProjects.slice(0, 6).map((p, i) => {
                const meta = getProjectCaseStudyMeta(p);
                return (
                  <Link
                    className={`project-card project-${i % 2}`}
                    key={p.slug || p.id}
                    to={`/blog/${p.slug}`}
                  >
                    <div className="project-art">
                      {p.cover_image ? (
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="project-cover-img"
                          loading="lazy"
                        />
                      ) : (
                        <span>{p.title.slice(0, 2).toUpperCase()}</span>
                      )}
                      <div className="project-orbit" />
                    </div>
                    <div className="project-content">
                      <div className="project-badge-row">
                        <span className="project-type">{meta.industry}</span>
                        <span className="project-client-tag">{meta.clientName}</span>
                      </div>
                      <h3>{p.title}</h3>
                      <p>{p.excerpt || "Explore how we shaped strategy, identity, and digital execution for this project."}</p>
                      <div className="project-deliverables-row">
                        {meta.deliverables.map((d) => (
                          <span key={d} className="project-deliverable-chip">{d}</span>
                        ))}
                      </div>
                      <span className="project-view-case-link">
                        View case study <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </Link>
                );
              })}
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
      {/* (2026-07-13) Add client trust & industry testimonials section; was none */}
      <section className="section testimonials-section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <Eyebrow>Client trust & adaptability</Eyebrow>
              <h2>
                Tailored to the industry.
                <br />
                <em>Built to earn trust.</em>
              </h2>
            </div>
            <Link className="text-link" to="/contact">
              Start a conversation <ArrowRight size={14} />
            </Link>
          </div>
          {/* Industry testimonial cards grid */}
          <div className="testimonials-grid">
            {[
              {
                sector: "Healthcare & Pharmacy",
                client: "Dr. K Pharmacy & Medical Supplies",
                quote: "BaiNest translated complex medical and pharmacy messaging into a clean, approachable visual identity that patients immediately trust.",
                scope: "Brand Identity · Patient Education Graphics",
                slug: "clean-professional-and-approachable-dr-k-pharmacy-and-medical-supplies",
              },
              {
                sector: "Legal & Professional",
                client: "Aton & Aton Law Office",
                quote: "They respected the authority required for a law practice while giving our firm a modern, distinctive brand system that stands out.",
                scope: "Corporate Identity · Digital Presence",
                slug: "professional-by-nature-bold-by-design-aton-aton-law-office",
              },
              {
                sector: "Commercial & Retail",
                client: "Bogo City Centrum Mall & K.LEE",
                quote: "From established shopping centers to growing storefronts, the strategy and creative direction made our digital presence feel cohesive and active.",
                scope: "Digital Transformation · Social Campaigns",
                slug: "elevating-an-established-brand-the-bogo-city-centrum-mall-digital-transformation",
              },
            ].map((item) => (
              <article key={item.client} className="testimonial-card">
                <div className="testimonial-sector-pill">{item.sector}</div>
                <p className="testimonial-quote">“{item.quote}”</p>
                <div className="testimonial-footer">
                  <div>
                    <b>{item.client}</b>
                    <span>{item.scope}</span>
                  </div>
                  <Link to={`/blog/${item.slug}`} className="testimonial-case-link" title="View case study">
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </article>
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
/* (2026-07-13) Render live About edits with linebreaks & empty-field support. Prev: || flat */
function About() {
  const settings = useSettings();
  const heroLabel = settings.aboutHeroLabel ?? "About BaiNest";
  const heroTitle = settings.aboutHeroTitle ?? "Thoughtful partners for your next chapter.";
  const heroCopy = settings.aboutHeroCopy || undefined;
  const quote = settings.aboutQuote ?? "“Good work should feel clear from the first conversation to the final detail.”";
  const storyEyebrow = settings.aboutStoryEyebrow ?? "Our point of view";
  const storyTitle = settings.aboutStoryTitle ?? "Strategy and making, working as one.";
  const storyBody1 = settings.aboutStoryBody1 ?? "BaiNest is an independent digital studio for businesses ready to grow with intention. We connect the dots between what you stand for, what you make, and how people experience it.";
  const storyBody2 = settings.aboutStoryBody2 ?? "We believe the strongest work is generous with clarity, ambitious with purpose, and practical enough to make a real difference.";
  const valuesEyebrow = settings.aboutValuesEyebrow ?? "What guides us";
  const valuesTitle = settings.aboutValuesTitle ?? "Good work is good partnership.";

  const values = [
    {
      icon: ShieldCheck,
      title: settings.aboutValue1Title ?? "Care in the details",
      copy: settings.aboutValue1Copy ?? "Thoughtful craft earns trust one useful decision at a time.",
    },
    {
      icon: Layers3,
      title: settings.aboutValue2Title ?? "Connected thinking",
      copy: settings.aboutValue2Copy ?? "Strategy and execution belong in the same conversation.",
    },
    {
      icon: ArrowUpRight,
      title: settings.aboutValue3Title ?? "Momentum over noise",
      copy: settings.aboutValue3Copy ?? "We choose meaningful progress over busywork and buzzwords.",
    },
  ];

  return (
    <PageFrame>
      <PageHeading
        label={heroLabel}
        title={heroTitle}
        copy={heroCopy}
      />
      <section className="section">
        <div className="wrap about-story">
          <div className="about-quote">
            {renderWithLinebreaks(quote)}
          </div>
          <div>
            {storyEyebrow && <Eyebrow>{storyEyebrow}</Eyebrow>}
            {storyTitle && (
              <h2>
                {renderWithLinebreaks(storyTitle)}
              </h2>
            )}
            {storyBody1 && (
              <p>
                {renderWithLinebreaks(storyBody1)}
              </p>
            )}
            {storyBody2 && (
              <p>
                {renderWithLinebreaks(storyBody2)}
              </p>
            )}
            <Link className="text-link" to="/services">
              See how we can help <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="wrap values-grid">
          <div>
            {valuesEyebrow && <Eyebrow>{valuesEyebrow}</Eyebrow>}
            {valuesTitle && (
              <h2>
                {renderWithLinebreaks(valuesTitle)}
              </h2>
            )}
          </div>
          {values.map((v, idx) => (
            <article className="value-card" key={idx}>
              <v.icon />
              <h3>{v.title}</h3>
              <p>{renderWithLinebreaks(v.copy)}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBand />
    </PageFrame>
  );
}
/* (2026-07-13) Live editable Services page with optional images. Prev: static */
function Services() {
  const settings = useSettings();
  const heroLabel = settings.servicesHeroLabel || "OUR SERVICES";
  const heroTitle = settings.servicesHeroTitle || "We bring strategy, creativity, and digital solutions together.";
  const heroCopy = settings.servicesHeroCopy || "We bring strategy, creativity, and digital solutions together to help businesses build stronger brands, connect with their audience, and grow online.";
  const servicesList = settings.servicesList && settings.servicesList.length > 0 ? settings.servicesList : defaultServicesList;

  return (
    <PageFrame>
      <PageHeading
        label={heroLabel}
        title={heroTitle}
        copy={heroCopy}
      />
      <section className="section services-page-section">
        <div className="wrap services-cards-grid">
          {servicesList.map((s, idx) => {
            const Icon = serviceIconList[idx % serviceIconList.length] || Sparkles;
            return (
              <article className="service-card-revamp" key={s.no || idx}>
                {s.image && (
                  <div className="service-card-cover-wrap">
                    <img src={s.image} alt={s.title} className="service-card-cover" loading="lazy" />
                  </div>
                )}
                <div className="service-card-revamp-header">
                  <div className="service-card-badge-wrap">
                    <span className="service-card-revamp-no">{s.no}</span>
                    <div className="service-card-revamp-icon">
                      <Icon size={20} />
                    </div>
                  </div>
                  <h2 className="service-card-revamp-title">{s.title}</h2>
                  <p className="service-card-revamp-tagline">{s.text}</p>
                </div>
                <div className="service-card-capabilities">
                  <span className="service-capabilities-label">Capabilities & Deliverables</span>
                  <ul className="service-capabilities-list">
                    {s.items?.map((item) => (
                      <li key={item} className="service-capability-item">
                        <span className="capability-check-icon">
                          <Check size={12} />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="service-card-action">
                  {/* (2026-07-13) Rename CTA to Work with BaiNest. Prev: Start a project */}
                  <Link to="/contact" className="service-card-inquire-btn">
                    <span>Work with BaiNest on this</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="cta-band services-cta-revamp">
        <div className="wrap cta-inner">
          <div>
            <Eyebrow>{settings.servicesCtaEyebrow || "BAINEST DIGITAL MARKETING SERVICES"}</Eyebrow>
            <h2>
              {settings.servicesCtaTitle ? (
                renderWithLinebreaks(settings.servicesCtaTitle)
              ) : (
                <>
                  MORE THAN JUST
                  <br />
                  <em>DIGITAL MARKETING.</em>
                </>
              )}
            </h2>
            <p>
              {settings.servicesCtaCopy ||
                "We help businesses establish their identity, strengthen their online presence, and create meaningful connections with the people who matter."}
            </p>
            <div className="cta-brand-tagline">
              <span>Innovate.</span>
              <span className="tagline-dot">·</span>
              <span>Elevate.</span>
              <span className="tagline-dot">·</span>
              <span>Connect.</span>
            </div>
          </div>
          {/* (2026-07-13) Rename CTA to Work with BaiNest. Prev: Start a project */}
          <Link className="btn" to="/contact">
            Work with BaiNest <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
// (2026-07-13) Showcase real client portfolio stories with link. Prev: empty state
// (2026-07-13) Add industry filter & deliverable chips to Portfolio; was plain
function Portfolio() {
  const { posts } = usePosts();
  const [industryFilter, setIndustryFilter] = useState<string>("All Industries");
  const portfolioPosts = useMemo(() => {
    return posts.filter(
      (p) =>
        p.status === "published" &&
        (p.include_in_portfolio ||
          p.portfolio_only ||
          p.slug?.toLowerCase().includes("aton") ||
          p.title?.toLowerCase().includes("aton"))
    );
  }, [posts]);

  const industryTabs = [
    "All Industries",
    "Healthcare & Medical",
    "Legal & Corporate",
    "Retail & Commercial",
    "Sports & Events",
  ];

  const filteredPortfolio = useMemo(() => {
    if (industryFilter === "All Industries") return portfolioPosts;
    return portfolioPosts.filter((p) => getProjectCaseStudyMeta(p).industryGroup === industryFilter);
  }, [portfolioPosts, industryFilter]);

  return (
    <PageFrame>
      <PageHeading
        label="Portfolio"
        title="Work that adapts to your industry."
        copy="From pharmacies, medical practices, and law offices to shopping malls and sporting events—we tailor our creative direction to fit your audience, never forcing every client into one template."
      />
      <section className="section">
        <div className="wrap">
          {portfolioPosts.length > 0 && (
            <div className="category-chips-bar portfolio-industry-bar">
              {industryTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`category-chip ${industryFilter === tab ? "active" : ""}`}
                  onClick={() => setIndustryFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
          {filteredPortfolio.length > 0 ? (
            <div className="portfolio-gallery-grid">
              {filteredPortfolio.map((p) => {
                const meta = getProjectCaseStudyMeta(p);
                return (
                  <article key={p.id} className="portfolio-project-card">
                    <Link to={`/blog/${p.slug}`} className="portfolio-card-cover-wrap">
                      {p.cover_image ? (
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="portfolio-card-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="portfolio-card-cover-fallback">
                          <span>{p.title.slice(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="portfolio-badge-pill">{meta.industry}</span>
                    </Link>
                    <div className="portfolio-card-content">
                      <div className="portfolio-card-meta">
                        <b>{meta.clientName}</b>
                        {p.published_at && (
                          <time dateTime={p.published_at}>
                            ·{" "}
                            {new Date(p.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        )}
                      </div>
                      <h3>
                        <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                      </h3>
                      {p.excerpt && <p className="portfolio-card-excerpt">{p.excerpt}</p>}
                      <div className="project-deliverables-row">
                        {meta.deliverables.map((d) => (
                          <span key={d} className="project-deliverable-chip">{d}</span>
                        ))}
                      </div>
                      <Link to={`/blog/${p.slug}`} className="portfolio-card-cta">
                        View case study <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
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
          )}
        </div>
      </section>
      <CtaBand />
    </PageFrame>
  );
}
// (2026-07-13) Blue back to top button for all blog views. Prev: none
function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 250) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top-blue-btn"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}

// (2026-07-13) Blogs page with category chips and card images. Prev: The journal
function Blog() {
  const { posts, loading } = usePosts();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  // (2026-07-13) Exclude portfolio-only posts from blog. Prev: all posts
  const blogPosts = useMemo(
    () => posts.filter((p) => !p.portfolio_only),
    [posts]
  );

  // (2026-07-13) Hide and disable tags in blog filter; was categories + tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    blogPosts.forEach((p) => {
      if (p.category) {
        const cat = p.category.trim();
        set.add(cat.toLowerCase().includes("case study") ? "Work" : cat);
      }
    });
    return ["All", ...Array.from(set)];
  }, [blogPosts]);

  const filtered = useMemo(() => {
    return blogPosts.filter((p) => {
      const matchesQuery = `${p.title} ${p.excerpt} ${p.category}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const pCat = (p.category || "").toLowerCase();
      const isWorkCategory = pCat.includes("case study") || pCat === "work";
      const matchesTag =
        selectedTag === "All" ||
        (selectedTag.toLowerCase() === "work"
          ? isWorkCategory
          : pCat === selectedTag.toLowerCase());
      return matchesQuery && matchesTag;
    });
  }, [blogPosts, query, selectedTag]);

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
// (2026-07-13) Fix Fragment usage without React namespace. Prev: React.Fragment
// (2026-07-13) Clean escaped backslashes & format lines. Prev: raw text
function renderWithLinebreaks(text?: string) {
  if (!text) return null;
  const sanitized = text.replace(/\\([.!?,:;'"#*_\-()[\]{}])/g, "$1");
  const lines = sanitized.split(/(?:<br\s*\/?>|\r?\n)/gi);
  return lines.map((line, idx) => (
    <Fragment key={idx}>
      {line}
      {idx < lines.length - 1 && <br />}
    </Fragment>
  ));
}

// (2026-07-13) Render blog blocks with line break preservation. Prev: flat text
function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="post-body">
      {blocks.map((b, i) => {
        if (b.type === "heading") return <h2 key={i}>{renderWithLinebreaks(b.text)}</h2>;
        if (b.type === "paragraph") return <p key={i}>{renderWithLinebreaks(b.text)}</p>;
        if (b.type === "quote")
          return <blockquote key={i}>{renderWithLinebreaks(b.text)}</blockquote>;
        if (b.type === "columns")
          return (
            <div className="post-columns" key={i}>
              <p>{renderWithLinebreaks(b.left)}</p>
              <p>{renderWithLinebreaks(b.right)}</p>
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
        // (2026-07-13) Fix WebKit data URL rendering with async decoding. Prev: lazy
        if (b.type === "image") {
          const rawSrc = (b.src || "").trim();
          if (!rawSrc || rawSrc.startsWith("blob:")) return null;
          const isDataUri = rawSrc.startsWith("data:");
          return (
            <figure key={i} className="post-figure-image">
              <img
                src={rawSrc}
                alt={b.alt || ""}
                loading={isDataUri ? "eager" : "lazy"}
                decoding="async"
                onError={(e) => {
                  const fig = e.currentTarget.closest("figure");
                  if (fig) fig.style.display = "none";
                }}
              />
              {b.caption && <figcaption>{b.caption}</figcaption>}
            </figure>
          );
        }
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
  // (2026-07-13) Manage, persist, and admin-delete blog story comments. Prev: persist only
  interface BlogComment {
    id: string;
    name: string;
    text: string;
    date: string;
  }
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [commentDone, setCommentDone] = useState(false);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    api<{ authenticated: boolean }>("/api/admin/session")
      .then((s) => setIsAdmin(Boolean(s?.authenticated)))
      .catch(() => setIsAdmin(false));
  }, []);

  // (2026-07-13) Keep only real per-article comments; was seeded defaults
  const normalizedSlug = slug.trim().toLowerCase();
  const articleCommentKey = `bainest_real_comments_${normalizedSlug || "default"}`;
  const isCurrentPost = Boolean(
    post &&
      ((post.slug && post.slug.toLowerCase() === normalizedSlug) ||
        String(post.id).toLowerCase() === normalizedSlug)
  );

  const cleanRealComments = (list: unknown): BlogComment[] => {
    if (!Array.isArray(list)) return [];
    return list.filter((c: any) => {
      if (!c || typeof c.id !== "string" || typeof c.text !== "string") return false;
      if (c.id === "c1" || c.id === "c2" || c.id.endsWith("_c1") || c.id.endsWith("_c2")) return false;
      return true;
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    localStorage.setItem(articleCommentKey, JSON.stringify(updated));
    const targetKey = isCurrentPost && post?.id ? String(post.id) : normalizedSlug;
    if (targetKey) {
      api(`/api/posts/${encodeURIComponent(targetKey)}/comments`, {
        method: "PUT",
        body: JSON.stringify({ comments: updated }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!normalizedSlug) {
      setComments([]);
      return;
    }
    let localList: BlogComment[] = [];
    try {
      const saved = localStorage.getItem(articleCommentKey);
      if (saved) localList = cleanRealComments(JSON.parse(saved));
    } catch {}

    if (isCurrentPost && post && Array.isArray(post.comments)) {
      const remoteList = cleanRealComments(post.comments);
      setComments(remoteList);
      localStorage.setItem(articleCommentKey, JSON.stringify(remoteList));
      return;
    }

    setComments(localList);
  }, [normalizedSlug, articleCommentKey, isCurrentPost, post?.id, post?.comments]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment: BlogComment = {
      id: `c_${Date.now()}`,
      name: commentName.trim() || "Reader",
      text: commentText.trim(),
      date: "Just now",
    };
    const updated = [newComment, ...cleanRealComments(comments)];
    setComments(updated);
    localStorage.setItem(articleCommentKey, JSON.stringify(updated));
    const targetKey = isCurrentPost && post?.id ? String(post.id) : normalizedSlug;
    if (targetKey) {
      api(`/api/posts/${encodeURIComponent(targetKey)}/comments`, {
        method: "PUT",
        body: JSON.stringify({ comments: updated, incrementEngagement: true }),
      }).catch(() => {});
    }
    setCommentDone(true);
    setCommentText("");
    setCommentName("");
    setTimeout(() => setCommentDone(false), 5000);
  };

  const { posts: allPosts } = usePosts();

  // (2026-07-13) Sync post live with real-time posts subscription. Prev: static
  useEffect(() => {
    if (!preview && slug && allPosts.length > 0) {
      const lower = slug.toLowerCase();
      const live = allPosts.find(
        (p) =>
          (p.slug && p.slug.toLowerCase() === lower) ||
          String(p.id).toLowerCase() === lower
      );
      if (live) {
        setPost(live);
        setLoading(false);
      }
    }
  }, [allPosts, slug, preview]);

  useEffect(() => {
    setLoading(true);
    const endpoint =
      preview && previewId
        ? `/api/admin/posts/${encodeURIComponent(previewId)}/preview`
        : `/api/posts/${encodeURIComponent(slug)}`;
    api<Post>(endpoint)
      .then((p) => {
        setPost(p);
        // (2026-07-13) Track post views and shares in PostDetail. Prev: none
        if (p?.id && !preview) {
          api(`/api/posts/${p.id}/view`, { method: "POST" }).catch(() => {});
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, preview, previewId]);

  // (2026-07-13) Exclude portfolio-only posts from related & latest. Prev: published
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allPosts
      .filter((p) => p.id !== post.id && p.status === "published" && !p.portfolio_only)
      .slice(0, 3);
  }, [allPosts, post]);

  const latestPosts = useMemo(() => {
    return allPosts.filter((p) => p.status === "published" && !p.portfolio_only).slice(0, 4);
  }, [allPosts]);

  // (2026-07-13) Rank top 5 popular posts by views & engagement; was latest 4
  const popularPosts = useMemo(() => {
    return [...allPosts]
      .filter((p) => p.status === "published" && !p.portfolio_only)
      .sort((a, b) => {
        const viewsA = typeof a.views === "number" && a.views > 0 ? Math.floor(a.views) : 0;
        const sharesA = typeof a.shares === "number" && a.shares > 0 ? Math.floor(a.shares) : 0;
        const viewsB = typeof b.views === "number" && b.views > 0 ? Math.floor(b.views) : 0;
        const sharesB = typeof b.shares === "number" && b.shares > 0 ? Math.floor(b.shares) : 0;
        const scoreA = viewsA + sharesA;
        const scoreB = viewsB + sharesB;
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (viewsB !== viewsA) return viewsB - viewsA;
        return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
      })
      .slice(0, 5);
  }, [allPosts]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function trackShare() {
    if (post?.id) {
      api(`/api/posts/${post.id}/share`, { method: "POST" }).catch(() => {});
    }
  }

  function copyShareLink() {
    trackShare();
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

  // (2026-07-13) Add structured case-study overview & CTA; was plain blog view
  const caseMeta = getProjectCaseStudyMeta(post);

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
            <Link to={caseMeta.isCaseStudy ? "/portfolio" : "/blog"}>
              {caseMeta.isCaseStudy ? "Portfolio" : "Blogs"}
            </Link>
            <ChevronRight size={13} />
            <span>{post.title}</span>
          </div>

          <header className="post-detail-header">
            {caseMeta.isCaseStudy && (
              <div className="case-study-eyebrow-row">
                <span className="case-study-sector-badge">{caseMeta.industry}</span>
                <span className="case-study-direction-tag">{caseMeta.direction}</span>
              </div>
            )}
            <h1>{post.title}</h1>
            <div className="post-meta-row">
              <span className="post-meta-author">
                By <b>{post.author || "BaiNest"}</b>
              </span>
              <span className="meta-sep">·</span>
              <time className="post-meta-date">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Draft"}
              </time>
              {post.category && (
                <>
                  <span className="meta-sep">·</span>
                  {/* (2026-07-13) Display Work badge instead of Case study. Prev: post.category */}
                  <span className="post-meta-cat">{caseMeta.isCaseStudy ? caseMeta.industry : post.category}</span>
                </>
              )}
            </div>
          </header>

          {post.cover_image && (
            <div className="post-featured-hero">
              <img src={post.cover_image} alt={post.title} />
            </div>
          )}

          {caseMeta.isCaseStudy && (
            /* Case study project snapshot bar */
            <div className="case-study-meta-strip">
              <div className="case-meta-col">
                <small>Client / Partner</small>
                <b>{caseMeta.clientName}</b>
              </div>
              <div className="case-meta-col">
                <small>Industry Sector</small>
                <b>{caseMeta.industry}</b>
              </div>
              <div className="case-meta-col">
                <small>Creative Direction</small>
                <b>{caseMeta.direction}</b>
              </div>
              <div className="case-meta-col">
                <small>Scope & Deliverables</small>
                <div className="case-meta-chips">
                  {caseMeta.deliverables.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* (2026-07-13) Support linebreaks in post lead excerpt. Prev: flat text */}
          {post.excerpt && <p className="post-lead-excerpt">{renderWithLinebreaks(post.excerpt)}</p>}

          <div className="post-content-blocks">
            <BlockRenderer blocks={post.blocks || []} />
          </div>

          {caseMeta.isCaseStudy && (
            /* Persuasive project conversion card */
            <div className="case-study-cta-banner">
              <div className="case-study-cta-copy">
                <span className="case-cta-eyebrow">Work with BaiNest</span>
                <h3>Want this level of clarity and creative direction for your brand?</h3>
                <p>
                  We adapt our strategy and visual identity systems to fit your industry—whether you lead a healthcare practice, law firm, retail brand, or live event.
                </p>
              </div>
              <div className="case-study-cta-actions">
                <Link to="/contact" className="btn">
                  Start a project like this <ArrowRight size={15} />
                </Link>
                <Link to="/portfolio" className="btn btn-outline">
                  View more client work
                </Link>
              </div>
            </div>
          )}

          {/* (2026-07-13) Single-row symmetrical share bar buttons. Prev: wrapped row */}
          <div className="post-share-bar">
            <span className="share-bar-label" title="Share this story">
              <Share2 size={16} />
            </span>
            <div className="share-buttons-group">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="share-btn share-fb"
                title="Share on Facebook"
                aria-label="Share on Facebook"
                onClick={trackShare}
              >
                <Facebook size={16} />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noreferrer"
                className="share-btn share-tw"
                title="Share on Twitter"
                aria-label="Share on Twitter"
                onClick={trackShare}
              >
                <Twitter size={16} />
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="share-btn share-wa"
                title="Share on WhatsApp"
                aria-label="Share on WhatsApp"
                onClick={trackShare}
              >
                <MessageCircle size={16} />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareUrl)}`}
                className="share-btn share-em"
                title="Share via Email"
                aria-label="Share via Email"
                onClick={trackShare}
              >
                <Mail size={16} />
              </a>
              <button
                type="button"
                className={`share-btn share-cp ${copied ? "copied" : ""}`}
                onClick={copyShareLink}
                title={copied ? "Link copied to clipboard!" : "Copy page link"}
                aria-label="Copy page link"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {copied && <span className="share-copied-notice">Link copied!</span>}
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

          {/* (2026-07-13) Display all comments and persistent comment form. Prev: hidden */}
          <div className="comment-section-card">
            <h3>Post a Comment &gt;</h3>
            {commentDone && (
              <div className="comment-success-notice">
                <Check size={16} /> Thank you! Your comment has been posted successfully.
              </div>
            )}
            <form className="comment-form" onSubmit={handleCommentSubmit}>
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

            <div className="comments-display-section">
              <div className="comments-display-header">
                <span className="comments-title-count">
                  <MessageCircle size={16} /> Comments ({comments.length})
                </span>
              </div>
              <div className="comments-feed-list">
                {comments.map((c) => (
                  <div key={c.id} className="comment-item-card">
                    <div className="comment-avatar">
                      {(c.name || "R").charAt(0).toUpperCase()}
                    </div>
                    <div className="comment-details">
                      <div className="comment-header-row">
                        <span className="comment-author-name">{c.name}</span>
                        <div className="comment-header-actions">
                          <span className="comment-date-tag">{c.date}</span>
                          {isAdmin && (
                            <button
                              type="button"
                              className="comment-delete-admin-btn"
                              onClick={() => handleDeleteComment(c.id)}
                              title="Delete comment as Admin"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="comment-body-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

          {/* (2026-07-13) Render top 5 popular posts by views+shares; was latestPosts */}
          {popularPosts.length > 0 && (
            <div className="sidebar-widget-card">
              <h3 className="widget-title">Popular Posts</h3>
              <div className="popular-posts-list">
                {popularPosts.map((pp, idx) => (
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
// (2026-07-13) Contact with confirmation email receipt and icons. Prev: plain form
function Contact() {
  const [sent, setSent] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    company: string;
    message: string;
    submittedAt: string;
    referenceId: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const settings = useSettings();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setError("");
    setBusy(true);
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const company = String(form.get("company") || "").trim();
    const message = String(form.get("message") || "").trim();
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const refId = `BN-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // (2026-07-13) Add timestamp to contact form submissions. Prev: none
      await api("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          company,
          message,
          created_at: new Date().toISOString(),
        }),
      });
      setSubmittedData({
        name,
        email,
        company,
        message,
        submittedAt: formattedDate,
        referenceId: refId,
      });
      setSent(true);
      formElement.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  /* (2026-07-13) Remove page-hero from contact page. Prev: PageHeading */
  return (
    <PageFrame>
      <section className="section contact-page-section">
        <div className="wrap contact-grid">
          <div className="contact-aside">
            <Eyebrow>{settings.contactSidebarEyebrow || "Start here"}</Eyebrow>
            <h2>
              {settings.contactSidebarTitle ? (
                renderWithLinebreaks(settings.contactSidebarTitle)
              ) : (
                <>
                  Good things start
                  <br />
                  with a <em>hello.</em>
                </>
              )}
            </h2>
            <p>
              {settings.contactSidebarCopy ||
                "Use the form to tell us a bit about your goals, timing, or the question you’re trying to answer."}
            </p>

            {/* Requested Pillars with improved icons */}
            <div className="contact-pillar-card">
              <div className="pillar-icon-badge">
                <Target size={20} />
                <span className="pillar-num-tag">01</span>
              </div>
              <div className="pillar-body">
                <h4>{settings.contactPillar1Title || "Built around your goals."}</h4>
                <p>
                  {settings.contactPillar1Text ||
                    "We take time to understand your brand, audience, and business objectives."}
                </p>
              </div>
            </div>

            <div className="contact-pillar-card">
              <div className="pillar-icon-badge">
                <Sparkles size={20} />
                <span className="pillar-num-tag">02</span>
              </div>
              <div className="pillar-body">
                <h4>{settings.contactPillar2Title || "Strategy starts with a conversation."}</h4>
                <p>
                  {settings.contactPillar2Text ||
                    "Tell us what you need. We'll help you explore the right solutions for your business."}
                </p>
              </div>
            </div>

            {/* (2026-07-13) Upgrade direct contact links with icons. Prev: plain text */}
            <div className="contact-direct-card">
              <h5>Direct Inquiries</h5>
              <a href={`mailto:${settings.email || "bainestph@gmail.com"}`} className="direct-link">
                <Mail size={16} /> <span>{settings.email || "bainestph@gmail.com"}</span>
              </a>
              {(settings.phone || "09622302015") && (
                <a href={`tel:${settings.phone || "09622302015"}`} className="direct-link">
                  <Phone size={16} /> <span>{settings.phone || "09622302015"}</span>
                </a>
              )}
            </div>
          </div>
          {sent && submittedData ? (
            /* (2026-07-13) Confirmation email receipt with customer details. Prev: plain box */
            <div className="confirmation-email-card">
              <div className="confirmation-email-topbar">
                <div className="confirmation-email-badge">
                  <MailCheck size={16} /> Confirmation Email Dispatched
                </div>
                <span className="confirmation-ref">Ref #{submittedData.referenceId}</span>
              </div>

              <div className="confirmation-email-envelope">
                <div className="confirmation-email-header">
                  <div className="email-meta-field">
                    <span className="email-meta-label">From:</span>
                    <span className="email-meta-val">
                      BaiNest Digital Marketing &lt;contact@bainestdigital.com&gt;
                    </span>
                  </div>
                  <div className="email-meta-field">
                    <span className="email-meta-label">To:</span>
                    <span className="email-meta-val">
                      <strong>{submittedData.name}</strong> &lt;{submittedData.email}&gt;
                    </span>
                  </div>
                  <div className="email-meta-field">
                    <span className="email-meta-label">Date:</span>
                    <span className="email-meta-val">{submittedData.submittedAt}</span>
                  </div>
                  <div className="email-meta-field">
                    <span className="email-meta-label">Subject:</span>
                    <span className="email-meta-subject">
                      Inquiry Confirmation: We received your message, {submittedData.name}!
                    </span>
                  </div>
                </div>

                <div className="confirmation-email-body">
                  <p className="email-greeting">Hi {submittedData.name},</p>
                  <p className="email-intro">
                    Thank you for getting in touch with BaiNest Digital Marketing Agency. We've logged your request in our direct inquiry pipeline and our team in Bogo City is reviewing your goals.
                  </p>

                  <div className="email-summary-box">
                    <div className="summary-box-title">
                      <FileText size={15} /> Summary of your submission:
                    </div>
                    <div className="summary-detail-row">
                      <span className="summary-label">Name:</span>
                      <span className="summary-value">{submittedData.name}</span>
                    </div>
                    <div className="summary-detail-row">
                      <span className="summary-label">Email:</span>
                      <span className="summary-value">{submittedData.email}</span>
                    </div>
                    {submittedData.company && (
                      <div className="summary-detail-row">
                        <span className="summary-label">Company:</span>
                        <span className="summary-value">{submittedData.company}</span>
                      </div>
                    )}
                    <div className="summary-detail-row message-block">
                      <span className="summary-label">What you'd like to work on:</span>
                      <blockquote className="summary-message-quote">
                        "{submittedData.message}"
                      </blockquote>
                    </div>
                  </div>

                  <div className="email-next-steps">
                    <div className="next-step-row">
                      <Clock size={16} />
                      <span><strong>Expected Reply:</strong> Within 24 business hours directly to {submittedData.email}.</span>
                    </div>
                    <div className="next-step-row">
                      <Sparkles size={16} />
                      <span><strong>Next:</strong> We'll propose strategic recommendations or schedule an introductory chat.</span>
                    </div>
                  </div>

                  <div className="email-signature">
                    <p>Warm regards,</p>
                    <strong>Jan Errol Duazo &amp; The BaiNest Team</strong>
                    <small>Innovate. Elevate. Connect.</small>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="success-reset-btn"
                onClick={() => {
                  setSent(false);
                  setSubmittedData(null);
                }}
              >
                <RotateCcw size={15} /> Send another message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit}>
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
            </form>
          )}
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
      <Routes key={location.pathname}>
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
      {!admin && <Footer />}
      {/* (2026-07-13) Global sticky back to top button in root App. Prev: in page */}
      {!admin && <BackToTopButton />}
    </>
  );
}
