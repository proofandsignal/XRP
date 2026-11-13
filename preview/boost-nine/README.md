# Project Boost · 9-Demo Intelligence Panel (isolated candidate)

## Purpose
One premium navigation surface for nine independently gated Proof & Signal demos by 2026-11-20. This branch is not a production release and none of its cards constitutes a Demo PASS.

## Standalone new interactive UX
- `rlusd.html`: historical RLUSD-001 ledger replay and two explicitly synthetic cases; no live balance/supply promise.
- `rwa.html`: historical MPT-001 passport and synthetic issuer/lock cases; off-chain issuer/legal/reserve/rights state UNKNOWN.
- `defi-guard.html`: synthetic deterministic guard threshold/alert preview, no live delivery. Canonical operational Guard system lives in `proofandsignal/DeFi-Guard`.

Each module provides Explainable Decision + Evidence Boundary + JSON export + readable mobile-responsive layout. The source cases are maintained in the XRPL repository. Do not treat this UX as proof of current on-chain state.

## Existing Render links
The panel links to six existing Render services. Render status LIVE is **deployment evidence only**. It is not proof that browsers can open the site, that routes work or that QA passed. DeFi Risk Monitor currently links to an API endpoint, not a verified premium UI. DeFi Market Risk currently links to an Evidence Pack preview, not a verified full client risk-report interface.

## Release gate for EACH of the nine products
1. Isolated private HTTPS preview and product-specific standalone Explore route.
2. Premium look, themed visual identity, logo top-left and Proof & Signal attribution; English client-facing copy.
3. Working synthetic cases with clear boundaries; all live claims independently evidenced.
4. Desktop Chromium browser interaction tests, invalid-input and export tests, accessibility smoke test.
5. Real physical Samsung Android QA.
6. Independent security, legal, methodology and IP/rights review (claim source differs from verification source).
7. Explicit human approval to share publicly; no silent production merge or capital / wallet actions.

Only after all these gates are PASS may a product card be labeled `DEMO PASS`.

## Local checks
```bash
node --test preview/boost-nine/test.mjs
```
The test does not establish browser QA, security review, live content correctness, Android QA or any deployment.

## Status
`BUILD CANDIDATE → STATIC TESTS PENDING → BROWSER QA → SECURITY QA → PRIVATE HTTPS → SAMSUNG QA → HUMAN APPROVAL`

No new paid APIs, autonomous trading, signing, wallet connection or real funds.


## Protected HTTPS deployment preparation (NOT authorized for deployment yet)
Prerequisite: recorded independent Security / Legal / IP review acceptance on
[RELEASE-009](https://github.com/proofandsignal/XRP/issues/31).
Do not deploy or share publicly before that acceptance.

After review, provision ONE isolated Render **Free** Node web service in `My Workspace`:
- repo: `proofandsignal/XRP`
- branch: `demo/boost-nine-20261113`
- Auto-Deploy: `OFF`
- build command: `node --test preview/boost-nine/test.mjs preview/boost-nine/protected-preview.test.mjs`
- start command: `node preview/boost-nine/server.mjs`
- environment: `PREVIEW_USER` and a unique randomly generated `PREVIEW_PASSWORD` at least 24 characters long as Render secrets; never commit or log credentials.
- route names: `/`, `/rlusd.html`, `/rwa.html`, `/defi-guard.html`.
- all paths (including index) require HTTP Basic authentication; no web-hosted credential sharing in the public repository.
- the six previous Render URL links remain external and **are not** covered by this protected service; review their separate exposure and product gates.

The HTTPS hostname itself is not confidential; protection is enforced by server-side authentication.
After deployment, verify unauthorized 401, authenticated 200, CSP response headers, desktop browser interactions, 390px viewport and actual physical Samsung device.
**Do not mark Full Demo PASS automatically.**
