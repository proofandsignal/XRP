# RELEASE-009 — Security / Legal / IP Preflight and Samsung QA Pack
**Scope:** Nine-product Proof & Signal demo panel, with three standalone new scenario experiences
**Branch:** `demo/boost-nine-20261113`
**Release owner:** HUMAN approval required.
**Classification:** author-side / automated preflight; **NOT INDEPENDENT REVIEW**.

## A. Verified preflight evidence
- Automated static, functional Chromium, mobile-viewport, password-protected-route and Content Security Policy tests are configured under `.github/workflows/boost-nine-demo.yml`; record the actual commit SHA and completed run URL for each release candidate.
- The candidate server serves only `/`, `/rlusd.html`, `/rwa.html`, `/defi-guard.html`; all require Basic auth and return no-store caching headers.
- No payment, custody, signing, trading, wallet connection, notifications, external data fetching or paid API is implemented by these new frontend routes.
- The three new UIs contain no remote fonts, embedded third-party images or advertisements. The top-left `P&S` initial mark is CSS/text created for this candidate, not an official partner logo.
- Historical RLUSD-001 case explicitly dated **2026-10-19** and MPT-001 case **2026-10-20**. Hypothetical scenarios are named synthetic. `UNKNOWN` is preserved for independent off-chain claims.

## B. Open independent Security/Legal/IP review (blocking)
An evaluator **independent from the author** must review code and claims, inspect live authorized vs unauthorized HTTPS after release staging, record findings, and approve each separate product scope. Automated CI and this checklist are not an independent sign-off.

**Security**: private credential entropy and secret storage; authentication/proxy behavior; brute-force constraints; least-privilege, source/credential leakage; CSP, CSRF relevance, blob exports; no telemetry or trackers; 401 for every route; prove no public static bypass; third-party links leave protected realm.

**Legal/evidence**: client-facing research-only/disclaimer text and non-advice statements; timestamps on historical evidence; issuer/asset identities independently validated using primary sources; no claims of real-time reserve coverage, solvency, redemption, licensing, live alerting or investment safety.

**IP**: inspect proprietary code and image/font/logo assets, brand usage, links and licenses. Distinguish descriptive `RLUSD`, `Ripple`, `Aave`, `Solana` references from owned branding. No automatic permission to use their logos/marks.

**Known functional limitations**:
- The portfolio hub links to six previously deployed Render URLs which are **NOT** protected by the hub's Basic auth.
- An existing DeFi Risk Monitor **API** and Market Evidence Pack preview are not evidence of complete separate customer-facing demo releases.
- The local Guard UI is a synthetic model example, not a linked live alert delivery workflow.
- Existing CI measures viewport responsiveness; it is **not physical Samsung Android QA**.
- Pending external reviewer identity, dated review record and acceptance; no signature, no gate change.

## C. Physical Samsung acceptance script
**Prerequisites:** independent review acceptance; then isolated protected Render HTTPS URL; credentials sent privately (not GitHub/comments).
On real Samsung mobile, in Samsung Internet **and** Chrome when available:
1. Open the exact approved HTTPS hostname; record device model, Android version, browser versions, date and commit SHA.
2. Confirm unauthenticated access prompts for credentials / returns protected response; reject bad credentials; valid credentials open hub.
3. Hub: verify nine cards, 4 XRPL / 4 DeFi / 1 Solana filtering, readable identity and `Created by Proof & Signal`, no horizontal scrolling or cut-off CTAs.
4. RLUSD: historical REVIEW; switch to synthetic supply-unavailable VERIFY; check `UNKNOWN`; export JSON to Downloads.
5. RWA: historical REVIEW; synthetic missing-issuer VERIFY; export passport JSON; off-chain identity remains UNKNOWN.
6. Guard: OK → WATCH → WARNING → CRITICAL; stale evidence → VERIFY; verify no real alert delivery or wallet interaction; export JSON.
7. Test six external cards individually. Their own URL/identity/security/mobile behavior requires independent checking, and they are **not inside the authenticated hub**.
8. Record screenshots or screen recording without showing credentials or sensitive tokens; log visual/functional failures by product.
9. **Do not** mark Samsung PASS when any critical issue remains or when the test is only on an emulator.

## D. Human Approval template (must be user-expressed after QA)
`I reviewed release SHA ______ and nine product QA records. I approve public sharing of [explicit product list / all nine] only under recorded limitations. I understand pending issues: ______. Date ______.`

Silence or the request to start QA is **not approval**. Production merge, real funds and automatic deployment remain locked.

## Release state
`AUTHOR PRECHECK PASS [only if latest CI completed] → INDEPENDENT SECURITY/LEGAL/IP PENDING → PROTECTED HTTPS HOLD → PHYSICAL SAMSUNG PENDING → HUMAN APPROVAL PENDING`.
