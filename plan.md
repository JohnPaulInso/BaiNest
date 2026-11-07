# BaiNest Studio — Implementation Plan

## Approved scope and architecture

Rebuild the supplied Blogger XML theme as a responsive, local-first content and marketing web application. The application will keep the template's BaiNest identity and improve its information architecture, navigation, accessibility, and CMS control. The app is intended to run locally during this stage; its persistent content store is a project-local SQLite file. Firebase is a later migration target only, and must not be connected in this phase.

Use a TypeScript React single-page application with clean browser routes and a TypeScript/Node Express API in the same project. Use React Router for page routes, Framer Motion for restrained route/element transitions, `better-sqlite3` for on-disk local persistence, a repository/data-access boundary around content operations, and a modular schema/migration layer. The chosen administrator authentication is **local-only username/password** as explicitly approved. Hash passwords with a modern password-hashing library; create the initial admin through a local bootstrap command rather than shipping a known default password. Use an HTTP-only application session cookie, CSRF protection for mutations, login throttling, and server-side role checks. Keep local auth isolated so a future identity provider can replace it.

All blog and site content remains in SQLite and local file storage for development. Public APIs expose only published content. Admin APIs require an authenticated admin session. Contact form submissions are validated and stored locally; no email sender is assumed. Seed the application with editable demo posts/projects and BaiNest copy so the design is populated without inventing real business contact details.

A blog may have a configured custom hostname in its stored settings. Implement hostname-to-blog resolution and an admin domain-settings interface, plus a local preview selector for development. Explain in the UI that public custom domains require DNS, TLS, and a deployment that accepts that hostname; do not imply DNS can be activated from localhost.

## Routes and page behavior

- `/` — supplied-style Home landing page, composed from hero, about preview, services, portfolio/work, recent blog insights, and contact CTA.
- `/about`, `/services`, `/portfolio`, `/blog`, `/contact` — distinct pages within the same SPA, with active navigation indication and restrained page-transition animation.
- `/blog/:slug` — individual article detail page; canonical URL contains no `.html` suffix.
- `/admin/login` and `/admin/*` — visually distinct administration experience with login, dashboard, post editor/list, settings/domain configuration, and stored contact submissions.
- Unknown routes render a designed not-found page.

The public header uses two clear tiers: BaiNest logo/wordmark in the upper identity row, followed by a sticky navigation row for HOME, ABOUT, SERVICES, PORTFOLIO, BLOG, CONTACT. On smaller screens, the navigation becomes a keyboard-accessible menu. Provide a discreet Admin login link in the public footer only; do not add it to the primary navigation. Respect `prefers-reduced-motion`; maintain focus, contrast, and semantic heading order.

## Design direction

- **Design Movement:** Contemporary editorial corporate design with restrained Swiss-grid discipline, derived from the supplied BaiNest premium digital-services theme.
- **Core Principles:** (1) confident contrast without visual noise; (2) clear, generous hierarchy; (3) useful content surfaces before decoration; (4) responsive and accessible interactions.
- **Color Philosophy:** Preserve navy `#102b46` and deep navy `#0a1e32` as trust and depth; preserve teal `#159b9b` / `#0d7f82` as an ownable signal for action and growth; retain white, mist `#f4f7fa`, ink `#172b3d`, muted slate, and subtle cool borders. Improve consistency with accessible contrast and a deliberate token system.
- **Layout Paradigm:** A spacious, asymmetric editorial landing page with an expressive hero and staggered, modular service/work/blog surfaces; separate detail and CMS layouts optimized for their jobs rather than copying one generic grid everywhere.
- **Signature Elements:** Compact geometric B mark paired with BAINEST wordmark; teal hairline/eyebrow cues; dark navy hero with layered circular/radial accents and a translucent insight panel.
- **Interaction Philosophy:** Navigation stays obvious, cards disclose meaningful action, editor controls are direct and reversible, and motion reinforces direction without delaying use.
- **Animation:** Short 180–320 ms opacity/translate transitions; subtle stagger on initial page entry; restrained card hover lift; smooth route transitions that do not obscure content; no scroll-jacking or perpetual motion; disable/reduce movement when requested by OS preference.
- **Typography System:** Strong modern sans-serif for interface and headings (system sans fallback), readable body sans-serif, compact uppercase labels with moderate tracking. Use fluid `clamp()` scales; keep body measure and line-height comfortable.
- **Brand Essence:** A clear, capable digital growth studio for businesses that want strategy and execution in one place. Personality: confident, thoughtful, contemporary.
- **Brand Voice:** Specific, useful, confident, and warm; headlines describe outcomes, not vague promises. Examples: “Make your digital presence work harder.” “Thoughtful strategy. Work built to move your business forward.”
- **Wordmark & Logo:** Recreate the template's dark rounded-square B mark as a crisp SVG/CSS monogram, paired with a tracked BAINEST wordmark and small “DIGITAL STUDIO” descriptor; preserve recognizable existing brand cues.
- **Signature Brand Color:** BaiNest teal `#159b9b`.

## Project structure

- `src/app/` — route tree, app shell, public/admin layouts, page transitions, route-level loading and not-found state.
- `src/components/` — brand/header/footer, buttons, cards, form fields, modal, toast, responsive navigation, content blocks.
- `src/features/blog/` — public blog list/detail, post schemas/types, editor, drag-and-drop block palette, previews.
- `src/features/admin/` — login, protected dashboard, posts, site/domain settings, contact inbox.
- `src/features/contact/`, `services/`, `portfolio/`, `about/` — public page sections and forms.
- `src/lib/` — API client, shared types, validation, formatting, animation helpers.
- `server/` — Express app, REST API, session/auth middleware, CSRF/rate limiting, routes, host/domain resolution.
- `server/db/` — SQLite connection, schema/migrations, seed/bootstrap scripts, repositories.
- `server/repositories/` — data interfaces and SQLite implementations, keeping persistence replaceable for later Firebase work.
- `public/` — logo and static assets, route manifest, favicon.
- `data/` — ignored local SQLite database and user-uploaded local media; never commit runtime user data or secrets.
- Root manifests and config — package scripts, TypeScript/build configuration, `.env.example`, ignore rules, README with local setup and future migration notes.

## Implementation boundaries

This stage includes the public marketing experience, clean SPA URLs, local blog CMS, admin authentication, local persistence, contact capture, local domain mapping/preview, and the detailed reusable AI prompt. It does not include Firebase credentials or integration, public deployment, registration/purchase of a domain, DNS/TLS changes, production hosting configuration, or an email delivery provider. Do not use `.html` suffixes in route paths or visible canonical links.
