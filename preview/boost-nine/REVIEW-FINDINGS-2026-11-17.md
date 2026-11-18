# RWA Risk Passport — reviewer findings triage (2026-11-17)

**Source:** User-supplied assessment of PR #30 at `bc85101d3daffb7eade59683101dd8d29b0f9300`. No authenticated independent GitHub reviewer or qualified legal professional signature provided. Treat as **external preliminary review / AI pre-review if produced by Google Gem**. Do not confuse report with release approval.

| Finding | Severity reported | Author remediation | Remaining gate |
|---|---|---|---|
| FIN-01 | HIGH | Prominent warning above RWA explorer, legal/off-chain limitations also exported in JSON, static and Chromium regression | Reviewer verify wording and disclosure adequacy |
| QA-01 | MEDIUM | Not executable here | Real Samsung Chrome/Samsung Internet test on protected URL, screenshots + export evidence |
| SEC-01 | MEDIUM | Canonical path verification, path fuzz and malformed authorization regression | Qualified reviewer must assess Basic Auth, brute force, reverse-proxy TLS, secrets, CSP, unauthorized routing in actual staging |
| LEG-01 | HIGH | Client wording framed as research-only | Qualified counsel signs jurisdiction-specific advice / rights and regulatory claims; IP review |

**Historical MPT-001 claim:** local repo `validation/cases/MPT-001.md` lists issuance `05EECEBE97A7D635DE2393068691A015FED5A89AD203F5AA`, ledger `107775551`, hash `ABB04B5374AA7A141AAA698D372F99BAB7224C07E0E59A7A60B6C4ABCEA1901F`, snapshot 2026-10-20. The incoming report states verified on-chain but does not provide reproducible primary RPC request/response, node, independent ledger hash capture or provenance. **Independent reproduction remains pending**. On-ledger `COMPLETE` never covers off-chain issuer identity, collateral backing, reserves, redemption, compliance, liquidity or legal enforceability.

**Sequence:** author CI on new SHA → independent technical and qualified legal/IP re-review with evidence and named reviewer → authorized isolated protected HTTPS (Render Free, Auto-Deploy OFF, no merge) → hosted 401/200/CSP/functional QA → physical Samsung QA → version-specific explicit human approval. No production/public rollout or real funds.

`NO NEW INDEPENDENT EVIDENCE → NO GATE CHANGE`.

## Reviewer report 2 — claim-specific adjudication, 2026-11-18
A second report asserted SEC-01 "no strict CSP" and FIN-01 "the repo claims MPT-001 is fully backed" without giving line references proving either claim. Direct source inspection at SHA 8bc077575ffd03a9026fd8e44e1b0b8f5559b6ca finds:
- The server already returned script-SHA256 CSP on authenticated pages and the tests asserted it. **"No CSP" is refuted by code**. New hardening hashes inline style blocks as well, removes remaining style attributes in the hub and Guard, applies deny-by-default CSP on error responses, compares password credentials using constant-length SHA-256 digests, and throttles failed attempts per direct socket address, ignoring spoofable X-Forwarded-For. The proxy address is not the real user IP in all deployments, so provider-edge protection and external security assessment remain necessary.
- The RWA page explicitly says backing, legal identity and redemption rights are UNKNOWN; "fully backed" appears only as an unsupported claim in a **synthetic** metadata example. The financial finding is valid as **missing third-party backing evidence**, not as proof of a false representation by the current demo. No reserve proof/prospectus can be invented and none is a requirement to display an honest historical/synthetic research-only case.
- `05EECEBE97A7D635DE2393068691A015FED5A89AD203F5AA` is an **MPTokenIssuanceID**, not the issuer account; ledger issuer account is `rNFta7UKwcoiCpxEYbhH2v92numE3cceB6`. Do not mark ledger verification independently PASS absent reproducible RPC request/response.
- Physical Samsung, qualified Legal/IP and independent security review remain blocked. New author CI needed on new head.
