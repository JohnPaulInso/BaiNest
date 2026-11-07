import "dotenv/config";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const configuredPath = process.env.DATABASE_PATH || "./data/bainenest.sqlite";
const dbPath = path.resolve(configuredPath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  csrf_token TEXT NOT NULL,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'BaiNest Studio',
  category TEXT NOT NULL DEFAULT 'Insights',
  tags TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hostname TEXT NOT NULL UNIQUE,
  blog_name TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_status_updated ON posts(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS contacts_created ON contacts(created_at DESC);
`);

const seedCount = db.prepare("SELECT COUNT(*) AS count FROM posts").get() as {
  count: number;
};
if (seedCount.count === 0) {
  const insert = db.prepare(`INSERT INTO posts
    (title, slug, excerpt, cover_image, author, category, tags, blocks, status, seo_title, seo_description, published_at)
    VALUES (@title,@slug,@excerpt,@cover_image,@author,@category,@tags,@blocks,'published',@seo_title,@seo_description,@published_at)`);
  const samples = [
    {
      title: "The clarity advantage: making your brand easier to choose",
      slug: "clarity-advantage-brand",
      excerpt:
        "A practical look at how sharper positioning turns a good business into the obvious choice.",
      category: "Brand strategy",
      tags: ["Brand", "Strategy"],
      cover_image: "",
      author: "BaiNest Studio",
      blocks: [
        {
          type: "paragraph",
          text: "Strong brands do not simply say more. They make the right things easier to understand, remember, and act on.",
        },
        { type: "heading", text: "Clarity is a growth tool" },
        {
          type: "paragraph",
          text: "When your promise is consistent across your website, content, and customer experience, people spend less time guessing and more time moving forward.",
        },
        {
          type: "quote",
          text: "The best positioning is a clear invitation to the right people.",
        },
        {
          type: "paragraph",
          text: "Start by naming the problem you solve, the people you solve it for, and the meaningful difference in how you work.",
        },
      ],
      seo_title: "",
      seo_description: "",
      published_at: "2026-01-14T09:00:00.000Z",
    },
    {
      title: "A better brief makes better creative",
      slug: "better-brief-better-creative",
      excerpt:
        "Four useful questions to bring your next campaign, website, or launch into focus.",
      category: "Creative",
      tags: ["Creative", "Process"],
      cover_image: "",
      author: "BaiNest Studio",
      blocks: [
        {
          type: "paragraph",
          text: "Great creative work starts before the first sketch. A thoughtful brief gives a team the context to make confident choices.",
        },
        { type: "heading", text: "Begin with the outcome" },
        {
          type: "paragraph",
          text: "Be clear about what should change for your audience after they see or use the work. Then share the constraints, proof points, and tone that will make the idea feel true.",
        },
        {
          type: "list",
          items: [
            "Who is this for?",
            "What do they need to understand or do?",
            "What makes this offer distinct?",
            "How will we know the work helped?",
          ],
        },
      ],
      seo_title: "",
      seo_description: "",
      published_at: "2026-01-08T09:00:00.000Z",
    },
    {
      title: "Small website improvements with outsized impact",
      slug: "small-site-improvements",
      excerpt:
        "A focused checklist for making your digital storefront more useful, credible, and clear.",
      category: "Digital",
      tags: ["Website", "Growth"],
      cover_image: "",
      author: "BaiNest Studio",
      blocks: [
        {
          type: "paragraph",
          text: "Your website is a living part of your business. Small improvements to clarity and navigation can remove friction at the exact moment a visitor is deciding what to do next.",
        },
        { type: "heading", text: "Make the next step obvious" },
        {
          type: "paragraph",
          text: "Use one primary action, describe what happens after a click, and keep important information close to the decision it supports.",
        },
        {
          type: "cta",
          text: "Ready to improve your site?",
          label: "Talk with BaiNest",
          href: "/contact",
        },
      ],
      seo_title: "",
      seo_description: "",
      published_at: "2026-01-02T09:00:00.000Z",
    },
  ];
  const insertMany = db.transaction((posts: typeof samples) =>
    posts.forEach((post) =>
      insert.run({
        ...post,
        tags: JSON.stringify(post.tags),
        blocks: JSON.stringify(post.blocks),
      }),
    ),
  );
  insertMany(samples);
}

export type PostRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  author: string;
  category: string;
  tags: string;
  blocks: string;
  status: "draft" | "published";
  seo_title: string;
  seo_description: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
export function serializePost(row: PostRow) {
  return {
    ...row,
    tags: safeJson<string[]>(row.tags, []),
    blocks: safeJson<ContentBlock[]>(row.blocks, []),
  };
}
export type ContentBlock = {
  id?: string;
  type: string;
  text?: string;
  items?: string[];
  label?: string;
  href?: string;
  src?: string;
  alt?: string;
  caption?: string;
};
export function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
