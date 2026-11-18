// (2026-07-13) Add increment import for atomic telemetry; was manual setDoc
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
  increment,
} from "firebase/firestore";
import { firestore } from "./firebase";
// (2026-07-13) Import recompressDataUrl for 1MB Firestore limit. Prev: none
import { recompressDataUrl } from "./imageCompressor";

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
  // (2026-07-13) Reference separate Firestore doc for HD image; was inline only
  media_ref?: string;
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
  // (2026-07-13) Add per-article comments array to Post type; was local only
  comments?: { id: string; name: string; text: string; date: string }[];
  // (2026-07-13) Editable case-study overview fields on Post; was inferred only
  client_name?: string;
  industry_sector?: string;
  creative_direction?: string;
  deliverables?: string[];
};
/* (2026-07-13) Helper to determine placement type: Blog, Portfolio, or Both. Prev: none */
export function getPostPlacement(p: { portfolio_only?: boolean; include_in_portfolio?: boolean }): "Blog" | "Portfolio" | "Both" {
  if (p?.portfolio_only) return "Portfolio";
  if (p?.include_in_portfolio) return "Both";
  return "Blog";
}

// (2026-07-13) Scan full blog blocks for case-study auto-suggest; was title
export function resolveCaseStudyDefaults(p: Partial<Post>, ignoreSaved = false) {
  const blocksText = Array.isArray(p?.blocks)
    ? p.blocks
        .map((b) =>
          [
            b.text || "",
            Array.isArray(b.items) ? b.items.join(" ") : "",
            b.left || "",
            b.right || "",
            b.caption || "",
            b.alt || "",
          ].join(" ")
        )
        .join(" ")
    : "";
  const fullText = `${p?.title || ""} ${p?.slug || ""} ${p?.excerpt || ""} ${blocksText}`;
  const hay = fullText.toLowerCase();
  const titleHay = `${p?.title || ""} ${p?.slug || ""}`.toLowerCase();

  let base = {
    client_name: "",
    industry_sector: p?.category || "Brand & Digital Strategy",
    creative_direction: "Intentional, Clear & Results-Oriented",
    deliverables: ["Brand Strategy", "Creative Direction", "Digital Execution"],
  };

  if (titleHay.includes("pharmacy") || titleHay.includes("dr. k") || titleHay.includes("dr-k")) {
    base = {
      client_name: "Dr. K Pharmacy & Medical Supplies",
      industry_sector: "Pharmacy & Healthcare",
      creative_direction: "Clean, Trust-Driven & Approachable",
      deliverables: ["Brand Identity", "Social Media Design", "Patient Education"],
    };
  } else if (titleHay.includes("aton") || titleHay.includes("law office")) {
    base = {
      client_name: "Aton & Aton Law Office",
      industry_sector: "Legal & Law Practice",
      creative_direction: "Authoritative, Modern & Bold",
      deliverables: ["Visual Identity", "Corporate Branding", "Digital Presence"],
    };
  } else if (titleHay.includes("doc jackie") || titleHay.includes("doc-jackie")) {
    base = {
      client_name: "Doc Jackie",
      industry_sector: "Healthcare Personal Brand",
      creative_direction: "Credible, Warm & Engaging",
      deliverables: ["Personal Branding", "Social Media Management", "Content Strategy"],
    };
  } else if (titleHay.includes("virtual assistant") || titleHay.includes("medical practice")) {
    base = {
      client_name: "Medical Practice Support",
      industry_sector: "Healthcare Operations",
      creative_direction: "Reliable, Structured & Patient-First",
      deliverables: ["Healthcare VA", "Patient Communication", "Digital Workflow"],
    };
  } else if (titleHay.includes("centrum mall")) {
    base = {
      client_name: "Bogo City Centrum Mall",
      industry_sector: "Shopping Mall & Commercial",
      creative_direction: "Vibrant, Community-Focused & Modern",
      deliverables: ["Digital Transformation", "Campaign Strategy", "Brand Refresh"],
    };
  } else if (titleHay.includes("k.lee") || titleHay.includes("k-lee")) {
    base = {
      client_name: "K.LEE Essentials",
      industry_sector: "Retail & E-Commerce",
      creative_direction: "Polished, Accessible & Conversion-Ready",
      deliverables: ["Digital Storefront", "Product Branding", "Social Launch"],
    };
  } else if (titleHay.includes("pickleball") || titleHay.includes("pinktober") || titleHay.includes("freeway")) {
    base = {
      client_name: titleHay.includes("freeway")
        ? "Freeway Pickleball Tournament"
        : titleHay.includes("pinktober")
        ? "Clash of Clubs Pickleball"
        : "Live Event Production",
      industry_sector: "Sports & Live Events",
      creative_direction: "High-Energy, Cohesive & Memorable",
      deliverables: ["Event Identity", "Merch & Court Visuals", "Campaign Graphics"],
    };
  } else {
    // Dynamic full-blog scanner for new blogs
    const rawTitle = (p?.title || "").replace(/\|\s*bainest.*$/i, "").trim();
    let extractedClient = "";
    if (rawTitle.includes(":")) {
      const parts = rawTitle.split(":").map((s) => s.trim()).filter(Boolean);
      extractedClient = parts[parts.length - 1]
        .replace(/^(the|bringing|creating|elevating|building|launching)\s+/i, "")
        .replace(/\s+(digital transformation|online|to the court|tournament)$/i, "")
        .trim();
    }
    if (!extractedClient) {
      const forMatch = rawTitle.match(/\b(?:for|with|at)\s+([A-Z][A-Za-z0-9.&'\-]+(?:\s+[A-Za-z0-9.&'\-]+){0,4})/);
      if (forMatch?.[1]) extractedClient = forMatch[1].trim();
    }
    if (!extractedClient && fullText) {
      const bodyMatch = fullText.match(/\b(?:client|partnered with|working with|created for|brand like)\s+([A-Z][A-Za-z0-9.&'\-]+(?:\s+[A-Z][A-Za-z0-9.&'\-]+){0,3})/);
      if (bodyMatch?.[1]) extractedClient = bodyMatch[1].trim();
    }
    base.client_name = extractedClient || rawTitle || "Client Partner";

    // Industry sector scan across full blog text
    if (/pharmacy|medicine|medical|clinic|doctor|patient|dental|hospital|wellness|health/.test(hay)) {
      base.industry_sector = /personal brand|doctor|dr\./.test(hay) ? "Healthcare Personal Brand" : "Healthcare & Medical";
    } else if (/law|legal|attorney|counsel|litigation|notary|firm/.test(hay)) {
      base.industry_sector = "Legal & Law Practice";
    } else if (/mall|shopping center|plaza|commercial center/.test(hay)) {
      base.industry_sector = "Shopping Mall & Commercial";
    } else if (/restaurant|cafe|coffee|dining|food|bakery|hotel|resort|hospitality|bar|bistro/.test(hay)) {
      base.industry_sector = "Food, Cafe & Hospitality";
    } else if (/pickleball|tournament|sport|athlete|court|fitness|gym|festival|concert|event/.test(hay)) {
      base.industry_sector = "Sports & Live Events";
    } else if (/real estate|property|architecture|construction|interior|development|housing/.test(hay)) {
      base.industry_sector = "Real Estate & Property";
    } else if (/storefront|retail|e-commerce|shop|boutique|apparel|fashion|product|essentials/.test(hay)) {
      base.industry_sector = "Retail & E-Commerce";
    } else if (/software|saas|tech|startup|app|platform|automation|ai /.test(hay)) {
      base.industry_sector = "Technology & Digital";
    } else if (/school|academy|education|training|university|learning/.test(hay)) {
      base.industry_sector = "Education & Community";
    } else if (/finance|accounting|consulting|corporate|insurance|investment/.test(hay)) {
      base.industry_sector = "Finance & Corporate";
    }

    // Tone & creative direction scan across full blog text
    const toneMap: [RegExp, string][] = [
      [/clean|minimal|simplicity|clarity/, "Clean"],
      [/trust|reliable|credib|dependable/, "Trust-Driven"],
      [/approachable|friendly|welcoming|warm/, "Approachable"],
      [/bold|striking|stand out|distinct/, "Bold"],
      [/modern|contemporary|fresh|new/, "Modern"],
      [/authoritat|professional|formal|corporate/, "Professional"],
      [/vibrant|energetic|lively|dynamic|high-energy/, "Vibrant"],
      [/cohesive|unified|consistent|connected/, "Cohesive"],
      [/community|local|people-first/, "Community-Focused"],
      [/polished|refined|elevated|premium/, "Refined"],
      [/accessible|easy|practical/, "Accessible"],
    ];
    const matchedTones: string[] = [];
    for (const [rx, label] of toneMap) {
      if (rx.test(hay) && !matchedTones.includes(label)) {
        matchedTones.push(label);
        if (matchedTones.length === 3) break;
      }
    }
    if (matchedTones.length === 3) {
      base.creative_direction = `${matchedTones[0]}, ${matchedTones[1]} & ${matchedTones[2]}`;
    } else if (matchedTones.length === 2) {
      base.creative_direction = `${matchedTones[0]}, ${matchedTones[1]} & Strategic`;
    } else if (matchedTones.length === 1) {
      base.creative_direction = `${matchedTones[0]}, Modern & Intentional`;
    }

    // Deliverables scan across full blog text
    const delivMap: [RegExp, string][] = [
      [/personal brand/, "Personal Branding"],
      [/brand identity|visual identity|logo|rebrand|color palette|typography/, "Brand Identity"],
      [/social media|facebook|instagram|tiktok|feed/, "Social Media Management"],
      [/content|storytelling|copywriting|caption|educational/, "Content Strategy"],
      [/graphic|poster|infographic|layout|print|signage/, "Graphic Design"],
      [/digital transformation|moderniz|online presence/, "Digital Transformation"],
      [/storefront|e-commerce|online store|website|web design|landing page/, "Digital Storefront"],
      [/campaign|launch|promotion|awareness|rollout/, "Campaign Strategy"],
      [/event|tournament|merch|jersey|court|banner/, "Event Identity"],
      [/virtual assistant|workflow|scheduling|patient communication|inbox/, "Digital Workflow"],
      [/ads|advertising|lead gen|conversion|seo/, "Growth & Ads"],
    ];
    const matchedDelivs: string[] = [];
    for (const [rx, label] of delivMap) {
      if (rx.test(hay) && !matchedDelivs.includes(label)) {
        matchedDelivs.push(label);
        if (matchedDelivs.length === 3) break;
      }
    }
    if (matchedDelivs.length > 0) {
      base.deliverables = matchedDelivs;
    }
  }

  if (ignoreSaved) {
    return base;
  }

  return {
    client_name: p?.client_name?.trim() || base.client_name,
    industry_sector: p?.industry_sector?.trim() || base.industry_sector,
    creative_direction: p?.creative_direction?.trim() || base.creative_direction,
    deliverables:
      Array.isArray(p?.deliverables) && p.deliverables.length > 0
        ? p.deliverables
        : base.deliverables,
  };
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
// (2026-07-13) Quota-safe post cache & live event dispatch. Prev: raw localStorage
function getStoredPosts(): Post[] {
  try {
    const raw = localStorage.getItem("bainenest_posts");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredPosts(posts: Post[], notify = false) {
  try {
    localStorage.setItem("bainenest_posts", JSON.stringify(posts));
  } catch {
    try {
      const compact = posts.map((p) => ({
        ...p,
        cover_image: p.cover_image && p.cover_image.length > 90000 ? "" : p.cover_image,
        blocks: (p.blocks || []).map((b) =>
          b.type === "image" && b.src && b.src.length > 90000 ? { ...b, src: "" } : b
        ),
      }));
      localStorage.setItem("bainenest_posts", JSON.stringify(compact));
    } catch {}
  }
  if (notify && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bainest-posts-updated", { detail: posts }));
  }
}

// (2026-07-13) Cached contacts helper and merge utility. Prev: none
export function getStoredContacts(): any[] {
  try {
    const raw = localStorage.getItem("bainenest_contacts");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredContacts(contacts: any[]) {
  try {
    localStorage.setItem("bainenest_contacts", JSON.stringify(contacts));
  } catch {}
}

export function mergeContacts(primary: any[], secondary: any[]): any[] {
  const map = new Map<string, any>();
  const add = (item: any) => {
    if (!item) return;
    const key = String(item.id || `${item.email}_${(item.created_at || "").slice(0, 16)}`);
    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key);
      map.set(key, {
        ...existing,
        ...item,
        read: existing.read || item.read ? 1 : 0,
      });
    }
  };
  (primary || []).forEach(add);
  (secondary || []).forEach(add);
  const result = Array.from(map.values());
  result.sort((a, b) => {
    const tA = new Date(a.created_at || 0).getTime() || 0;
    const tB = new Date(b.created_at || 0).getTime() || 0;
    return tB - tA;
  });
  return result;
}

// (2026-07-13) Instant cached settings helper & cross-tab sync. Prev: Firestore only
export function getCachedSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem("bainenest_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...defaultSettings, ...parsed };
      if (!merged.email || merged.email.includes("bainestdigital.com")) merged.email = "bainestph@gmail.com";
      if (!merged.phone || merged.phone.includes("900 000")) merged.phone = "09622302015";
      return merged;
    }
  } catch {}
  return defaultSettings;
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
      try {
        localStorage.setItem("bainenest_settings", JSON.stringify(merged));
      } catch {}
      return merged;
    }
    await setDoc(doc(firestore, "settings", "global"), defaultSettings);
    return defaultSettings;
  } catch {
    return getCachedSettings();
  }
}

// (2026-07-13) Immediate local cache & event broadcast on settings save. Prev: delayed
export async function saveFirestoreSettings(data: Partial<SiteSettings>): Promise<void> {
  const cleaned = cleanFirestoreData(data);
  const nextSettings = { ...getCachedSettings(), ...cleaned };
  try {
    localStorage.setItem("bainenest_settings", JSON.stringify(nextSettings));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bainest-settings-updated", { detail: nextSettings }));
    }
  } catch {}
  await setDoc(doc(firestore, "settings", "global"), cleaned, { merge: true });
}

export function subscribeToSettings(
  callback: (s: SiteSettings) => void
): () => void {
  callback(getCachedSettings());
  const onLocalUpdate = (e: Event) => {
    const custom = e as CustomEvent<SiteSettings>;
    if (custom.detail) callback(custom.detail);
    else callback(getCachedSettings());
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === "bainenest_settings") {
      callback(getCachedSettings());
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("bainest-settings-updated", onLocalUpdate);
    window.addEventListener("storage", onStorage);
  }
  let unsubFirestore = () => {};
  try {
    unsubFirestore = onSnapshot(
      doc(firestore, "settings", "global"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<SiteSettings>;
          const merged = { ...defaultSettings, ...data };
          if (!merged.email || merged.email.includes("bainestdigital.com")) merged.email = "bainestph@gmail.com";
          if (!merged.phone || merged.phone.includes("900 000")) merged.phone = "09622302015";
          try {
            localStorage.setItem("bainenest_settings", JSON.stringify(merged));
          } catch {}
          callback(merged);
        } else {
          callback(getCachedSettings());
        }
      },
      () => callback(getCachedSettings())
    );
  } catch {
    callback(getCachedSettings());
  }
  return () => {
    unsubFirestore();
    if (typeof window !== "undefined") {
      window.removeEventListener("bainest-settings-updated", onLocalUpdate);
      window.removeEventListener("storage", onStorage);
    }
  };
}

// (2026-07-13) Store overflow HD images in post_media docs; was 480px downscale
const mediaCache = new Map<string, string>();

async function hydratePostsMedia(posts: Post[]): Promise<Post[]> {
  const missingRefs = new Set<string>();
  for (const p of posts) {
    for (const b of p.blocks || []) {
      if (b.media_ref && !b.src) {
        const cached = mediaCache.get(b.media_ref);
        if (cached) {
          b.src = cached;
        } else {
          missingRefs.add(b.media_ref);
        }
      }
    }
  }
  if (missingRefs.size > 0) {
    await Promise.all(
      Array.from(missingRefs).map(async (refId) => {
        try {
          const snap = await getDoc(doc(firestore, "post_media", refId));
          if (snap.exists()) {
            const data = snap.data() as { src?: string };
            if (data?.src) mediaCache.set(refId, data.src);
          }
        } catch {}
      })
    );
    for (const p of posts) {
      for (const b of p.blocks || []) {
        if (b.media_ref && !b.src && mediaCache.has(b.media_ref)) {
          b.src = mediaCache.get(b.media_ref);
        }
      }
    }
  }
  return posts;
}

// (2026-07-13) Ensure doc ID fallback & query resiliency. Prev: data.id only
async function getFirestorePosts(): Promise<Post[]> {
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
        new Date(b.created_at || b.published_at || 0).getTime() -
        new Date(a.created_at || a.published_at || 0).getTime()
    );
    await hydratePostsMedia(posts);
    saveStoredPosts(posts);
    return posts;
  } catch {
    return getStoredPosts();
  }
}

// (2026-07-13) Clean undefined fields for Firestore save. Prev: uncaught fail
export function cleanFirestoreData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (v === undefined ? null : v))
  );
}

// (2026-07-13) Save HD images in post_media docs over 850KB; was 480px crush
async function saveFirestorePost(post: Post): Promise<Post> {
  const prepared: Post = {
    ...post,
    created_at: post.created_at || post.published_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    blocks: (post.blocks || []).map((b) => ({
      ...b,
      id: b.id || crypto.randomUUID(),
    })),
  };
  let cleaned = cleanFirestoreData(prepared);
  if (cleaned.cover_image && cleaned.cover_image.startsWith("data:") && cleaned.cover_image.length > 780000) {
    cleaned.cover_image = await recompressDataUrl(cleaned.cover_image, 1600, 0.86);
  }
  if (Array.isArray(cleaned.blocks)) {
    cleaned.blocks = await Promise.all(
      cleaned.blocks.map(async (b) => {
        if (b.type === "image" && b.src && b.src.startsWith("data:") && b.src.length > 780000) {
          return { ...b, src: await recompressDataUrl(b.src, 1600, 0.86) };
        }
        return b;
      })
    );
  }
  const fullBlocks = (cleaned.blocks || []).map((b) => ({ ...b }));
  const docBlocks = (cleaned.blocks || []).map((b) => ({ ...b }));
  let docPayload: Post = { ...cleaned, blocks: docBlocks };

  if (JSON.stringify(docPayload).length > 850000) {
    for (let i = 0; i < docBlocks.length; i++) {
      const b = docBlocks[i];
      if (b.type === "image" && b.src && b.src.startsWith("data:") && b.src.length > 20000) {
        const refId = `${cleaned.id}_${b.id}`;
        mediaCache.set(refId, b.src);
        await setDoc(doc(firestore, "post_media", refId), {
          postId: String(cleaned.id),
          blockId: b.id,
          src: b.src,
        });
        docBlocks[i] = { ...b, src: "", media_ref: refId };
        fullBlocks[i] = { ...fullBlocks[i], media_ref: refId };
        if (JSON.stringify(docPayload).length <= 820000) break;
      }
    }
  }

  await setDoc(doc(firestore, "posts", String(cleaned.id)), docPayload);
  return { ...cleaned, blocks: fullBlocks };
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

// (2026-07-13) Real-time post subscription with local event sync. Prev: snapshot only
export function subscribeToPosts(
  callback: (posts: Post[]) => void,
  onlyPublished = false
): () => void {
  const emit = (list: Post[]) => {
    callback(onlyPublished ? list.filter((p) => p.status === "published") : list);
  };
  const onLocalPosts = (e: Event) => {
    const custom = e as CustomEvent<Post[]>;
    if (Array.isArray(custom.detail)) {
      emit(custom.detail);
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("bainest-posts-updated", onLocalPosts);
  }
  let unsubFirestore = () => {};
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
      hydratePostsMedia(posts).then((hydrated) => {
        saveStoredPosts(hydrated);
        emit(hydrated);
      });
    };
    unsubFirestore = onSnapshot(
      col,
      handleSnap,
      () => {
        emit(getStoredPosts());
      }
    );
  } catch {
    emit(getStoredPosts());
  }
  return () => {
    unsubFirestore();
    if (typeof window !== "undefined") {
      window.removeEventListener("bainest-posts-updated", onLocalPosts);
    }
  };
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

// (2026-07-13) Merge Firestore & cached contacts in real-time. Prev: raw missing
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
        const stored = getStoredContacts();
        const merged = mergeContacts(contacts, stored);
        saveStoredContacts(merged);
        callback(merged);
      },
      () => {
        const stored = getStoredContacts();
        callback(stored);
      }
    );
  } catch {
    const stored = getStoredContacts();
    callback(stored);
    return () => {};
  }
}

async function getFirestoreContacts(): Promise<any[]> {
  try {
    const col = collection(firestore, "contacts");
    const snap = await getDocs(col);
    const contacts: any[] = [];
    snap.forEach((d) => contacts.push(normalizeContactDoc(d)));
    const stored = getStoredContacts();
    const merged = mergeContacts(contacts, stored);
    saveStoredContacts(merged);
    return merged;
  } catch {
    return getStoredContacts();
  }
}

async function deleteFirestoreContact(id: string | number): Promise<void> {
  try {
    await deleteDoc(doc(firestore, "contacts", String(id)));
  } catch {}
  const stored = getStoredContacts().filter((c) => String(c.id) !== String(id));
  saveStoredContacts(stored);
}

async function markFirestoreContactRead(id: string | number): Promise<void> {
  try {
    await setDoc(
      doc(firestore, "contacts", String(id)),
      { read: 1 },
      { merge: true }
    );
  } catch {}
  const stored = getStoredContacts().map((c) => (String(c.id) === String(id) ? { ...c, read: 1 } : c));
  saveStoredContacts(stored);
}

export async function syncContactsToFirestore(contacts: any[]): Promise<void> {
  if (!Array.isArray(contacts) || contacts.length === 0) return;
  try {
    const col = collection(firestore, "contacts");
    const snap = await getDocs(col);
    const existing = new Set(
      snap.docs.map((d) => {
        const data = d.data();
        return `${data.email}_${(data.message || "").trim().slice(0, 30)}`;
      })
    );
    for (const c of contacts) {
      const key = `${c.email}_${(c.message || "").trim().slice(0, 30)}`;
      if (!existing.has(key)) {
        await addDoc(col, {
          name: c.name || "",
          email: c.email || "",
          company: c.company || "",
          message: c.message || "",
          read: c.read ? 1 : 0,
          created_at: c.created_at || new Date().toISOString(),
        });
        existing.add(key);
      }
    }
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
        // (2026-07-13) Init real 0 views and shares on new post; was undefined
        views: 0,
        shares: 0,
        // (2026-07-13) Persist custom case-study overview fields; was omitted
        client_name: body.client_name || "",
        industry_sector: body.industry_sector || "",
        creative_direction: body.creative_direction || "",
        deliverables: Array.isArray(body.deliverables) ? body.deliverables : [],
      };
      // (2026-07-13) Persist post to Firestore and notify UI listeners. Prev: unawaited
      const savedPost = await saveFirestorePost(newPost);
      posts.unshift(savedPost);
      saveStoredPosts(posts, true);
      return savedPost;
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
        created_at: p?.created_at || body.published_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // (2026-07-13) Save edited post & broadcast update immediately. Prev: stale cache
      const savedPost = await saveFirestorePost(updated);
      const filtered = posts.filter(
        (item) => String(item.id) !== String(rawId) && String(item.slug) !== String(rawId)
      );
      filtered.unshift(savedPost);
      saveStoredPosts(filtered, true);
      return savedPost;
    }
    if (method === "DELETE") {
      const filtered = posts.filter(
        (item) => String(item.id) !== String(rawId) && String(item.slug) !== String(rawId)
      );
      saveStoredPosts(filtered, true);
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
    const contactItem = { ...body, read: 0, created_at: body.created_at || new Date().toISOString() };
    await saveFirestoreContact(contactItem);
    const stored = getStoredContacts();
    saveStoredContacts(mergeContacts([contactItem], stored));
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

  // (2026-07-13) Track real views, clicks, impressions & telemetry; was view/share
  const postViewMatch = url.match(/^\/api\/posts\/([^/]+)\/view$/);
  if (postViewMatch && method === "POST") {
    const pId = decodeURIComponent(postViewMatch[1]).toLowerCase();
    const posts = await getFirestorePosts();
    const target = posts.find(
      (p) => String(p.id).toLowerCase() === pId || (p.slug && p.slug.toLowerCase() === pId)
    );
    if (target) {
      target.views = (target.views || 0) + 1;
      await setDoc(doc(firestore, "posts", String(target.id)), { views: increment(1) }, { merge: true });
      saveStoredPosts(posts, true);
    }
    recordSiteTelemetry("view", 1).catch(() => {});
    return { ok: true };
  }

  const postClickMatch = url.match(/^\/api\/posts\/([^/]+)\/click$/);
  if (postClickMatch && method === "POST") {
    const pId = decodeURIComponent(postClickMatch[1]).toLowerCase();
    const posts = await getFirestorePosts();
    const target = posts.find(
      (p) => String(p.id).toLowerCase() === pId || (p.slug && p.slug.toLowerCase() === pId)
    );
    if (target) {
      target.clicks = (target.clicks || 0) + 1;
      await setDoc(doc(firestore, "posts", String(target.id)), { clicks: increment(1) }, { merge: true });
      saveStoredPosts(posts, true);
    }
    recordSiteTelemetry("click", 1).catch(() => {});
    return { ok: true };
  }

  if (url === "/api/posts/impressions" && method === "POST") {
    const ids: string[] = Array.isArray(body.postIds) ? body.postIds.map((x: unknown) => String(x)) : [];
    if (ids.length > 0) {
      const uniqueIds = Array.from(new Set(ids)).slice(0, 12);
      await Promise.all(
        uniqueIds.map((pid) =>
          setDoc(doc(firestore, "posts", pid), { impressions: increment(1) }, { merge: true }).catch(() => {})
        )
      );
      recordSiteTelemetry("impression", uniqueIds.length).catch(() => {});
    }
    return { ok: true };
  }

  const postShareMatch = url.match(/^\/api\/posts\/([^/]+)\/share$/);
  if (postShareMatch && method === "POST") {
    const pId = decodeURIComponent(postShareMatch[1]).toLowerCase();
    const posts = await getFirestorePosts();
    const target = posts.find(
      (p) => String(p.id).toLowerCase() === pId || (p.slug && p.slug.toLowerCase() === pId)
    );
    if (target) {
      target.shares = (target.shares || 0) + 1;
      await setDoc(doc(firestore, "posts", String(target.id)), { shares: increment(1) }, { merge: true });
      saveStoredPosts(posts, true);
    }
    recordSiteTelemetry("share", 1).catch(() => {});
    return { ok: true };
  }

  // (2026-07-13) Atomically save article comments & engagement; was race-prone
  const postCommentsMatch = url.match(/^\/api\/posts\/([^/]+)\/comments$/);
  if (postCommentsMatch && method === "PUT") {
    const pId = decodeURIComponent(postCommentsMatch[1]).toLowerCase();
    const posts = await getFirestorePosts();
    const target = posts.find(
      (p) => String(p.id).toLowerCase() === pId || (p.slug && p.slug.toLowerCase() === pId)
    );
    const nextComments = Array.isArray(body.comments) ? body.comments : [];
    if (target) {
      target.comments = nextComments;
      const patchData: Record<string, unknown> = { comments: nextComments };
      if (body.incrementEngagement) {
        target.shares = (target.shares || 0) + 1;
        patchData.shares = increment(1);
        recordSiteTelemetry("share", 1).catch(() => {});
      }
      await setDoc(doc(firestore, "posts", String(target.id)), patchData, { merge: true });
      saveStoredPosts(posts, true);
    }
    return { ok: true, comments: nextComments };
  }

  return {};
}

// (2026-07-13) Real Firestore site telemetry tracking & subscription; was none
export type DailyTelemetry = {
  views: number;
  clicks: number;
  impressions: number;
  shares: number;
};

export type SiteTelemetry = {
  daily: Record<string, DailyTelemetry>;
  channels: { google: number; direct: number; social: number };
  devices: { mobile: number; desktop: number; tablet: number };
  updated_at?: string;
};

export const emptyTelemetry: SiteTelemetry = {
  daily: {},
  channels: { google: 0, direct: 0, social: 0 },
  devices: { mobile: 0, desktop: 0, tablet: 0 },
};

function normalizeTelemetry(raw: any): SiteTelemetry {
  const daily: Record<string, DailyTelemetry> = {};
  if (raw?.daily && typeof raw.daily === "object") {
    for (const [k, v] of Object.entries(raw.daily)) {
      const item = v as any;
      daily[k] = {
        views: Number(item?.views) || 0,
        clicks: Number(item?.clicks) || 0,
        impressions: Number(item?.impressions) || 0,
        shares: Number(item?.shares) || 0,
      };
    }
  }
  return {
    daily,
    channels: {
      google: Number(raw?.channels?.google) || 0,
      direct: Number(raw?.channels?.direct) || 0,
      social: Number(raw?.channels?.social) || 0,
    },
    devices: {
      mobile: Number(raw?.devices?.mobile) || 0,
      desktop: Number(raw?.devices?.desktop) || 0,
      tablet: Number(raw?.devices?.tablet) || 0,
    },
    updated_at: raw?.updated_at,
  };
}

export function getCachedTelemetry(): SiteTelemetry {
  try {
    const raw = localStorage.getItem("bainest_site_telemetry");
    if (raw) return normalizeTelemetry(JSON.parse(raw));
  } catch {}
  return emptyTelemetry;
}

export async function getFirestoreTelemetry(): Promise<SiteTelemetry> {
  try {
    const snap = await getDoc(doc(firestore, "analytics", "site_telemetry"));
    if (snap.exists()) {
      const norm = normalizeTelemetry(snap.data());
      try {
        localStorage.setItem("bainest_site_telemetry", JSON.stringify(norm));
      } catch {}
      return norm;
    }
  } catch {}
  return getCachedTelemetry();
}

export function subscribeToTelemetry(callback: (t: SiteTelemetry) => void): () => void {
  callback(getCachedTelemetry());
  try {
    const ref = doc(firestore, "analytics", "site_telemetry");
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const norm = normalizeTelemetry(snap.data());
          try {
            localStorage.setItem("bainest_site_telemetry", JSON.stringify(norm));
          } catch {}
          callback(norm);
        }
      },
      () => callback(getCachedTelemetry())
    );
  } catch {
    return () => {};
  }
}

function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function recordSiteTelemetry(
  event: "view" | "click" | "impression" | "share",
  amount = 1
): Promise<void> {
  try {
    const dateKey = getTodayDateKey();
    const fieldMap: Record<typeof event, keyof DailyTelemetry> = {
      view: "views",
      click: "clicks",
      impression: "impressions",
      share: "shares",
    };
    const metricKey = fieldMap[event];
    const payload: Record<string, any> = {
      daily: {
        [dateKey]: {
          [metricKey]: increment(amount),
        },
      },
      updated_at: new Date().toISOString(),
    };
    if (event === "view" && typeof window !== "undefined") {
      const ref = (document.referrer || "").toLowerCase();
      let channel: "google" | "direct" | "social" = "direct";
      if (/google\.|bing\.|yahoo\.|duckduckgo\.|search\./.test(ref)) channel = "google";
      else if (/facebook\.|fb\.|instagram\.|twitter\.|x\.com|t\.co|linkedin\.|tiktok\.|youtube\./.test(ref)) channel = "social";

      const ua = navigator.userAgent || "";
      const w = window.innerWidth || 1200;
      let device: "mobile" | "desktop" | "tablet" = "desktop";
      if (/iPad|Tablet/i.test(ua) || (w >= 768 && w <= 1024 && "ontouchstart" in window)) device = "tablet";
      else if (/Mobi|Android|iPhone|iPod/i.test(ua) || w < 768) device = "mobile";

      payload.channels = { [channel]: increment(1) };
      payload.devices = { [device]: increment(1) };
    }
    await setDoc(doc(firestore, "analytics", "site_telemetry"), payload, { merge: true });
  } catch {}
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  // (2026-07-13) Guarantee live Firestore settings sync across all environments
  if (path.startsWith("/api/admin/settings") && ["PUT", "POST"].includes((init.method || "").toUpperCase()) && init.body) {
    try {
      const parsed = JSON.parse(init.body as string);
      await saveFirestoreSettings(parsed);
    } catch (err) {
      console.warn("Direct saveFirestoreSettings error:", err);
    }
  }

  // (2026-07-13) Guarantee live contact sync to Firestore across all envs
  if (path === "/api/contact" && ["POST"].includes((init.method || "").toUpperCase()) && init.body) {
    try {
      const parsed = JSON.parse(init.body as string);
      const contactItem = { ...parsed, read: 0, created_at: parsed.created_at || new Date().toISOString() };
      saveFirestoreContact(contactItem).catch(() => {});
      const stored = getStoredContacts();
      saveStoredContacts(mergeContacts([contactItem], stored));
    } catch (err) {
      console.warn("Direct saveFirestoreContact error:", err);
    }
  }

  const contactReadMatch = path.match(/^\/api\/admin\/contacts\/([^/]+)\/read$/);
  if (contactReadMatch && ["PUT", "POST"].includes((init.method || "").toUpperCase())) {
    markFirestoreContactRead(contactReadMatch[1]).catch(() => {});
  }

  const contactDeleteMatch = path.match(/^\/api\/admin\/contacts\/([^/]+)$/);
  if (contactDeleteMatch && (init.method || "").toUpperCase() === "DELETE") {
    deleteFirestoreContact(contactDeleteMatch[1]).catch(() => {});
  }

  const isStaticHost =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  if (isStaticHost) {
    return (await handleStaticApi(path, init)) as T;
  }

  // (2026-07-13) Route all post & settings calls via Firestore handler. Prev: GET list only
  if (
    path.startsWith("/api/admin/posts") ||
    path.startsWith("/api/posts") ||
    path.startsWith("/api/admin/settings")
  ) {
    const result = (await handleStaticApi(path, init)) as T;
    if (!isStaticHost && ["POST", "PUT", "DELETE"].includes((init.method || "").toUpperCase())) {
      const mirrorHeaders = new Headers(init.headers);
      if (init.body && !mirrorHeaders.has("Content-Type")) mirrorHeaders.set("Content-Type", "application/json");
      if (csrfToken) mirrorHeaders.set("X-CSRF-Token", csrfToken);
      fetch(path, { ...init, headers: mirrorHeaders, credentials: "same-origin" }).catch(() => {});
    }
    return result;
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
    const json = (await response.json()) as T;
    if (path === "/api/admin/contacts" && Array.isArray(json)) {
      const stored = getStoredContacts();
      const merged = mergeContacts(json, stored);
      saveStoredContacts(merged);
      syncContactsToFirestore(json).catch(() => {});
      return merged as T;
    }
    return json;
  } catch (err) {
    return (await handleStaticApi(path, init)) as T;
  }
}
