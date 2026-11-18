# XRPL RWA Risk Passport — Product-Specific Demo Acceptance

**Product:** Proof & Signal XRPL RWA Risk Passport (PRODUCT-002)  
**Build track:** existing `proofandsignal/XRP`, Draft PR #30, `demo/boost-nine-20261113`  
**Classification:** Owner-facing, read-only demo CANDIDATE, not a public product release.

## Implemented, source level
- Standalone-themed original logo (top-left), original SVG hero, correct product-first brand hierarchy.
- English user-facing copy; exact `Created by Proof & Signal`.
- Working `Explore the Passport` CTA to a focused interactive section.
- MPT-001 historical author-captured case, plus three distinctly synthetic scenarios. No live blockchain or wallet.
- Deterministic REVIEW/VERIFY findings, evidence limitations, independent off-chain UNKNOWN, JSON export, Reset.
- Export includes `pass_allowed:false`, `live_feed:false`, `real_funds:false`, `archive_rpc_independent_replay:'PENDING'`.
- Standalone artifact is generated from canonical `../boost-nine/rwa.html` by `build.mjs`; no duplicated UI source.
- Isolated RWA-only protected preview candidate through `private-server.mjs` with 401 on anonymous requests and 404 on other products.
- Future no-login, no-wallet static artifact for owner-approved public version via `dist/rwa-passport/index.html`.

## Developer/author CI (NOT independent approval)
Run from repository root:

```sh
node --test preview/boost-nine/test.mjs preview/boost-nine/protected-preview.test.mjs preview/rwa-passport/build.test.mjs
node preview/rwa-passport/build.mjs
node --test preview/boost-nine/browser-qa.mjs preview/boost-nine/auth-browser-qa.mjs preview/rwa-passport/browser-qa.mjs
```

Browser tests require Playwright 1.58 and its Chromium. They exercise Explore, responsive sizes 360/390/412/768/1440, four scenarios, reset, exported JSON bytes and browser JS errors. CI captures desktop/390px screenshots when successful. **Screenshots and emulators are NOT physical Samsung evidence.**

## P0 — independent pre-staging clearance (blocking)
Security: review latest SHA's CSP, asset delivery, no auth bypass, path allowlist, HTTP 200/401/429/500, throttling proxy assumptions. Independent reviewer records identity/scope, issues, retests, and written approval or HOLD.  
Legal/IP: validate research-only, XRPL descriptive naming, ownership of original SVG and code, no implied affiliation/investment advice; supply qualified written opinion where needed.  
Evidence: Mainnet `ledger_index=107775551` and MPT issuance `05EECEBE97A7D635DE2393068691A015FED5A89AD203F5AA` must be independently replayed from a suitable archive node, with raw RPC JSON, URL/provider, UTC time and hash. On-chain proof never certifies asset backing.

No raw independent RPC or professional signed signoff has been recorded in this product handoff. Missing data = `UNVERIFIED/PENDING`, not `CONTRADICTED`.

## P1 — owner-authorized protected Render QA (not applied yet)
- Workspace: `My Workspace`, Free plan, Auto-Deploy OFF.
- Use `render.private-qa.yaml` only after explicit pre-staging clearance/owner authorization.
- Private strong Basic Auth credential stored in Render secret env (not repo); RWA-only routes `/`, `/rwa.html`.
- Verify live HTTPS, 401 anonymous, 200 authenticated, 404 other routes, CSP/hardening, interactive desktop and mobile browser QA.
- Record exact SHA, deployment ID and actual HTTPS URL. An existing other-product Render URL does not count.

## P2 — real physical Samsung QA (not performed)
Record device model, Android and Samsung Internet/Chrome versions, date, URL and SHA. Verify:
1. Premium logo and hero, product hierarchy, exact attribution, no crop or overflow.
2. Explore CTA scrolls to passport; selector supports MPT-001/issuer/lock/metadata.
3. REVIEW/VERIFY decisions and legal warning remain visible.
4. Export JSON opens in Downloads and contains the expected synthetic or historical provenance; Reset works.
5. Portrait and landscape, zoom, 360–412px effective widths, keyboard/accessibility and touch.
6. Negative authorization checks on protected QA, with no credentials in recordings.

Attach screenshots/screen recording and a dated PASS/FAIL. Do not mark PASS for browser emulation.

## P3 — version-specific human approval
Public static release uses `render.public-after-approval.yaml` or equivalent authorized HTTPS host, no login/wallet/payment. It cannot be shared before the owner has opened and tested the actual URL and expressly approved the exact SHA. 
Legal, IP, Security, evidence and Samsung approvals remain separate; do not silently convert an owner's staging request into public distribution permission.

**Gate**:
`AUTHOR CI EVIDENCE → INDEPENDENT SECURITY/LEGAL/IP → PROTECTED HTTPS QA → PHYSICAL SAMSUNG → OWNER APPROVAL → PUBLIC DEMO`

Current classification: `DEMO CANDIDATE · RELEASE HOLD · NO MERGE · NO DEPLOY · NO PUBLIC SHARING`.
