# CASE RLUSD-001 — Ripple USD issuer evidence

Status: **LIVE VERIFIED — PARTIAL TRUST-LINE INVENTORY**  
Verified: 2026-10-19

## Identity anchor

Asset: Ripple USD (RLUSD)  
Network: XRPL Mainnet  
Issuer: `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`

Official identity source:  
https://docs.ripple.com/products/stablecoin/overview/token-addresses

## Validated ledger anchor

- ledger index: `107761290`
- ledger hash: `137E4B85103AA3E67224EDAB8933DB1E8F2A038B769E505FCC198CBABBADABF7`
- validated: `true`
- captured at: `2026-10-19T11:57:16.234Z`

## Deterministic decision

- risk state: `REVIEW`
- evidence status: `PARTIAL`
- BLOCK findings: `0`
- REVIEW findings: `1`

Finding: `CLAWBACK_CAPABILITY_ENABLED`.

The issuer account has trust-line clawback capability enabled. This is an issuer-control capability and **is not evidence of misuse**.

## AccountRoot observations

Observed at the validated ledger above:

- Global Freeze: `false`
- Clawback capability: `true`
- DepositAuth: `true`
- Default Ripple: `true`
- Disable Master: `true`
- Disallow XRP: `true`
- Require Auth: `false`
- Require Destination Tag: `true`
- Trust-line locking capability: `false`
- domain: `https://ripple.com/`

Raw AccountRoot flags: `2174353408`.

## Bounded trust-line evidence

The live run intentionally enforces a bounded evidence scan.

Observed before the configured bound:

- trust lines observed: `20,000`
- issued assets observed: `1` (RLUSD)
- issuer-holder lines observed: `15,513`
- issuer-frozen holder lines observed: `0`
- observed RLUSD obligation sum: `56,337,876.2512472175807424692641`

**These are lower bounds, not complete totals.** The trust-line scan reached `MAX_ITEMS`, so the result is marked `PARTIAL`. The obligation value must not be presented as total supply, total circulation or complete issuer obligation.

Data incompleteness is an evidence-quality issue, not an asset-risk BLOCK.

## Risk Passport

- passport ID: `xrpl:account:mainnet:rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De:107761290:b4fd6eafc5702019`
- attestation: `UNSIGNED`
- evidence fingerprint SHA-256: `b4fd6eafc5702019c1419a12cc7caa28d6bd90e4f1867a06f0305439c30c0422`
- artifact SHA-256: `259baefa013c74c655086177aeb9b0ed48c921777a533160a9487507d2dbaf2b`

The hashes support deterministic artifact integrity. They do not authenticate a publisher signature.

## Reproducibility provenance

GitHub Actions run: `39248304831`  
Workflow artifact: `12185035018`  
Artifact ZIP SHA-256: `4e45dd9b9a6ce84a553156866e6335ec129c83882fc2385c0fa2d18d486fa6e4`  
Head commit: `d7b0e0ebcd78d626cccc46b5eaf802a65ae379be`

## External evidence namespace

Ripple separately publishes RLUSD transparency and reserve information:

https://ripple.com/products/stablecoin/transparency/

Reserve sufficiency, redemption rights, legal issuer identity and regulatory claims remain external evidence. They are not converted into XRPL ledger facts by this case.

## Reuse

This verified case can now support the XRPL Intelligence Screen demo, international educational content, a Bulgarian XRP Community adaptation and workflow-specific B2B outreach.

This is technical evidence research, not investment advice.
