// (2026-07-13) Add getDoc for settings query. Prev: getDocs only
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "./firebase";

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
  include_in_nav?: boolean;
};
export type SiteSettings = {
  siteName: string;
  email: string;
  phone: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
};
export const defaultSettings: SiteSettings = {
  siteName: "BaiNest",
  email: "contact@bainestdigital.com",
  phone: "+63 900 000 0000",
  facebook: "https://facebook.com/bainestdigital",
  twitter: "https://twitter.com/bainestdigital",
  instagram: "https://instagram.com/bainestdigital",
  youtube: "https://youtube.com/@bainestdigital",
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
// (2026-07-13) Clean storage fallback without mock seed. Prev: mock data
function getStoredPosts(): Post[] {
  try {
    const raw = localStorage.getItem("bainenest_posts");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredPosts(posts: Post[]) {
  try {
    localStorage.setItem("bainenest_posts", JSON.stringify(posts));
  } catch {}
}

export async function getFirestoreSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(firestore, "settings", "global"));
    if (snap.exists()) {
      return { ...defaultSettings, ...(snap.data() as Partial<SiteSettings>) };
    }
    await setDoc(doc(firestore, "settings", "global"), defaultSettings);
    return defaultSettings;
  } catch {
    const raw = localStorage.getItem("bainenest_settings");
    if (raw) {
      try {
        return { ...defaultSettings, ...JSON.parse(raw) };
      } catch {}
    }
    return defaultSettings;
  }
}

export async function saveFirestoreSettings(data: Partial<SiteSettings>): Promise<void> {
  try {
    await setDoc(doc(firestore, "settings", "global"), data, { merge: true });
  } catch {}
  try {
    const cur = await getFirestoreSettings();
    localStorage.setItem(
      "bainenest_settings",
      JSON.stringify({ ...cur, ...data })
    );
  } catch {}
}

export function subscribeToSettings(
  callback: (s: SiteSettings) => void
): () => void {
  try {
    return onSnapshot(
      doc(firestore, "settings", "global"),
      (snap) => {
        if (snap.exists()) {
          callback({
            ...defaultSettings,
            ...(snap.data() as Partial<SiteSettings>),
          });
        } else {
          callback(defaultSettings);
        }
      },
      () => callback(defaultSettings)
    );
  } catch {
    callback(defaultSettings);
    return () => {};
  }
}

// (2026-07-13) Connect Firestore for clean live posts. Prev: mock auto-seed
async function getFirestorePosts(): Promise<Post[]> {
  try {
    const col = collection(firestore, "posts");
    const q = query(col, orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    const posts: Post[] = [];
    snap.forEach((d) => posts.push(d.data() as Post));
    saveStoredPosts(posts);
    return posts;
  } catch {
    return getStoredPosts();
  }
}

async function saveFirestorePost(post: Post): Promise<void> {
  try {
    await setDoc(doc(firestore, "posts", String(post.id)), post);
  } catch {}
}

async function deleteFirestorePost(id: number): Promise<void> {
  try {
    await deleteDoc(doc(firestore, "posts", String(id)));
  } catch {}
}

async function saveFirestoreContact(body: Record<string, unknown>): Promise<void> {
  try {
    await addDoc(collection(firestore, "contacts"), {
      ...body,
      created_at: new Date().toISOString(),
    });
  } catch {}
}

// (2026-07-13) Add onSnapshot real-time subscriptions. Prev: static fetch only
export function subscribeToPosts(
  callback: (posts: Post[]) => void,
  onlyPublished = false
): () => void {
  try {
    const col = collection(firestore, "posts");
    const q = query(col, orderBy("created_at", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const posts: Post[] = [];
        snapshot.forEach((d) => posts.push(d.data() as Post));
        saveStoredPosts(posts);
        callback(
          onlyPublished ? posts.filter((p) => p.status === "published") : posts
        );
      },
      () => {
        const stored = getStoredPosts();
        callback(
          onlyPublished
            ? stored.filter((p) => p.status === "published")
            : stored
        );
      }
    );
  } catch {
    const stored = getStoredPosts();
    callback(
      onlyPublished ? stored.filter((p) => p.status === "published") : stored
    );
    return () => {};
  }
}

export function subscribeToContacts(
  callback: (contacts: any[]) => void
): () => void {
  try {
    const col = collection(firestore, "contacts");
    const q = query(col, orderBy("created_at", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const contacts: any[] = [];
        snapshot.forEach((d) => contacts.push({ id: d.id, ...d.data() }));
        callback(contacts);
      },
      () => callback([])
    );
  } catch {
    callback([]);
    return () => {};
  }
}

async function getFirestoreContacts(): Promise<any[]> {
  try {
    const col = collection(firestore, "contacts");
    const q = query(col, orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    const contacts: any[] = [];
    snap.forEach((d) => contacts.push({ id: d.id, ...d.data() }));
    return contacts;
  } catch {
    return [];
  }
}

async function markFirestoreContactRead(id: string | number): Promise<void> {
  try {
    await setDoc(
      doc(firestore, "contacts", String(id)),
      { read: 1 },
      { merge: true }
    );
  } catch {}
}

async function handleStaticApi(path: string, init: RequestInit): Promise<unknown> {
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
    // (2026-07-13) Query live overview counts from Firestore. Prev: static zero
    const posts = await getFirestorePosts();
    const contacts = await getFirestoreContacts();
    return {
      posts: {
        total: posts.length,
        published: posts.filter((p) => p.status === "published").length,
      },
      messages: {
        total: contacts.length,
        unread: contacts.filter((c) => !c.read).length,
      },
    };
  }

  if (url === "/api/admin/posts") {
    const posts = await getFirestorePosts();
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
        include_in_nav: Boolean(body.include_in_nav),
      };
      posts.unshift(newPost);
      saveStoredPosts(posts);
      await saveFirestorePost(newPost);
      return newPost;
    }
  }

  const postMatch = url.match(/^\/api\/admin\/posts\/(\d+)/);
  if (postMatch) {
    const id = Number(postMatch[1]);
    const posts = await getFirestorePosts();
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
      await saveFirestorePost(updated);
      return updated;
    }
    if (method === "DELETE") {
      const filtered = posts.filter((item) => item.id !== id);
      saveStoredPosts(filtered);
      await deleteFirestorePost(id);
      return { ok: true };
    }
  }

  if (url === "/api/posts") {
    const posts = await getFirestorePosts();
    return posts.filter((p) => p.status === "published");
  }

  const publicPostMatch = url.match(/^\/api\/posts\/([a-z0-9-]+)$/);
  if (publicPostMatch) {
    const slug = publicPostMatch[1];
    const posts = await getFirestorePosts();
    const post = posts.find((p) => p.slug === slug);
    if (!post) throw new Error("That article could not be found.");
    return post;
  }

  if (url === "/api/site") {
    return { name: "BaiNest", mappedBlog: null, localDomainMode: false };
  }

  if (url === "/api/contact") {
    // (2026-07-13) Store contact message in Firestore with read: 0. Prev: empty
    await saveFirestoreContact({ ...body, read: 0 });
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
    // (2026-07-13) Manage global social & site settings in Firestore. Prev: siteName only
    if (method === "GET") return await getFirestoreSettings();
    await saveFirestoreSettings(body);
    return await getFirestoreSettings();
  }

  if (url === "/api/admin/contacts") {
    return await getFirestoreContacts();
  }

  const contactReadMatch = url.match(/^\/api\/admin\/contacts\/([^/]+)\/read$/);
  if (contactReadMatch) {
    await markFirestoreContactRead(contactReadMatch[1]);
    return { ok: true };
  }

  return {};
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isStaticHost =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  if (isStaticHost) {
    return (await handleStaticApi(path, init)) as T;
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
    return (await handleStaticApi(path, init)) as T;
  }
}
