# GameVerse — Production Readiness Audit

Scope: `gameverse-next` (frontend) and `gameverse` (API + batch).

**Final verdict (2026-10-11, Phase 3): READY WITH WARNINGS.** The code is ready; deployment must first complete the environment checklist at the end of this report. See "Phase 3 — Final verification". The sections below are the original Phase 1 findings; their status is in "Phase 2 progress".


**Audit date:** 2026-10-11.
**Frontend:** branch `modification`, Next 14.2.0, React 18.2, Apollo 3.8.3, GSAP 3.15.
**Backend:** NestJS 10, Apollo Server 4, Mongoose.

**How findings are marked:**
- **[C] CONFIRMED** — seen in code or reproduced.
- **[S] SUSPECTED** — depends on runtime behaviour or configuration that was not observed.

## 0. Automated checks that ran

| Check | Command | Result |
|---|---|---|
| FE typecheck | `yarn tsc --noEmit` | ✅ pass |
| BE typecheck, API app | `tsc -p apps/gameverse-api/tsconfig.app.json --noEmit` | ✅ pass |
| BE typecheck, batch app | `tsc -p apps/gameverse-batch/tsconfig.app.json --noEmit` | ✅ pass |
| BE typecheck, repo incl. specs | `tsc -p tsconfig.json --noEmit` | ❌ 4 errors, all in `member.service.spec.ts` (stale test typings) |
| BE unit tests | `jest` | ✅ 20 suites, 104 tests passed |
| BE lint | `eslint apps/**/*.ts` (without `--fix`) | ❌ 576 problems: 110 prettier, 26 unused vars, ~110 `no-unsafe-*`, 310 warnings |
| BE dependency audit | `npm audit --omit=dev` | ❌ 34 vulns: 1 critical, 17 high, 16 moderate |
| FE dependency audit | `yarn audit --groups dependencies` | ❌ 741 advisories: 39 critical, 361 high. Most come from `react-scripts` (CRA) sitting in prod deps, plus `next@14.2.0` |
| API probes (read-only curl) | — | CORS reflects any origin with credentials; `X-Powered-By: Express`; introspection enabled; Playground served; raw BSON errors returned to clients |

## 1. CRITICAL — deployment blockers

| # | Issue | Evidence | Impact | Fix |
|---|---|---|---|---|
| C1 | **Anyone can sign up as ADMIN** [C] | `gameverse/apps/gameverse-api/src/libs/dto/member/member.input.ts:23-25` (`memberType` optional field); `member.service.ts:48` `memberModel.create(input)` | Full admin takeover with one public mutation | Server accepts only `USER` or `AGENT` (the join form sends one of these); `ADMIN` is rejected. Audit existing ADMIN accounts |
| C2 | **Any logged-in user can make themselves ADMIN or change their own status** [C] | `member.update.ts:12-18` exposes `memberType` and `memberStatus`; `member.service.ts:81` passes the whole input to `findOneAndUpdate` | Privilege escalation. `verifyToken` reloads the role from the DB, so it works immediately | Strip `memberType`, `memberStatus` and `_id` from the self-update path (separate DTO); keep them only in `updateMemberByAdmin` |
| C3 | **Password updates are stored in plain text** [C] | `member.update.ts:29-32`; `member.service.ts:79-86` and `:218-224` never call `hashPassword` | Plain-text password in the DB, and the account locks out (bcrypt compare fails) | Hash in both update paths |
| C4 | **Uploads can be HTML/SVG, giving stored XSS on the API origin** [C] | `libs/config.ts:33-36` keeps the client's file extension; `member.resolver.ts:131,163` checks only the client-supplied MIME type; `main.ts:16` serves `express.static('./uploads')` without `nosniff` | Logged-in attacker hosts `x.html` on the API domain (phishing, script) | Derive the extension from magic bytes, allow only jpg/jpeg/png, send `nosniff` on `/uploads` |
| C5 | **`MONGO_DEV` and `MONGO_PROD` are the same connection string** [C] (compared by length and equality; values not printed) | `gameverse/.env`; `database.module.ts:9` and the scripts choose between them by `NODE_ENV` | Every `start:dev`, local test, manual QA session and script hits **production data**. `migrate:games --rollback` runs `deleteMany` and `drop()` (`scripts/migrate-property-to-game.ts:397,418`) | **Ops action (you):** create a separate dev database and user. Then add a startup guard that refuses identical URIs |
| C6 | **Open redirect and `javascript:` execution after login/sign-up** [C] | `gameverse-next/pages/account/join.tsx:88,98` `router.push(\`${router.query.referrer ?? '/'}\`)`. Next hard-navigates on non-local URLs | `?referrer=javascript:…` runs script after login and can steal the localStorage JWT | Accept only `/path` (not `//`, not `/\`), otherwise `/` |
| C7 | **Login and sign-up passwords are logged to the browser console** [C] | `apollo/client.ts:88` `console.warn('requesting.. ', operation)` (variables include `memberPassword`); socket frames logged at `:43-50`; ~40 other `console.*` calls | Credentials visible in DevTools, extensions and session recorders | Remove the request logging; gate other logs behind non-production |
| C8 | **Runtime dependencies with critical/high advisories** [C, reported by the audit tools] | FE `next@14.2.0`: yarn audit lists image-optimizer RCE/DoS and cache-poisoning advisories fixed in later 14.2.x. BE: `proxy-addr` (critical), `@apollo/server` ≤5.4, `@nestjs/platform-express`, `graphql-upload@13` → `busboy@0.3`/`dicer` (multipart DoS), `ws` (DoS), `multer`, `axios`, `lodash` | Remote DoS, possible RCE on the image optimizer | Upgrade `next` to latest 14.2.x (same major). Patch-upgrade the BE packages. `graphql-upload` 13 → 15+ needs a code check. Remove `react-scripts` from FE prod deps |

## 2. HIGH

| # | Issue | Evidence | Impact | Fix |
|---|---|---|---|---|
| H1 | **Phone, address and status of every member are public** [C] | `member.ts:21-22` exposes `memberPhone`; public `getMember`/`getAgents`; every `$lookup` into members returns the full document (`libs/config.ts:122-147`, `game.service.ts:285`, `comment.service.ts:146`, `board-article.service.ts:116`, `follow.service.ts:98,130`, `notification.service.ts:83`) | Anyone can harvest every user's phone number | Add `$project` to the lookups. Return phone and address only to the owner or an admin. **API-contract change → approval** |
| H2 | **Chat socket broadcasts full member documents to every client, guests included** [C] | `socket/socket.gateway.ts:75-81,99-107,113` (`memberData: authMember`) | Personal data leaks to anyone connected | Send `{_id, memberNick, memberImage}` only |
| H3 | **User search text goes into `new RegExp` unescaped** [C] | `member.service.ts:135` (public `getAgents`), `:197`; `board-article.service.ts:100` (public). An escape helper already exists: `libs/config.ts:24 escapeRegex` | ReDoS against MongoDB; invalid patterns cause 500s | Use `escapeRegex` and add `@MaxLength(100)` |
| H4 | **No rate limiting; 5-character minimum password** [C] | No throttler; `login` is open; GraphQL aliases allow many logins per request; `member.input.ts:15 Length(5,12)` | Credential stuffing and spam | `@nestjs/throttler` with GraphQL context (login/signup/comment/inquiry). Length policy **needs approval** (it changes signup rules) |
| H5 | **No GraphQL depth/complexity limit; Playground always on** [C] | `app.module.ts:16-35 playground: true`; no validation rules; probe confirmed introspection and Playground are on | Expensive alias queries can overload the API and DB | Turn off Playground and introspection when `NODE_ENV=production`; add a depth/alias limit |
| H6 | **CORS reflects any origin with credentials; no security headers** [C, curl-verified] | `main.ts:13 enableCors({origin:true, credentials:true})`; no helmet; `X-Powered-By: Express` | Any website can call the API with a user's credentials; no clickjacking or sniffing protection | Allow-list origins from env (`CORS_ORIGINS`); add `helmet()` |
| H7 | **Chat: guests can post; payload is not validated; frames up to 100 MiB; full payload logged** [C] | `socket.gateway.ts:110-122,116`; `ws` default `maxPayload`; no Origin check | Spam, memory exhaustion, log injection | Require login to post (**behaviour change → approval**); string payload ≤ 500 chars; `maxPayload` 16 KB; per-connection rate limit |
| H8 | **JWT hygiene** [C, secret strength S] | `.env SECRET_TOKEN` is 17 characters and looks human-chosen; `jwt.config.ts:12 expiresIn '30d'`; whole member document signed into the token (`auth.service.ts:30-40`); token kept in localStorage (`libs/auth/index.ts:10,15`) and sent in the WS URL (`apollo/client.ts:39`) | Offline brute force of the secret; long-lived tokens carrying personal data | **Ops:** rotate to a random secret of 48+ bytes (this signs everyone out). Code: sign `{_id}` only, shorter expiry. **Auth change → approval** |
| H9 | **Community articles can embed iframes from any site; bundled sanitizer is DOMPurify 2.3.3** [C] | `libs/components/community/TViewer.tsx:23-34` custom iframe renderer, which Toast UI then whitelists | Embedded phishing or malware frames in posts | Allow only YouTube/Vimeo origins with `sandbox`, or drop the iframe renderer |
| H10 | **SweetAlert renders server messages as HTML** [C sink, S exploitability] | `libs/sweetAlert.ts:49,57,97,106,115,155` `title: msg`; fed by `apollo/client.ts:128` and about 20 `err.message` callers | XSS if any error message echoes user input | Switch to `titleText` (plain text); styling stays the same |
| H11 | **Frontend sends no security headers** [C] | `next.config.js` has no `headers()` and no `poweredByHeader:false` | No CSP or framing protection to contain C6/H9/H10 | Add `headers()`: `frame-ancestors 'none'`, `nosniff`, Referrer-Policy, HSTS (CSP report-only first) |
| H12 | **`/member` shows the literal text "MEMBER PAGE MOBILE" on phones and iPads** [C] | `pages/member/index.tsx:102-103`; same placeholder in `MemberMenu.tsx:41`, `MemberGames.tsx:49`, `MemberArticles.tsx:69`, `common/CommunityCard.tsx:47` | Broken profile page on mobile. Notification links and admin links point to `/member` | Remove the `device === 'mobile'` branches (the site already uses one responsive layout) |
| H13 | **`/developer?input=<bad>` crashes; no 404, `_error` page or error boundary** [C] | `pages/developer/index.tsx:53,83` unguarded `JSON.parse`; no `pages/404.tsx` or `_error.tsx`; `_app.tsx` has no error boundary | White screen; unstyled default 404 | Reuse the guarded `parseInput` from `pages/game/index.tsx:43-64`; add a GameVerse-styled 404 + `_error` and an error boundary |
| H14 | **Navbar adds a `scroll` listener on every render and never removes it** [C] | `libs/components/Top.tsx:125-127` in the render body | Listeners pile up across renders and pages: leak and scroll cost | Move into `useEffect` with cleanup and `{passive:true}` |
| H15 | **Admin and private pages are indexable; no `robots.txt` or sitemap** [C] | `pages/_document.tsx:10` `robots index,follow` on every page; `public/` has no `robots.txt` | `/_admin`, `/mypage` and `/notifications` can be indexed | Add `robots.txt` (disallow `/_admin`, `/mypage`, `/notifications`, `/account`); add `noindex` in `LayoutAdmin` and on those pages |
| H16 | **3D homepage shelf renders 60 fps continuously** [C] | `libs/components/common/FiberContainer.tsx:50 <Canvas>` without `frameloop="demand"`, although `ScrollControls` calls `invalidate()` | GPU and battery drain on desktop for the whole homepage visit | `frameloop="demand"` (the intended mode) |
| H17 | **Chat handler: unguarded `JSON.parse`; state array mutated in place** [C] | `libs/components/Chat.tsx:95,112-113` | A non-JSON frame throws; duplicate messages possible | try/catch; functional `setState` |

## 3. MEDIUM

**Backend**

| # | Issue | Evidence |
|---|---|---|
| M1 | No maximum `limit` on paginated inputs (only notifications has `@Max(50)`) [C] | `member.input.ts:60,100`, `game.input.ts:190,220,250,273`, `comment.input.ts:46`, … → add `@Max(100)` |
| M2 | Nested `search` validators never run (no `@ValidateNested/@Type`); global `ValidationPipe()` has no options [C] | `main.ts:11`, `game.input.ts:203`, … |
| M3 | Free-text and URL fields have no length or format limits [C] | `member.update.ts:39-49`, `board-article.input.ts:24-26`, `game.input.ts:102-110` |
| M4 | Comments are saved before the target is validated (can attach to deleted or missing targets) [C] | `comment.service.ts:32-34,107-109` |
| M5 | `removeCommentByAdmin` decrements the counter again for an already-deleted comment [C] | `comment.service.ts:160-166` |
| M6 | Like/follow/create counters have no transaction; counts can go negative [C/S] | `like.service.ts:18-36`, `game.service.ts:65-72`, `follow.service.ts:34-37` |
| M7 | Upload stream errors can hang the request and leave partial files [S] | `member.resolver.ts:138-143,170-175` |
| M8 | Missing indexes: `comments` (none), `boardArticles` (none), `follows{followerId}`, `likes{likeGroup,likeRefId}`, `members{memberType,memberStatus}` [C] | `schemas/*.model.ts` (**schema change → approval**) |
| M9 | Raw Mongo/BSON error text returned to clients [C, curl-verified] | `game.service.ts:84`; invalid ObjectId → "input must be a 24 character hex string…" |
| M10 | Login messages reveal which accounts exist and are blocked; returned as 500s [C] | `member.service.ts:65-74` |
| M11 | An admin can change or block other admins; no audit trail [C] | `member.service.ts:218-224` |
| M12 | Batch rank job: ranks are reset to 0 for ~20–40 s each night (stay 0 if a job fails); unbounded `Promise.all` writes; no timeZone [C] | `apps/gameverse-batch/src/batch.service.ts:39-69` |
| M13 | Request bodies (which can contain an inline password), nicks and `match:` debug output are logged [C] | `libs/interceptor/Logging.interceptor.ts:20`, `auth.guard.ts:10,23` |
| M14 | Repo-wide `tsc` fails on a stale spec; lint has 576 problems [C] | `member.service.spec.ts:11,12,29,39` |

**Frontend**

| # | Issue | Evidence |
|---|---|---|
| M15 | `/game/detail` without an `id` shows "Loading game…" forever [C] | `pages/game/detail.tsx:293` |
| M16 | Double error alerts (global link + local catch); blank alerts when a string is passed to `sweetErrorHandling` [C] | `apollo/client.ts:121-124`, `MemberArticles.tsx:65`, `pages/member/index.tsx:89` |
| M17 | Article editor accepts an empty title or empty body (`&&` should be `||`); upload failure inserts a broken image [C] | `libs/components/community/Teditor.tsx:90,103,160-162` |
| M18 | `setState` inside `useMemo`; class name renders as `"false"` [C] | `libs/components/layout/LayoutBasic.tsx:64-68` |
| M19 | Admin lists mutate the shared `defaultProps` inquiry object; up to 3 fetches per page change [C] | `pages/_admin/users/index.tsx:61-74` (same pattern in other `_admin` pages and `NoticeManager.tsx`) |
| M20 | Chat socket never reconnects (`reconnect:false`) [C] | `apollo/client.ts:101` |
| M21 | Queries fire before the router is ready; filter changes are not shallow (extra data-JSON fetch) [C/S] | `pages/community/detail.tsx:94-123`, `pages/game/index.tsx:86-107` |
| M22 | Many uncoordinated `ScrollTrigger.refresh()` calls on mount (jank risk) [C] | `HomeHero.tsx:140`, `TrendGames.tsx:109`, `game/detail.tsx:260,288`, `developer/detail.tsx:263,290`, … |
| M23 | GSAP writes `textContent` into a React-owned text node, so the count can go stale [C mechanism] | `libs/components/homepage/PopularGames.tsx:89-137,161-163` |
| M24 | `ScrollControls` leaks an anonymous scroll listener; imports undeclared `react-merge-refs` [C] | `libs/components/common/ScrollControls.tsx:6,128-138` |
| M25 | Possible hydration mismatch from reading localStorage during render [S] | `libs/components/cs/Inquiry.tsx:87` |
| M26 | `sweetalert2@11.7.28` contains region-targeted protestware (blocks clicks on `.ru`/`.by` domains with a `ru` browser language); the site ships a `ru` locale [C code; impact depends on domain] | `node_modules/sweetalert2/dist/sweetalert2.js:4217-4226` → pin a clean version |
| M27 | Unused heavy deps in prod: `react-scripts`, `@mui/x-date-pickers-pro` (commercial licence, never imported), `material-ui-pickers`, `styled-components`, `chart.js`, `react-slick`, `react-spring`, `valtio`, `notistack`, … (~30, zero imports) [C] | `package.json`. Keep `axios`, `@emotion/*`, `graphql`, `i18next`, `subscriptions-transport-ws` |
| M28 | Performance: `moment` in the Footer (every page); ~421 KB of global SCSS in `_app`; dead `swiper` CSS in layouts; 0 uses of `next/image`; 8 shelf tiles ≈ 2.9 MB on home; render-blocking Google Fonts site-wide [C] | `Footer.tsx:6`, `_app.tsx:11-13`, `LayoutBasic.tsx:12-14`, `public/img/gameverse/*`, `_document.tsx:15-20` |
| M29 | SEO: `<Html lang="en">` hardcoded; locale code `kr` (ISO is `ko`); no hreflang or canonical; one tri-lingual description; no Open Graph/Twitter tags; detail-page content is client-only (`?id=` + client fetch) [C] | `_document.tsx:5,10,32-40`, `next-i18next.config.js:4` |
| M30 | Admin guard is client-side, based on an undecoded-signature JWT (no admin UI flashes for non-admins) [C, by design] | `LayoutAdmin.tsx:28-38`. Server enforcement verified OK, see §5 |

## 4. LOW

- **Backend**
  - Late or unclear failures on missing env: Mongo URI, ports default to 3000 → validate env at startup.
  - No Mongo pool or timeout options.
  - `recordView` has a find-then-create race (E11000 can fail a read).
  - Members can like their own profile or game.
  - `memberNick` is case-sensitive unique.
  - Admin hard-delete leaves orphan comments, likes and notifications.
  - bcrypt cost is 10.
  - Batch `GET /` should stay private.
  - Auth errors are returned as 400/500 instead of 401.
- **Frontend**
  - Unused files: `homepage/HomeSection.tsx`, `homepage/HomeGameCard.tsx`, `common/GameBigCard.tsx`, `layout/LayoutFull.tsx`.
  - ~20 function-component `defaultProps` (React 19 removal).
  - Footer year is fixed at build time.
  - Comment-edit "unchanged" check never matches (`community/detail.tsx:197-199`).
  - Navbar flag follows localStorage, not `router.locale`.
  - `trailingSlash` in the i18n config is never applied.
  - `HomeCredits` piles up delayed tweens during fast scroll.
  - `TokenRefreshLink` is a no-op.
  - `useDeviceDetect` causes a first-render flip.
  - API URL falls back to the string `"undefined"` or `ws://127.0.0.1:3007` when env is missing (`libs/config.ts:1`, `apollo/client.ts:62`).
  - No `.eslintrc`, so `yarn lint` prompts interactively; `eslint-config-next@12` vs `next@14`; TypeScript 4.6.
  - `custom.d.ts` is gitignored but listed in `tsconfig.json` `include`.
  - Invalid licence id `"ITC"`.
  - Duplicate `<h1>` on detail pages.
- **Accessibility**
  - Logo link has no accessible name (`Top.tsx:134`).
  - Avatar/logout trigger is a clickable `div` (no keyboard access).
  - Advanced-filter modal: close and reset are `div`s; `aria-labelledby` points to a missing id; the search input has no label.
  - Clickable `Stack`s without a role: `MemberFollowers.tsx:92`, `MyGameCard.tsx:62`, `CommunityCard.tsx:61`.
  - Icon buttons without labels.

## 5. Verified OK

- **Server-side authorization**
  - Every `*ByAdmin`, notice and inquiry-admin resolver uses `@Roles(ADMIN)` with RolesGuard.
  - `createGame`, `updateGame` and `getAgentGames` require AGENT.
  - The API rejects non-admin calls even though the admin UI guard is client-side.
- **Ownership checks**
  - `updateGame` filters on `{_id, memberId}`.
  - `updateComment` and `updateBoardArticle` filter on `{_id, memberId, ACTIVE}`.
  - `updateMember` takes the member ID from the token.
- **Notification isolation:** every read and write is scoped to `receiverId`, live delivery goes only to the receiver's own sockets, and writes are deduplicated by `dedupeKey`.
- **Inquiries:** members see only their own.
- **JWT handling**
  - The secret is loaded through ConfigService, and startup fails without it.
  - Each request reloads the member and refuses blocked or deleted accounts and stale roles.
  - The password hash is `select:false`.
- **`$sort` input:** every user-controlled sort is `@IsIn`-validated.
- **Regex escaping:** game, inquiry and notice search already escape input.
- **Upload paths:** target allow-list, path-traversal check, UUID filenames.
- **`formatError`:** no stack traces.
- **Batch:** cron handlers are wrapped in try/catch.
- **Scripts:** dry-run, apply and verify modes; snapshots before rollback; transaction in `repair:game-owner`.
- **Secrets in git:** `.env` files are ignored and never committed (both repos); no hardcoded secrets in source.
- **Frontend rendering of user content**
  - No `dangerouslySetInnerHTML` with user data.
  - Comments, chat, notifications, inquiries and FAQ are rendered as escaped text.
  - `target="_blank"` links have `rel="noopener noreferrer"`.
  - Store URLs are hardcoded.
- **Animation code**
  - GSAP: every `matchMedia` returns `mm.revert()`; effects key on `.length`/`_id`, so no duplicate triggers.
  - Reduced motion is honoured everywhere.
  - PortalTransition: listener cleanup, 8 s watchdog, `routeChangeError` reveal, double-click guard, admin excluded.
  - Clean up correctly: GvCursor (rAF sleeps and is cancelled), HomeIntro fail-safe, useHomeScrollMemory, and the useNotificationFeed listeners and guarded parse.
  - three.js loads through dynamic `ssr:false` on desktop with a fine pointer only.
- **Apollo SSR:** a new client per server render; no cross-user cache.
- **Polling:** none; unread counts come over the socket.
- **Language switcher:** clicks always reach the item with the id (`pointer-events:none` on its children, fixed and browser-tested on 2026-10-11).

## 6. Not performed in Phase 1 (and why)

| Check | Reason |
|---|---|
| FE production build (`yarn build`) | It writes `.next/` and Phase 1 is inspection-only. Last recorded pass: 2026-10-11 (COMPLETED_TASKS). Will run in Phase 3 |
| BE production build (`nest build`) | Writes `dist/`. Typecheck of both apps passed instead. Phase 3 |
| BE e2e (`test:e2e`) | Boots `AppModule` against the `.env` database, which is **production** (C5). Not safe until a separate test DB exists |
| FE lint (`next lint`) | No ESLint config, so the command starts an interactive setup that writes files |
| Manual feature walkthrough (auth, games, community, My Page, CS, chat, notifications, SweetAlert, admin CRUD) | Any write (like, comment, signup, admin edit) would modify **production data** (C5). Only read-only API probes were done. Needs a separate dev DB first, or read-only journeys only |
| Core Web Vitals / Lighthouse, bundle-size table | Needs a production build and a browser run; Phase 3 |
| Cross-browser (Safari/Firefox), real devices | Not available in this environment; the Playwright Chromium check is possible in Phase 3 |
| Database backup and restore rehearsal | Ops task. Requires the DB owner. Recommended before deploy together with the migration dry run in NEXT_STEPS |

## 7. Recommended fix order

| Batch | Items | Notes |
|---|---|---|
| **A** — FE safe fixes, no API change | C6, C7, H10, H12, H13, H14, H15 (robots + noindex), H16, H17, M15, M16, M17, M18, M24 | No visual change except the new 404/error pages in GameVerse style |
| **B** — BE security, approval per item | C1, C2, C3, C4, H3, H5, H6, H7, M1, M2, M9, M10 | C1, C2 and H7 change behaviour; H5 and H6 need a production `CORS_ORIGINS` value |
| **C** — Dependency patches | C8: `next` 14.2.x latest, BE patch versions, `graphql-upload` upgrade, drop `react-scripts` | Approval; rebuild and retest |
| **D** — Data-exposure contract | H1, H2, H8 (sign `{_id}` only, expiry), H9 | API-contract and auth change, explicit approval |
| **E** — Ops (you) | C5 separate dev DB; rotate `SECRET_TOKEN`; production env (`NODE_ENV=production`, `CORS_ORIGINS`, `wss://` URL); backup before deploy | No code |
| **F** — Medium/Low polish | M8 indexes (schema approval), M12, M19–M23, M26–M29, accessibility items, dead files and deps | Only what you approve |


---

## Phase 2 progress

| Group | Items | Status | Verification |
|---|---|---|---|
| 1 — FE credential and injection sinks | C6, C7, H10 | ✅ Fixed 2026-10-11 | `yarn tsc --noEmit` passed. `safeReferrer` case table: internal path kept; `//`, `/\`, `https:`, `javascript:`, empty, missing and array → `/`. Browser: injected GraphQL error `<b>…<img onerror>` showed as literal text in the GameVerse alert (no element created, no script run). No `requesting..`/`WebSocket …` console lines across `/game`, `/`, `/developer`, `/community`, `/cs`, `/account/join` |
| 2 — FE stability | H12, H13, H14, H17 | ✅ Fixed 2026-10-11 | `yarn tsc --noEmit` passed. `/member` on iPhone 13: no placeholder text; all 4 tabs 390px wide (they forced a 1260px layout viewport before); desktop unchanged. `/developer?input={broken` renders the list with defaults. `/no-such-page` → GameVerse 404 (desktop and phone, no overflow). Real window scroll listeners (CDP) stay at 2 across 6 navigations. Chat: a non-JSON frame is ignored; two messages each render once. Error boundary: typecheck only (no safe way to force a render error) |
| 3 — Indexing, 3D shelf, FE security headers | H15, H16, H11 | ✅ Fixed 2026-10-11 | `yarn tsc --noEmit` and `yarn build` passed. Production server: all security headers present, no `X-Powered-By`. `robots.txt` served. `noindex, nofollow` in the HTML of `/mypage`, `/notifications`, `/account/join`, `/_admin` and `/kr/mypage`; public pages have no robots tag (indexable by default). 0 CSP report-only violations across `/`, `/game`, game detail, `/developer`, `/community`, `/cs`, `/about`, `/account/join`, 404. Shelf: 0 draw calls in 2 s idle, 261 while scrolling; images render |
| 4 — Backend critical security | C1, C2, C3, C4 | ✅ Fixed 2026-10-11 (live: the dev API on :3007 runs `nest start --watch` and reloaded it) | Backend repo `tsc` passed (repo-wide again: the stale spec typings are fixed). `jest` 22 suites / 125 tests passed (21 new). `nest build` passed for the API and batch apps. Unit-tested only, with no live requests, because the DB is production (C5) |
| 5 — Backend hardening | H3, H5, H6 | ✅ Fixed 2026-10-11 (live on :3007 via watch mode). Set `CORS_ORIGINS` in production | `tsc` passed; `jest` 24 suites / 135 tests. Built API probed on :3017. **Production mode:** refuses to start without `CORS_ORIGINS`; allowed origin echoed, foreign origin gets no CORS headers; nosniff / DENY / no-referrer / HSTS present, no `X-Powered-By`; Playground off (400), introspection refused; normal queries work; 6 aliased logins rejected at validation; `(a+)+$` searched literally. **Dev mode:** `localhost:3000` allowed (incl. upload preflight headers), Playground and introspection on, images served |
| 6 — Personal data exposure | H1, H2, H9 | ✅ Fixed 2026-10-11 (live on :3007 via watch mode) | Backend `tsc`; `jest` 25 suites / 144 tests. Anonymous queries against the API: 0 of 7 `getAgents`, 1 `getMember`, 10 `getGames.memberData`, 2 `getBoardArticles.memberData` and 1 `getComments.memberData` members expose phone or address; schema types unchanged (`memberPhone: String!`, `memberAddress: String`). Browser: injected post HTML renders only the YouTube iframe (`evil.example` and `javascript:` frames dropped, `onload` stripped, text kept, no script ran); `/member` shows no phone row to visitors. FE `yarn tsc --noEmit` passed |
| 7 — Dependencies (safe updates only) | C8 | ✅ Done 2026-10-11 (residual risks below) | **FE:** `next` 14.2.0 → 14.2.35; removed unused `react-scripts`, `react-tree`, `view`, `styled-components`, `babel-plugin-styled-components`, `js-cookie` (zero imports); `i18next-fs-backend` 2.2.0 → 2.6.8 (within `next-i18next`'s range). `yarn audit`: 741 → 109 advisories (critical 39 → 4). After each step: `tsc`, production build, browser tour of 13 pages × desktop/phone (0 problems), chat, headers, 5 page transitions (all covered and cleared). KR/RU translations render. **BE:** `npm audit fix` without `--force` (lockfile only; `proxy-addr`, `express`, `body-parser`, `axios` 1.20 …). `npm audit`: 34 → 29 (critical 1 → 0). `tsc`, `jest` 144/144, both builds; built API smoke on :3017 (queries, auth, CORS, uploads, chat round-trip) |
| 8 — Abuse limits | H4, H7 | ✅ Done 2026-10-11 (live on :3007 via watch mode) | **Login:** 10 tries / 15 min per IP + nickname (cleared by a successful login), 50 / 15 min per IP; **sign-up:** 10 / hour per IP (in memory, `libs/security/attempt-limiter.ts`; `TRUST_PROXY` behind a proxy). **Chat:** frames ≤ 16 KB (`maxPayload`), text must be a non-empty string ≤ 500 chars (input `maxLength` 500), 5 messages / 5 s per connection, browser origins limited to the CORS list (`verifyClient`), log lines single-line and truncated; guests can still post. `jest` 27 suites / 158 tests. Live on :3017: 11th login try refused while another nickname still works; foreign-origin socket refused (401), localhost allowed; 7 rapid messages → 5 delivered; object payload dropped; 20 KB frame closed (1009) |
| 9 — Token hygiene | H8 (partly) | ✅ Done 2026-10-11 | Production refuses a `SECRET_TOKEN` shorter than 32 characters (dev: warning); new tokens last 7 days instead of 30 (`JWT_EXPIRES_IN`), earlier tokens keep their expiry. `jest` 162 tests. Live: production mode refused the current 17-character secret; dev mode started with the warning. **Deferred:** removing phone and address from the token payload (My Page pre-fills the profile form from the token; needs a new "me" query) and moving the socket token out of the URL |

### New finding (Group 3): production build needs the API env at build time

| # | Issue | Evidence | Impact | Fix |
|---|---|---|---|---|
| C9 | **A production build without `REACT_APP_API_URL`, `REACT_APP_API_GRAPHQL_URL` and `REACT_APP_API_WS` in its environment has no API URL** [C] | They exist only in `.env.development`, which Next does not load for `next build`. A plain `yarn build` gave `connect-src 'self'` and no API origin in the bundle (`next.config.js` inlines them at build time) | The deployed site cannot reach the API or chat. The CSP and the inlined URLs are fixed at build time | Set the three variables in the hosting build environment (or a git-ignored `.env.production`) to the production `https://` / `wss://` API URLs. The Phase 3 build must be made that way |

### Residual dependency risks after Group 7 (accepted for now: major upgrades)

| Package | Remaining advisories | Why it stays | Exposure |
|---|---|---|---|
| `next` 14.2.35 | Several fixed only in Next 15.x | Next 15 is a major upgrade | Self-hosted pages router; no middleware, no `next/image` in use. Plan the Next 15 move after launch |
| `@apollo/server` 4, `@nestjs/*` 10, `@graphql-tools/*`, `ws` (BE) | DoS-class advisories, fixed in Apollo 5 / Nest 11 | Major upgrades | Partly reduced by the Group 5 query limits |
| `graphql-upload` 13 → `busboy` / `dicer` / `multer` (BE) | Multipart DoS | v15+ changes the upload code | Uploads require login; content checked (Group 4) |
| `axios` 0.27 (FE) | Prototype pollution / DoS | Used only for uploads, which cannot be tested without writing data | Browser-side, fixed request shapes |
| `@toast-ui` editor → DOMPurify 2.3.3 (FE) | Sanitizer bypasses | No maintained editor release | Iframes are limited to YouTube (Group 6); the CSP (report-only) helps after enforcement |
| `swiper` (FE) | Prototype pollution | Fix is in a new major | Only Swiper's CSS is imported; its JavaScript is never loaded |

## Deployment checklist (environment)

| Where | Setting | Value |
|---|---|---|
| API server | `NODE_ENV` | `production` (the `start:prod` script sets it) |
| API server | `CORS_ORIGINS` | `https://gameverse.kr,https://www.gameverse.kr`. Required: the API refuses to start in production without it. **Do not put it in the local `.env`**: a listed value replaces the localhost default, so the local frontend would be blocked |
| API server | `MONGO_PROD`, `SECRET_TOKEN` | A production database separate from development (C5); a new random secret, at least 32 characters (`openssl rand -base64 48`). Production refuses a shorter one (H8). Changing it signs everyone out once |
| API server | `TRUST_PROXY` | `1` when the API runs behind one reverse proxy / load balancer, so login limits see the visitor's IP instead of the proxy's |
| API server | `JWT_EXPIRES_IN` (optional) | Session length for new logins; default `7d` |
| Frontend build | `REACT_APP_API_URL`, `REACT_APP_API_GRAPHQL_URL`, `REACT_APP_API_WS` | Production `https://` / `wss://` API URLs, present **at build time** (C9). They also feed the CSP |

---

## Phase 3 — Final verification (2026-10-11)

### Automated checks

| Check | Result |
|---|---|
| FE `yarn tsc --noEmit` | ✅ Passed |
| FE `next build` (Next 14.2.35, with the API env) | ✅ Passed; shared JS 266 kB; largest pages `/game` 366 kB, `/` 365 kB first load |
| FE lint | ⚠️ Not run: no ESLint config (`next lint` starts an interactive setup) |
| FE `yarn audit` (dependencies) | 109 advisories (4 critical, 40 high), down from 741 (39 critical); residual list above |
| BE `tsc -p tsconfig.json` (whole repo incl. specs) | ✅ Passed (it failed in Phase 1) |
| BE `jest` | ✅ 27 suites, 162 tests (Phase 1: 20 / 104) |
| BE `build:api`, `build:batch` | ✅ Passed |
| BE `npm audit --omit=dev` | 29 (0 critical, 16 high), down from 34 (1 critical); all remaining need major upgrades |
| BE ESLint | 595 problems (Phase 1: 576). The increase is `no-unsafe-*` from `as any` mocks in the new tests; nothing new in production code |
| BE e2e (`test:e2e`) | ⚠️ Not run: boots against the shared production database (C5) |

### Live checks

| Journey | Result |
|---|---|
| 13 pages × desktop (1440) and iPhone 13: home, games, game detail, developers, developer profile, community, post, CS, about, login, member, 404, admin | ✅ 0 problems: content renders, no page errors, no console errors, no horizontal overflow |
| Page transitions: header link, game card → detail, Back, Community, logo | ✅ 5/5 covered and cleared (0.66–1.54 s) |
| Phone drawer → Games | ✅ Navigates; overlay cleared |
| Language switch through the redesigned menu (EN → KR → EN) | ✅ URL and navigation text change (홈 게임 개발자 커뮤니티 고객센터) and back |
| Chat widget | ✅ Opens; guest chat round-trip, limits and origin check verified on the built API |
| Error alert with an injected `<img onerror>` message | ✅ Shown as literal text in the GameVerse alert; nothing executed |
| Visitor privacy | ✅ No phone row on `/member`, no contact line on the developer page; API returns `""` / `null` |
| CSP report-only, 8 pages incl. game detail | ✅ 0 violations, 0 page errors |
| Robots | ✅ `robots.txt` disallows `/_admin` etc.; noindex on `/mypage`, `/_admin`, `/account/join`; home indexable |
| Frontend headers | ✅ nosniff, `X-Frame-Options: DENY`, Referrer/Permissions policies, CSP report-only; no `X-Powered-By` |
| API in production mode (strong temporary secret, `CORS_ORIGINS=https://gameverse.kr`) | ✅ Starts; `gameverse.kr` allowed, `evil.example` and `localhost` refused; nosniff / DENY / HSTS; Playground 400, introspection refused; public queries OK; phone hidden; protected and admin queries refused without login; forged token refused; depth-4 query allowed; `/uploads` non-image 404, images with nosniff; sockets from `gameverse.kr` connect, from `evil.example` 401 |
| API production mode with the current short secret | ✅ Refuses to start (as intended) |
| Rough web vitals (local, unthrottled) | LCP 120–632 ms on `/`, `/game`, game detail (desktop and phone). CLS 0 everywhere except **game detail on desktop: 0.199** (see M31; fixed afterwards, now 0) |

### New finding during the final check

| # | Issue | Evidence | Fix |
|---|---|---|---|
| M31 | **Layout shift on game detail (desktop CLS 0.199; "good" is ≤ 0.1)** [C] | The "Loading game…" state (`.gv-gd-state`, `min-height: max(80vh, 560px)` = 720 px) leaves the footer visible at y = 720; when the data arrives, the footer is pushed off-screen. The developer detail page uses the same state, so it is likely affected too | ✅ **Fixed 2026-10-11:** `.gv-gd-state` now has `min-height: max(100vh, 560px)` / `max(100svh, 560px)`. Measured on the production build (3 runs each): game detail desktop **0.199 → 0**, phone 0; developer detail desktop 0.061 (good, ≤ 0.1), phone 0; 404 0. Tour 13 pages × 2 still has 0 problems |

### Not verified (and why)

| Area | Reason | What to do |
|---|---|---|
| Write journeys: sign-up, login → redirect, profile edit and password change, image upload, like / follow / comment, posting, CS inquiry, notifications, admin CRUD | Development uses the production database (C5); any test write would change real data | After C5, run them once against the separate dev database (the unit tests cover the changed server logic) |
| Safari / Firefox, real devices | Only Chromium is available here | Quick manual pass on an iPhone (Safari) and Firefox before launch |
| Lighthouse scores under throttling | Not available here; the numbers above are local and unthrottled | Run PageSpeed Insights on the deployed URL |

### Deployment blockers that are settings, not code

1. **C5:** separate production and development databases (`MONGO_PROD` ≠ `MONGO_DEV`); take a backup before the first deploy.
2. **`SECRET_TOKEN`:** new random value of at least 32 characters (the API refuses a shorter one in production).
3. **`CORS_ORIGINS=https://gameverse.kr,https://www.gameverse.kr`** on the API (it refuses to start without it), plus `TRUST_PROXY=1` behind a proxy.
4. **C9:** frontend built with the production `REACT_APP_API_URL`, `REACT_APP_API_GRAPHQL_URL`, `REACT_APP_API_WS` (`https://` / `wss://`).

### Remaining risks (accepted, documented)

- Next.js advisories fixed only in Next 15, and backend majors (Apollo 5, Nest 11, `graphql-upload` 15+). See "Residual dependency risks". Plan these after launch.
- H8 partly: the token still carries profile fields, and the chat socket sends the token in its URL.
- Password policy is unchanged (5–12 characters).
- Rate limits live in one process's memory.
- The Phase 1 medium and low items not handled in Phase 2 (M1–M30 except those fixed along the way, and the lows).

### Verdict

**READY WITH WARNINGS.**
- Every critical and high finding in the code is fixed, or partly fixed and documented (C8, H8).
- All automated checks that can run pass.
- Every read-only journey and production-mode probe passed.

**Do not deploy until the four settings above are in place.** After C5, run the write journeys once.
