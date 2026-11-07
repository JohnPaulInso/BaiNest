import { db, PostRow, serializePost } from "../db/database.js";

export type PostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  cover_image?: string;
  author?: string;
  category?: string;
  tags?: string[];
  blocks?: unknown[];
  status?: "draft" | "published";
  seo_title?: string;
  seo_description?: string;
  published_at?: string | null;
};

export const contentRepository = {
  listPublished() {
    return (
      db
        .prepare(
          "SELECT * FROM posts WHERE status='published' AND datetime(COALESCE(published_at, created_at)) <= CURRENT_TIMESTAMP ORDER BY COALESCE(published_at, created_at) DESC",
        )
        .all() as PostRow[]
    ).map(serializePost);
  },
  getPublishedBySlug(slug: string) {
    const row = db
      .prepare(
        "SELECT * FROM posts WHERE slug=? AND status='published' AND datetime(COALESCE(published_at, created_at)) <= CURRENT_TIMESTAMP",
      )
      .get(slug) as PostRow | undefined;
    return row ? serializePost(row) : null;
  },
  listAll() {
    return (
      db
        .prepare("SELECT * FROM posts ORDER BY updated_at DESC")
        .all() as PostRow[]
    ).map(serializePost);
  },
  getById(id: number) {
    const row = db.prepare("SELECT * FROM posts WHERE id=?").get(id) as
      PostRow | undefined;
    return row ? serializePost(row) : null;
  },
  save(input: PostInput, id?: number) {
    const fields = {
      title: input.title.trim(),
      slug: input.slug.trim(),
      excerpt: input.excerpt || "",
      cover_image: input.cover_image || "",
      author: input.author || "BaiNest Studio",
      category: input.category || "Insights",
      tags: JSON.stringify(input.tags || []),
      blocks: JSON.stringify(input.blocks || []),
      status: input.status || "draft",
      seo_title: input.seo_title || "",
      seo_description: input.seo_description || "",
      published_at:
        input.status === "published"
          ? input.published_at || new Date().toISOString()
          : null,
    };
    if (id) {
      const result = db
        .prepare(
          `UPDATE posts SET title=@title,slug=@slug,excerpt=@excerpt,cover_image=@cover_image,author=@author,category=@category,tags=@tags,blocks=@blocks,status=@status,seo_title=@seo_title,seo_description=@seo_description,published_at=@published_at,updated_at=CURRENT_TIMESTAMP WHERE id=@id`,
        )
        .run({ ...fields, id });
      return result.changes ? this.getById(id) : null;
    }
    const result = db
      .prepare(
        `INSERT INTO posts(title,slug,excerpt,cover_image,author,category,tags,blocks,status,seo_title,seo_description,published_at) VALUES(@title,@slug,@excerpt,@cover_image,@author,@category,@tags,@blocks,@status,@seo_title,@seo_description,@published_at)`,
      )
      .run(fields);
    return this.getById(Number(result.lastInsertRowid));
  },
  remove(id: number) {
    return db.prepare("DELETE FROM posts WHERE id=?").run(id).changes > 0;
  },
};

export const domainRepository = {
  list() {
    return db.prepare("SELECT * FROM domains ORDER BY hostname").all();
  },
  save(hostname: string, blogName: string) {
    const normalized = hostname
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    db.prepare(
      "INSERT INTO domains(hostname,blog_name) VALUES(?,?) ON CONFLICT(hostname) DO UPDATE SET blog_name=excluded.blog_name, verified=0",
    ).run(normalized, blogName.trim());
    return db.prepare("SELECT * FROM domains WHERE hostname=?").get(normalized);
  },
  remove(id: number) {
    return db.prepare("DELETE FROM domains WHERE id=?").run(id).changes > 0;
  },
  resolve(host: string) {
    return db
      .prepare("SELECT blog_name FROM domains WHERE hostname=? AND verified=1")
      .get(host.toLowerCase());
  },
  resolvePreview(host: string) {
    return db
      .prepare("SELECT blog_name FROM domains WHERE hostname=?")
      .get(host.toLowerCase());
  },
};
