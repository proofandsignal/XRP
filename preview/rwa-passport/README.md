# XRPL RWA Risk Passport — standalone demo build candidate

**Canonical source:** `../boost-nine/rwa.html`; do not maintain a second app or copy edited HTML elsewhere.

**Product:** XRPL RWA Risk Passport, Created by Proof & Signal. Interactive historical MPT-001 snapshot + synthetic edge cases, read-only, browser JSON export, no live RPC, no wallet, no signing. Source-level evidence is distinct from independent verification.

## Build / QA

```sh
node --test preview/boost-nine/test.mjs preview/boost-nine/protected-preview.test.mjs preview/rwa-passport/build.test.mjs
node preview/rwa-passport/build.mjs
# output: dist/rwa-passport/index.html
```

The unprotected static output is **only a future public/demo artifact**. Do not host or distribute it before independent security/legal/IP clearance, physical Samsung QA and express owner approval. A robots.txt disallow is not access control.

## Deployment policy

- Current branch: `demo/boost-nine-20261113`; PR #30 stays DRAFT, no main merge.
- Render Free; auto-deploy OFF; no paid APIs, no wallet, no external transactions.
- Existing protected review server in `../boost-nine/server.mjs` remains the controlled QA candidate pending approval by the release owner and independent reviewers.
- **Do not deploy this static build without separate owner approval for internet exposure**, even if its URL is unlisted.
- A working HTTPS URL, real desktop browser interactions and physical Samsung are required before full Demo PASS.
- No technical CI test is qualified independent Security, Legal, Financial or IP sign-off.

## Brand / provenance

The logo and hero illustration are original SVG markup inside the canonical HTML; no external images, icons, paid fonts or partner logos. XRPL is a descriptive protocol reference, not an affiliation claim. Confirm with qualified IP reviewer.

## Demo limits

On-chain control fields are not legal identity/reserves/redemption. The historical example is dated 2026-10-20; the other three cases are explicitly synthetic. External backing and safety are UNKNOWN; passport PASS and investment safety PASS remain locked. Avoid calling historical Mainnet fields independently verified without raw primary archive RPC proof.
