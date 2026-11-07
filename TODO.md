# TODO — BaiNest Studio

## Public identity, navigation, and design

- [x] Preserve and improve the supplied Blogger design's navy/teal color palette and visual identity; include a BaiNest logo in the header; keep the landing page's design as the home page. Evidence: React site shell, SVG logo, CSS token system, and composed Home route.
- [x] Build a real, responsive landing/public website with HOME, ABOUT, SERVICES, PORTFOLIO, BLOG, and CONTACT navigation. Put the navigation in a sticky header row under the logo, with a mobile-friendly equivalent. Evidence: two-tier sticky masthead and responsive primary routes.
- [x] Treat the sections as separate pages inside one application, with an animation/transition when navigating between pages; use clean URLs without `.html` suffixes. Evidence: React Router routes and Framer Motion `PageFrame`; route manifest lists clean routes.
- [x] Keep admin access discreet and available from the public footer, not from the primary navigation. Evidence: low-contrast, keyboard-accessible Admin link in the footer; HOME, ABOUT, SERVICES, PORTFOLIO, BLOG, and CONTACT remain the only header navigation items.

## Public pages and blog reading

- [x] Implement distinct Home, About, Services, Portfolio, Blog, and Contact routes in one app. Evidence: route handlers render page-specific layouts.
- [x] On Blog, show blog entries as a listing and allow opening each entry as an individual post page. Evidence: seeded published posts, search/filter list, slug details, and private draft preview for signed-in admins.
- [x] On Contact, show contact information and a usable contact form; store submissions locally during this phase. Evidence: validated `/api/contact` stores SQLite rows and the authenticated admin inbox lists them.

## Admin access and publishing backend

- [x] Provide a separate admin page/layout, with a protected local-only username/password login and a Blogger-inspired admin layout. Create no public admin writes and do not ship a default shared password. Evidence: `/admin/login`, hashed local admin bootstrap, signed SQLite sessions, CSRF-protected writes, login throttling, and admin-only routes.
- [x] Provide an admin backend where the site owner can create and manage blog posts similar to Blogger. Store content in a local database for now; structure persistence so Firebase can be connected later without replacing the site's design. Do not connect Firebase in this phase. Evidence: SQLite migrations/seed, REST APIs, and repository boundary; no Firebase SDK or managed database.
- [x] Give the owner broad control over post content/layout, including a drag-and-drop content-block editing experience and support for reordering blocks. Evidence: post metadata/SEO and publication-date controls plus sortable heading, paragraph, quote, list, image/caption, divider, CTA, and two-column blocks.

## Custom domains, local operation, and handoff

- [x] Support assigning custom domain names to individual blogs and resolving the selected blog from its configured host. Provide a local-development preview for domain mappings; clearly identify that public DNS/TLS activation requires later domain/hosting setup. Evidence: authenticated domain-settings screen, hostname-to-blog resolver, local-preview link/banner, and explicit DNS/TLS notice. Public activation remains outside localhost scope.
- [x] Run the app locally with persistent project-local SQLite storage for this stage; no managed database and no Firebase connection. Evidence: `better-sqlite3`, ignored `data/bainenest.sqlite`, successful `/api/health` response identifying `local-sqlite`.
- [x] Produce a detailed reusable AI build prompt reflecting the attached design, routes, animations, admin/login, local-first data model, future Firebase connection, custom domains, and editor. Evidence: `AI_BUILD_PROMPT.md`.
