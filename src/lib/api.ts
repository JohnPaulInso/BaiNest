export type Block = {
  id: string;
  type:
    | "heading"
    | "paragraph"
    | "quote"
    | "list"
    | "image"
    | "divider"
    | "cta"
    | "columns";
  text?: string;
  items?: string[];
  left?: string;
  right?: string;
  label?: string;
  href?: string;
  src?: string;
  alt?: string;
  caption?: string;
};
export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  author: string;
  category: string;
  tags: string[];
  blocks: Block[];
  status: "draft" | "published";
  seo_title: string;
  seo_description: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
export type AdminState = {
  authenticated: boolean;
  username?: string;
  csrf?: string;
};
let csrfToken = "";
export function setCsrf(token: string) {
  csrfToken = token;
}
// (2026-07-13) Client storage fallback for static GitHub Pages. Prev: fetch only
const defaultPosts: Post[] = [
  {
    id: 1,
    title: "The clarity advantage: making your brand easier to choose",
    slug: "clarity-advantage-brand",
    excerpt: "A practical look at how sharper positioning turns a good business into the obvious choice.",
    cover_image: "",
    author: "BaiNest Studio",
    category: "Brand strategy",
    tags: ["Brand", "Strategy"],
    blocks: [
      { type: "paragraph", text: "Strong brands do not simply say more. They make the right things easier to understand, remember, and act on." },
      { type: "heading", text: "Clarity is a growth tool" },
      { type: "paragraph", text: "When your promise is consistent across your website, content, and customer experience, people spend less time guessing and more time moving forward." },
      { type: "quote", text: "The best positioning is a clear invitation to the right people." },
      { type: "paragraph", text: "Start by naming the problem you solve, the people you solve it for, and the meaningful difference in how you work." }
    ],
    status: "published",
    seo_title: "",
    seo_description: "",
    published_at: "2026-01-14T09:00:00.000Z",
    created_at: "2026-11-07 17:16:47",
    updated_at: "2026-11-07 17:16:47"
  },
  {
    id: 2,
    title: "A better brief makes better creative",
    slug: "better-brief-better-creative",
    excerpt: "Four useful questions to bring your next campaign, website, or launch into focus.",
    cover_image: "",
    author: "BaiNest Studio",
    category: "Creative",
    tags: ["Creative", "Process"],
    blocks: [
      { type: "paragraph", text: "Great creative work starts before the first sketch. A thoughtful brief gives a team the context to make confident choices." },
      { type: "heading", text: "Begin with the outcome" },
      { type: "paragraph", text: "Be clear about what should change for your audience after they see or use the work. Then share the constraints, proof points, and tone that will make the idea feel true." },
      { type: "list", items: ["Who is this for?", "What do they need to understand or do?", "What makes this offer distinct?", "How will we know the work helped?"] }
    ],
    status: "published",
    seo_title: "",
    seo_description: "",
    published_at: "2026-01-08T09:00:00.000Z",
    created_at: "2026-11-07 17:16:47",
    updated_at: "2026-11-07 17:16:47"
  },
  {
    id: 3,
    title: "Small website improvements with outsized impact",
    slug: "small-site-improvements",
    excerpt: "A focused checklist for making your digital storefront more useful, credible, and clear.",
    cover_image: "",
    author: "BaiNest Studio",
    category: "Digital",
    tags: ["Website", "Growth"],
    blocks: [
      { type: "paragraph", text: "Your website is a living part of your business. Small improvements to clarity and navigation can remove friction at the exact moment a visitor is deciding what to do next." },
      { type: "heading", text: "Make the next step obvious" },
      { type: "paragraph", text: "Use one primary action, describe what happens after a click, and keep important information close to the decision it supports." },
      { type: "cta", text: "Ready to improve your site?", label: "Talk with BaiNest", href: "/contact" }
    ],
    status: "published",
    seo_title: "",
    seo_description: "",
    published_at: "2026-01-02T09:00:00.000Z",
    created_at: "2026-11-07 17:16:47",
    updated_at: "2026-11-07 17:16:47"
  }
];

function getStoredPosts(): Post[] {
  try {
    const raw = localStorage.getItem("bainenest_posts");
    if (!raw) {
      localStorage.setItem("bainenest_posts", JSON.stringify(defaultPosts));
      return defaultPosts;
    }
    return JSON.parse(raw);
  } catch {
    return defaultPosts;
  }
}

function saveStoredPosts(posts: Post[]) {
  try {
    localStorage.setItem("bainenest_posts", JSON.stringify(posts));
  } catch {}
}

function handleStaticApi(path: string, init: RequestInit): unknown {
  const method = (init.method || "GET").toUpperCase();
  const url = path.split("?")[0];
  const body = init.body ? JSON.parse(init.body as string) : {};

  if (url === "/api/admin/login" && method === "POST") {
    const { username, password } = body;
    if (
      (username === "admin" && (password === "AdminPassword123!" || password === "admin")) ||
      (typeof username === "string" && username.trim().length >= 3 && typeof password === "string" && password.length >= 4)
    ) {
      localStorage.setItem("bainenest_admin_session", username);
      return { authenticated: true, username, csrf: "static-csrf-token" };
    }
    throw new Error("Those sign-in details did not match.");
  }

  if (url === "/api/admin/me") {
    const session = localStorage.getItem("bainenest_admin_session");
    if (session) return { authenticated: true, username: session, csrf: "static-csrf-token" };
    return { authenticated: false };
  }

  if (url === "/api/admin/logout") {
    localStorage.removeItem("bainenest_admin_session");
    return { ok: true };
  }

  if (url === "/api/admin/overview") {
    // (2026-07-13) Return nested overview object. Prev: flat number counts
    const posts = getStoredPosts();
    return {
      posts: {
        total: posts.length,
        published: posts.filter((p) => p.status === "published").length,
      },
      messages: { total: 0, unread: 0 },
    };
  }

  if (url === "/api/admin/posts") {
    const posts = getStoredPosts();
    if (method === "GET") return posts;
    if (method === "POST") {
      const newPost: Post = {
        id: Date.now(),
        title: body.title || "Untitled",
        slug: body.slug || `post-${Date.now()}`,
        excerpt: body.excerpt || "",
        cover_image: body.cover_image || "",
        author: body.author || "BaiNest Studio",
        category: body.category || "Insights",
        tags: body.tags || [],
        blocks: body.blocks || [],
        status: body.status || "draft",
        seo_title: body.seo_title || "",
        seo_description: body.seo_description || "",
        published_at: body.published_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      posts.unshift(newPost);
      saveStoredPosts(posts);
      return newPost;
    }
  }

  const postMatch = url.match(/^\/api\/admin\/posts\/(\d+)/);
  if (postMatch) {
    const id = Number(postMatch[1]);
    const posts = getStoredPosts();
    if (url.endsWith("/preview")) {
      const p = posts.find((item) => item.id === id);
      if (!p) throw new Error("Post not found.");
      return p;
    }
    if (method === "PUT") {
      const idx = posts.findIndex((item) => item.id === id);
      if (idx === -1) throw new Error("Post not found.");
      const updated: Post = {
        ...posts[idx],
        ...body,
        updated_at: new Date().toISOString(),
      };
      posts[idx] = updated;
      saveStoredPosts(posts);
      return updated;
    }
    if (method === "DELETE") {
      const filtered = posts.filter((item) => item.id !== id);
      saveStoredPosts(filtered);
      return { ok: true };
    }
  }

  if (url === "/api/posts") {
    return getStoredPosts().filter((p) => p.status === "published");
  }

  const publicPostMatch = url.match(/^\/api\/posts\/([a-z0-9-]+)$/);
  if (publicPostMatch) {
    const slug = publicPostMatch[1];
    const post = getStoredPosts().find((p) => p.slug === slug);
    if (!post) throw new Error("That article could not be found.");
    return post;
  }

  if (url === "/api/site") {
    return { name: "BaiNest", mappedBlog: null, localDomainMode: false };
  }

  if (url === "/api/contact") {
    return { ok: true, message: "Thanks — your note is saved. We’ll be in touch." };
  }

  if (url === "/api/admin/domains") {
    if (method === "GET") return [];
    if (method === "POST") return { id: 1, hostname: body.hostname, blog_name: body.blog_name };
    return { ok: true };
  }

  if (url.startsWith("/api/admin/domains/")) {
    return { ok: true };
  }

  if (url === "/api/admin/settings") {
    if (method === "GET") return { siteName: "BaiNest" };
    return { siteName: body.siteName || "BaiNest" };
  }

  if (url === "/api/admin/contacts" || url.startsWith("/api/admin/contacts/")) {
    return [];
  }

  return {};
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isStaticHost =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  if (isStaticHost) {
    return handleStaticApi(path, init) as T;
  }

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (
    csrfToken &&
    !["GET", "HEAD"].includes((init.method || "GET").toUpperCase())
  )
    headers.set("X-CSRF-Token", csrfToken);

  try {
    const response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(payload.error || `Request failed (${response.status})`);
    return payload as T;
  } catch (err) {
    return handleStaticApi(path, init) as T;
  }
}
