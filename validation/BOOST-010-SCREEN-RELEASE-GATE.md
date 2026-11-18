# BOOST-010 — XRPL Intelligence Screen protected-preview and browser QA gate

**2026-11-17 · DRAFT · NO MERGE · NO DEPLOY · NO EXTERNAL DISTRIBUTION**

Parent: BUILD-009 Case Library, PR #28, commit `5a55a8dda2fccefee09264e25d8845aff2fc0d4f`.
Purpose: release hardening of the **existing** premium XRPL historical-evidence explorer and institutional workspace. Not a new XRPL product and not a settlement/risk audit.

## Implemented on this isolated branch

1. Hosted **fail-closed Basic authentication** for all HTTP routes (including health, evidence exports, API endpoints and brand assets). Detection is based on Render's `RENDER_SERVICE_ID` (or `RENDER=true`), or explicit `PREVIEW_REQUIRE_AUTH=1`. Missing `DEMO_USER`/`DEMO_PASSWORD` returns 503; invalid credentials return 401; both use no-store.
2. Local development without host marker remains possible. To verify auth locally, set `PREVIEW_REQUIRE_AUTH=1` and supply non-production dummy credentials.
3. Regression tests verify the access boundary, unknown credentials and authenticated historical case API; all other tests remain enabled.
4. A separate capped GitHub Actions Chromium workflow performs authenticated desktop 1440x900 and mobile 390x844 smoke tests for historical case selection, Explore, canonical archived-artifact consistency display, explicitly **partial** third-case consistency, JSON export, workspace route, absence of third-party requests, and horizontal overflow. Screenshots are saved for 3 days.
5. No new Mainnet calls are required by this browser test. No wallets, keys, signing, custody, trades, paid APIs or external leads are introduced.

## Deployment and security caveats

- Existing Render service: `xrpl-intelligence-screen-preview` in **My Workspace**; branch `build/009-case-library-distribution`, Auto-Deploy OFF.
- Previously recorded Render deploy `dep-dbm1mqpsrm7s73eq29ag`: LIVE on the **old** BUILD-009 commit. This does **not** attest that the BOOST branch is deployed, protected or Browser QA-PASS.
- **Do not send the current hosted preview to clients** until the protected release is deployed, its exact source SHA verified, and real HTTPS authentication/functional QA passed.
- Render credentials must be created as environment variables and never committed, printed or sent via screenshots. The service must remain Free, with Auto-Deploy OFF.
- Basic authentication is appropriate for **access-controlled internal QA over HTTPS**, not an enterprise identity/authorization solution.
- This existing application retains *read-only live XRPL scanner endpoints*. Auth controls access, not data accuracy or production RPC safety. Independent security evaluation must include input bounds, resource exhaustion, upstream RPC behavior, CSP and confidential evidence handling.
- An archived case hash attests only consistency with checked-in repository artifacts, **not independent ledger verification, issuer backing, compliance or investment safety**.

## Required acceptance gates (none waived)

- [ ] CI of exact BOOST head: unit, HTTP access and real Chromium QA PASS; review screenshots.
- [ ] Independent Security/Financial/Legal/IP review and residual-risk disposition; avoid presenting authored tests as independent sign-off.
- [ ] Explicit authorized, protected Render Free deployment at exact reviewed SHA; Auto-Deploy OFF.
- [ ] Verify 401 for anonymous HTTPS request; verify authorized premium Explorer, three historical cases, export and Workspace in a live desktop browser; ensure no unauthorized external requests.
- [ ] Physical Samsung QA of **that exact hosted build**, including logo top-left, thematic cover, "Created by Proof & Signal", Explore, filters, export, no horizontal scroll and correct `UNKNOWN`/`PARTIAL` labels.
- [ ] Owner Human Approval **before first external sharing**.
- [ ] First qualified XRPL lead validates decision relevance; record feedback separately from technical readiness.

**Status:** BUILD BOOST IN REVIEW / RELEASE HOLD. No gate change without new independent evidence.

`BUILD → MEASURE → VERIFY → CREATE VALUE → PAID REPEAT`

## Independent source-review F-003: brute-force mitigation candidate (2026-11-18)

- Preview auth now limits **failed** Basic-auth attempts per immediate TCP peer: 20 in 60 seconds, then HTTP **429** with `Retry-After` for 60 seconds. Correct credentials continue to work after attacker failures, to avoid a trivial owner lockout.
- The in-memory peer table is bounded (1,024 entries). Untrusted `X-Forwarded-For` is **never** used as the peer key; this avoids simple header-spoof bypass. Reverse proxies may pool clients behind a single peer, and process restarts clear in-memory state.
- The HTTP regression runs 105 bad-password attempts **against a locally spawned server only**, plus fake-clock tests for lock expiry, spoofing and bounded memory. It does NOT test or authorize brute-force traffic against hosted Render or any third-party service.
- These measures are **internal private-QA safeguards**, not a production/Internet-scale rate-limit architecture. An externally accessible preview still requires HTTPS, strong credentials, verified `PREVIEW_REQUIRE_AUTH=1` in Render, a source-based independent Security reviewer, and authorization for exact-head deployment. Authenticated live RPC handlers still need independent resource-exhaustion review.
- **F-001 Samsung and F-002 hosted SHA drift remain open**; **F-004 Legal/IP remains HOLD** while rights notice PR #29 and independent rights clearance are pending. No independent pass, deploy or share is implied.

## Independent DELTA source review — FIND-001..004 (2026-11-18, review still HOLD)

**Scope correction:** The reviewer described a potential proxy issue, stale-peer pruning, multi-instance counters, and no authenticated RPC request budget. Those observations must be assessed against **our actual single-instance Render Free preview**. They do not authorize deployment or constitute independently reproduced tests.

- **FIND-001 proxy:** `req.socket.remoteAddress` may identify Render's reverse proxy, not the end user; unauthenticated clients can share one failed-auth bucket. No `X-Forwarded-For` is trusted and no Express exists. A generic `trust proxy` toggle would be unsafe without a verified proxy allowlist. **For one-owner private QA**, keep conservative shared-peer counting; valid credentials are not blocked by failed-auth lockouts. Verify behavior independently on a protected hosted build **after owner deployment approval**. An actual client-isolated edge limiter is a public-distribution blocker.
- **FIND-002 memory:** Fail-auth limiter uses a maximum of 1,024 peers; stale entries are removed **lazily** only when the table fills, and a full live table rejects further unknown failed-auth attempts. This is bounded table size, not an independently measured bound on process memory. No background timer required for the bounded internal QA demo. A synthetic 10,000-peer test is allowable only locally; do not stress hosted Render.
- **FIND-003 replicas:** Current Render Free service is configured for **one instance**. Local in-memory counters reset on restart and do not synchronize among replicas. Redis/shared distributed quota (or trusted edge) is mandatory to reassess if the architecture changes, **not a prerequisite to this isolated single-instance QA**.
- **FIND-004 authenticated read-only XRPL scans:** Added a separate process-global, **cost-weighted scanner admission budget** in `lib/scannerBudget.mjs`, enforced by `server.mjs` only for authenticated `GET /api/account`, `/api/amm` and `/api/mpt`. Cost weights account=6, AMM=4, MPT=3; aggregate capacity=18/minute; up to 2 simultaneously active scanner requests. Over-quota or concurrency returns **429** with `Retry-After`; historical case explorer and Workspace remain functional. The request lease releases on completion of the awaited scanner even when it fails. This is a **private demo safety brake, NOT an exact metering of individual upstream RPC calls**. Existing pagination, retries and timeout implementation must still be independently inspected for external deployment.
- New `test/scannerBudget.test.mjs` uses a deterministic fake clock and a locally spawned protected server; scanner HTTP integration supplies an intentionally invalid address **to avoid any external XRPL calls**. CI outcomes are author-produced until independently verified.

**Decision:** Re-review the latest SHA after CI; verify shared-proxy behavior, rate rules, source and optional negative tests. Explicit `PREVIEW_REQUIRE_AUTH=1` at any future protected QA deployment is mandatory. Maintain Legal/IP HOLD, hosted SHA and physical Samsung QA pending, and separate owner Human Approval before outreach.

`INTERNAL QA HARDENING · SINGLE INSTANCE · NO LIVE LOAD TEST · NO PRODUCTION GUARANTEE · NO MERGE/DEPLOY/SHARE`
