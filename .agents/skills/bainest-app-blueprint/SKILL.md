---
name: bainest-app-blueprint
description: Complete reusable Design Language, Full-Stack Architecture, High-Resolution Image Uploader (Cloudinary, ImgBB, and Firestore Split-Doc), Capacitor Android/iOS APK Converter, and Local-First Firestore + IndexedDB Engineering Rules for building new web and mobile applications.
---

# BaiNest Universal App Design Language & Engineering Blueprint

Use this skill whenever creating a new application, porting the BaiNest aesthetic and architecture to another project, converting a web app into a native Android/iOS APK via Capacitor, or auditing an existing app against the mandatory database, UI/UX, modal, and quota-protection standards.

---

## PART 1: CORE LANGUAGES, FRAMEWORKS & TECH STACK

### 1. Frontend Stack
- **Primary Languages:** TypeScript (`.ts`, `.tsx`), HTML5, Modern CSS3 (`styles.css` + `base.css` with CSS Custom Properties).
- **UI Framework:** React 19 (`react`, `react-dom`) + React Router DOM v7 (`react-router-dom`) for SPA routing and persistent view state.
- **Icons:** `lucide-react` (or FontAwesome / Material Symbols / inline SVGs). **Unicode emojis are strictly prohibited.**
- **Motion & Drag-and-Drop:** `framer-motion` for layout/modal physics and `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` for reorderable blocks, cards, and lists.
- **Build Tooling:** Vite 7 (`@vitejs/plugin-react`) + TypeScript (`tsc --noEmit`).

### 2. Backend, Database & Local-First Storage Stack
- **Cloud Database:** Firebase v12+ (`firebase/app`, `firebase/firestore`, `firebase/auth`, `firebase/storage`).
- **Primary Client Storage:** **IndexedDB** for full datasets, historical logs, offline queues, and automated/manual backup snapshots (bypasses the 5 MB browser `localStorage` limit and prevents `QuotaExceededError`).
- **Fast Cache Mirror:** **`localStorage`** strictly for lightweight UI state (active route/tab, theme, auth flag, and a capped recent-items buffer) + **In-Memory Cache (`memCache`)** hydrated from IndexedDB before initial render (`await DB.ready`).
- **Optional Local Server Mode:** Node.js + Express 5 + `better-sqlite3` + `zod` schema validation + `tsx` runner.

### 3. Native Mobile Packaging Stack
- **Wrapper:** Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`) converting the Vite production `dist/` (or `www/`) bundle into an installable Android APK / AAB and iOS project.

---

## PART 2: VISUAL DESIGN LANGUAGE & TOKENS

### 1. Aesthetic Direction: "Editorial Precision & Modern Studio"
- **Public / Consumer Views:** High-contrast editorial clarity pairing deep navy authority (`--navy`), vibrant teal accents (`--teal`), warm paper whites (`--paper`), and soft mist surfaces (`--mist`). Generous whitespace, crisp `1px` borders (`--line`), subtle elevated shadows, and a pairing of geometric sans-serif UI typography (`DM Sans`) with expressive serif display accents (`Instrument Serif`).
- **Studio / Admin Views:** Clean SaaS workspace with a dark navy collapsible sidebar, sticky glassmorphic top utility bar, metric pill badges, interactive SVG line/bar/donut charts, and split-pane live editors.

### 2. Global CSS Variables (`:root` Design Tokens)
Every app must define all colors, radii, shadows, and typography in `:root` to ensure instant theming and light/dark mode support:

```css
:root {
  /* Brand & Surface Palette */
  --navy: #102b46;
  --navy-deep: #0a1e32;
  --teal: #159b9b;
  --teal-dark: #0d7f82;
  --ink: #172b3d;
  --muted: #667789;
  --paper: #ffffff;
  --mist: #f4f7fa;
  --line: #e3eaf0;

  /* Semantic Status Tokens */
  --success: #10b981;
  --success-bg: #ecfdf5;
  --warning: #f59e0b;
  --warning-bg: #fffbeb;
  --danger: #ef4444;
  --danger-bg: #fef2f2;
  --info: #3b82f6;
  --info-bg: #eff6ff;

  /* Layout, Geometry & Elevation */
  --max: 1200px;
  --radius-sm: 10px;
  --radius: 18px;
  --radius-lg: 24px;
  --radius-pill: 999px;
  --shadow-sm: 0 4px 14px rgba(16, 43, 70, 0.05);
  --shadow: 0 18px 50px rgba(16, 43, 70, 0.09);
  --shadow-lg: 0 24px 64px rgba(10, 30, 50, 0.16);

  /* Typography */
  --font-sans: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: "Instrument Serif", Georgia, serif;
}

[data-theme="dark"] {
  --paper: #0b1521;
  --mist: #112031;
  --ink: #f1f5f9;
  --muted: #94a3b8;
  --line: #1e334a;
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
}
```

### 3. Typography, Date & Text Truncation Rules
- **Base Body:** `15px`, `line-height: 1.7`, `-webkit-font-smoothing: antialiased`.
- **Eyebrow Labels:** Uppercase pill or tracked label (`font-size: 11px–12px`, `letter-spacing: 0.14em`, `font-weight: 700`, `color: var(--teal)`).
- **Mandatory Date Format:** Always format dates across the entire application as `Jan 1, 2020` (`toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })`).
- **Long Text Overflow Protection:** Every single-line or multi-line title, slug, filename, or card label that can overflow must apply either ellipsis truncation (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;`) or a multi-line clamp / CSS mask fade gradient (`-webkit-line-clamp`).

---

## PART 3: HIGH-RESOLUTION IMAGE UPLOADER & CLOUD HOSTING ARCHITECTURE

### 1. Why Hybrid Cloud Hosting + Smart Compression Matters
- Firestore's free Spark tier provides **1 GiB of total storage** and a hard **1 MiB (1,048,576 bytes) limit per document**.
- Aggressive downscaling (e.g., `<800px` at `<0.65` quality) destroys fine text and infographic details.
- Therefore, every app using this design language must use **High-Resolution Client Compression (`1800px` maxDimension, `0.92` quality, `ctx.imageSmoothingQuality = "high"`)** paired with an **Interactive Pan/Zoom Cropper Modal (`1600px` output)** and one of the three storage backends below.

### 2. Choosing Between Cloudinary, ImgBB, and Firestore Split-Doc

| Storage Provider | Free Tier Capacity | Best App Types | How It Works |
| :--- | :--- | :--- | :--- |
| **Cloudinary** *(Recommended for Production & E-Commerce)* | **25 GB Free** (storage + bandwidth + CDN transformations) | E-commerce catalogs, real-estate apps, multi-author CMS, social feeds, POS/inventory apps with hundreds of product photos. | Upload via unsigned preset to `https://api.cloudinary.com/v1_1/<CLOUD_NAME>/image/upload`. Returns a fast global CDN `secure_url`. Supports automatic WebP/AVIF delivery (`f_auto,q_auto`). Firestore stores only the ~80-byte URL string. |
| **ImgBB** *(Recommended for Lightweight Apps, Blogs & Tools)* | **Unlimited Free Image Hosting** (up to 32 MB per image via free API key) | Agency portfolios, blogs, community boards, internal tools, and quick prototypes. | Upload `FormData` (`image` file/base64) to `https://api.imgbb.com/1/upload?key=<IMGBB_API_KEY>`. Returns `data.data.url` and `data.data.display_url`. Firestore stores only the short URL string. |
| **Firestore `post_media` Split-Doc** *(Zero-Account Fallback)* | **1 GB Free** (inside existing Firebase Spark project) | Offline-first utilities or single-tenant apps when no external image API key is configured. | Keeps images at `1800px` (`0.92` quality). If a document exceeds `850 KB`, extra images are automatically stored in separate `post_media/{docId}_{blockId}` Firestore documents (or chunked) and hydrated via an in-memory `mediaCache`. |

### 3. Unified Image Uploader Pattern (Cloudinary -> ImgBB -> Firestore Fallback)
1. **Step 1 (Crop & High-Res Optimize):** Pass selected `File` through `ImageCropperModal` (`1600px–1800px`, `quality: 0.92`, `ctx.imageSmoothingQuality = "high"`).
2. **Step 2 (Cloud Upload):**
   - If `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are set -> `POST` `FormData` to Cloudinary and return `json.secure_url`.
   - Else if `VITE_IMGBB_API_KEY` is set -> `POST` `FormData` to ImgBB and return `json.data.display_url`.
   - Else -> return the high-resolution `1800px` `0.92` quality `dataUrl` and let the Firestore `post_media` document splitter store each large image in its own `post_media` document so no single document ever exceeds 1 MB.

---

## PART 4: CAPACITOR WEB-TO-APK CONVERTER & ANDROID PACKAGING

When converting any web app built with this design language into an Android APK or iOS app:

### 1. Required Capacitor Configuration (`capacitor.config.ts`)
Keep Google Sign-In and Firebase OAuth inside the WebView by configuring `androidScheme: "https"` and `allowNavigation`:

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bainest.app",
  appName: "BaiNest",
  webDir: "dist",
  server: {
    androidScheme: "https",
    allowNavigation: [
      "accounts.google.com",
      "*.googleapis.com",
      "*.firebaseapp.com",
      "*.gstatic.com",
    ],
  },
};

export default config;
```

### 2. Samsung PackageInstaller & Android Native Compatibility
To ensure Samsung PackageInstaller and all Android devices scan and install the APK cleanly without "App not installed / package appears to be invalid" errors:
1. In `android/app/src/main/AndroidManifest.xml`, set `android:extractNativeLibs="true"` on the `<application>` tag:
   ```xml
   <application
       android:allowBackup="true"
       android:extractNativeLibs="true"
       android:icon="@mipmap/ic_launcher"
       android:label="@string/app_name"
       android:supportsRtl="true"
       android:theme="@style/AppTheme">
   ```
2. In `android/app/build.gradle`, enable legacy JNI packaging:
   ```groovy
   android {
       packagingOptions {
           jniLibs {
               useLegacyPackaging = true
           }
       }
   }
   ```
3. Build & Sync Pipeline:
   - `npm run build`
   - `npx cap sync android`
   - `cd android && ./gradlew assembleDebug` (or `assembleRelease`)

---

## PART 5: MANDATORY ENGINEERING RULES (ALL NEW APPS)

### SECTION 1: DATABASE, STATE & DATA HYGIENE

1. **Real-Time Synchronization:** Always implement Firebase Firestore `onSnapshot` listeners for real-time data sync across all connected devices.
2. **Absolute Database Persistence:** Every new feature, setting, preference, or state change created must be immediately connected and saved to the Firestore database. No critical state may exist purely in temporary memory.
3. **Listener Lifecycle Management:** Every `onSnapshot` listener must be assigned to a reference variable and explicitly unsubscribed whenever a page, view, modal, or component is closed or unmounted to prevent memory leaks and unnecessary API billing.
4. **Data Portability (Backup & Restore):** The system must include a built-in Backup & Restore module with dedicated "Import Data" and "Export Data" actions (supporting both JSON and CSV formatting, including a combined "Backup All (JSON + CSV)" action) for complete user data control.
5. **Offline Persistence:** Firestore offline persistence (`enableIndexedDbPersistence`) must be initialized at app launch so cached data renders instantly without active internet connectivity.
6. **Data Fallbacks & Hygiene:** All dynamic data rendered in the UI must include safe fallbacks (e.g., `data.title || "Untitled"`) to prevent `undefined` outputs or visual breakage.
7. **Capacitor Auth Navigation:** Configure `allowNavigation` and `https` `androidScheme` in Capacitor config to keep Google sign-in inside the app.
8. **Samsung APK Install Compatibility:** Enable `extractNativeLibs="true"` and legacy JNI packaging (`useLegacyPackaging = true`) to allow Samsung PackageInstaller to scan and install the APK cleanly.
9. **Auth Transition & Skeleton Flow:** After logging in with Google there must be a quick spinner followed immediately by the entire homepage rendered with skeleton loaders; tapping logout must display a dedicated logging-out modal with a spinner.
10. **Google Sign-In Button Recovery:** The "Sign in with Google" button must be disabled immediately after tapping, but if One Tap Login or the OAuth popup is closed or cancelled, the button must re-enable and return to its normal state immediately so the user can retry.
11. **Exact-Position Shimmering Skeleton Loaders:** Skeleton loaders must have shimmering animations and sit in the exact layout position of the target feature across all responsive breakpoints—replacing the element in-place for a few seconds without layout shift.
12. **No Repeated Onboarding on Reload:** Whenever the user reloads the app while already authenticated, never show the onboarding/welcome screen again.
13. **Custom In-App Pull-to-Refresh:** Disable native browser reload overscroll and provide an in-app reload/refresh mechanism with a spinner matching the app's theme color.
14. **Gentle Shimmer Gradient:** Skeleton loader shimmer gradients must use subtle, low-opacity light stops for a soft, gentle loading effect across all bars.
15. **LCP & Asset Optimization:** Apply CDN `preconnect` tags, make web font loading non-render-blocking (`display=swap` / preload), optimize the initial render trigger, and synchronize build assets (`dist/` and `docs/` / `www/`) to maximize Largest Contentful Paint (LCP) performance.
16. **4-Pillar Local-First Read Optimization:**
    - **Smart Initial Sync:** Use the local IndexedDB/cached copy on app open instead of scanning the cloud every launch (saves 99% of reads).
    - **Timestamp Comparison:** Compare `updatedAt` / `syncBaseline` timestamps and only download documents newer than the local copy (saves 80% of reads).
    - **Real-Time Listener Deduplication:** Skip redundant initial snapshots when already hydrated locally, and deep-compare incoming data before triggering state updates or writes (saves 95% of reads).
    - **Local-First Architecture:** Save everything to the local device (IndexedDB + memory cache) immediately; treat the cloud strictly as background sync/backup for other devices so the app works offline automatically.

---

### SECTION 2: UI/UX & DESIGN SYSTEM CONSTRAINTS

1. **No Alerts Policy:** Native browser dialogs (`alert()`, `prompt()`, `confirm()`) are strictly forbidden. All user prompts, confirmations, and alerts must use custom-designed Modal components.
2. **Custom Dropdowns Only:** Native HTML `<select>` elements are prohibited. All dropdown menus must be custom-built using CSS and JavaScript/React for full visual control and cross-device consistency.
3. **Icons Over Emojis:** Never use unicode emojis in UI elements or text layouts. Always use vector icon libraries (e.g., Lucide, FontAwesome, Material Symbols, or inline SVGs) to ensure uniform rendering across devices.
4. **Unified Toast System:** Non-blocking alerts (success messages, copy actions, network notifications, exit warnings) must route through a single global Toast system rendered above the bottom navigation bar.
5. **Design Tokens & CSS Variables:** All colors, elevation shadows, border radii, and font sizes must be defined as global CSS variables (`:root { --primary: ...; }`) to support seamless light/dark mode changes and uniform spacing.
6. **Standardized Date Format:** Always use `Jan 1, 2020` format for dates across all views, tables, cards, and logs.
7. **Persistent Navigation State:** Save the current route/tab/view in `localStorage` so reloading the page automatically restores the user to the exact tab or page they last opened.
8. **Two-Step Back-to-Home & Exit Flow:** When on any page other than the homepage, pressing the back button (or universal hardware back button) must navigate to the homepage first; pressing back again on the homepage must trigger a toast saying `"Press back again to exit."`, and pressing back a second time within the toast window closes/minimizes the app.
9. **Google Popup Cancel Recovery:** Clicking "Sign in with Google" and closing the popup without completing sign-in must immediately reset the button's loading state back to normal.
10. **Sticky Hover Prevention on Touch Devices:** Wrap all CSS `:hover` effects inside `@media (hover: hover) { ... }` and use `:active` states for touch feedback so hover styles never stick on mobile screens.
11. **Text Overflow Ellipsis & Gradient:** All elements with potentially long text must apply ellipsis truncation (`text-overflow: ellipsis`) or a fade gradient so text never overlaps adjacent UI.
12. **Eliminate 300ms Mobile Tap Delay:** Configure a responsive `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` tag in `index.html` and apply `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent` to all interactive elements.
13. **Prevent Viewport Rubber-Banding:** Apply `overscroll-behavior: none` to `html`, `body`, and root app containers in base CSS to eliminate elastic viewport bounce.
14. **Cloud Overwrite Protection on Fresh Sessions:** Enable immediate auto-pull on launch before allowing any push so new tabs, cleared browsers, and incognito sessions fetch existing cloud records instead of overwriting them with empty state.
15. **Optimistic UI Updates:** All save, publish, and folder/category assignment buttons must apply optimistic local state updates immediately, close any open modal/overlay right away, display a confirmation toast, and run cloud database synchronization asynchronously in the background.
16. **Hierarchical Back-Button Interception:** Always intercept system and universal hardware back actions to dismiss open modals, lightboxes, dropdowns, drawers, sidebars, and subviews in LIFO order before navigating back or exiting the app.

---

### SECTION 3: MODAL ARCHITECTURE & PHYSICS

1. **Modal Animations:** Every modal must feature smooth, subtle CSS fade-in and fade-out transitions (`opacity` paired with a subtle `transform: scale(0.96)` -> `scale(1)`).
2. **Strict Scroll-Locking:** Whenever any modal, drawer, cropper, or overlay is open, background scrolling on `<body>` and main containers must be locked immediately (e.g., via `.overflow-hidden { overflow: hidden !important; }`) and restored only when all overlays are closed.
3. **Dismissal Hierarchy:** Tapping the modal backdrop or pressing the hardware/Escape back button must smoothly trigger the modal's close/fade-out state.

---

### SECTION 4: MOBILE & CAPACITOR HARDWARE INTEGRATION

1. **Safe Area & Hardware Insets:** Top headers, sticky toolbars, floating action buttons, and bottom navigation bars must respect mobile hardware bounds (notches, camera punch-holes, and Android gesture/3-button bars):
   ```css
   padding-top: max(12px, env(safe-area-inset-top));
   padding-bottom: max(16px, env(safe-area-inset-bottom));
   padding-left: env(safe-area-inset-left);
   padding-right: env(safe-area-inset-right);
   ```

---

## PART 6: STORAGE QUOTA, INDEXEDDB HYDRATION & FIRESTORE SYNC SAFEGUARDS

Every app with growing datasets (posts, media, products, sales logs, analytics, or backups) must enforce these architectural safeguards to prevent both **Browser `QuotaExceededError` (5 MB `localStorage` limit)** and **Firestore Read Quota Exhaustion (50,000 free daily reads)**:

1. **IndexedDB for Large Data, `localStorage` for Small Metadata Only:**
   - Browser `localStorage` is capped at ~5 MB per domain. Never store full historical logs, unchunked base64 galleries, or backup snapshots in `localStorage`.
   - Store all full collections and backup snapshots in **IndexedDB**. Keep `localStorage` strictly as a lightweight mirror (e.g., capped to the 150 most recent items without large media payloads).
2. **Await IndexedDB Hydration Before Boot (`await DB.ready`):**
   - Never allow early synchronous renders or startup repair scripts to read the 150-item `localStorage` fallback while `idbLoadAll()` is still running asynchronously and then write that truncated 150-item slice back into IndexedDB.
   - Export a `DB.ready` Promise and `await DB.ready` in `App.init()` before running migrations, auth checks, or sync routines.
3. **Cross-Tab Sync Hydration from IndexedDB (`IDB_ONLY_KEYS`):**
   - When a cross-tab `storage` or custom sync event fires, hydrate large collections directly from IndexedDB (`await idbGet(key)`) rather than evicting `memCache` and falling back to truncated `localStorage`.
4. **Prevent Recursive `onSnapshot` <-> `pushSnapshot` Ping-Pong Loops:**
   - Never let `onSnapshot` remote updates dispatch a dirty-state event (`mm:dirty`) that immediately calls `pushSnapshot(true)` bypassing concurrency locks.
   - Guard all sync pushes with a debounced scheduler, an `isSyncing` mutex lock, and a source flag (`isApplyingRemoteSnapshot`) so incoming cloud updates never re-trigger an outgoing push.
5. **Quota Circuit Breaker & Elimination of Full Collection Scans:**
   - Never run redundant fallback `getDocs(collection(...))` scans across thousands of individual documents on every sync cycle.
   - Catch `resource-exhausted` / quota errors in `pushSnapshot()`, `pullSnapshot()`, and `startRealtimeListener()`, set the sync status indicator to `Quota reached (Local)`, and trip a circuit breaker (`if (meta.status === "quota") return;`) to halt reconnect polling loops.
6. **No Premature Historical Cutoff & Collision-Free Deduplication:**
   - Never silently discard historical records older than 30 days during cloud sync pushes.
   - Key deduplication and 3-way merges by a unique composite identifier (`id + "_" + timestamp` or `receiptNo + "_" + tsSec`), never by `timestamp + total + itemCount` alone (which collides on batch or same-second records).
7. **Backup & Restore Integrity (JSON + CSV):**
   - Retain complete snapshot payloads inside IndexedDB backup records (`DB.saveBackup(record)`) with automatic fallback to live snapshot data.
   - Provide a one-click `exportBothJSONandCSV(snapshot)` utility and an animated restoration modal for `importFullBackupFile()` that performs a clean overwrite (`forceOverwrite = true`), aligns `syncBaseline` immediately to prevent cloud-diff storms, and resets `<input type="file">` (`e.target.value = ""`) after every selection so re-selecting the same file always fires `onChange`.
