# BaiNest Studio

A local-first marketing site and blog CMS based on the supplied Blogger design. This phase uses a project-local SQLite file; it does not connect Firebase or a managed database.

This is not one standalone `.html` file: the React/Vite frontend builds to browser HTML, CSS, and JavaScript, while the Node/Express API provides protected admin login and SQLite persistence. A static HTML file alone cannot safely provide those backend features.

## Requirements

Node.js 22 or newer and pnpm 11. Install project dependencies with `pnpm install`, then copy `.env.example` to `.env` and set `APP_SESSION_SECRET` to a long random local secret. The default SQLite file is `data/bainenest.sqlite`; it is ignored by Git.

Create your private local administrator using `pnpm admin:create`. The command asks for a username and a password of at least 12 characters. Do not commit the database or share the admin credentials. Start the app with `pnpm dev` and open `http://localhost:3000`. Public pages are at `/`, `/about`, `/services`, `/portfolio`, `/blog`, and `/contact`; the separate CMS is at `/admin`, reached through the discreet Admin link in the public footer or directly by URL.

`pnpm db:seed` is optional on first run: the database module automatically seeds a small set of editable sample articles when the database is empty, and this command can be used to initialize/check the local database again. Change or replace the illustrative portfolio entries, sample posts, brand copy, and contact details before a real launch.

## Admin security

Passwords are hashed with Node's scrypt. Admin routes enforce server-side sessions, login throttling, CSRF tokens on write operations, and validation. Local HTTP uses a same-site session cookie. If using the HTTPS embedded Preview, set `COOKIE_SECURE=true` before running so the cookie is `Secure; SameSite=None`; this local account remains a local development account and should not be used as a public production identity.

## Domain mappings

In Admin → Domains & settings, add a hostname-to-blog mapping and use local preview while developing. A live custom domain requires DNS records, TLS, and a hosting configuration that routes the hostname to this app; the localhost app does not perform those steps.

## Future Firebase connection

The frontend calls a small REST API; server-side content operations are grouped in `server/repositories/content.ts` and the current adapter is SQLite. A future Firebase/Firestore adapter can implement that boundary while keeping the public theme, routes, editor, and content block format intact. No Firebase SDK, credentials, or cloud database is included in the current runtime.
