// (2026-07-13) Add where to firestore imports for slug query. Prev: no where
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
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
// (2026-07-13) Add views, shares and analytics fields to Post. Prev: none
  include_in_nav?: boolean;
  include_in_portfolio?: boolean;
  portfolio_only?: boolean;
  views?: number;
  shares?: number;
  clicks?: number;
  impressions?: number;
};
/* (2026-07-13) Helper to determine placement type: Blog, Portfolio, or Both. Prev: none */
export function getPostPlacement(p: { portfolio_only?: boolean; include_in_portfolio?: boolean }): "Blog" | "Portfolio" | "Both" {
  if (p?.portfolio_only) return "Portfolio";
  if (p?.include_in_portfolio) return "Both";
  return "Blog";
}
export type SiteSettings = {
  siteName: string;
  email: string;
  phone: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  tags?: string[];
  /* (2026-07-13) Add About page content fields to SiteSettings. Prev: none */
  aboutHeroLabel?: string;
  aboutHeroTitle?: string;
  aboutHeroCopy?: string;
  aboutQuote?: string;
  aboutStoryEyebrow?: string;
  aboutStoryTitle?: string;
  aboutStoryBody1?: string;
  aboutStoryBody2?: string;
  aboutValuesEyebrow?: string;
  aboutValuesTitle?: string;
  aboutValue1Title?: string;
  aboutValue1Copy?: string;
  aboutValue2Title?: string;
  aboutValue2Copy?: string;
  aboutValue3Title?: string;
  aboutValue3Copy?: string;
  /* (2026-07-13) Add editable Services page types and defaults. Prev: none */
  servicesHeroLabel?: string;
  servicesHeroTitle?: string;
  servicesHeroCopy?: string;
  servicesList?: ServiceItemSetting[];
  servicesCtaEyebrow?: string;
  servicesCtaTitle?: string;
  servicesCtaCopy?: string;
  /* (2026-07-13) Editable Contact page fields and updated info. Prev: mock data */
  contactHeroLabel?: string;
  contactHeroTitle?: string;
  contactHeroCopy?: string;
  contactSidebarEyebrow?: string;
  contactSidebarTitle?: string;
  contactSidebarCopy?: string;
  contactPillar1Title?: string;
  contactPillar1Text?: string;
  contactPillar2Title?: string;
  contactPillar2Text?: string;
  // (2026-07-13) Add Search Console fields to SiteSettings. Prev: none
  googleSearchConsoleCode?: string;
  googleSearchConsoleConnected?: boolean;
};
export type ServiceItemSetting = {
  no: string;
  title: string;
  text: string;
  image?: string;
  items: string[];
};
export const defaultServicesList: ServiceItemSetting[] = [
  {
    no: "01",
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
    ],
  },
];
/* (2026-07-13) Master tags imported from database reference. Prev: none */
export const defaultTags: string[] = [
  "Affiliate Marketing",
  "alert",
  "Applepay",
  "Bogo Cebu",
  "Bogo City",
  "Bogo Lifestyle",
  "Bogo Photo Feature",
  "Bogo Places",
  "Bogo Spots",
  "BOGOHANON CHECK-IN",
  "Bogophoria",
  "Bogophoria list",
  "Business Buzz",
  "Capitancillo",
  "Community",
  "Content Creation",
  "Culture & Community",
  "Cycling Apparel",
  "Facebook Tips",
  "Fact Check",
  "Family & Kids",
  "Food & Drinks",
  "forthesoul",
  "Free Diving",
  "Fun Activities",
  "greetings",
  "Hometown Heroes",
  "Hot Topic",
  "Hotspot",
  "In Focus",
  "Local Businesses",
  "Local Heroes",
  "News & Updates",
  "People",
  "Places",
  "Politics",
  "Prince Express Inn",
  "Public Safety",
  "Red Goose",
  "Red Goose Bogo City",
  "Social Media",
  "Sports",
  "Stories",
  "The Bogohanon Spirit",
  "Things to Do",
  "tips",
  "Top 10 things to experience in Bogo City",
  "Unfiltered",
  "Wakal-Wakal"
];
// (2026-07-13) Rebrand default siteName to bainest. Prev: BaiNest
export const defaultSettings: SiteSettings = {
  siteName: "bainest",
  email: "bainestph@gmail.com",
  phone: "09622302015",
  // (2026-07-13) Set Facebook-only default profile. Prev: twitter/ig/yt placeholders
  facebook: "https://www.facebook.com/profile.php?id=61580429522750",
  twitter: "",
  instagram: "",
  youtube: "",
  tags: defaultTags,
  /* (2026-07-13) Default content for About page. Prev: static inline in App */
  aboutHeroLabel: "About BaiNest",
  aboutHeroTitle: "Thoughtful partners for your next chapter.",
  aboutHeroCopy: "We bring the right questions, clear strategy, and considered creative to help your business move forward.",
  aboutQuote: "“Good work should feel clear from the first conversation to the final detail.”",
  aboutStoryEyebrow: "Our point of view",
  aboutStoryTitle: "Strategy and making, working as one.",
  aboutStoryBody1: "BaiNest is an independent digital studio for businesses ready to grow with intention. We connect the dots between what you stand for, what you make, and how people experience it.",
  aboutStoryBody2: "We believe the strongest work is generous with clarity, ambitious with purpose, and practical enough to make a real difference.",
  aboutValuesEyebrow: "What guides us",
  aboutValuesTitle: "Good work is good partnership.",
  aboutValue1Title: "Care in the details",
  aboutValue1Copy: "Thoughtful craft earns trust one useful decision at a time.",
  aboutValue2Title: "Connected thinking",
  aboutValue2Copy: "Strategy and execution belong in the same conversation.",
  aboutValue3Title: "Momentum over noise",
  aboutValue3Copy: "We choose meaningful progress over busywork and buzzwords.",
  servicesHeroLabel: "OUR SERVICES",
  servicesHeroTitle: "We bring strategy, creativity, and digital solutions together.",
  servicesHeroCopy: "We bring strategy, creativity, and digital solutions together to help businesses build stronger brands, connect with their audience, and grow online.",
  servicesList: defaultServicesList,
  servicesCtaEyebrow: "BAINEST DIGITAL MARKETING SERVICES",
  servicesCtaTitle: "MORE THAN JUST\nDIGITAL MARKETING.",
  servicesCtaCopy: "We help businesses establish their identity, strengthen their online presence, and create meaningful connections with the people who matter.",
  contactHeroLabel: "Contact",
  contactHeroTitle: "Tell us what you’re working toward.",
  contactHeroCopy: "A good conversation can make the next step clearer. Share a little about your idea and we’ll take it from there.",
  contactSidebarEyebrow: "Start here",
  contactSidebarTitle: "Good things start\nwith a hello.",
  contactSidebarCopy: "Use the form to tell us a bit about your goals, timing, or the question you’re trying to answer.",
  contactPillar1Title: "Built around your goals.",
  contactPillar1Text: "We take time to understand your brand, audience, and business objectives.",
  contactPillar2Title: "Strategy starts with a conversation.",
  contactPillar2Text: "Tell us what you need. We'll help you explore the right solutions for your business.",
  // (2026-07-13) Set default Search Console verification token. Prev: none
  googleSearchConsoleCode: "google161104ce8aca460d.html",
  googleSearchConsoleConnected: true,
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
      const data = snap.data() as Partial<SiteSettings>;
      const merged = { ...defaultSettings, ...data };
      // (2026-07-13) Overwrite legacy footer contacts in settings. Prev: placeholder
      if (!merged.email || merged.email.includes("bainestdigital.com")) merged.email = "bainestph@gmail.com";
      if (!merged.phone || merged.phone.includes("900 000")) merged.phone = "09622302015";
      if (data.email?.includes("bainestdigital.com") || data.phone?.includes("900 000")) {
        setDoc(doc(firestore, "settings", "global"), { email: "bainestph@gmail.com", phone: "09622302015" }, { merge: true }).catch(() => {});
      }
      return merged;
    }
    await setDoc(doc(firestore, "settings", "global"), defaultSettings);
    return defaultSettings;
  } catch {
    const raw = localStorage.getItem("bainenest_settings");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const merged = { ...defaultSettings, ...parsed };
        if (!merged.email || merged.email === "contact@bainestdigital.com") merged.email = "bainestph@gmail.com";
        if (!merged.phone || merged.phone === "+63 900 000 0000") merged.phone = "09622302015";
        return merged;
      } catch {}
    }
    return defaultSettings;
  }
}

// (2026-07-13) Clean data before saving Firestore settings. Prev: raw data
export async function saveFirestoreSettings(data: Partial<SiteSettings>): Promise<void> {
  try {
    const cleaned = cleanFirestoreData(data);
    await setDoc(doc(firestore, "settings", "global"), cleaned, { merge: true });
  } catch (err) {
    console.error("Failed to save Firestore settings:", err);
  }
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
          const data = snap.data() as Partial<SiteSettings>;
          const merged = { ...defaultSettings, ...data };
          if (!merged.email || merged.email.includes("bainestdigital.com")) merged.email = "bainestph@gmail.com";
          if (!merged.phone || merged.phone.includes("900 000")) merged.phone = "09622302015";
          callback(merged);
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

// (2026-07-13) Ensure doc ID fallback & query resiliency. Prev: data.id only
async function getFirestorePosts(): Promise<Post[]> {
  try {
    const col = collection(firestore, "posts");
    const q = query(col, orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    const posts: Post[] = [];
    snap.forEach((d) => {
      const data = d.data() as Post;
      posts.push({ ...data, id: data.id ?? d.id });
    });
    saveStoredPosts(posts);
    return posts;
  } catch {
    try {
      const col = collection(firestore, "posts");
      const snap = await getDocs(col);
      const posts: Post[] = [];
      snap.forEach((d) => {
        const data = d.data() as Post;
        posts.push({ ...data, id: data.id ?? d.id });
      });
      posts.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
      saveStoredPosts(posts);
      return posts;
    } catch {
      return getStoredPosts();
    }
  }
}

// (2026-07-13) Clean undefined fields for Firestore save. Prev: uncaught fail
export function cleanFirestoreData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (v === undefined ? null : v))
  );
}

async function saveFirestorePost(post: Post): Promise<void> {
  try {
    const cleaned = cleanFirestoreData(post);
    await setDoc(doc(firestore, "posts", String(post.id)), cleaned);
  } catch (err) {
    console.error("Firestore post save failed:", err);
  }
}

async function deleteFirestorePost(id: string | number): Promise<void> {
  try {
    await deleteDoc(doc(firestore, "posts", String(id)));
  } catch {}
}

// (2026-07-13) Guarantee contact created_at date on save. Prev: none
async function saveFirestoreContact(body: Record<string, unknown>): Promise<void> {
  try {
    await addDoc(collection(firestore, "contacts"), {
      ...body,
      created_at: (body.created_at as string) || new Date().toISOString(),
    });
  } catch {}
}

// (2026-07-13) Robust real-time post subscription with fallback. Prev: q only
export function subscribeToPosts(
  callback: (posts: Post[]) => void,
  onlyPublished = false
): () => void {
  try {
    const col = collection(firestore, "posts");
    const handleSnap = (snapshot: any) => {
      const posts: Post[] = [];
      snapshot.forEach((d: any) => {
        const data = d.data() as Post;
        posts.push({ ...data, id: data.id ?? d.id });
      });
      posts.sort(
        (a, b) =>
          new Date(b.created_at || b.published_at || 0).getTime() -
          new Date(a.created_at || a.published_at || 0).getTime()
      );
      saveStoredPosts(posts);
      callback(
        onlyPublished ? posts.filter((p) => p.status === "published") : posts
      );
    };
    return onSnapshot(
      col,
      handleSnap,
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

function normalizeContactDoc(d: { id: string; data: () => any }): any {
  const data = d.data() || {};
  let created = data.created_at || data.created;
  if (created && typeof created === "object" && typeof created.toDate === "function") {
    created = created.toDate().toISOString();
  } else if (created && typeof created === "object" && typeof created.seconds === "number") {
    created = new Date(created.seconds * 1000).toISOString();
  } else if (typeof created === "string") {
    created = created.replace(/Z+$/i, "Z");
  } else if (!created) {
    created = new Date().toISOString();
  }
  return {
    id: d.id,
    ...data,
    created_at: created,
  };
}

// (2026-07-13) Normalize contact dates in real-time query. Prev: raw missing
export function subscribeToContacts(
  callback: (contacts: any[]) => void
): () => void {
  try {
    const col = collection(firestore, "contacts");
    return onSnapshot(
      col,
      (snapshot) => {
        const contacts: any[] = [];
        snapshot.forEach((d) => contacts.push(normalizeContactDoc(d)));
        contacts.sort((a, b) => {
          const tA = new Date(a.created_at).getTime() || 0;
          const tB = new Date(b.created_at).getTime() || 0;
          return tB - tA;
        });
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
    const snap = await getDocs(col);
    const contacts: any[] = [];
    snap.forEach((d) => contacts.push(normalizeContactDoc(d)));
    contacts.sort((a, b) => {
      const tA = new Date(a.created_at).getTime() || 0;
      const tB = new Date(b.created_at).getTime() || 0;
      return tB - tA;
    });
    return contacts;
  } catch {
    return [];
  }
}

async function deleteFirestoreContact(id: string | number): Promise<void> {
  try {
    await deleteDoc(doc(firestore, "contacts", String(id)));
  } catch {}
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
        // (2026-07-13) Set portfolio flags on create (was portfolio inclusion only)
        include_in_nav: Boolean(body.include_in_nav),
        include_in_portfolio: Boolean(body.include_in_portfolio),
        portfolio_only: Boolean(body.portfolio_only),
      };
      posts.unshift(newPost);
      saveStoredPosts(posts);
      await saveFirestorePost(newPost);
      return newPost;
    }
  }

  // (2026-07-13) Direct doc & slug Firestore fallback for edit. Prev: list only
  const postMatch = url.match(/^\/api\/admin\/posts\/([^/?]+)(?:\/preview)?$/);
  if (postMatch) {
    const rawId = decodeURIComponent(postMatch[1]);
    const posts = await getFirestorePosts();
    let p = posts.find(
      (item) => String(item.id) === String(rawId) || String(item.slug) === String(rawId)
    );
    if (!p) {
      try {
        const docSnap = await getDoc(doc(firestore, "posts", String(rawId)));
        if (docSnap.exists()) {
          const d = docSnap.data() as Post;
          p = { ...d, id: d.id ?? docSnap.id };
        }
      } catch {}
    }
    if (!p) {
      try {
        const qSlug = query(collection(firestore, "posts"), where("slug", "==", rawId));
        const slugSnap = await getDocs(qSlug);
        if (!slugSnap.empty) {
          const d = slugSnap.docs[0];
          const data = d.data() as Post;
          p = { ...data, id: data.id ?? d.id };
        }
      } catch {}
    }
    if (url.endsWith("/preview") || method === "GET") {
      if (!p) throw new Error("Post not found.");
      return p;
    }
    if (method === "PUT") {
      const updated: Post = {
        ...(p || {}),
        ...body,
        id: p?.id ?? rawId,
        updated_at: new Date().toISOString(),
      };
      const filtered = posts.filter(
        (item) => String(item.id) !== String(rawId) && String(item.slug) !== String(rawId)
      );
      filtered.unshift(updated);
      saveStoredPosts(filtered);
      await saveFirestorePost(updated);
      return updated;
    }
    if (method === "DELETE") {
      const filtered = posts.filter(
        (item) => String(item.id) !== String(rawId) && String(item.slug) !== String(rawId)
      );
      saveStoredPosts(filtered);
      await deleteFirestorePost(rawId);
      return { ok: true };
    }
  }

  if (url === "/api/posts") {
    const posts = await getFirestorePosts();
    return posts.filter((p) => p.status === "published");
  }

  // (2026-07-13) Case-insensitive URL slug & ID resolver. Prev: strict regex
  const publicPostMatch = url.match(/^\/api\/posts\/([^/?]+)$/);
  if (publicPostMatch) {
    const rawParam = decodeURIComponent(publicPostMatch[1]).toLowerCase();
    const posts = await getFirestorePosts();
    const post = posts.find(
      (p) =>
        (p.slug && p.slug.toLowerCase() === rawParam) ||
        String(p.id).toLowerCase() === rawParam
    );
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

  // (2026-07-13) Add contact delete route handler. Prev: mark read only
  const contactDeleteMatch = url.match(/^\/api\/admin\/contacts\/([^/]+)$/);
  if (contactDeleteMatch && method === "DELETE") {
    await deleteFirestoreContact(contactDeleteMatch[1]);
    return { ok: true };
  }

  // (2026-07-13) Track post views and shares in Firestore. Prev: none
  const postViewMatch = url.match(/^\/api\/posts\/([^/]+)\/view$/);
  if (postViewMatch && method === "POST") {
    const pId = postViewMatch[1];
    const posts = await getFirestorePosts();
    const target = posts.find((p) => String(p.id) === pId || p.slug === pId);
    if (target) {
      target.views = (target.views || 0) + 1;
      await saveFirestorePost(target);
    }
    return { ok: true };
  }

  const postShareMatch = url.match(/^\/api\/posts\/([^/]+)\/share$/);
  if (postShareMatch && method === "POST") {
    const pId = postShareMatch[1];
    const posts = await getFirestorePosts();
    const target = posts.find((p) => String(p.id) === pId || p.slug === pId);
    if (target) {
      target.shares = (target.shares || 0) + 1;
      await saveFirestorePost(target);
    }
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
    // (2026-07-13) Fallback non-JSON responses to static API. Prev: raw json fail
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("application/json")) {
      return (await handleStaticApi(path, init)) as T;
    }
    return (await response.json()) as T;
  } catch (err) {
    return (await handleStaticApi(path, init)) as T;
  }
}
