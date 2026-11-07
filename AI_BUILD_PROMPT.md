# Master AI Build Prompt — BaiNest Studio

Act as a senior product designer and full-stack engineer. Build a complete, polished, responsive marketing website and blog CMS based on the supplied Blogger template. This must be a working application, not a static mockup.

## Source design and brand

Use the supplied `design.html` as the design source. Migrate its valid visual concepts into ordinary application code rather than keeping Blogger XML tags or Blogger-only widgets. Preserve and improve the BaiNest Digital Marketing Services identity: deep navy (`#102b46`), darker navy (`#0a1e32`), teal (`#159b9b`, darker teal `#0d7f82`), white, soft cool mist (`#f4f7fa`), slate copy, subtle borders, generous spacing, clean corporate typography, and premium but approachable styling. Keep the dark navy hero, teal accents, rounded service cards, portfolio surfaces, blog cards, strong CTA band, and dark footer, refining contrast, responsive behavior, and consistency. Include a recognizable logo/wordmark in the header; use a compact geometric B mark with the BAINEST name and a small “DIGITAL STUDIO” descriptor. Do not replace the brand colors with an unrelated palette.

## Public site and navigation

Create these separate pages inside one application: HOME, ABOUT, SERVICES, PORTFOLIO, BLOG, CONTACT. Use clean paths with no `.html` suffix: `/`, `/about`, `/services`, `/portfolio`, `/blog`, `/contact`. The logo/identity area must be above the navigation; make the navigation row below it sticky while scrolling. Include a responsive mobile menu, active-page state, keyboard accessibility, semantic headings, and useful page titles/meta descriptions. Keep the Admin login out of the primary navigation and provide a discreet Admin link in the public footer only.

The Home page is the primary landing page and should retain the source template's character. Build a compelling hero, concise brand introduction, services overview, featured portfolio work, recent blog insights, and a prominent contact CTA. Each other navigation item opens its own page—not merely an anchor on Home. The Blog listing must display individual posts, with search/filter or category browsing as appropriate, and each entry opens its own detail page at `/blog/:slug`. Contact must display contact information and a working form that records messages locally.

## Motion and interaction

Animate transitions between pages with subtle opacity/position motion, and use restrained reveal and hover effects for content cards. Motion should support orientation and hierarchy, not distract or delay reading. Respect `prefers-reduced-motion`; do not use scroll-jacking or perpetual motion. Keep interactions responsive and accessible.

## Separate admin CMS

Create a separate, clearly distinct admin area under `/admin`, including `/admin/login`. Use a Blogger-inspired management layout (compact left navigation, clear post list/statuses, obvious “new post” action) while giving the administrator more control than a basic Blogger editor. Implement real protected login with local-only username/password authentication, secure password hashing, server-side authorization, login throttling, CSRF protection on state-changing requests, and an explicit local admin-bootstrap command. Do not ship a known default password or silently allow unauthenticated admin access.

The admin must allow an authenticated owner to create, edit, save drafts, publish/unpublish, delete, categorize, and tag posts; manage title, slug, excerpt, cover image, author, status, SEO title/description, and publication date; preview before publishing; and author the post body with reusable content blocks. Include a drag-and-drop editor to add and reorder blocks such as heading, paragraph, image/caption, quote, list, divider, CTA, and two-column content. Make editing controls clear and provide confirmations for destructive actions. Public views must never expose drafts or admin endpoints.

Include admin screens for site/domain settings and a local contact-message inbox. Use demo content only for presentation; do not invent real email addresses, phone numbers, client names, or claims.

## Local-first backend and Firebase later

Run the application locally during this phase. Persist blogs, domain mappings, contact submissions, and settings in a project-local SQLite database. Use a clean API and repository/data-access boundary so the SQLite adapter can later be replaced or supplemented by Firebase/Firestore without rewriting the public design, route structure, or editor. Do not connect to Firebase now, do not require Firebase credentials, and do not use a managed/cloud database for this phase. Add clear local setup instructions, migrations/seeding, `.env.example`, and appropriate ignore rules so database contents, secrets, and uploaded user data are not committed.

## Blog domains

Allow each blog/site to store a custom domain, and implement host-to-blog resolution plus a local domain-mapping preview/switcher. Show the custom-domain status and configuration instructions in admin. Be clear that a live public custom domain still requires later DNS, TLS, and hosting configuration; do not pretend this can be provisioned by a localhost-only app.

## Engineering quality

Use maintainable, typed, modular code; validate all API inputs; handle empty, loading, error, and not-found states; make public content work after refresh/deep linking; and keep backend authorization on the server. Separate public and admin layouts. Use relative browser-facing paths and route patterns without `.html`. Document how to install dependencies, initialize the local database/admin, seed sample data, and run the app on localhost. Keep future Firebase integration behind the persistence boundary and out of the current runtime path.

## Deliverables

Deliver the working application, local database/API and admin CMS, the detailed editor and domain-mapping workflow described above, and concise local-run documentation. Preserve the BaiNest design rather than genericizing it. Do not deploy publicly or connect Firebase as part of this phase.
