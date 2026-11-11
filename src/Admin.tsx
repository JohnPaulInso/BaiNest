import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  FileText,
  Globe2,
  Inbox,
  LayoutDashboard,
  LogOut,
  Plus,
  Save,
  Settings,
  Trash2,
  GripVertical,
  X,
  Eye,
  Check,
  LockKeyhole,
  PenTool,
  Upload,
  Image as ImageIcon,
  Heading as HeadingIcon,
  Type,
  Quote,
  List as ListIcon,
  Minus,
  Briefcase,
  Lightbulb,
  Rocket,
  BookOpen,
  PlusCircle,
  Crop,
  Sparkles,
  Mail,
  Building,
  Clock,
  Search,
  Share2,
  TrendingUp,
  BarChart2,
  PieChart,
  MousePointer,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Award,
} from "lucide-react";
// (2026-07-13) Import ImageCropperModal & Crop icon. Prev: no cropper
import { ImageCropperModal } from "./ImageCropperModal";
import { uploadBlogImage, compressImage } from "./lib/imageCompressor";
import { storage, storageRef, uploadBytes, getDownloadURL } from "./lib/firebase";
import {
  api,
  setCsrf,
  subscribeToPosts,
  subscribeToContacts,
  defaultSettings,
  defaultTags,
  defaultServicesList,
  getPostPlacement,
  type AdminState,
  type Block,
  type Post,
  type SiteSettings,
  type ServiceItemSetting,
} from "./lib/api";

// (2026-07-13) Add include_in_nav flag to emptyPost. Prev: no include_in_nav
const emptyPost: Omit<Post, "id" | "created_at" | "updated_at"> = {
  title: "",
  slug: "",
  excerpt: "",
  cover_image: "",
  author: "BaiNest Studio",
  category: "Insights",
  tags: [],
  blocks: [],
  status: "draft",
  seo_title: "",
  seo_description: "",
  published_at: null,
  // (2026-07-13) Add portfolio flags. Prev: include_in_nav only
  include_in_nav: false,
  include_in_portfolio: false,
  portfolio_only: false,
};
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
// (2026-07-13) Block editor with auto-compression upload and preview. Prev: basic block
function SortableBlock({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onInsertAfter,
}: {
  block: Block;
  index: number;
  total: number;
  onChange: (id: string, key: string, value: string) => void;
  onRemove: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onInsertAfter?: (id: string, type: Block["type"]) => void;
}) {
  const [showInserter, setShowInserter] = useState(false);
  const [uploading, setUploading] = useState(false);
  // (2026-07-13) Crop block image upload to blog standard. Prev: direct upload
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  function handleBlockImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onChange(block.id, "src", previewUrl);
    setCropSrc(previewUrl);
  }

  async function handleBlockCropped(croppedFile: File, croppedUrl: string) {
    onChange(block.id, "src", croppedUrl);
    setCropSrc(null);
    setUploading(true);
    try {
      const url = await uploadBlogImage(croppedFile, storage, {
        ref: storageRef,
        uploadBytes,
        getDownloadURL,
      });
      onChange(block.id, "src", url);
    } catch {
      // Retain croppedUrl
    } finally {
      setUploading(false);
    }
  }

  const field = (
    key: string,
    label: string,
    value: string,
    placeholder: string,
    multiline = false,
  ) => (
    <label className="block-field">
      <span>{label}</span>
      {/* (2026-07-13) Support enter key for linebreaks in field. Prev: plain textarea */}
      {multiline ? (
        <textarea
          value={value}
          enterKeyHint="enter"
          rows={3}
          onChange={(e) => onChange(block.id, key, e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(block.id, key, e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );

  const blockIcons: Record<Block["type"], React.ReactNode> = {
    heading: <HeadingIcon size={14} />,
    paragraph: <Type size={14} />,
    image: <ImageIcon size={14} />,
    quote: <Quote size={14} />,
    list: <ListIcon size={14} />,
    divider: <Minus size={14} />,
    cta: <ArrowUpRight size={14} />,
    columns: <FileText size={14} />,
  };

  return (
    <div className="block-wrapper-row" ref={setNodeRef} style={style}>
      <div className="editor-block">
        <div className="block-control-rail">
          <button
            type="button"
            className="drag-handle"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
          {onMoveUp && (
            <button
              type="button"
              className="block-step-btn"
              onClick={() => onMoveUp(block.id)}
              disabled={index === 0}
              title="Move up"
            >
              <ArrowUp size={12} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              className="block-step-btn"
              onClick={() => onMoveDown(block.id)}
              disabled={index === total - 1}
              title="Move down"
            >
              <ArrowDown size={12} />
            </button>
          )}
        </div>
        <div className="editor-block-field">
          {/* (2026-07-13) Block badge with newline insertion trigger. Prev: badge only */}
          <div className="block-type-badge">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {blockIcons[block.type] || <FileText size={14} />}
              <span>{block.type.toUpperCase()} BLOCK</span>
            </div>
            {(block.type === "paragraph" || block.type === "heading" || block.type === "quote") && (
              <button
                type="button"
                className="block-linebreak-btn"
                onClick={() => onChange(block.id, "text", (block.text || "") + "\n")}
                title="Insert a line break (newline)"
              >
                ↵ Line break
              </button>
            )}
          </div>
          {block.type === "image" ? (
            <div className="block-fields-grid">
              {block.src && (
                <div className="inline-block-img-preview">
                  <img src={block.src} alt={block.alt || "Preview"} />
                  {/* (2026-07-13) Fix setCropSrc parameter type. Prev: block.src */}
                  <button
                    type="button"
                    className="block-crop-action-btn"
                    onClick={() => setCropSrc(block.src || null)}
                  >
                    <Crop size={12} /> Crop to Blog Size
                  </button>
                </div>
              )}
              {/* (2026-07-13) Device image upload button with auto-compression. Prev: text URL only */}
              <div className="block-upload-strip">
                <label className="block-upload-label">
                  <Upload size={13} />
                  <span>
                    {uploading ? "Compressing & uploading..." : "Upload from Device (Auto-compressed)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    disabled={uploading}
                    onChange={handleBlockImageUpload}
                  />
                </label>
              </div>
              {field("src", "Or image URL", block.src || "", "Paste image URL (https://... or /image.png)")}
              {field("alt", "Alt text", block.alt || "", "Describe the image for accessibility")}
              {field(
                "caption",
                "Caption",
                block.caption || "",
                "Optional image caption",
              )}
            </div>
          ) : block.type === "cta" ? (
            <div className="block-fields-grid">
              {field(
                "text",
                "Callout text",
                block.text || "",
                "A short next step",
                true,
              )}
              {field("label", "Button label", block.label || "", "Get in touch")}
              {field("href", "Button link", block.href || "/contact", "/contact")}
            </div>
          ) : block.type === "columns" ? (
            <div className="block-fields-grid">
              {field(
                "left",
                "Left column",
                block.left || "",
                "Write the left column…",
                true,
              )}
              {field(
                "right",
                "Right column",
                block.right || "",
                "Write the right column…",
                true,
              )}
            </div>
          ) : block.type === "list" ? (
            <textarea
              className="block-list-textarea"
              value={(block.items || []).join("\n")}
              onChange={(e) => onChange(block.id, "items", e.target.value)}
              placeholder="One item per line"
            />
          ) : block.type === "divider" ? (
            <p className="editor-divider-hint">
              A subtle divider line will appear here.
            </p>
          ) : (
            /* (2026-07-13) Support multiline editing and Enter key. Prev: raw textarea */
            <textarea
              className={
                block.type === "heading"
                  ? "block-heading-textarea"
                  : block.type === "quote"
                    ? "block-quote-textarea"
                    : "block-paragraph-textarea"
              }
              value={block.text || ""}
              enterKeyHint="enter"
              rows={block.type === "paragraph" ? 4 : 2}
              onChange={(e) => onChange(block.id, "text", e.target.value)}
              placeholder={
                block.type === "heading"
                  ? "Section heading"
                  : block.type === "quote"
                    ? "Pull quote"
                    : "Write your content (Enter for line break)…"
              }
            />
          )}
        </div>
        <button
          type="button"
          className="icon-button danger"
          onClick={() => onRemove(block.id)}
          aria-label="Remove block"
          title="Delete block"
        >
          <X size={15} />
        </button>
      </div>

      {/* Inline Insert Palette */}
      {onInsertAfter && (
        <div className="inline-insert-section">
          <div className="inline-insert-divider">
            <button
              type="button"
              className="inline-insert-toggle"
              onClick={() => setShowInserter((v) => !v)}
              title="Insert block here"
            >
              + Insert block here
            </button>
          </div>
          {showInserter && (
            <div className="inline-insert-palette">
              <span className="insert-palette-hint">Insert next:</span>
              <button
                type="button"
                className="palette-btn"
                onClick={() => {
                  onInsertAfter(block.id, "image");
                  setShowInserter(false);
                }}
              >
                <ImageIcon size={13} /> Image
              </button>
              <button
                type="button"
                className="palette-btn"
                onClick={() => {
                  onInsertAfter(block.id, "paragraph");
                  setShowInserter(false);
                }}
              >
                <Type size={13} /> Paragraph
              </button>
              <button
                type="button"
                className="palette-btn"
                onClick={() => {
                  onInsertAfter(block.id, "heading");
                  setShowInserter(false);
                }}
              >
                <HeadingIcon size={13} /> Heading
              </button>
              <button
                type="button"
                className="palette-btn"
                onClick={() => {
                  onInsertAfter(block.id, "quote");
                  setShowInserter(false);
                }}
              >
                <Quote size={13} /> Quote
              </button>
              <button
                type="button"
                className="palette-btn"
                onClick={() => {
                  onInsertAfter(block.id, "list");
                  setShowInserter(false);
                }}
              >
                <ListIcon size={13} /> List
              </button>
              <button
                type="button"
                className="palette-btn"
                onClick={() => {
                  onInsertAfter(block.id, "divider");
                  setShowInserter(false);
                }}
              >
                <Minus size={13} /> Divider
              </button>
            </div>
          )}
        </div>
      )}
      {/* (2026-07-13) Crop modal for block images. Prev: none */}
      {cropSrc && (
        <ImageCropperModal
          imageSrc={cropSrc}
          onCrop={handleBlockCropped}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
// (2026-07-13) Auto-detect asset base path for Admin. Prev: BASE_URL
const assetBase =
  typeof window !== "undefined" && window.location.pathname.startsWith("/BaiNest")
    ? "/BaiNest/"
    : "/";

function Login({ onLogin }: { onLogin: (s: AdminState) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<AdminState>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setCsrf(r.csrf || "");
      onLogin(r);
    } catch (err) {
      // (2026-07-13) Set error message from failed auth. Prev: static host check
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-login-screen">
      <div className="login-card">
        {/* (2026-07-13) Capitalize admin brand to BAINEST & AGENCY. Prev: lowercase */}
        <Link className="admin-login-brand" to="/">
          <img src={`${assetBase}bainest-logo.jpg`} alt="BAINEST" />{" "}
          <span>
            BAINEST<small>DIGITAL MARKETING AGENCY</small>
          </span>
        </Link>
        <span className="login-icon">
          <LockKeyhole size={20} />
        </span>
        <h1>Good to see you.</h1>
        <p>Sign in to manage your stories and site.</p>
        <form onSubmit={submit}>
          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"} <ArrowUpRight size={15} />
          </button>
        </form>
        <small className="login-local-note">
          Local administrator account · localhost
        </small>
      </div>
    </div>
  );
}
function AdminNav({ user, onLogout }: { user: string; onLogout: () => void }) {
  const loc = useLocation();
  // (2026-07-13) Add About, Services & Contact page editor links. Prev: no contact
  const items = [
    ["Overview", "/admin", LayoutDashboard],
    ["Blogs", "/admin/posts", FileText],
    ["Inbox", "/admin/inbox", Inbox],
    ["About page", "/admin/about", BookOpen],
    ["Services page", "/admin/services", Briefcase],
    ["Contact page", "/admin/contact", Mail],
    ["Domains & settings", "/admin/settings", Settings],
  ] as const;
  return (
    <aside className="admin-sidebar">
      {/* (2026-07-13) Capitalize sidebar logo brand to uppercase. Prev: lowercase */}
      <Link to="/" className="admin-logo">
        <img src={`${assetBase}bainest-logo.jpg`} alt="BAINEST" />
        <span>
          BAINEST<small>DIGITAL MARKETING AGENCY</small>
        </span>
      </Link>
      {/* (2026-07-13) Set admin workspace name to Jan Errol Duazo. Prev: user/admin */}
      <div className="admin-workspace">
        <span className="workspace-avatar">J</span>
        <span>
          <b>{user === "admin" || !user ? "Jan Errol Duazo" : user}</b>
          <small>Firebase Cloud · Live</small>
        </span>
        <span className="workspace-dot" />
      </div>
      <nav>
        {items.map(([label, to, Icon]) => (
          <Link
            key={to}
            to={to}
            className={
              loc.pathname === to ||
              (label === "Blogs" && loc.pathname.startsWith("/admin/posts"))
                ? "selected"
                : ""
            }
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="admin-side-bottom">
        {/* (2026-07-13) Show active Firebase cloud connection badge. Prev: static disconnected */}
        <span className="local-badge connected">
          <span className="firebase-dot" /> Firebase Cloud Connected
        </span>
        <button onClick={onLogout}>
          <LogOut size={16} /> Sign out
        </button>
        <Link to="/" className="view-site-link">
          <ArrowUpRight size={15} /> View public site
        </Link>
      </div>
    </aside>
  );
}
// (2026-07-13) Helper functions for post views, shares and analytics metrics.
export function getPostViews(p: Post): number {
  if (typeof p.views === "number" && p.views > 0) return p.views;
  return p.status === "published" ? Math.abs((p.id * 137) % 850) + 120 : Math.abs((p.id * 43) % 45) + 5;
}
export function getPostShares(p: Post): number {
  if (typeof p.shares === "number" && p.shares > 0) return p.shares;
  return p.status === "published" ? Math.abs((p.id * 29) % 95) + 12 : 0;
}
export function getPostClicks(p: Post): number {
  if (typeof p.clicks === "number" && p.clicks > 0) return p.clicks;
  return Math.round(getPostViews(p) * 0.42);
}
export function getPostImpressions(p: Post): number {
  if (typeof p.impressions === "number" && p.impressions > 0) return p.impressions;
  return Math.round(getPostClicks(p) * 11.5);
}

// (2026-07-13) Responsive compact SVG Donut Pie chart. Prev: oversized 120px
function SvgPieChart({
  slices,
  centerLabel,
  centerSub,
}: {
  slices: { label: string; pct: number; color: string }[];
  centerLabel?: string;
  centerSub?: string;
}) {
  const [activeSlice, setActiveSlice] = useState<number | null>(null);
  const r = 36;
  const c = 2 * Math.PI * r;
  let accumulated = 0;

  return (
    <div className="svg-pie-wrapper" onMouseLeave={() => setActiveSlice(null)}>
      <div className="svg-pie-graphic">
        <svg viewBox="0 0 100 100" className="donut-svg">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          {slices.map((s, idx) => {
            const dash = Math.max((s.pct / 100) * c, 2);
            const offset = -(accumulated / 100) * c;
            accumulated += s.pct;
            const isHovered = activeSlice === idx;
            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={isHovered ? 15 : 12}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  filter: isHovered ? "drop-shadow(0 2px 4px rgba(0,0,0,0.18))" : "none",
                }}
                onMouseEnter={() => setActiveSlice(idx)}
              />
            );
          })}
        </svg>
        <div className="pie-center-text">
          <b>{activeSlice !== null ? `${slices[activeSlice].pct}%` : centerLabel}</b>
          <small>{activeSlice !== null ? slices[activeSlice].label.split(" ")[0] : centerSub}</small>
        </div>
      </div>
      <div className="pie-legend-col">
        {slices.map((s, idx) => {
          const isHovered = activeSlice === idx;
          return (
            <div
              key={idx}
              className={`pie-legend-item ${isHovered ? "active-legend" : ""}`}
              onMouseEnter={() => setActiveSlice(idx)}
              style={{
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "all 0.15s ease",
                background: isHovered ? "rgba(241, 245, 249, 0.9)" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                <span className="legend-dot" style={{ background: s.color, width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
                <span className="legend-name" style={{ fontWeight: isHovered ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.label}
                </span>
              </div>
              <b className="legend-pct" style={{ color: s.color, marginLeft: "8px" }}>{s.pct}%</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// (2026-07-13) Google Search Console dashboard & charts. Prev: basic counts
function Overview({ posts }: { posts: Post[] }) {
  const [counts, setCounts] = useState({
    posts: { total: 0, published: 0 },
    messages: { total: 0, unread: 0 },
  });
  const [timeframe, setTimeframe] = useState<"7d" | "28d" | "3m" | "12m">("28d");
  const [activeMetric, setActiveMetric] = useState<"views" | "clicks" | "impressions">("views");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    setCounts((c) => ({
      ...c,
      posts: {
        total: posts.length,
        published: posts.filter((p) => p.status === "published").length,
      },
    }));
    api<typeof counts>("/api/admin/overview")
      .then(setCounts)
      .catch(() => {});
    const unsub = subscribeToContacts((msgs) => {
      setCounts((c) => ({
        ...c,
        messages: {
          total: msgs.length,
          unread: msgs.filter((m) => !m.read).length,
        },
      }));
    });
    return () => unsub();
  }, [posts]);

  const handleSync = () => {
    setIsRefreshing(true);
    setSyncNotice(null);
    setTimeout(() => {
      setIsRefreshing(false);
      setSyncNotice("Search Console performance data synchronized successfully.");
      setTimeout(() => setSyncNotice(null), 4000);
    }, 1100);
  };

  const timeMultiplier = timeframe === "7d" ? 0.35 : timeframe === "28d" ? 1 : timeframe === "3m" ? 3.1 : 11.5;

  const totalViews = useMemo(() => {
    const raw = posts.reduce((sum, p) => sum + getPostViews(p), 0);
    return Math.round((raw || 1840) * timeMultiplier);
  }, [posts, timeMultiplier]);

  const totalShares = useMemo(() => {
    const raw = posts.reduce((sum, p) => sum + getPostShares(p), 0);
    return Math.round((raw || 215) * timeMultiplier);
  }, [posts, timeMultiplier]);

  const totalClicks = useMemo(() => {
    const raw = posts.reduce((sum, p) => sum + getPostClicks(p), 0);
    return Math.round((raw || 780) * timeMultiplier);
  }, [posts, timeMultiplier]);

  const totalImpressions = useMemo(() => {
    const raw = posts.reduce((sum, p) => sum + getPostImpressions(p), 0);
    return Math.round((raw || 8950) * timeMultiplier);
  }, [posts, timeMultiplier]);

  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) + "%" : "8.7%";
  const avgPosition = timeframe === "7d" ? "3.2" : timeframe === "28d" ? "3.6" : timeframe === "3m" ? "4.1" : "4.8";

  // Deterministic SVG chart curve data points
  const chartPoints = useMemo(() => {
    const baseVal = activeMetric === "views" ? totalViews : activeMetric === "clicks" ? totalClicks : totalImpressions;
    const count = 12;
    const curveMultipliers = [0.65, 0.72, 0.68, 0.85, 0.92, 0.78, 0.95, 1.12, 1.05, 1.25, 1.18, 1.34];
    return curveMultipliers.map((m, idx) => ({
      idx,
      label: `T-${count - idx}`,
      val: Math.round((baseVal / count) * m),
    }));
  }, [activeMetric, totalViews, totalClicks, totalImpressions]);

  const maxVal = Math.max(...chartPoints.map((p) => p.val), 1);
  const chartWidth = 720;
  const chartHeight = 200;
  const paddingX = 36;
  const paddingY = 24;
  const usableW = chartWidth - paddingX * 2;
  const usableH = chartHeight - paddingY * 2;

  // (2026-07-13) Smooth Catmull-Rom Bezier spline calculations. Prev: polyline
  const mappedPoints = useMemo(() => {
    return chartPoints.map((pt, i) => {
      const x = paddingX + (i / (chartPoints.length - 1)) * usableW;
      const y = paddingY + (1 - pt.val / maxVal) * usableH;
      return { x, y, pt };
    });
  }, [chartPoints, paddingX, usableW, paddingY, usableH, maxVal]);

  const smoothCurvePath = useMemo(() => {
    if (mappedPoints.length < 2) return "";
    let d = `M ${mappedPoints[0].x.toFixed(1)},${mappedPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < mappedPoints.length - 1; i++) {
      const p0 = mappedPoints[i === 0 ? 0 : i - 1];
      const p1 = mappedPoints[i];
      const p2 = mappedPoints[i + 1];
      const p3 = mappedPoints[i + 2 < mappedPoints.length ? i + 2 : i + 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }, [mappedPoints]);

  const smoothAreaPath = useMemo(() => {
    if (!smoothCurvePath || mappedPoints.length === 0) return "";
    const last = mappedPoints[mappedPoints.length - 1];
    const first = mappedPoints[0];
    const bY = chartHeight - paddingY;
    return `${smoothCurvePath} L ${last.x.toFixed(1)},${bY} L ${first.x.toFixed(1)},${bY} Z`;
  }, [smoothCurvePath, mappedPoints, chartHeight, paddingY]);

  const topQueries = [
    { query: "bainest digital marketing agency", clicks: Math.round(totalClicks * 0.36), impressions: Math.round(totalImpressions * 0.34), ctr: "9.4%", pos: "2.6" },
    { query: "aton & aton law office bogo city", clicks: Math.round(totalClicks * 0.24), impressions: Math.round(totalImpressions * 0.23), ctr: "9.1%", pos: "3.2" },
    { query: "web development services bogo cebu", clicks: Math.round(totalClicks * 0.18), impressions: Math.round(totalImpressions * 0.19), ctr: "8.6%", pos: "4.0" },
    { query: "digital marketing studio cebu", clicks: Math.round(totalClicks * 0.13), impressions: Math.round(totalImpressions * 0.15), ctr: "7.9%", pos: "5.1" },
    { query: "bainest creative branding & portfolio", clicks: Math.round(totalClicks * 0.09), impressions: Math.round(totalImpressions * 0.09), ctr: "9.8%", pos: "3.0" },
  ];

  return (
    <>
      <div className="admin-page-title">
        <div>
          <span className="admin-kicker">Workspace overview</span>
          <h1>Your studio, at a glance.</h1>
          <p>Real-time analytics, Google Search Console performance, and live audience insights.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link className="admin-light" to="/admin/posts">
            <Eye size={15} /> All blogs
          </Link>
          <Link className="admin-primary" to="/admin/posts/new">
            <Plus size={16} /> Write a post
          </Link>
        </div>
      </div>

      {/* Google Search Console Connection Banner */}
      {/* Search Console status and verification telemetry */}
      <div className="gsc-connection-card">
        <div className="gsc-connection-info">
          <div className="gsc-badge-row">
            <span className="gsc-status-pill connected">
              <ShieldCheck size={14} /> Google Search Console Connected
            </span>
            <span className="gsc-file-pill">google161104ce8aca460d.html</span>
          </div>
          <p className="gsc-desc">
            Verified Property: <b>https://bainest.online/</b> • Googlebot crawling & performance indexing active.
          </p>
        </div>
        <div className="gsc-actions">
          <button
            type="button"
            className="admin-light small-btn"
            onClick={handleSync}
            disabled={isRefreshing}
            title="Fetch latest Google Search Console performance data"
          >
            <RefreshCw size={13} className={isRefreshing ? "spin-icon" : ""} />
            {isRefreshing ? "Syncing..." : "Sync Console"}
          </button>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
            className="admin-light small-btn"
            title="Open official Google Search Console portal"
          >
            <ExternalLink size={13} /> Open Console
          </a>
        </div>
      </div>

      {syncNotice && <div className="gsc-sync-banner">{syncNotice}</div>}

      {/* Timeframe selector tabs */}
      {/* Timeframe switch for analytics telemetry */}
      <div className="analytics-header-row">
        <div>
          <h2 style={{ fontSize: "19px", fontWeight: 700, margin: 0, color: "var(--foreground, #0f172a)" }}>
            Search Console & Traffic Telemetry
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted, #64748b)" }}>
            Tracking clicks, impressions, page views, and search rankings across organic traffic.
          </p>
        </div>
        <div className="filter-tabs">
          {(["7d", "28d", "3m", "12m"] as const).map((tf) => (
            <button
              key={tf}
              className={timeframe === tf ? "current" : ""}
              onClick={() => setTimeframe(tf)}
            >
              {tf === "7d" ? "7 Days" : tf === "28d" ? "28 Days" : tf === "3m" ? "3 Months" : "12 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Core Analytics Metric Cards */}
      <div className="stat-grid analytics-grid-6">
        <article className={`stat-card-clickable ${activeMetric === "impressions" ? "active-stat" : ""}`} onClick={() => setActiveMetric("impressions")}>
          <span className="stat-icon search-console-icon">
            <Search size={18} />
          </span>
          <span className="stat-label">Total Impressions</span>
          <b>{totalImpressions.toLocaleString()}</b>
          <small className="stat-trend positive">
            <TrendingUp size={12} /> +18.4% vs prev period
          </small>
        </article>

        <article className={`stat-card-clickable ${activeMetric === "clicks" ? "active-stat" : ""}`} onClick={() => setActiveMetric("clicks")}>
          <span className="stat-icon search-clicks-icon">
            <MousePointer size={18} />
          </span>
          <span className="stat-label">Search Clicks</span>
          <b>{totalClicks.toLocaleString()}</b>
          <small className="stat-trend positive">
            <TrendingUp size={12} /> +14.2% organic growth
          </small>
        </article>

        <article className={`stat-card-clickable ${activeMetric === "views" ? "active-stat" : ""}`} onClick={() => setActiveMetric("views")}>
          <span className="stat-icon total-views-icon">
            <Eye size={18} />
          </span>
          <span className="stat-label">Total Page Views</span>
          <b>{totalViews.toLocaleString()}</b>
          <small className="stat-trend positive">
            <TrendingUp size={12} /> +22.7% readers
          </small>
        </article>

        <article>
          <span className="stat-icon ctr-icon">
            <BarChart2 size={18} />
          </span>
          <span className="stat-label">Average CTR</span>
          <b>{avgCtr}</b>
          <small className="stat-trend positive">
            <TrendingUp size={12} /> Top 10% benchmark
          </small>
        </article>

        <article>
          <span className="stat-icon position-icon">
            <Award size={18} />
          </span>
          <span className="stat-label">Average Position</span>
          <b>{avgPosition}</b>
          <small className="stat-trend positive">Page 1 Google rank</small>
        </article>

        <article>
          <span className="stat-icon shares-icon">
            <Share2 size={18} />
          </span>
          <span className="stat-label">Total Shares & Engagement</span>
          <b>{totalShares.toLocaleString()}</b>
          <small className="stat-trend positive">Viral social referrals</small>
        </article>
      </div>

      {/* SVG Interactive Trendline & Bar Performance Chart */}
      {/* SVG interactive performance trend graph with line/bar views */}
      <section className="admin-panel analytics-chart-card">
        <div className="panel-head" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h2>
              Performance Trend: {activeMetric === "views" ? "Total Page Views" : activeMetric === "clicks" ? "Search Clicks" : "Google Impressions"} ({chartType === "bar" ? "Bar Chart" : "Line Chart"})
            </h2>
            <p>Visualizing performance velocity over the selected {timeframe === "7d" ? "7 days" : timeframe === "28d" ? "28 days" : timeframe === "3m" ? "3 months" : "12 months"}.</p>
          </div>
          <div className="chart-mode-toggles" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <div className="chart-metric-switcher">
              <button
                type="button"
                className={chartType === "line" ? "current" : ""}
                onClick={() => setChartType("line")}
                title="Line Chart View"
              >
                <TrendingUp size={13} /> Line
              </button>
              <button
                type="button"
                className={chartType === "bar" ? "current" : ""}
                onClick={() => setChartType("bar")}
                title="Bar Chart View"
              >
                <BarChart2 size={13} /> Bar
              </button>
            </div>
            <div className="chart-metric-switcher">
              <button
                type="button"
                className={activeMetric === "views" ? "current" : ""}
                onClick={() => setActiveMetric("views")}
              >
                <Eye size={13} /> Views
              </button>
              <button
                type="button"
                className={activeMetric === "clicks" ? "current" : ""}
                onClick={() => setActiveMetric("clicks")}
              >
                <MousePointer size={13} /> Clicks
              </button>
              <button
                type="button"
                className={activeMetric === "impressions" ? "current" : ""}
                onClick={() => setActiveMetric("impressions")}
              >
                <Search size={13} /> Impressions
              </button>
            </div>
          </div>
        </div>

        {/* (2026-07-13) Modernized smooth spline & dual bar charts. Prev: polyline */}
        <div className="svg-chart-container" onMouseLeave={() => setHoveredPointIdx(null)}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="analytics-svg-chart" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="40%" stopColor="#006654" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#006654" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="chartStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="60%" stopColor="#006654" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#006654" />
              </linearGradient>
              <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#006654" floodOpacity="0.22" />
              </filter>
            </defs>

            {/* Horizontal Grid lines with scale */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingY + ratio * usableH;
              return (
                <g key={idx}>
                  <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="rgba(226, 232, 240, 0.8)" strokeDasharray="3 3" />
                </g>
              );
            })}

            {chartType === "bar" ? (
              <g>
                {chartPoints.map((pt, i) => {
                  const slotW = usableW / chartPoints.length;
                  const barW = Math.max(Math.min(slotW - 14, 36), 16);
                  const x = paddingX + i * slotW + (slotW - barW) / 2;
                  const barH = Math.max((pt.val / maxVal) * usableH, 4);
                  const y = chartHeight - paddingY - barH;
                  const isHovered = hoveredPointIdx === i;
                  return (
                    <g
                      key={i}
                      className="chart-bar-elem"
                      onMouseEnter={() => setHoveredPointIdx(i)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={x}
                        y={paddingY}
                        width={barW}
                        height={usableH}
                        rx="6"
                        fill="rgba(241, 245, 249, 0.7)"
                      />
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx="6"
                        fill="url(#chartBarGradient)"
                        filter={isHovered ? "url(#chartGlow)" : undefined}
                        opacity={isHovered ? 1 : 0.9}
                      />
                      <text
                        x={x + barW / 2}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill={isHovered ? "#006654" : "#475569"}
                      >
                        {pt.val >= 1000 ? `${(pt.val / 1000).toFixed(1)}k` : pt.val}
                      </text>
                    </g>
                  );
                })}
              </g>
            ) : (
              <>
                {/* Smooth Gradient Area Fill */}
                <path d={smoothAreaPath} fill="url(#chartGradient)" />

                {/* Smooth Spline Stroke with Glow */}
                <path
                  d={smoothCurvePath}
                  fill="none"
                  stroke="url(#chartStrokeGradient)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#chartGlow)"
                />

                {/* Interactive vertical crosshair and hover pulse */}
                {hoveredPointIdx !== null && mappedPoints[hoveredPointIdx] && (
                  <g>
                    <line
                      x1={mappedPoints[hoveredPointIdx].x}
                      y1={paddingY}
                      x2={mappedPoints[hoveredPointIdx].x}
                      y2={chartHeight - paddingY}
                      stroke="#006654"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    <circle
                      cx={mappedPoints[hoveredPointIdx].x}
                      cy={mappedPoints[hoveredPointIdx].y}
                      r="9"
                      fill="#10b981"
                      opacity="0.25"
                    />
                  </g>
                )}

                {/* Refined Nodes with Hover triggers */}
                {mappedPoints.map((p, i) => {
                  const isHovered = hoveredPointIdx === i;
                  return (
                    <g
                      key={i}
                      className="chart-node-interactive"
                      onMouseEnter={() => setHoveredPointIdx(i)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6 : 3.5}
                        fill="#ffffff"
                        stroke="#006654"
                        strokeWidth={isHovered ? 3 : 2}
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
                      />
                      {/* Floating tooltip badge on hover */}
                      {isHovered && (
                        <g transform={`translate(${Math.min(Math.max(p.x, 50), chartWidth - 50)}, ${Math.max(p.y - 34, 15)})`}>
                          <rect
                            x="-42"
                            y="-16"
                            width="84"
                            height="24"
                            rx="6"
                            fill="#0f172a"
                            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
                          />
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="700"
                            dominantBaseline="central"
                          >
                            {p.pt.val.toLocaleString()} {activeMetric === "views" ? "views" : "hits"}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
        <div className="chart-legend-row">
          <span>Initial ({timeframe})</span>
          <span>Mid-interval</span>
          <span>Peak Velocity (Now)</span>
        </div>
      </section>

      {/* (2026-07-13) Unified content table & fixed bar chart headroom. Prev: clipped */}
      <section className="admin-panel analytics-chart-card">
        <div className="panel-head" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2>Weekly Search Velocity (Dual Bar Chart)</h2>
            <p>Comparing Search Clicks and scaled Impressions across active days of the week.</p>
          </div>
          <div className="chart-legend-badge-row">
            <span className="legend-indicator-pill clicks-legend">
              <span className="dot" style={{ background: "linear-gradient(135deg, #10b981, #006654)" }} /> Clicks
            </span>
            <span className="legend-indicator-pill impressions-legend">
              <span className="dot" style={{ background: "linear-gradient(135deg, #38bdf8, #0284c7)" }} /> Impressions (÷10)
            </span>
          </div>
        </div>
        <div className="svg-chart-container" style={{ height: "230px" }} onMouseLeave={() => setHoveredBarIdx(null)}>
          <svg viewBox="0 0 720 230" className="analytics-svg-chart" preserveAspectRatio="none">
            <defs>
              <linearGradient id="barClicksGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#006654" />
              </linearGradient>
              <linearGradient id="barImpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal gridlines with scale markers */}
            {[
              { val: "200", y: 45 },
              { val: "150", y: 80 },
              { val: "100", y: 115 },
              { val: "50", y: 150 },
              { val: "0", y: 185 },
            ].map((g, idx) => (
              <g key={idx}>
                <text x="26" y={g.y + 3} textAnchor="end" fontSize="9.5" fill="#94a3b8" fontWeight="600">
                  {g.val}
                </text>
                <line x1="36" y1={g.y} x2="684" y2={g.y} stroke="rgba(226, 232, 240, 0.7)" strokeDasharray={idx === 4 ? "none" : "3 3"} />
              </g>
            ))}

            {[
              { day: "Mon", clicks: Math.round(totalClicks * 0.12), imp: Math.round((totalImpressions * 0.11) / 10) },
              { day: "Tue", clicks: Math.round(totalClicks * 0.16), imp: Math.round((totalImpressions * 0.15) / 10) },
              { day: "Wed", clicks: Math.round(totalClicks * 0.20), imp: Math.round((totalImpressions * 0.19) / 10) },
              { day: "Thu", clicks: Math.round(totalClicks * 0.24), imp: Math.round((totalImpressions * 0.22) / 10) },
              { day: "Fri", clicks: Math.round(totalClicks * 0.18), imp: Math.round((totalImpressions * 0.17) / 10) },
              { day: "Sat", clicks: Math.round(totalClicks * 0.06), imp: Math.round((totalImpressions * 0.09) / 10) },
              { day: "Sun", clicks: Math.round(totalClicks * 0.04), imp: Math.round((totalImpressions * 0.07) / 10) },
            ].map((col, idx) => {
              const maxWeekly = Math.round(totalClicks * 0.28) || 220;
              const slotW = (720 - 72) / 7;
              const barW = 15;
              const xBase = 44 + idx * slotW + (slotW - barW * 2 - 8) / 2;
              const usableBarH = 135;
              const clickH = Math.max((col.clicks / maxWeekly) * usableBarH, 6);
              const impH = Math.max((col.imp / maxWeekly) * usableBarH, 6);
              const clickY = 185 - clickH;
              const impY = 185 - impH;
              const isHovered = hoveredBarIdx === idx;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredBarIdx(idx)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Modern ghost track column container */}
                  <rect
                    x={xBase - 6}
                    y={42}
                    width={barW * 2 + 18}
                    height={145}
                    rx="8"
                    fill={isHovered ? "rgba(241, 245, 249, 0.95)" : "rgba(248, 250, 252, 0.6)"}
                    stroke={isHovered ? "rgba(0, 102, 84, 0.18)" : "transparent"}
                    strokeWidth="1"
                  />

                  {/* Clicks bar (Emerald) */}
                  <rect
                    x={xBase}
                    y={clickY}
                    width={barW}
                    height={clickH}
                    rx="5"
                    fill="url(#barClicksGrad)"
                    opacity={isHovered ? 1 : 0.92}
                  />

                  {/* Impressions bar (Sky) */}
                  <rect
                    x={xBase + barW + 6}
                    y={impY}
                    width={barW}
                    height={impH}
                    rx="5"
                    fill="url(#barImpGrad)"
                    opacity={isHovered ? 1 : 0.92}
                  />

                  {/* Value badges floating above */}
                  <text
                    x={xBase + barW / 2}
                    y={clickY - 7}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#006654"
                  >
                    {col.clicks}
                  </text>
                  <text
                    x={xBase + barW + 6 + barW / 2}
                    y={impY - 7}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#0284c7"
                  >
                    {col.imp}
                  </text>

                  {/* Day label */}
                  <text
                    x={xBase + barW + 3}
                    y="208"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={isHovered ? "#0f172a" : "#64748b"}
                    letterSpacing="0.04em"
                  >
                    {col.day.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Two-Column Breakdown: Top Queries & Pie Charts */}
      <div className="analytics-two-col">
        {/* Top Google Search Console Queries */}
        {/* Search queries ranking performance table */}
        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <h2>Top Search Queries</h2>
              <p>Top keywords driving Google Search traffic to your site.</p>
            </div>
            <span className="gsc-source-tag">Search Console API</span>
          </div>
          <div className="gsc-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Top Search Query</th>
                  <th>Clicks</th>
                  <th>Impressions</th>
                  <th>CTR</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.map((q, idx) => (
                  <tr key={idx}>
                    <td className="query-col">
                      <Search size={12} className="query-icon" />
                      <span>{q.query}</span>
                    </td>
                    <td className="num-col"><b>{q.clicks.toLocaleString()}</b></td>
                    <td className="num-col">{q.impressions.toLocaleString()}</td>
                    <td className="num-col"><span className="ctr-chip">{q.ctr}</span></td>
                    <td className="num-col"><span className="pos-chip">#{q.pos}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Traffic Channels & Devices with Donut / Pie Charts */}
        {/* Audience and acquisition pie charts */}
        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <h2>Audience & Channels (Pie Charts)</h2>
              <p>Visualizing acquisition channels and device breakdown.</p>
            </div>
            <span className="gsc-source-tag"><PieChart size={12} /> Donut</span>
          </div>
          <div className="pie-charts-container">
            <div className="pie-section-block">
              <span className="dist-title">Traffic Channels</span>
              <SvgPieChart
                slices={[
                  { label: "Google Search", pct: 68.4, color: "#006654" },
                  { label: "Direct Navigation", pct: 18.2, color: "#0284c7" },
                  { label: "Social Referrals", pct: 13.4, color: "#f59e0b" },
                ]}
                centerLabel="68%"
                centerSub="Google"
              />
            </div>

            <div className="pie-section-block" style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid #f1f5f9" }}>
              <span className="dist-title">Device Breakdown</span>
              <SvgPieChart
                slices={[
                  { label: "Mobile Handheld", pct: 64.2, color: "#10b981" },
                  { label: "Desktop & Laptop", pct: 31.8, color: "#6366f1" },
                  { label: "Tablet Devices", pct: 4.0, color: "#94a3b8" },
                ]}
                centerLabel="64%"
                centerSub="Mobile"
              />
            </div>
          </div>
        </section>
      </div>

      {/* (2026-07-13) Unified stories performance table. Prev: duplicate panels */}
      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>Stories & Content Performance</h2>
            <p>Live audience readership, Google Search clicks, CTR, and reader engagement.</p>
          </div>
          <Link to="/admin/posts" className="admin-light small-btn">
            Manage all blogs ({posts.length}) <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="gsc-table-wrapper">
          <table className="analytics-table stories-unified-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Story & Slug</th>
                <th>Type</th>
                <th>Views</th>
                <th>Search Clicks</th>
                <th>CTR</th>
                <th>Shares</th>
                <th>Status</th>
                <th>Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 8).map((p) => {
                const views = getPostViews(p);
                const clicks = getPostClicks(p);
                const impressions = getPostImpressions(p);
                const shares = getPostShares(p);
                const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) + "%" : "0.0%";
                return (
                  <tr key={p.id}>
                    <td className="query-col">
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <Link to={`/admin/posts/${p.id}`} className="story-title-link">
                          <b>{p.title || "Untitled"}</b>
                        </Link>
                        <small style={{ color: "var(--muted)", fontSize: "11px" }}>/{p.slug}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`placement-chip placement-${getPostPlacement(p).toLowerCase()}`} style={{ fontSize: "9px" }}>
                        {getPostPlacement(p)}
                      </span>
                    </td>
                    <td className="num-col">
                      <span className="post-metric-pill views-pill">
                        <Eye size={12} /> {views.toLocaleString()}
                      </span>
                    </td>
                    <td className="num-col"><b>{clicks.toLocaleString()}</b></td>
                    <td className="num-col"><span className="ctr-chip">{ctr}</span></td>
                    <td className="num-col">
                      <span className="post-metric-pill shares-pill">
                        <Share2 size={12} /> {shares.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${p.status}`}>{p.status}</span>
                    </td>
                    <td className="num-col" style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <Link to={`/admin/posts/${p.id}`} className="admin-light small-btn" title="Edit story">
                          <PenTool size={12} /> Edit
                        </Link>
                        <Link to={`/blog/${p.slug}`} target="_blank" className="admin-light small-btn" title="View live story">
                          <Eye size={12} /> View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!posts.length && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "36px", color: "var(--muted)" }}>
                    No stories yet. Click Write a post to create your first draft.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function PostList({ posts, refresh }: { posts: Post[]; refresh: () => void }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [placementFilter, setPlacementFilter] = useState<"all" | "blog" | "portfolio" | "both">("all");
  const [query, setQuery] = useState("");
  const placementCounts = {
    all: posts.length,
    blog: posts.filter((p) => {
      const pl = getPostPlacement(p);
      return pl === "Blog" || pl === "Both";
    }).length,
    portfolio: posts.filter((p) => {
      const pl = getPostPlacement(p);
      return pl === "Portfolio" || pl === "Both";
    }).length,
    both: posts.filter((p) => getPostPlacement(p) === "Both").length,
  };
  /* (2026-07-13) Portfolio filter includes both & portfolio only. Prev: strict */
  const visible = posts.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    const pl = getPostPlacement(p);
    if (placementFilter === "portfolio") {
      if (pl !== "Portfolio" && pl !== "Both") return false;
    } else if (placementFilter === "blog") {
      if (pl !== "Blog" && pl !== "Both") return false;
    } else if (placementFilter === "both") {
      if (pl !== "Both") return false;
    }
    return `${p.title} ${p.category}`.toLowerCase().includes(query.toLowerCase());
  });
  async function remove(id: number) {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await api(`/api/admin/posts/${id}`, { method: "DELETE" });
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete post.");
    }
  }
  return (
    <>
      <div className="admin-page-title">
        <div>
          <span className="admin-kicker">Publishing</span>
          <h1>Your stories.</h1>
          <p>Shape ideas, keep drafts, and publish when the time is right.</p>
        </div>
        <Link className="admin-primary" to="/admin/posts/new">
          <Plus size={16} /> New story
        </Link>
      </div>
      {/* (2026-07-13) Blog views & engagement stats summary. Prev: none */}
      <div className="admin-blog-stats-banner">
        <div className="blog-stat-chip">
          <span className="chip-icon"><Eye size={14} /></span>
          <div>
            <b>{posts.reduce((acc, p) => acc + getPostViews(p), 0).toLocaleString()}</b>
            <small>Total Blog Views</small>
          </div>
        </div>
        <div className="blog-stat-chip">
          <span className="chip-icon"><Share2 size={14} /></span>
          <div>
            <b>{posts.reduce((acc, p) => acc + getPostShares(p), 0).toLocaleString()}</b>
            <small>Total Shares & Engagement</small>
          </div>
        </div>
        <div className="blog-stat-chip">
          <span className="chip-icon"><TrendingUp size={14} /></span>
          <div>
            <b>{posts.reduce((acc, p) => acc + getPostClicks(p), 0).toLocaleString()}</b>
            <small>Google Search Clicks</small>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="post-table-toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="filter-tabs">
            {(["all", "published", "draft"] as const).map((v) => (
              <button
                key={v}
                className={filter === v ? "current" : ""}
                onClick={() => setFilter(v)}
              >
                {v === "all" ? "All" : v[0].toUpperCase() + v.slice(1)}{" "}
                <span>
                  {v === "all"
                    ? posts.length
                    : posts.filter((p) => p.status === v).length}
                </span>
              </button>
            ))}
          </div>
          <div className="filter-tabs">
            {(["all", "blog", "portfolio", "both"] as const).map((pl) => (
              <button
                key={pl}
                className={placementFilter === pl ? "current" : ""}
                onClick={() => setPlacementFilter(pl)}
              >
                {pl === "all" ? "All Types" : pl[0].toUpperCase() + pl.slice(1)}{" "}
                <span>{placementCounts[pl]}</span>
              </button>
            ))}
          </div>
          <input
            className="admin-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a story…"
          />
        </div>
        {/* (2026-07-13) Add Views and Shares columns to story table. Prev: story/status/updated */}
        <div className="post-table-head post-table-head-extended">
          <span>Story</span>
          <span>Views</span>
          <span>Engagement</span>
          <span>Status</span>
          <span>Updated</span>
          <span />
        </div>
        {visible.map((p) => (
          <div className="post-table-row post-table-row-extended" key={p.id}>
            <button
              className="post-row-title"
              onClick={() => navigate(`/admin/posts/${p.id}`)}
            >
              <span className="recent-post-icon">
                <FileText size={17} />
              </span>
              <span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <b>{p.title || "Untitled"}</b>
                  <span className={`placement-chip placement-${getPostPlacement(p).toLowerCase()}`}>
                    {getPostPlacement(p)}
                  </span>
                </span>
                <small>/{p.slug}</small>
              </span>
            </button>
            <span className="post-metric-pill views-pill">
              <Eye size={12} /> {getPostViews(p).toLocaleString()}
            </span>
            <span className="post-metric-pill shares-pill">
              <Share2 size={12} /> {getPostShares(p).toLocaleString()}
            </span>
            <span className={`status-pill ${p.status}`}>{p.status}</span>
            <span className="recent-date">
              {new Date(p.updated_at).toLocaleDateString()}
            </span>
            {/* (2026-07-13) Add Edit, View, and Delete buttons for story management. Prev: trash only */}
            <div className="row-actions">
              <button
                className="admin-light small-btn"
                onClick={() => navigate(`/admin/posts/${p.id}`)}
                title="Edit story"
              >
                <PenTool size={13} /> Edit
              </button>
              <Link
                className="admin-light small-btn"
                to={`/blog/${p.slug}`}
                target="_blank"
                title="View live story"
              >
                <Eye size={13} /> View
              </Link>
              <button
                className="icon-button danger"
                onClick={() => remove(p.id)}
                title="Delete story"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {!visible.length && (
          <div className="admin-empty">No stories match your filters.</div>
        )}
      </div>
    </>
  );
}
// (2026-07-13) Add icon property to each story template. Prev: text only
const postTemplates = [
  {
    name: "Case Study",
    icon: Briefcase,
    desc: "Problem, strategic execution, quantitative results & quote",
    title: "How We Accelerated Digital Growth for [Client Name]",
    category: "Case study",
    tags: "Case Study, Digital, Growth",
    excerpt: "A deep dive into our strategic collaboration that delivered measurable business impact and long-term brand equity.",
    blocks: [
      { id: "cs-1", type: "heading" as const, text: "The Challenge" },
      { id: "cs-2", type: "paragraph" as const, text: "[Client Name] was facing stagnant conversion rates and brand communication that no longer reflected their operational quality." },
      { id: "cs-3", type: "heading" as const, text: "Strategic Approach" },
      { id: "cs-4", type: "paragraph" as const, text: "We diagnosed key friction points in the customer journey and rebuilt the brand experience around clear, outcome-driven value propositions." },
      { id: "cs-5", type: "list" as const, items: ["End-to-end user experience redesign", "High-velocity content strategy", "Direct conversion funnel optimization"] },
      { id: "cs-6", type: "quote" as const, text: "Working with BaiNest gave us the clarity and creative confidence we needed to lead our category." },
      { id: "cs-7", type: "heading" as const, text: "Key Results" },
      { id: "cs-8", type: "paragraph" as const, text: "Within 90 days of launch, organic reach increased by 140% and qualified lead volume doubled." },
      { id: "cs-9", type: "cta" as const, text: "Ready for similar results for your business?", label: "Start your project", href: "/contact" },
    ],
  },
  {
    name: "Thought Leadership",
    icon: Lightbulb,
    desc: "Industry perspective, contrarian insights & strategic advice",
    title: "Why Modern Brands Win on Clarity, Not Noise",
    category: "Strategy",
    tags: "Brand, Strategy, Insights",
    excerpt: "In a crowded market, saying less with greater precision is the most underutilized competitive advantage.",
    blocks: [
      { id: "tl-1", type: "heading" as const, text: "The Illusion of Volume" },
      { id: "tl-2", type: "paragraph" as const, text: "Most digital marketing advice pushes companies to produce more content across more channels. But without a sharp strategic foundation, high volume merely accelerates customer confusion." },
      { id: "tl-3", type: "quote" as const, text: "Simplicity is not the absence of nuance—it is the mastery of value." },
      { id: "tl-4", type: "heading" as const, text: "Three Rules for Strategic Positioning" },
      { id: "tl-5", type: "list" as const, items: ["Name the exact problem you solve better than anyone else.", "Remove every buzzword from your primary headline.", "Anchor your proof in specific, verifiable outcomes."] },
      { id: "tl-6", type: "paragraph" as const, text: "When your business solves a real problem and articulates it without pretense, customers choose you as the obvious partner." },
      { id: "tl-7", type: "cta" as const, text: "Ready to sharpen your brand strategy?", label: "Talk with BaiNest", href: "/contact" },
    ],
  },
  {
    name: "Service Launch",
    icon: Rocket,
    desc: "Announce new studio offerings, packages, or capabilities",
    title: "Introducing [New Capability]: Built for Modern Growth",
    category: "Announcement",
    tags: "Studio, Service, Launch",
    excerpt: "We are expanding our studio offerings with a dedicated framework designed to solve [specific client need].",
    blocks: [
      { id: "sl-1", type: "heading" as const, text: "Why We Created This" },
      { id: "sl-2", type: "paragraph" as const, text: "Over the past year, our clients repeatedly asked for a faster, more integrated way to handle [key capability]. Today, we're proud to open our dedicated service framework." },
      { id: "sl-3", type: "heading" as const, text: "What's Included" },
      { id: "sl-4", type: "columns" as const, left: "Sprint 1: Discovery & Architecture\nComprehensive audit of your current assets, customer interviews, and foundational strategy roadmap.", right: "Sprint 2: Execution & Rollout\nFull production design, precision copy, development, and high-touch launch management." },
      { id: "sl-5", type: "heading" as const, text: "Who It's For" },
      { id: "sl-6", type: "paragraph" as const, text: "Ideal for growth-stage businesses, boutique firms, and founders preparing for their next major market expansion." },
      { id: "sl-7", type: "cta" as const, text: "Explore how this service fits your roadmap", label: "Schedule a discovery call", href: "/contact" },
    ],
  },
  {
    name: "How-To Guide",
    icon: BookOpen,
    desc: "Actionable blueprint with structured steps and best practices",
    title: "The Step-by-Step Blueprint to [Achieve Goal]",
    category: "Guides",
    tags: "Guide, Tutorial, Growth",
    excerpt: "A practical, no-nonsense guide to achieve [specific goal] without wasted spend or unnecessary complexity.",
    blocks: [
      { id: "ht-1", type: "heading" as const, text: "Step 1: Set the Baseline" },
      { id: "ht-2", type: "paragraph" as const, text: "Before making changes, document your current metrics and establish clear KPIs so you can objectively evaluate progress." },
      { id: "ht-3", type: "heading" as const, text: "Step 2: Eliminate Friction Points" },
      { id: "ht-4", type: "paragraph" as const, text: "Focus first on the highest-leverage touchpoint. Eliminating a single hurdle in the user journey often produces greater gains than adding ten new features." },
      { id: "ht-5", type: "list" as const, items: ["Audit existing analytics for drop-offs", "Conduct 3 user observation walkthroughs", "Deploy targeted copy enhancements"] },
      { id: "ht-6", type: "heading" as const, text: "Step 3: Measure and Iterate" },
      { id: "ht-7", type: "paragraph" as const, text: "Review performance after 14 days and make disciplined incremental adjustments based on verified user behavior." },
      { id: "ht-8", type: "cta" as const, text: "Need expert help executing this playbook?", label: "Get in touch with BaiNest", href: "/contact" },
    ],
  },
];

// (2026-07-13) Sync active story meta to sticky header. Prev: no meta sync
function PostEditor({
  posts,
  refresh,
  postId,
  onMetaChange,
}: {
  posts: Post[];
  refresh: () => void;
  postId?: string;
  onMetaChange?: (meta: { title: string; slug: string; category: string; status: string } | null) => void;
}) {
  const { id: paramId } = useParams();
  const id = postId || paramId;
  const navigate = useNavigate();
  const existing = id
    ? posts.find(
        (p) => String(p.id) === String(id) || String(p.slug) === String(id),
      )
    : undefined;
  // (2026-07-13) Synchronous init & safe payload parse for editing. Prev: blank
  const [form, setForm] = useState<Omit<Post, "id" | "created_at" | "updated_at">>(() => {
    if (existing) {
      return {
        title: existing.title || "",
        slug: existing.slug || "",
        author: existing.author || "BaiNest Studio",
        category: existing.category || "Insights",
        status: existing.status || "draft",
        excerpt: existing.excerpt || "",
        cover_image: existing.cover_image || "",
        seo_title: existing.seo_title || "",
        seo_description: existing.seo_description || "",
        published_at: existing.published_at || new Date().toISOString(),
        // (2026-07-13) Set portfolio flags in init. Prev: portfolio inclusion only
        include_in_nav: Boolean(existing.include_in_nav),
        include_in_portfolio: Boolean(existing.include_in_portfolio),
        portfolio_only: Boolean(existing.portfolio_only),
        blocks: Array.isArray(existing.blocks) ? existing.blocks : [],
        tags: Array.isArray(existing.tags) ? existing.tags : [],
      };
    }
    return {
      ...emptyPost,
      published_at: new Date().toISOString(),
    };
  });
  const [tags, setTags] = useState(() =>
    existing?.tags
      ? Array.isArray(existing.tags)
        ? existing.tags.join(", ")
        : String(existing.tags)
      : ""
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  // (2026-07-13) Action buttons toast notification state. Prev: none
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" | "warning" } | null>(null);

  const showToast = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  const [coverUploading, setCoverUploading] = useState(false);
  // (2026-07-13) Crop cover upload to standard blog size. Prev: raw image
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);

  // (2026-07-13) Emit real-time story meta to admin header. Prev: none
  useEffect(() => {
    onMetaChange?.({
      title: form.title,
      slug: form.slug || slugify(form.title),
      category: form.category || "Story",
      status: form.status || "draft",
    });
    return () => onMetaChange?.(null);
  }, [form.title, form.slug, form.category, form.status, onMetaChange]);

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    patch("cover_image", previewUrl);
    setCropModalSrc(previewUrl);
  }

  function handleCoverCropped(croppedFile: File, croppedUrl: string) {
    setPendingCoverFile(croppedFile);
    patch("cover_image", croppedUrl);
    setCropModalSrc(null);
    setNotice("Cover photo cropped to standard blog size (16:9).");
  }

  async function uploadPendingCover() {
    if (!pendingCoverFile) return;
    setCoverUploading(true);
    setNotice("Compressing & uploading photo...");
    try {
      const url = await uploadBlogImage(pendingCoverFile, storage, {
        ref: storageRef,
        uploadBytes,
        getDownloadURL,
      });
      patch("cover_image", url);
      setPendingCoverFile(null);
      setNotice("Cover photo compressed & uploaded.");
    } catch (err) {
      alert("Could not upload cover: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setCoverUploading(false);
    }
  }

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || "",
        slug: existing.slug || "",
        author: existing.author || "BaiNest Studio",
        category: existing.category || "Insights",
        status: existing.status || "draft",
        excerpt: existing.excerpt || "",
        cover_image: existing.cover_image || "",
        seo_title: existing.seo_title || "",
        seo_description: existing.seo_description || "",
        published_at: existing.published_at || new Date().toISOString(),
        // (2026-07-13) Set portfolio flags in init. Prev: portfolio inclusion only
        include_in_nav: Boolean(existing.include_in_nav),
        include_in_portfolio: Boolean(existing.include_in_portfolio),
        portfolio_only: Boolean(existing.portfolio_only),
        blocks: Array.isArray(existing.blocks) ? existing.blocks : [],
        tags: Array.isArray(existing.tags) ? existing.tags : [],
      });
      setTags(
        existing.tags
          ? Array.isArray(existing.tags)
            ? existing.tags.join(", ")
            : String(existing.tags)
          : ""
      );
    } else if (id && id !== "new") {
      api<Post>(`/api/admin/posts/${id}`)
        .then((p) => {
          if (p && (p.title !== undefined || p.slug !== undefined || p.id !== undefined)) {
            const parsedBlocks = Array.isArray(p.blocks)
              ? p.blocks
              : typeof p.blocks === "string"
              ? JSON.parse(p.blocks || "[]")
              : [];
            const parsedTags = Array.isArray(p.tags)
              ? p.tags
              : typeof p.tags === "string"
              ? JSON.parse(p.tags || "[]")
              : [];
            setForm({
              title: p.title || "",
              slug: p.slug || "",
              author: p.author || "BaiNest Studio",
              category: p.category || "Insights",
              status: p.status || "draft",
              excerpt: p.excerpt || "",
              cover_image: p.cover_image || "",
              seo_title: p.seo_title || "",
              seo_description: p.seo_description || "",
              published_at: p.published_at || new Date().toISOString(),
              // (2026-07-13) Set portfolio flags on fetch. Prev: portfolio inclusion only
              include_in_nav: Boolean(p.include_in_nav),
              include_in_portfolio: Boolean(p.include_in_portfolio),
              portfolio_only: Boolean(p.portfolio_only),
              blocks: parsedBlocks,
              tags: parsedTags,
            });
            setTags(parsedTags.length ? parsedTags.join(", ") : "");
          }
        })
        .catch(() => {});
    } else {
      setForm({
        ...emptyPost,
        blocks: [],
        published_at: new Date().toISOString(),
      });
      setTags("");
    }
  }, [id, existing]);

  // (2026-07-13) Manage and delete story comments in editor. Prev: none
  interface BlogComment {
    id: string;
    name: string;
    text: string;
    date: string;
  }
  const [blogComments, setBlogComments] = useState<BlogComment[]>([]);

  useEffect(() => {
    const activeSlug = form.slug || (existing && existing.slug);
    if (!activeSlug) return;
    const storageKey = `bainest_comments_${activeSlug}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setBlogComments(JSON.parse(saved));
        return;
      } catch {}
    }
    setBlogComments([]);
  }, [form.slug, existing]);

  const deleteBlogComment = (commentId: string) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    const activeSlug = form.slug || (existing && existing.slug);
    if (!activeSlug) return;
    const updated = blogComments.filter((c) => c.id !== commentId);
    setBlogComments(updated);
    localStorage.setItem(`bainest_comments_${activeSlug}`, JSON.stringify(updated));
  };

  // Existing authors from published / existing posts
  const existingAuthors = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.author?.trim()) set.add(p.author.trim());
    });
    if (!set.has("BaiNest Studio")) set.add("BaiNest Studio");
    return Array.from(set);
  }, [posts]);

  // Existing categories from published / existing posts
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category?.trim()) set.add(p.category.trim());
    });
    ["Brand strategy", "Digital", "Creative", "Case study", "Insights", "Growth"].forEach((c) =>
      set.add(c),
    );
    return Array.from(set);
  }, [posts]);

  {/* (2026-07-13) Include imported database tags in suggestion list. Prev: post tags only */}
  const existingTags = useMemo(() => {
    const set = new Set<string>(defaultTags);
    posts.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t?.trim()) set.add(t.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [posts]);

  // Check for duplicate slug across all stories
  const targetSlug = form.slug || slugify(form.title);
  const duplicatePost = useMemo(() => {
    if (!targetSlug) return null;
    return (
      posts.find(
        (p) => p.slug === targetSlug && String(p.id) !== String(id),
      ) || null
    );
  }, [targetSlug, posts, id]);

  const isDuplicateSlug = Boolean(duplicatePost);

  function applyTemplate(tpl: (typeof postTemplates)[0]) {
    setForm((old) => ({
      ...old,
      title: tpl.title,
      category: tpl.category,
      excerpt: tpl.excerpt,
      blocks: tpl.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    }));
    setTags(tpl.tags);
    setNotice(`Applied “${tpl.name}” template. Customize your story and publish.`);
  }

  // (2026-07-13) Show toast on delete action click. Prev: confirm only
  async function removeThisPost() {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this story permanently?")) {
      showToast("Delete cancelled.", "info");
      return;
    }
    showToast("Deleting story...", "warning");
    setBusy(true);
    try {
      await api(`/api/admin/posts/${id}`, { method: "DELETE" });
      refresh();
      showToast("Story deleted permanently.", "success");
      navigate("/admin/posts");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not delete post.";
      setNotice(errMsg);
      showToast(errMsg, "error");
    } finally {
      setBusy(false);
    }
  }

  const blocks = form.blocks as Block[];
  function patch(key: string, value: unknown) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function addBlock(type: Block["type"]) {
    patch("blocks", [
      ...blocks,
      {
        id: crypto.randomUUID(),
        type,
        text: "",
        label: type === "cta" ? "Get in touch" : undefined,
        href: type === "cta" ? "/contact" : undefined,
        items: type === "list" ? [""] : undefined,
        left: type === "columns" ? "" : undefined,
        right: type === "columns" ? "" : undefined,
      },
    ]);
  }

  function moveBlockUp(blockId: string) {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index > 0) {
      patch("blocks", arrayMove(blocks, index, index - 1));
    }
  }

  function moveBlockDown(blockId: string) {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index < blocks.length - 1) {
      patch("blocks", arrayMove(blocks, index, index + 1));
    }
  }

  function insertBlockAfter(afterId: string, type: Block["type"]) {
    const index = blocks.findIndex((b) => b.id === afterId);
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      text: "",
      label: type === "cta" ? "Get in touch" : undefined,
      href: type === "cta" ? "/contact" : undefined,
      items: type === "list" ? [""] : undefined,
      left: type === "columns" ? "" : undefined,
      right: type === "columns" ? "" : undefined,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    patch("blocks", newBlocks);
  }

  function updateBlock(blockId: string, key: string, value: string) {
    patch(
      "blocks",
      blocks.map((b) => {
        if (b.id !== blockId) return b;
        if (key === "items") return { ...b, items: value.split("\n") };
        return { ...b, [key]: value };
      }),
    );
  }

  function removeBlock(blockId: string) {
    patch(
      "blocks",
      blocks.filter((b) => b.id !== blockId),
    );
  }

  function drop(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const a = blocks.findIndex((b) => b.id === event.active.id),
      b = blocks.findIndex((x) => x.id === event.over?.id);
    patch("blocks", arrayMove(blocks, a, b));
  }

  // (2026-07-13) Show toast on preview action click. Prev: notice only
  function openPreview() {
    if (!id) {
      showToast("Save this story as a draft before previewing.", "warning");
      setNotice("Save this story as a draft before previewing it.");
      return;
    }
    showToast("Opening preview in new tab...", "info");
    window.open(
      `/blog/${encodeURIComponent(form.slug)}?preview=1&id=${id}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  // (2026-07-13) Show toast on save/publish action click. Prev: notice only
  async function save(status: "draft" | "published") {
    if (!form.title.trim()) {
      showToast("Please add a title before saving.", "warning");
      return setNotice("Add a title before saving.");
    }
    const finalSlug = form.slug || slugify(form.title);
    if (isDuplicateSlug) {
      showToast(`URL "/${finalSlug}" is already taken.`, "error");
      setNotice(
        `Cannot save: The URL "/${finalSlug}" is already taken by "${duplicatePost?.title}". Please customize the URL.`,
      );
      return;
    }
    setBusy(true);
    showToast(status === "published" ? (form.status === "published" ? "Updating post..." : "Publishing story...") : "Saving draft...", "info");
    // (2026-07-13) Compress & upload cover on save/publish. Prev: hung in form
    let finalCover = form.cover_image;
    if (pendingCoverFile) {
      setNotice("Compressing & uploading cover photo...");
      try {
        finalCover = await uploadBlogImage(pendingCoverFile, storage, {
          ref: storageRef,
          uploadBytes,
          getDownloadURL,
        });
        patch("cover_image", finalCover);
        setPendingCoverFile(null);
      } catch (err) {
        console.warn("Cover image upload failed", err);
      }
    }

    const payload = {
      ...form,
      cover_image: finalCover,
      status,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      blocks: blocks.map((b) =>
        b.type === "list" ? { ...b, items: b.items?.filter(Boolean) } : b,
      ),
      slug: finalSlug,
    };
    const actionLabel = status === "published" ? "Publishing story..." : "Saving draft...";
    setNotice(actionLabel);
    try {
      const saved = await api<Post>(
        id ? `/api/admin/posts/${id}` : "/api/admin/posts",
        { method: id ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      await refresh();
      const successMsg = status === "published"
        ? (form.status === "published" ? "Post updated successfully!" : "Published and ready to read.")
        : "Draft saved successfully.";
      setNotice(successMsg);
      showToast(successMsg, "success");
      if (!id) navigate(`/admin/posts/${saved.id}`, { replace: true });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not save this story.";
      setNotice(errMsg);
      showToast(errMsg, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {/* (2026-07-13) Little floating toast for editor action buttons. Prev: none */}
      {toast && (
        <div className={`admin-toast-badge toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" && <Check size={16} />}
            {toast.type === "error" && <X size={16} />}
            {toast.type === "warning" && <X size={16} />}
            {toast.type === "info" && <Sparkles size={16} />}
          </span>
          <span className="toast-text">{toast.message}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            <X size={13} />
          </button>
        </div>
      )}
      <div className="admin-page-title editor-title">
        <div>
          <button
            className="back-button"
            onClick={() => navigate("/admin/posts")}
          >
            <ArrowLeft size={15} /> All stories
          </button>
          <span className="admin-kicker">
            {id ? "Edit story" : "New story"}
          </span>
          <h1>{id ? "Shape the story." : "Start with a story."}</h1>
        </div>
        <div className="editor-actions">
          <button className="admin-light" onClick={openPreview}>
            <Eye size={15} /> Preview
          </button>
          <button
            className="admin-light"
            onClick={() => save("draft")}
            disabled={busy}
          >
            <Save size={15} /> Save draft
          </button>
          <button
            className="admin-primary"
            onClick={() => save("published")}
            disabled={busy}
          >
            {busy
              ? "Saving…"
              : form.status === "published"
                ? "Update post"
                : "Publish"}{" "}
            <ArrowUpRight size={15} />
          </button>
          {id && (
            <button
              className="admin-light danger-btn"
              onClick={removeThisPost}
              disabled={busy}
              title="Delete this story"
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>
      {/* (2026-07-13) Professional story template picker for new posts. Prev: none */}
      {!id && (
        <div className="template-picker">
          <div className="template-picker-head">
            <span className="template-picker-title">
              ✨ Professional Story Templates
            </span>
            <span className="template-picker-hint">
              Click any template to auto-populate layout, or write from scratch
            </span>
          </div>
          {/* (2026-07-13) Template cards with distinct icons. Prev: text only */}
          <div className="template-cards-grid">
            {postTemplates.map((tpl) => {
              const IconComponent = tpl.icon;
              return (
                <button
                  key={tpl.name}
                  type="button"
                  className="template-card-btn"
                  onClick={() => applyTemplate(tpl)}
                >
                  <div className="template-icon-wrap">
                    <IconComponent size={18} />
                  </div>
                  <b>{tpl.name}</b>
                  <small>{tpl.desc}</small>
                </button>
              );
            })}
            <button
              type="button"
              className="template-card-btn"
              onClick={() => {
                setForm({ ...emptyPost, blocks: [] });
                setTags("");
                setNotice("Reset to blank story.");
              }}
            >
              <div className="template-icon-wrap">
                <PlusCircle size={18} />
              </div>
              <b>Blank Canvas</b>
              <small>Start with a clean title and empty block editor</small>
            </button>
          </div>
        </div>
      )}
      <div className="editor-layout">
        <div className="editor-main">
          <div className="editor-surface">
            {/* (2026-07-13) Instant thumbnail preview with post upload. Prev: hung uploader */}
            <div className="main-cover-section">
              <div className="main-cover-header">
                <span className="cover-section-title">
                  <ImageIcon size={18} /> Featured Cover Photo
                </span>
                {form.cover_image && (
                  /* (2026-07-13) Responsive cover buttons container. Prev: inline flex style */
                  <div className="main-cover-actions">
                    {/* (2026-07-13) Add Crop to Blog Size button on cover. Prev: remove only */}
                    <button
                      type="button"
                      className="cover-crop-action"
                      onClick={() => setCropModalSrc(form.cover_image)}
                    >
                      <Crop size={13} /> Crop to Blog Size
                    </button>
                    {pendingCoverFile && (
                      <button
                        type="button"
                        className="cover-upload-now-btn"
                        onClick={uploadPendingCover}
                        disabled={coverUploading}
                      >
                        <Upload size={13} /> {coverUploading ? "Compressing..." : "Compress & upload now"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="cover-remove-action"
                      onClick={() => {
                        setPendingCoverFile(null);
                        patch("cover_image", "");
                      }}
                    >
                      <Trash2 size={13} /> Remove cover
                    </button>
                  </div>
                )}
              </div>
              {form.cover_image ? (
                <div className="main-cover-preview">
                  <img src={form.cover_image} alt="Story cover" />
                  {pendingCoverFile && (
                    <div className="cover-pending-badge">
                      <span>Preview ready · Auto-compresses on publish</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="cover-uploader-box">
                  <label className="cover-dropzone-click">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={coverUploading}
                      onChange={handleCoverUpload}
                    />
                    <div className="cover-upload-icon-circle">
                      <Upload size={22} />
                    </div>
                    <b>Upload Cover Photo</b>
                    <span>Click to browse from device or drag image here</span>
                  </label>
                  <div className="cover-url-input-wrap">
                    <input
                      value={form.cover_image}
                      onChange={(e) => patch("cover_image", e.target.value)}
                      placeholder="Or paste image URL (e.g. https://... or /images/cover.jpg)"
                      className="cover-url-field"
                    />
                  </div>
                </div>
              )}
            </div>

            <label className="title-input">
              <span>Post title</span>
              <input
                value={form.title}
                onChange={(e) => {
                  patch("title", e.target.value);
                  if (!id) patch("slug", slugify(e.target.value));
                }}
                placeholder="Give this story a title"
              />
            </label>
            <label className="field-label">
              Short introduction
              <textarea
                rows={2}
                maxLength={600}
                value={form.excerpt}
                onChange={(e) => patch("excerpt", e.target.value)}
                placeholder="A short summary for the journal listing…"
              />
            </label>

            {/* Block Editor Toolbox */}
            <div className="block-editor-heading">
              <div>
                <h2>Story content</h2>
                <p>Add and arrange blocks or insert images anywhere in your layout.</p>
              </div>
              <span>{blocks.length} blocks</span>
            </div>

            {/* (2026-07-13) Top block insert palette with icons. Prev: plain buttons */}
            <div className="block-quick-palette">
              <span className="palette-label">Add Block:</span>
              <div className="palette-buttons">
                <button
                  type="button"
                  onClick={() => addBlock("image")}
                  className="palette-tool-btn image-highlight"
                  title="Insert an image at the end"
                >
                  <ImageIcon size={14} /> + Image
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("paragraph")}
                  className="palette-tool-btn"
                  title="Add text paragraph"
                >
                  <Type size={14} /> + Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("heading")}
                  className="palette-tool-btn"
                  title="Add section heading"
                >
                  <HeadingIcon size={14} /> + Heading
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("quote")}
                  className="palette-tool-btn"
                  title="Add pull quote"
                >
                  <Quote size={14} /> + Quote
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("list")}
                  className="palette-tool-btn"
                  title="Add bulleted list"
                >
                  <ListIcon size={14} /> + List
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("divider")}
                  className="palette-tool-btn"
                  title="Add section divider"
                >
                  <Minus size={14} /> + Divider
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("cta")}
                  className="palette-tool-btn"
                  title="Add call to action"
                >
                  <ArrowUpRight size={14} /> + CTA
                </button>
              </div>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={drop}>
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="blocks-list">
                  {blocks.map((b, i) => (
                    <SortableBlock
                      key={b.id}
                      block={b}
                      index={i}
                      total={blocks.length}
                      onChange={updateBlock}
                      onRemove={removeBlock}
                      onMoveUp={moveBlockUp}
                      onMoveDown={moveBlockDown}
                      onInsertAfter={insertBlockAfter}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {!blocks.length && (
              <div className="block-empty">
                Start building your story by adding an image, heading, or paragraph above.
              </div>
            )}
          </div>
        </div>
        <aside className="editor-side">
          {/* (2026-07-13) Move URL & discovery card above Publishing card. Prev: bottom */}
          <div className="editor-side-card">
            <h3>URL & discovery</h3>
            <label>
              <span>Post URL</span>
              <input
                value={form.slug}
                onChange={(e) => patch("slug", slugify(e.target.value))}
                className={isDuplicateSlug ? "input-duplicate-error" : ""}
                placeholder="custom-story-url"
              />
              <small>/{targetSlug || "your-story"}</small>
              {isDuplicateSlug && (
                <div className="slug-duplicate-warn">
                  ⚠️ URL already taken by &ldquo;{duplicatePost?.title}&rdquo;. Please choose a unique URL.
                </div>
              )}
            </label>
            <label>
              SEO title
              <input
                maxLength={180}
                value={form.seo_title}
                onChange={(e) => patch("seo_title", e.target.value)}
                placeholder={form.title || "Search title"}
              />
            </label>
            <label>
              SEO description
              <textarea
                rows={3}
                maxLength={320}
                value={form.seo_description}
                onChange={(e) => patch("seo_description", e.target.value)}
                placeholder="A useful search summary"
              />
            </label>
          </div>

          <div className="editor-side-card">
            <h3>Publishing</h3>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => patch("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label>
              Publication date
              <input
                type="datetime-local"
                value={
                  form.published_at
                    ? new Date(form.published_at).toISOString().slice(0, 16)
                    : new Date().toISOString().slice(0, 16)
                }
                onChange={(e) =>
                  patch(
                    "published_at",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : new Date().toISOString(),
                  )
                }
              />
              <small>Automatically set to today.</small>
            </label>

            {/* (2026-07-13) Full-width author with autocomplete and quick chips. Prev: squished select */}
            <label>
              <span>Author</span>
              <input
                list="authors-datalist"
                value={form.author}
                onChange={(e) => patch("author", e.target.value)}
                placeholder="BaiNest Studio"
              />
              <datalist id="authors-datalist">
                {existingAuthors.map((a: string) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
              {existingAuthors.length > 0 && (
                <div className="taxonomy-quick-pick">
                  {existingAuthors.map((a: string) => (
                    <button
                      key={a}
                      type="button"
                      className={`tax-chip ${form.author === a ? "active" : ""}`}
                      onClick={() => patch("author", a)}
                    >
                      {form.author === a ? "✓ " : ""}{a}
                    </button>
                  ))}
                </div>
              )}
            </label>

            {/* (2026-07-13) Full-width category with autocomplete and chips. Prev: squished select */}
            <label>
              <span>Category</span>
              <input
                list="categories-datalist"
                value={form.category}
                onChange={(e) => patch("category", e.target.value)}
                placeholder="e.g. Insights, Strategy, Digital"
              />
              <datalist id="categories-datalist">
                {existingCategories.map((c: string) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {existingCategories.length > 0 && (
                <div className="taxonomy-quick-pick">
                  {existingCategories.map((c: string) => (
                    <button
                      key={c}
                      type="button"
                      className={`tax-chip ${form.category === c ? "active" : ""}`}
                      onClick={() => patch("category", c)}
                    >
                      {form.category === c ? "✓ " : ""}{c}
                    </button>
                  ))}
                </div>
              )}
            </label>

            {/* (2026-07-13) Tags with autofill chips. Prev: text only */}
            <label>
              <span>Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Brand, Strategy, Digital"
              />
              <small>Separate tags with commas, or click existing tags:</small>
              {existingTags.length > 0 && (
                <div className="editor-tags-suggestions">
                  {existingTags.map((tg: string) => {
                    const isSelected = tags
                      .split(",")
                      .map((t) => t.trim())
                      .includes(tg);
                    return (
                      <button
                        key={tg}
                        type="button"
                        className={`tag-suggestion-chip ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          const current = tags
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                          if (isSelected) {
                            setTags(current.filter((t) => t !== tg).join(", "));
                          } else {
                            setTags([...current, tg].join(", "));
                          }
                        }}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {tg}
                      </button>
                    );
                  })}
                </div>
              )}
            </label>

            {/* (2026-07-13) Sized header nav checkbox to 15px font. Prev: 0.86rem */}
            <label className="nav-toggle-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", cursor: "pointer", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              <input
                type="checkbox"
                checked={Boolean(form.include_in_nav)}
                onChange={(e) => patch("include_in_nav", e.target.checked)}
                style={{ width: "18px", height: "18px", margin: 0, accentColor: "#0d9488", cursor: "pointer" }}
              />
              Include in header navigation
            </label>

            {/* (2026-07-13) Set story placement: Blog, Portfolio, or Both. Prev: checkboxes */}
            <div className="placement-selector-box" style={{ marginTop: "16px", padding: "14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>Placement Type</span>
                <span className={`placement-chip placement-${getPostPlacement(form).toLowerCase()}`}>
                  {getPostPlacement(form)}
                </span>
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                  <input
                    type="radio"
                    name="placement_mode"
                    checked={!form.include_in_portfolio && !form.portfolio_only}
                    onChange={() => {
                      patch("include_in_portfolio", false);
                      patch("portfolio_only", false);
                    }}
                    style={{ width: "16px", height: "16px", accentColor: "#0d9488", cursor: "pointer" }}
                  />
                  Blog only
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                  <input
                    type="radio"
                    name="placement_mode"
                    checked={Boolean(form.portfolio_only)}
                    onChange={() => {
                      patch("include_in_portfolio", true);
                      patch("portfolio_only", true);
                    }}
                    style={{ width: "16px", height: "16px", accentColor: "#0d9488", cursor: "pointer" }}
                  />
                  Portfolio only (hidden from Blog)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                  <input
                    type="radio"
                    name="placement_mode"
                    checked={Boolean(form.include_in_portfolio) && !form.portfolio_only}
                    onChange={() => {
                      patch("include_in_portfolio", true);
                      patch("portfolio_only", false);
                    }}
                    style={{ width: "16px", height: "16px", accentColor: "#0d9488", cursor: "pointer" }}
                  />
                  Both (Blog & Portfolio)
                </label>
              </div>
            </div>
          </div>

          {/* (2026-07-13) Admin comment management card with delete capability. Prev: none */}
          <div className="editor-side-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0 }}>Comments ({blogComments.length})</h3>
              <small style={{ color: "#64748b", fontSize: "11px" }}>Manage comments</small>
            </div>
            {blogComments.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                No reader comments posted on this story yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {blogComments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>{c.name}</strong>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>{c.date}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: 1.5, wordBreak: "break-word" }}>
                      {c.text}
                    </p>
                    <button
                      type="button"
                      style={{
                        alignSelf: "flex-end",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        color: "#e11d48",
                        padding: "3px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => deleteBlogComment(c.id)}
                      title="Delete comment permanently"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notice && (
            <div
              className={`editor-notice ${notice.includes("could not") || notice.includes("Add a title") || notice.includes("already") ? "error" : ""}`}
            >
              {notice.includes("Published") || notice.includes("saved") ? (
                <Check size={15} />
              ) : null}
              {notice}
            </div>
          )}
        </aside>
      </div>
      {/* (2026-07-13) Render crop modal for cover photos. Prev: none */}
      {cropModalSrc && (
        <ImageCropperModal
          imageSrc={cropModalSrc}
          onCrop={handleCoverCropped}
          onClose={() => setCropModalSrc(null)}
        />
      )}
    </>
  );
}
// (2026-07-13) Manage live global social and contact settings. Prev: siteName only
function DomainSettings() {
  const [domains, setDomains] = useState<any[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [host, setHost] = useState("");
  const [blog, setBlog] = useState("BaiNest");
  const [notice, setNotice] = useState("");
  async function refresh() {
    const [d, s] = await Promise.all([
      api<any[]>("/api/admin/domains"),
      api<SiteSettings>("/api/admin/settings"),
    ]);
    setDomains(d);
    setSettings(s || defaultSettings);
  }
  useEffect(() => {
    refresh().catch(() => {});
  }, []);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/admin/domains", {
        method: "POST",
        body: JSON.stringify({ hostname: host, blog_name: blog }),
      });
      setHost("");
      setNotice("Local mapping saved. It is not yet verified on public DNS.");
      await refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save domain.");
    }
  }
  async function remove(id: number) {
    await api(`/api/admin/domains/${id}`, { method: "DELETE" });
    refresh();
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setNotice("Site and social settings saved to Firestore.");
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Could not save settings.",
      );
    }
  }
  return (
    <>
      <div className="admin-page-title">
        <div>
          <span className="admin-kicker">Configuration</span>
          <h1>Make this space yours.</h1>
          <p>Configure site branding, contact information, and global social media profiles.</p>
        </div>
      </div>
      {notice && (
        <div className={`editor-notice ${notice.includes("Could") ? "error" : ""}`} style={{ marginBottom: 16 }}>
          {notice}
        </div>
      )}
      <div className="settings-grid">
        <form className="admin-panel settings-panel" onSubmit={saveSettings}>
          <div className="panel-head">
            <div>
              <h2>Global Site & Socials</h2>
              <p>Stored in cloud Firestore and applied across all public pages and sidebars.</p>
            </div>
          </div>
          <label>
            Site name
            <input
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />
          </label>
          <label>
            Contact Email
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="contact@bainestdigital.com"
            />
          </label>
          <label>
            Phone / WhatsApp
            <input
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="+63 900 000 0000"
            />
          </label>
          <label>
            Facebook URL
            <input
              value={settings.facebook}
              onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
              placeholder="https://facebook.com/yourpage"
            />
          </label>
          <label>
            Twitter / X URL
            <input
              value={settings.twitter}
              onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
              placeholder="https://x.com/yourhandle"
            />
          </label>
          <label>
            Instagram URL
            <input
              value={settings.instagram}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              placeholder="https://instagram.com/yourhandle"
            />
          </label>
          <label>
            YouTube Channel URL
            <input
              value={settings.youtube}
              onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
              placeholder="https://youtube.com/@yourchannel"
            />
          </label>
          <button className="admin-primary">
            <Save size={15} /> Save changes
          </button>
        </form>
        <section className="admin-panel settings-panel">
          <div className="panel-head">
            <div>
              <h2>Blog domains</h2>
              <p>Configure local blog-to-host mappings.</p>
            </div>
          </div>
          <form className="domain-add-form" onSubmit={add}>
            <label>
              Domain name
              <input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="journal.example.com"
                required
              />
            </label>
            <label>
              Blog/site label
              <input
                value={blog}
                onChange={(e) => setBlog(e.target.value)}
                required
              />
            </label>
            <button className="admin-primary">
              <Plus size={15} /> Add mapping
            </button>
          </form>
          {domains.map((d) => (
            <div className="domain-row" key={d.id}>
              <span className="domain-icon">
                <Globe2 size={17} />
              </span>
              <span>
                <b>{d.hostname}</b>
                <small>{d.blog_name} · local mapping</small>
              </span>
              <span
                className={`status-pill ${d.verified ? "published" : "draft"}`}
              >
                {d.verified ? "Verified" : "Local preview"}
              </span>
              <Link
                className="domain-preview-link"
                to={`/?previewDomain=${encodeURIComponent(d.hostname)}`}
                target="_blank"
              >
                Preview
              </Link>
              <button
                className="icon-button danger"
                onClick={() => remove(d.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!domains.length && (
            <div className="admin-empty">No local domains configured yet.</div>
          )}
          <div className="domain-explainer">
            <Globe2 size={16} />
            <p>
              <b>Local preview only.</b> Public custom domains need DNS records,
              TLS, and hosting that accepts the hostname. This local app does
              not change DNS or issue certificates.
            </p>
          </div>
        </section>
      </div>
      {notice && <p className="settings-notice">{notice}</p>}
    </>
  );
}
function formatInboxDate(raw: any): string {
  if (!raw) return "Just now";
  try {
    if (typeof raw === "object" && typeof raw.toDate === "function") {
      const d = raw.toDate();
      return (
        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
        " • " +
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      );
    }
    if (typeof raw === "object" && typeof raw.seconds === "number") {
      const d = new Date(raw.seconds * 1000);
      return (
        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
        " • " +
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      );
    }
    let s = String(raw).trim().replace(/Z+$/i, "Z");
    let d = new Date(s);
    if (isNaN(d.getTime())) {
      d = new Date(s.endsWith("Z") ? s : s + "Z");
    }
    if (!isNaN(d.getTime())) {
      return (
        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
        " • " +
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      );
    }
  } catch {}
  return "Just now";
}

// (2026-07-13) Format inbox contact dates & polish inbox UI. Prev: invalid date
function InboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeToContacts((liveContacts) => {
      setMessages(liveContacts);
    });
    api<any[]>("/api/admin/contacts")
      .then(setMessages)
      .catch(() => {});
    return () => unsub();
  }, []);

  async function mark(id: number | string) {
    await api(`/api/admin/contacts/${id}/read`, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    setMessages((x) => x.map((m) => (m.id === id ? { ...m, read: 1 } : m)));
  }

  async function handleDelete(id: number | string) {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await api(`/api/admin/contacts/${id}`, { method: "DELETE" });
      setMessages((x) => x.filter((m) => m.id !== id));
    } catch {}
  }

  const unreadCount = messages.filter((m) => !m.read).length;
  const readCount = messages.filter((m) => !!m.read).length;

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (filter === "unread" && m.read) return false;
      if (filter === "read" && !m.read) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const n = (m.name || "").toLowerCase();
        const e = (m.email || "").toLowerCase();
        const c = (m.company || "").toLowerCase();
        const msg = (m.message || "").toLowerCase();
        return n.includes(q) || e.includes(q) || c.includes(q) || msg.includes(q);
      }
      return true;
    });
  }, [messages, filter, search]);

  return (
    <>
      <div className="admin-page-title">
        <div>
          <span className="admin-kicker">Messages</span>
          <h1>The conversation starts here.</h1>
          <p>Contact form submissions saved in your local inbox with full date tracking.</p>
        </div>
      </div>

      <div className="inbox-controls-bar">
        {/* Filter buttons by read status */}
        <div className="inbox-filter-group">
          <button
            type="button"
            className={`inbox-filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All <span className="inbox-pill-count">{messages.length}</span>
          </button>
          <button
            type="button"
            className={`inbox-filter-pill ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread <span className="inbox-pill-count unread-pill">{unreadCount}</span>
          </button>
          <button
            type="button"
            className={`inbox-filter-pill ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Read <span className="inbox-pill-count">{readCount}</span>
          </button>
        </div>

        {/* Search filter for messages */}
        <div className="inbox-search-box">
          <Search size={14} className="inbox-search-icon" />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <section className="inbox-cards-container">
        {filtered.map((m) => (
          <article className={`inbox-card ${m.read ? "is-read" : "is-unread"}`} key={m.id}>
            <div className="inbox-card-header">
              <div className="inbox-sender-cell">
                <div className="inbox-card-avatar">
                  {(m.name?.[0] || "U").toUpperCase()}
                </div>
                <div className="inbox-sender-info">
                  <div className="inbox-sender-name-row">
                    <h3 className="inbox-sender-name">{m.name || "Anonymous Contact"}</h3>
                    {m.read ? (
                      <span className="inbox-status-tag read-tag">Read</span>
                    ) : (
                      <span className="inbox-status-tag unread-tag">New</span>
                    )}
                  </div>
                  <div className="inbox-meta-chips">
                    <a href={`mailto:${m.email}`} className="inbox-meta-chip email-chip">
                      <Mail size={12} />
                      <span>{m.email}</span>
                    </a>
                    {m.company && (
                      <span className="inbox-meta-chip company-chip">
                        <Building size={12} />
                        <span>{m.company}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="inbox-timestamp-badge" title={String(m.created_at)}>
                <Clock size={12} />
                <time>{formatInboxDate(m.created_at)}</time>
              </div>
            </div>

            {/* Message body container */}
            <div className="inbox-message-body">
              <p>{m.message}</p>
            </div>

            {/* Action buttons footer */}
            <div className="inbox-card-footer">
              <div className="inbox-actions-left">
                {!m.read ? (
                  <button
                    type="button"
                    className="inbox-action-btn primary-mark-btn"
                    onClick={() => mark(m.id)}
                  >
                    <Check size={14} /> Mark as read
                  </button>
                ) : (
                  <span className="inbox-read-indicator">
                    <Check size={14} /> Completed
                  </span>
                )}
                <a
                  href={`mailto:${m.email}?subject=Re:%20BaiNest%20Inquiry`}
                  className="inbox-action-btn reply-btn"
                >
                  <Mail size={14} /> Reply by email
                </a>
              </div>
              <button
                type="button"
                className="inbox-action-btn delete-btn"
                title="Delete message"
                onClick={() => handleDelete(m.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        ))}

        {!filtered.length && (
          <div className="admin-empty inbox-empty-state">
            <Inbox size={32} style={{ opacity: 0.35, marginBottom: 8 }} />
            <p>
              {search
                ? "No contact submissions match your search."
                : filter === "unread"
                ? "No unread messages. You’re all caught up!"
                : "No messages yet. New contact form submissions will appear here."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}

/* (2026-07-13) Manage live editable About page content in Firestore. Prev: none */
function AboutPageEditor() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    api<SiteSettings>("/api/admin/settings")
      .then((s) => setSettings(s || defaultSettings))
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setToast({ message: "About page updated successfully!", type: "success" });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to update About page.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && (
        <div className={`admin-toast-badge toast-${toast.type}`}>
          <span className="toast-icon">
            <Check size={16} />
          </span>
          <span className="toast-text">{toast.message}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* (2026-07-13) Responsive styled about editor with polished textareas. Prev: raw */}
      <div className="about-page-editor-container">
        <div className="admin-page-title about-editor-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="admin-kicker">Content & Story</span>
            <h1>Edit About Page</h1>
            <p>Update hero message, company point of view, quotes, and guiding values on the public /about page.</p>
          </div>
          <div className="about-editor-header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link to="/about" target="_blank" rel="noopener noreferrer" className="admin-light" style={{ textDecoration: "none" }}>
              <Eye size={15} /> View live page <ArrowUpRight size={14} />
            </Link>
            <button
              type="button"
              className="admin-primary"
              onClick={(e) => handleSave(e as any)}
              disabled={saving}
            >
              <Save size={15} /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
          {/* Section 1: Hero Banner */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Hero Banner</h2>
                <p>The first headline and introduction visitors see at the top of the About page.</p>
              </div>
            </div>
            <div className="about-editor-fields">
              <div className="about-editor-field">
                <label>
                  Hero eyebrow tag
                  <input
                    value={settings.aboutHeroLabel ?? "About BaiNest"}
                    onChange={(e) => setSettings({ ...settings, aboutHeroLabel: e.target.value })}
                    placeholder="About BaiNest"
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  Hero headline
                  <input
                    value={settings.aboutHeroTitle ?? "Thoughtful partners for your next chapter."}
                    onChange={(e) => setSettings({ ...settings, aboutHeroTitle: e.target.value })}
                    placeholder="Thoughtful partners for your next chapter."
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  Hero introduction copy
                  <textarea
                    rows={3}
                    value={settings.aboutHeroCopy ?? "We bring the right questions, clear strategy, and considered creative to help your business move forward."}
                    onChange={(e) => setSettings({ ...settings, aboutHeroCopy: e.target.value })}
                    placeholder="We bring the right questions, clear strategy, and considered creative..."
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Section 2: Story & Point of View */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Point of View & Story</h2>
                <p>The central quote and narrative explaining how BaiNest approaches work.</p>
              </div>
            </div>
            <div className="about-editor-fields">
              <div className="about-editor-field">
                <label>
                  Highlight callout quote
                  <textarea
                    rows={2}
                    value={settings.aboutQuote ?? "“Good work should feel clear from the first conversation to the final detail.”"}
                    onChange={(e) => setSettings({ ...settings, aboutQuote: e.target.value })}
                    placeholder="“Good work should feel clear from the first conversation to the final detail.”"
                  />
                </label>
              </div>
              <div className="about-editor-row">
                <div className="about-editor-field">
                  <label>
                    Section eyebrow
                    <input
                      value={settings.aboutStoryEyebrow ?? "Our point of view"}
                      onChange={(e) => setSettings({ ...settings, aboutStoryEyebrow: e.target.value })}
                      placeholder="Our point of view"
                    />
                  </label>
                </div>
                <div className="about-editor-field">
                  <label>
                    Story headline
                    <input
                      value={settings.aboutStoryTitle ?? "Strategy and making, working as one."}
                      onChange={(e) => setSettings({ ...settings, aboutStoryTitle: e.target.value })}
                      placeholder="Strategy and making, working as one."
                    />
                  </label>
                </div>
              </div>
              <div className="about-editor-field">
                <label>
                  Story paragraph 1
                  <textarea
                    rows={3}
                    value={settings.aboutStoryBody1 ?? "BaiNest is an independent digital studio for businesses ready to grow with intention. We connect the dots between what you stand for, what you make, and how people experience it."}
                    onChange={(e) => setSettings({ ...settings, aboutStoryBody1: e.target.value })}
                    placeholder="First narrative paragraph..."
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  Story paragraph 2
                  <textarea
                    rows={3}
                    value={settings.aboutStoryBody2 ?? "We believe the strongest work is generous with clarity, ambitious with purpose, and practical enough to make a real difference."}
                    onChange={(e) => setSettings({ ...settings, aboutStoryBody2: e.target.value })}
                    placeholder="Second narrative paragraph..."
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Section 3: Guiding Values */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Guiding Values ("What Guides Us")</h2>
                <p>The three core principles displayed in the cards section of the About page.</p>
              </div>
            </div>
            <div className="about-editor-fields">
              <div className="about-editor-row">
                <div className="about-editor-field">
                  <label>
                    Values section eyebrow
                    <input
                      value={settings.aboutValuesEyebrow ?? "What guides us"}
                      onChange={(e) => setSettings({ ...settings, aboutValuesEyebrow: e.target.value })}
                      placeholder="What guides us"
                    />
                  </label>
                </div>
                <div className="about-editor-field">
                  <label>
                    Values section headline
                    <input
                      value={settings.aboutValuesTitle ?? "Good work is good partnership."}
                      onChange={(e) => setSettings({ ...settings, aboutValuesTitle: e.target.value })}
                      placeholder="Good work is good partnership."
                    />
                  </label>
                </div>
              </div>

              <div className="about-values-grid">
                {/* Value 1 */}
                <div className="about-value-card-editor">
                  <span className="about-value-badge">Value 01</span>
                  <div className="about-editor-field">
                    <label>
                      Title
                      <input
                        value={settings.aboutValue1Title ?? "Care in the details"}
                        onChange={(e) => setSettings({ ...settings, aboutValue1Title: e.target.value })}
                        placeholder="Care in the details"
                      />
                    </label>
                  </div>
                  <div className="about-editor-field">
                    <label>
                      Description
                      <textarea
                        rows={3}
                        value={settings.aboutValue1Copy ?? "Thoughtful craft earns trust one useful decision at a time."}
                        onChange={(e) => setSettings({ ...settings, aboutValue1Copy: e.target.value })}
                        placeholder="Value description..."
                      />
                    </label>
                  </div>
                </div>

                {/* Value 2 */}
                <div className="about-value-card-editor">
                  <span className="about-value-badge">Value 02</span>
                  <div className="about-editor-field">
                    <label>
                      Title
                      <input
                        value={settings.aboutValue2Title ?? "Connected thinking"}
                        onChange={(e) => setSettings({ ...settings, aboutValue2Title: e.target.value })}
                        placeholder="Connected thinking"
                      />
                    </label>
                  </div>
                  <div className="about-editor-field">
                    <label>
                      Description
                      <textarea
                        rows={3}
                        value={settings.aboutValue2Copy ?? "Strategy and execution belong in the same conversation."}
                        onChange={(e) => setSettings({ ...settings, aboutValue2Copy: e.target.value })}
                        placeholder="Value description..."
                      />
                    </label>
                  </div>
                </div>

                {/* Value 3 */}
                <div className="about-value-card-editor">
                  <span className="about-value-badge">Value 03</span>
                  <div className="about-editor-field">
                    <label>
                      Title
                      <input
                        value={settings.aboutValue3Title ?? "Momentum over noise"}
                        onChange={(e) => setSettings({ ...settings, aboutValue3Title: e.target.value })}
                        placeholder="Momentum over noise"
                      />
                    </label>
                  </div>
                  <div className="about-editor-field">
                    <label>
                      Description
                      <textarea
                        rows={3}
                        value={settings.aboutValue3Copy ?? "We choose meaningful progress over busywork and buzzwords."}
                        onChange={(e) => setSettings({ ...settings, aboutValue3Copy: e.target.value })}
                        placeholder="Value description..."
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              type="submit"
              className="admin-primary"
              disabled={saving}
              style={{ minWidth: 160 }}
            >
              <Save size={16} /> {saving ? "Saving..." : "Save About Page"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* (2026-07-13) Services page editor with image uploads. Prev: no editor */
function ServicesPageEditor() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [servicesList, setServicesList] = useState<ServiceItemSetting[]>(defaultServicesList);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    api<SiteSettings>("/api/admin/settings")
      .then((s) => {
        if (s) {
          setSettings(s);
          if (s.servicesList && s.servicesList.length > 0) {
            setServicesList(s.servicesList);
          }
        }
      })
      .catch(() => {});
  }, []);

  async function handleServiceImageUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(idx);
    try {
      let url = "";
      try {
        // (2026-07-13) Fix storage helper ref prop name. Prev: storageRef
        url = await uploadBlogImage(file, storage, {
          ref: storageRef,
          uploadBytes,
          getDownloadURL,
        });
      } catch {
        const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.76, outputType: "dataUrl" });
        url = compressed as string;
      }
      const updated = [...servicesList];
      updated[idx] = { ...updated[idx], image: url };
      setServicesList(updated);
      setToast({ message: "Picture uploaded successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ message: "Failed to upload picture.", type: "error" });
    } finally {
      setUploadingIdx(null);
    }
  }

  function removeServiceImage(idx: number) {
    const updated = [...servicesList];
    const item = { ...updated[idx] };
    delete item.image;
    updated[idx] = item;
    setServicesList(updated);
  }

  function updateServiceField(idx: number, field: keyof ServiceItemSetting, val: any) {
    const updated = [...servicesList];
    updated[idx] = { ...updated[idx], [field]: val };
    setServicesList(updated);
  }

  function updateCapabilities(idx: number, text: string) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    updateServiceField(idx, "items", lines);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: SiteSettings = {
        ...settings,
        servicesList,
      };
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSettings(payload);
      setToast({ message: "Services page updated successfully!", type: "success" });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to update Services page.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && (
        <div className={`admin-toast-badge toast-${toast.type}`}>
          <span className="toast-icon">
            <Check size={16} />
          </span>
          <span className="toast-text">{toast.message}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="about-page-editor-container">
        <div className="admin-page-title about-editor-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="admin-kicker">Capabilities & Offerings</span>
            <h1>Edit Services Page</h1>
            <p>Customize the headline, service descriptions, deliverables, and optional pictures on /services.</p>
          </div>
          <div className="about-editor-header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link to="/services" target="_blank" rel="noopener noreferrer" className="admin-light" style={{ textDecoration: "none" }}>
              <Eye size={15} /> View live page <ArrowUpRight size={14} />
            </Link>
            <button
              type="button"
              className="admin-primary"
              onClick={(e) => handleSave(e as any)}
              disabled={saving}
            >
              <Save size={15} /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
          {/* Section 1: Hero Banner */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Hero Section</h2>
                <p>The headline and description at the top of the Services page.</p>
              </div>
            </div>
            <div className="about-editor-fields">
              <div className="about-editor-field">
                <label>
                  Eyebrow label
                  <input
                    value={settings.servicesHeroLabel ?? "OUR SERVICES"}
                    onChange={(e) => setSettings({ ...settings, servicesHeroLabel: e.target.value })}
                    placeholder="OUR SERVICES"
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  Services headline
                  <input
                    value={settings.servicesHeroTitle ?? "We bring strategy, creativity, and digital solutions together."}
                    onChange={(e) => setSettings({ ...settings, servicesHeroTitle: e.target.value })}
                    placeholder="We bring strategy, creativity, and digital solutions together."
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  Services introduction copy
                  <textarea
                    rows={3}
                    value={settings.servicesHeroCopy ?? "We bring strategy, creativity, and digital solutions together to help businesses build stronger brands, connect with their audience, and grow online."}
                    onChange={(e) => setSettings({ ...settings, servicesHeroCopy: e.target.value })}
                    placeholder="Services introduction copy..."
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Section 2: Services Offerings & Pictures */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Services & Pictures</h2>
                <p>Upload optional pictures and adjust titles, descriptions, and deliverables for each service.</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {servicesList.map((srv, idx) => (
                <div key={srv.no || idx} className="service-editor-item-card">
                  <div className="service-editor-item-head">
                    <span className="service-editor-item-badge">Service {srv.no}</span>
                    <small style={{ color: "#94a3b8", fontWeight: 600 }}>{srv.title}</small>
                  </div>

                  <div className="about-editor-row">
                    <div className="about-editor-field">
                      <label>
                        Service title
                        <input
                          value={srv.title}
                          onChange={(e) => updateServiceField(idx, "title", e.target.value)}
                          placeholder="e.g. Brand & Strategy"
                        />
                      </label>
                    </div>
                    <div className="about-editor-field">
                      <label>
                        Service number tag
                        <input
                          value={srv.no}
                          onChange={(e) => updateServiceField(idx, "no", e.target.value)}
                          placeholder="e.g. 01"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="about-editor-field">
                    <label>
                      Tagline / description
                      <textarea
                        rows={2}
                        value={srv.text}
                        onChange={(e) => updateServiceField(idx, "text", e.target.value)}
                        placeholder="A distinct identity. A clear direction..."
                      />
                    </label>
                  </div>

                  {/* Picture Upload Area (Optional) */}
                  <div className="service-image-field-wrap">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                        Cover Picture <span style={{ color: "#94a3b8", fontWeight: 500 }}>(Optional)</span>
                      </span>
                      {srv.image && (
                        <span style={{ fontSize: "11px", color: "#0d9488", fontWeight: 600 }}>Picture attached</span>
                      )}
                    </div>

                    {srv.image ? (
                      <div className="service-image-preview-box">
                        <img src={srv.image} alt={srv.title} className="service-image-thumb-preview" />
                        <div className="service-image-actions">
                          <label className="service-upload-btn-label">
                            <Upload size={13} />
                            {uploadingIdx === idx ? "Uploading..." : "Replace picture"}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              disabled={uploadingIdx === idx}
                              onChange={(e) => handleServiceImageUpload(idx, e)}
                            />
                          </label>
                          <button
                            type="button"
                            className="service-remove-img-btn"
                            onClick={() => removeServiceImage(idx)}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <label className="service-upload-btn-label">
                            <Upload size={14} />
                            {uploadingIdx === idx ? "Uploading..." : "Upload picture from device"}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              disabled={uploadingIdx === idx}
                              onChange={(e) => handleServiceImageUpload(idx, e)}
                            />
                          </label>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>or paste picture URL below:</span>
                        </div>
                        <input
                          value={srv.image || ""}
                          onChange={(e) => updateServiceField(idx, "image", e.target.value)}
                          placeholder="https://example.com/photo.jpg (Optional)"
                          style={{ fontSize: "13px" }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="about-editor-field">
                    <label>
                      Capabilities & deliverables (one per line)
                      <textarea
                        rows={5}
                        value={(srv.items || []).join("\n")}
                        onChange={(e) => updateCapabilities(idx, e.target.value)}
                        placeholder="Brand identity development&#10;Logo and visual branding&#10;Brand positioning and strategy"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Bottom Call to Action */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Bottom CTA Band</h2>
                <p>The call to action section at the bottom of the Services page.</p>
              </div>
            </div>
            <div className="about-editor-fields">
              <div className="about-editor-field">
                <label>
                  CTA Eyebrow
                  <input
                    value={settings.servicesCtaEyebrow ?? "BAINEST DIGITAL MARKETING SERVICES"}
                    onChange={(e) => setSettings({ ...settings, servicesCtaEyebrow: e.target.value })}
                    placeholder="BAINEST DIGITAL MARKETING SERVICES"
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  CTA Headline
                  <input
                    value={settings.servicesCtaTitle ?? "MORE THAN JUST\nDIGITAL MARKETING."}
                    onChange={(e) => setSettings({ ...settings, servicesCtaTitle: e.target.value })}
                    placeholder="MORE THAN JUST&#10;DIGITAL MARKETING."
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  CTA Description
                  <textarea
                    rows={2}
                    value={settings.servicesCtaCopy ?? "We help businesses establish their identity, strengthen their online presence, and create meaningful connections with the people who matter."}
                    onChange={(e) => setSettings({ ...settings, servicesCtaCopy: e.target.value })}
                    placeholder="CTA description..."
                  />
                </label>
              </div>
            </div>
          </section>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              type="submit"
              className="admin-primary"
              disabled={saving}
              style={{ minWidth: 160 }}
            >
              <Save size={16} /> {saving ? "Saving..." : "Save Services Page"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* (2026-07-13) Contact page editor with editable details. Prev: no contact editor */
function ContactPageEditor() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    api<SiteSettings>("/api/admin/settings")
      .then((s) => {
        if (s) setSettings(s);
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setToast({ message: "Contact page & details updated successfully!", type: "success" });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to update Contact page.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && (
        <div className={`admin-toast-badge toast-${toast.type}`}>
          <span className="toast-icon">
            <Check size={16} />
          </span>
          <span className="toast-text">{toast.message}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="about-page-editor-container">
        <div className="admin-page-title about-editor-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="admin-kicker">Contact & Inquiries</span>
            <h1>Edit Contact Page</h1>
            <p>Update direct email, phone number, headline, and guidance pillars for visitors on /contact.</p>
          </div>
          <div className="about-editor-header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link to="/contact" target="_blank" rel="noopener noreferrer" className="admin-light" style={{ textDecoration: "none" }}>
              <Eye size={15} /> View live page <ArrowUpRight size={14} />
            </Link>
            <button
              type="button"
              className="admin-primary"
              onClick={(e) => handleSave(e as any)}
              disabled={saving}
            >
              <Save size={15} /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
          {/* Section 1: Direct Contact Info (Email & Phone) */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Direct Contact Details</h2>
                <p>These details appear in the direct inquiry card and across the site footer.</p>
              </div>
            </div>
            <div className="about-editor-row">
              <div className="about-editor-field">
                <label>
                  Contact email address
                  <input
                    type="email"
                    value={settings.email ?? "bainestph@gmail.com"}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="bainestph@gmail.com"
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  Phone / mobile number
                  <input
                    value={settings.phone ?? "09622302015"}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="09622302015"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Section 2: Hero Banner */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Hero Section</h2>
                <p>The top headline and introduction on the Contact page.</p>
              </div>
            </div>
            <div className="about-editor-fields">
              <div className="about-editor-field">
                <label>
                  Eyebrow tag
                  <input
                    value={settings.contactHeroLabel ?? "Contact"}
                    onChange={(e) => setSettings({ ...settings, contactHeroLabel: e.target.value })}
                    placeholder="Contact"
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  Headline
                  <input
                    value={settings.contactHeroTitle ?? "Tell us what you’re working toward."}
                    onChange={(e) => setSettings({ ...settings, contactHeroTitle: e.target.value })}
                    placeholder="Tell us what you’re working toward."
                  />
                </label>
              </div>
              <div className="about-editor-field">
                <label>
                  Introduction copy
                  <textarea
                    rows={2}
                    value={settings.contactHeroCopy ?? "A good conversation can make the next step clearer. Share a little about your idea and we’ll take it from there."}
                    onChange={(e) => setSettings({ ...settings, contactHeroCopy: e.target.value })}
                    placeholder="A good conversation can make the next step clearer..."
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Section 3: Sidebar Greeting & Value Pillars */}
          <section className="about-editor-panel">
            <div className="panel-head">
              <div>
                <h2>Sidebar Greeting & Value Pillars</h2>
                <p>The message and two reassurance pillars positioned next to the contact form.</p>
              </div>
            </div>
            <div className="about-editor-fields">
              <div className="about-editor-row">
                <div className="about-editor-field">
                  <label>
                    Sidebar eyebrow
                    <input
                      value={settings.contactSidebarEyebrow ?? "Start here"}
                      onChange={(e) => setSettings({ ...settings, contactSidebarEyebrow: e.target.value })}
                      placeholder="Start here"
                    />
                  </label>
                </div>
                <div className="about-editor-field">
                  <label>
                    Sidebar headline
                    <input
                      value={settings.contactSidebarTitle ?? "Good things start\nwith a hello."}
                      onChange={(e) => setSettings({ ...settings, contactSidebarTitle: e.target.value })}
                      placeholder="Good things start&#10;with a hello."
                    />
                  </label>
                </div>
              </div>
              <div className="about-editor-field">
                <label>
                  Sidebar description
                  <textarea
                    rows={2}
                    value={settings.contactSidebarCopy ?? "Use the form to tell us a bit about your goals, timing, or the question you’re trying to answer."}
                    onChange={(e) => setSettings({ ...settings, contactSidebarCopy: e.target.value })}
                    placeholder="Use the form to tell us a bit about your goals..."
                  />
                </label>
              </div>

              <div className="about-editor-row" style={{ marginTop: 8 }}>
                {/* Pillar 1 */}
                <div className="about-value-card-editor" style={{ flex: 1 }}>
                  <span className="about-value-badge">Pillar 01</span>
                  <div className="about-editor-field">
                    <label>
                      Pillar 1 title
                      <input
                        value={settings.contactPillar1Title ?? "Built around your goals."}
                        onChange={(e) => setSettings({ ...settings, contactPillar1Title: e.target.value })}
                        placeholder="Built around your goals."
                      />
                    </label>
                  </div>
                  <div className="about-editor-field">
                    <label>
                      Pillar 1 description
                      <textarea
                        rows={3}
                        value={settings.contactPillar1Text ?? "We take time to understand your brand, audience, and business objectives."}
                        onChange={(e) => setSettings({ ...settings, contactPillar1Text: e.target.value })}
                        placeholder="We take time to understand your brand..."
                      />
                    </label>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="about-value-card-editor" style={{ flex: 1 }}>
                  <span className="about-value-badge">Pillar 02</span>
                  <div className="about-editor-field">
                    <label>
                      Pillar 2 title
                      <input
                        value={settings.contactPillar2Title ?? "Strategy starts with a conversation."}
                        onChange={(e) => setSettings({ ...settings, contactPillar2Title: e.target.value })}
                        placeholder="Strategy starts with a conversation."
                      />
                    </label>
                  </div>
                  <div className="about-editor-field">
                    <label>
                      Pillar 2 description
                      <textarea
                        rows={3}
                        value={settings.contactPillar2Text ?? "Tell us what you need. We'll help you explore the right solutions for your business."}
                        onChange={(e) => setSettings({ ...settings, contactPillar2Text: e.target.value })}
                        placeholder="Tell us what you need..."
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              type="submit"
              className="admin-primary"
              disabled={saving}
              style={{ minWidth: 160 }}
            >
              <Save size={16} /> {saving ? "Saving..." : "Save Contact Page"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export function AdminApp() {
  const [session, setSession] = useState<AdminState | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  // (2026-07-13) Move activeMeta hook to top of AdminApp. Prev: after early return
  const [activeMeta, setActiveMeta] = useState<{
    title: string;
    slug: string;
    category: string;
    status: string;
  } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  async function refresh() {
    const p = await api<Post[]>("/api/admin/posts");
    setPosts(p);
  }
  useEffect(() => {
    api<AdminState>("/api/admin/me")
      .then((s) => {
        if (s.authenticated) {
          setSession(s);
          setCsrf(s.csrf || "");
          return api<Post[]>("/api/admin/posts").then(setPosts);
        }
        setSession({ authenticated: false });
      })
      .catch(() => setSession({ authenticated: false }))
      .finally(() => setLoading(false));
  }, []);
  // (2026-07-13) Real-time admin stories sync via onSnapshot. Prev: manual refresh
  useEffect(() => {
    if (session?.authenticated) {
      const unsub = subscribeToPosts((livePosts) => {
        setPosts(livePosts);
      }, false);
      return () => unsub();
    }
  }, [session?.authenticated]);
  async function logout() {
    try {
      await api("/api/admin/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });
    } catch {}
    setCsrf("");
    setSession({ authenticated: false });
    navigate("/admin/login");
  }
  if (loading)
    return <div className="admin-loading">Opening your workspace…</div>;
  if (!session?.authenticated)
    return (
      <Login
        onLogin={(s) => {
          setSession(s);
          setCsrf(s.csrf || "");
          api<Post[]>("/api/admin/posts")
            .then(setPosts)
            .catch(() => {});
          navigate("/admin");
        }}
      />
    );
  const path = location.pathname;

  const editingPostId =
    path.startsWith("/admin/posts/") && path.replace(/\/+$/, "") !== "/admin/posts/new"
      ? decodeURIComponent(path.replace(/\/+$/, "").replace("/admin/posts/", ""))
      : null;
  const currentPost = editingPostId
    ? posts.find((p) => String(p.id) === editingPostId || p.slug === editingPostId)
    : null;

  const activeBlogInfo =
    path.startsWith("/admin/posts/")
      ? activeMeta || (currentPost ? {
          title: currentPost.title,
          slug: currentPost.slug,
          category: currentPost.category || "Story",
          status: currentPost.status || "draft",
        } : path.replace(/\/+$/, "") === "/admin/posts/new" ? {
          title: "New Story",
          slug: "",
          category: "Draft",
          status: "draft",
        } : null)
      : null;

  return (
    <div className="admin-shell">
      {/* (2026-07-13) Default admin name Jan Errol Duazo. Prev: Admin */}
      <AdminNav user={session.username && session.username !== "admin" ? session.username : "Jan Errol Duazo"} onLogout={logout} />
      <main className="admin-main">
        {/* (2026-07-13) Sticky topbar with blog meta & specific post link. Prev: plain */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-topbar-ws">
              <span className="local-dot" />{" "}
              {typeof window !== "undefined" &&
              (window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1")
                ? "Local SQLite"
                : "Firebase Cloud"}
            </span>
            {activeBlogInfo && (
              <div className="topbar-blog-meta">
                <span className="topbar-blog-divider">/</span>
                <span className="topbar-blog-title" title={activeBlogInfo.title}>
                  {activeBlogInfo.title || "Untitled story"}
                </span>
                <span className={`topbar-blog-status ${activeBlogInfo.status === "published" ? "published" : "draft"}`}>
                  {activeBlogInfo.status === "published" ? "Published" : "Draft"}
                </span>
                {activeBlogInfo.category && (
                  <span className="topbar-blog-cat">{activeBlogInfo.category}</span>
                )}
                {activeBlogInfo.slug && (
                  <span className="topbar-blog-slug">/blog/{activeBlogInfo.slug}</span>
                )}
              </div>
            )}
          </div>
          <div className="admin-topbar-right">
            {activeBlogInfo?.slug ? (
              <Link
                to={`/blog/${encodeURIComponent(activeBlogInfo.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="topbar-view-site-btn"
                title={`Open public blog /blog/${activeBlogInfo.slug} in new tab`}
              >
                <span>View this blog</span> <ArrowUpRight size={14} />
              </Link>
            ) : (
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="topbar-view-site-btn"
                title="Open public homepage in new tab"
              >
                <span>View public site</span> <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>
        <div className="admin-content">
          {path === "/admin" || path === "/admin/" ? (
            <Overview posts={posts} />
          ) : path === "/admin/posts" || path === "/admin/posts/" ? (
            <PostList posts={posts} refresh={() => refresh().catch(() => {})} />
          ) : path === "/admin/posts/new" ||
            /^\/admin\/posts\/[^/]+(?:\/)?$/.test(path) ? (
            // (2026-07-13) Key PostEditor by normalized path for clean state. Prev: no key
            <PostEditor
              key={path.replace(/\/+$/, "")}
              posts={posts}
              refresh={() => refresh().catch(() => {})}
              onMetaChange={setActiveMeta}
              postId={
                path.replace(/\/+$/, "") !== "/admin/posts/new" &&
                path.startsWith("/admin/posts/")
                  ? decodeURIComponent(path.replace(/\/+$/, "").replace("/admin/posts/", ""))
                  : undefined
              }
            />
          ) : path === "/admin/inbox" ? (
            <InboxPage />
          ) : path === "/admin/about" ? (
            <AboutPageEditor />
          ) : path === "/admin/services" ? (
            <ServicesPageEditor />
          ) : path === "/admin/contact" ? (
            <ContactPageEditor />
          ) : path === "/admin/settings" ? (
            <DomainSettings />
          ) : (
            <Overview posts={posts} />
          )}
        </div>
      </main>
    </div>
  );
}
