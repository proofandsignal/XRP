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
