import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  api,
  setCsrf,
  type AdminState,
  type Block,
  type Post,
} from "./lib/api";

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
};
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function SortableBlock({
  block,
  onChange,
  onRemove,
}: {
  block: Block;
  onChange: (id: string, key: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const field = (
    key: string,
    label: string,
    value: string,
    placeholder: string,
    multiline = false,
  ) => (
    <label className="block-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
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
  return (
    <div className="editor-block" ref={setNodeRef} style={style}>
      <button
        type="button"
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <div className="editor-block-field">
        <span>{block.type} block</span>
        {block.type === "image" ? (
          <div className="block-fields-grid">
            {field("src", "Image URL", block.src || "", "/images/photo.jpg")}
            {field("alt", "Alt text", block.alt || "", "Describe the image")}
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
            value={(block.items || []).join("\n")}
            onChange={(e) => onChange(block.id, "items", e.target.value)}
            placeholder="One item per line"
          />
        ) : block.type === "divider" ? (
          <p className="editor-divider-hint">
            A subtle divider will appear between these sections.
          </p>
        ) : (
          <textarea
            value={block.text || ""}
            onChange={(e) => onChange(block.id, "text", e.target.value)}
            placeholder={
              block.type === "heading"
                ? "Section heading"
                : block.type === "quote"
                  ? "Pull quote"
                  : "Write your content…"
            }
          />
        )}
      </div>
      <button
        type="button"
        className="icon-button danger"
        onClick={() => onRemove(block.id)}
        aria-label="Remove block"
      >
        <X size={15} />
      </button>
    </div>
  );
}
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
      // (2026-07-13) Clarify static host backend requirement. Prev: raw error
      if (err instanceof Error && err.message.includes("405")) {
        setError("GitHub Pages is static. Run dev.bat and open http://localhost:3000/admin");
      } else {
        setError(err instanceof Error ? err.message : "Unable to sign in.");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-login-screen">
      <div className="login-card">
        <Link className="admin-login-brand" to="/">
          {/* (2026-07-13) Fix logo path with BASE_URL. Prev: src="/logo.svg" */}
          <img src={`${import.meta.env.BASE_URL}logo.svg`} />{" "}
          <span>
            BAINEST<small>STUDIO ADMIN</small>
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
  const items = [
    ["Overview", "/admin", LayoutDashboard],
    ["Posts", "/admin/posts", FileText],
    ["Inbox", "/admin/inbox", Inbox],
    ["Domains & settings", "/admin/settings", Settings],
  ] as const;
  return (
    <aside className="admin-sidebar">
      <Link to="/" className="admin-logo">
        {/* (2026-07-13) Fix logo path with BASE_URL. Prev: src="/logo.svg" */}
        <img src={`${import.meta.env.BASE_URL}logo.svg`} />
        <span>
          BAINEST<small>STUDIO ADMIN</small>
        </span>
      </Link>
      <div className="admin-workspace">
        <span className="workspace-avatar">B</span>
        <span>
          <b>{user}</b>
          <small>Local workspace</small>
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
              (label === "Posts" && loc.pathname.startsWith("/admin/posts"))
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
        <span className="local-badge">
          <span /> Local SQLite · not connected to Firebase
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
function Overview({ posts }: { posts: Post[] }) {
  const [counts, setCounts] = useState({
    posts: { total: 0, published: 0 },
    messages: { total: 0, unread: 0 },
  });
  useEffect(() => {
    api<typeof counts>("/api/admin/overview")
      .then(setCounts)
      .catch(() => {});
  }, []);
  return (
    <>
      <div className="admin-page-title">
        <div>
          <span className="admin-kicker">Workspace overview</span>
          <h1>Your studio, at a glance.</h1>
          <p>
            Keep your ideas moving. Your work is stored locally on this machine.
          </p>
        </div>
        <Link className="admin-primary" to="/admin/posts/new">
          <Plus size={16} /> Write a post
        </Link>
      </div>
      <div className="stat-grid">
        <article>
          <span className="stat-icon">
            <FileText />
          </span>
          <span className="stat-label">Total stories</span>
          <b>{counts.posts.total}</b>
          <small>{counts.posts.published} published</small>
        </article>
        <article>
          <span className="stat-icon">
            <Inbox />
          </span>
          <span className="stat-label">Contact notes</span>
          <b>{counts.messages.total}</b>
          <small>{counts.messages.unread} unread</small>
        </article>
        <article>
          <span className="stat-icon">
            <Globe2 />
          </span>
          <span className="stat-label">Domain setup</span>
          <b>Local</b>
          <small>DNS not connected</small>
        </article>
      </div>
      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>Recent stories</h2>
            <p>What you’ve been working on lately.</p>
          </div>
          <Link to="/admin/posts">
            All posts <ArrowUpRight size={14} />
          </Link>
        </div>
        {posts.slice(0, 5).map((p) => (
          <Link className="recent-post" key={p.id} to={`/admin/posts/${p.id}`}>
            <span className="recent-post-icon">
              <FileText size={17} />
            </span>
            <span className="recent-post-main">
              <b>{p.title || "Untitled"}</b>
              <small>/{p.slug}</small>
            </span>
            <span className={`status-pill ${p.status}`}>{p.status}</span>
            <span className="recent-date">
              {new Date(p.updated_at).toLocaleDateString()}
            </span>
          </Link>
        ))}
        {!posts.length && (
          <div className="admin-empty">
            No stories yet. Create a draft to begin.
          </div>
        )}
      </section>
    </>
  );
}
function PostList({ posts, refresh }: { posts: Post[]; refresh: () => void }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [query, setQuery] = useState("");
  const visible = posts.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      `${p.title} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
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
      <div className="admin-panel">
        <div className="post-table-toolbar">
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
          <input
            className="admin-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a story…"
          />
        </div>
        <div className="post-table-head">
          <span>Story</span>
          <span>Status</span>
          <span>Updated</span>
          <span />
        </div>
        {visible.map((p) => (
          <div className="post-table-row" key={p.id}>
            <button
              className="post-row-title"
              onClick={() => navigate(`/admin/posts/${p.id}`)}
            >
              <span className="recent-post-icon">
                <FileText size={17} />
              </span>
              <span>
                <b>{p.title || "Untitled"}</b>
                <small>/{p.slug}</small>
              </span>
            </button>
            <span className={`status-pill ${p.status}`}>{p.status}</span>
            <span className="recent-date">
              {new Date(p.updated_at).toLocaleDateString()}
            </span>
            <div className="row-actions">
              <button
                className="icon-button danger"
                onClick={() => remove(p.id)}
                title="Delete post"
              >
                <Trash2 size={15} />
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
function PostEditor({
  posts,
  refresh,
}: {
  posts: Post[];
  refresh: () => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id ? posts.find((p) => p.id === Number(id)) : undefined;
  const [form, setForm] = useState({ ...emptyPost });
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (existing) {
      setForm({ ...existing });
      setTags(existing.tags.join(", "));
    } else setForm({ ...emptyPost, blocks: [] });
  }, [id, existing?.updated_at]);
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
  function openPreview() {
    if (!id) {
      setNotice("Save this story as a draft before previewing it.");
      return;
    }
    window.open(
      `/blog/${encodeURIComponent(form.slug)}?preview=1&id=${id}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  async function save(status: "draft" | "published") {
    if (!form.title.trim()) return setNotice("Add a title before saving.");
    const payload = {
      ...form,
      status,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      blocks: blocks.map((b) =>
        b.type === "list" ? { ...b, items: b.items?.filter(Boolean) } : b,
      ),
      slug: form.slug || slugify(form.title),
    };
    setBusy(true);
    setNotice("");
    try {
      const saved = await api<Post>(
        id ? `/api/admin/posts/${id}` : "/api/admin/posts",
        { method: id ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      await refresh();
      setNotice(
        status === "published"
          ? "Published and ready to read."
          : "Draft saved.",
      );
      if (!id) navigate(`/admin/posts/${saved.id}`, { replace: true });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not save this story.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
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
        </div>
      </div>
      <div className="editor-layout">
        <div className="editor-main">
          <div className="editor-surface">
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
            <div className="block-editor-heading">
              <div>
                <h2>Story content</h2>
                <p>Add and arrange blocks to shape your layout.</p>
              </div>
              <span>{blocks.length} blocks</span>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={drop}>
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="blocks-list">
                  {blocks.map((b) => (
                    <SortableBlock
                      key={b.id}
                      block={b}
                      onChange={updateBlock}
                      onRemove={removeBlock}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="block-add-row">
              <span>Add a block</span>
              {(
                [
                  "heading",
                  "paragraph",
                  "quote",
                  "list",
                  "image",
                  "divider",
                  "cta",
                  "columns",
                ] as const
              ).map((t) => (
                <button key={t} onClick={() => addBlock(t)}>
                  + {t}
                </button>
              ))}
            </div>
            {!blocks.length && (
              <div className="block-empty">
                Start building your story with a heading or paragraph.
              </div>
            )}
          </div>
        </div>
        <aside className="editor-side">
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
                    : ""
                }
                onChange={(e) =>
                  patch(
                    "published_at",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
              />
              <small>Leave blank to use the time you publish.</small>
            </label>
            <label>
              Author
              <input
                value={form.author}
                onChange={(e) => patch("author", e.target.value)}
              />
            </label>
            <label>
              Category
              <input
                value={form.category}
                onChange={(e) => patch("category", e.target.value)}
                placeholder="Insights"
              />
            </label>
            <label>
              Tags
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Brand, Strategy"
              />
              <small>Separate tags with commas.</small>
            </label>
          </div>
          <div className="editor-side-card">
            <h3>URL & discovery</h3>
            <label>
              Post URL
              <input
                value={form.slug}
                onChange={(e) => patch("slug", slugify(e.target.value))}
              />
              <small>/{form.slug || "your-story"}</small>
            </label>
            <label>
              Cover image URL
              <input
                value={form.cover_image}
                onChange={(e) => patch("cover_image", e.target.value)}
                placeholder="Optional image URL"
              />
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
    </>
  );
}
function DomainSettings() {
  const [domains, setDomains] = useState<any[]>([]);
  const [settings, setSettings] = useState({ siteName: "BaiNest" });
  const [host, setHost] = useState("");
  const [blog, setBlog] = useState("BaiNest");
  const [notice, setNotice] = useState("");
  async function refresh() {
    const [d, s] = await Promise.all([
      api<any[]>("/api/admin/domains"),
      api<any>("/api/admin/settings"),
    ]);
    setDomains(d);
    setSettings({ siteName: s.siteName || "BaiNest" });
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
      setNotice("Site settings saved.");
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
          <p>Set your site identity and map blog domains for local preview.</p>
        </div>
      </div>
      <div className="settings-grid">
        <form className="admin-panel settings-panel" onSubmit={saveSettings}>
          <div className="panel-head">
            <div>
              <h2>Site identity</h2>
              <p>These settings are stored in your local database.</p>
            </div>
          </div>
          <label>
            Site name
            <input
              value={settings.siteName}
              onChange={(e) => setSettings({ siteName: e.target.value })}
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
function InboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    api<any[]>("/api/admin/contacts")
      .then(setMessages)
      .catch(() => {});
  }, []);
  async function mark(id: number) {
    await api(`/api/admin/contacts/${id}/read`, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    setMessages((x) => x.map((m) => (m.id === id ? { ...m, read: 1 } : m)));
  }
  return (
    <>
      <div className="admin-page-title">
        <div>
          <span className="admin-kicker">Messages</span>
          <h1>The conversation starts here.</h1>
          <p>Contact form submissions saved in your local inbox.</p>
        </div>
      </div>
      <section className="admin-panel inbox-panel">
        {messages.map((m) => (
          <article className={`inbox-item ${m.read ? "read" : ""}`} key={m.id}>
            <div className="inbox-avatar">{m.name[0]?.toUpperCase()}</div>
            <div className="inbox-content">
              <div className="inbox-top">
                <h3>{m.name}</h3>
                <time>{new Date(m.created_at + "Z").toLocaleString()}</time>
              </div>
              <a href={`mailto:${m.email}`}>{m.email}</a>
              {m.company && <span className="inbox-company">{m.company}</span>}
              <p>{m.message}</p>
              {!m.read && (
                <button className="text-link" onClick={() => mark(m.id)}>
                  Mark as read
                </button>
              )}
            </div>
          </article>
        ))}
        {!messages.length && (
          <div className="admin-empty">
            No messages yet. New contact form submissions will appear here.
          </div>
        )}
      </section>
    </>
  );
}
export function AdminApp() {
  const [session, setSession] = useState<AdminState | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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
  return (
    <div className="admin-shell">
      <AdminNav user={session.username || "Admin"} onLogout={logout} />
      <main className="admin-main">
        <div className="admin-topbar">
          <span>
            <span className="local-dot" /> Local workspace
          </span>
          <Link to="/" target="_blank">
            View public site <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="admin-content">
          {path === "/admin" || path === "/admin/" ? (
            <Overview posts={posts} />
          ) : path === "/admin/posts" ? (
            <PostList posts={posts} refresh={() => refresh().catch(() => {})} />
          ) : path === "/admin/posts/new" ||
            /^\/admin\/posts\/\d+$/.test(path) ? (
            <PostEditor
              posts={posts}
              refresh={() => refresh().catch(() => {})}
            />
          ) : path === "/admin/inbox" ? (
            <InboxPage />
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
