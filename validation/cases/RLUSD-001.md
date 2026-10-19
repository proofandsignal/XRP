# CASE RLUSD-001 — Ripple USD issuer evidence

Status: LIVE XRPL EVIDENCE RUNNING
Date opened: 2026-10-19

## Identity anchor

Asset: Ripple USD (RLUSD)

XRPL Mainnet issuer:
`rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`

Official identity source:
https://docs.ripple.com/products/stablecoin/overview/token-addresses

Official XRPL developer source:
https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-the-xrpl

## External evidence namespace

Ripple states separately from the ledger that RLUSD reserves are held in segregated accounts and publishes monthly reserve reports:
https://ripple.com/products/stablecoin/transparency/

This external evidence is **not** converted into an XRPL ledger fact.

## Live evidence target

BUILD-008 will read the official Mainnet issuer using validated XRPL evidence and record:

- validated ledger index,
- ledger hash,
- account configuration,
- issuer-control flags,
- observed issued-asset/trust-line state within configured pagination limits,
- deterministic findings,
- unsigned Risk Passport ID,
- evidence fingerprint,
- artifact integrity hash.

## Publication gate

Do not publish a case conclusion until the live workflow produces an evidence artifact.

Allowed before live PASS:
- official issuer identity,
- methodology,
- evidence-boundary explanation.

Not allowed before live PASS:
- claimed issuer-control state,
- claimed finding list,
- claimed holder/trust-line counts from BUILD-008,
- claimed Risk Passport result.

## Reuse plan

If live evidence passes:

1. Demo case in XRPL Intelligence Screen.
2. International post: "RLUSD on XRPL: what the ledger proves and what requires external evidence."
3. Bulgarian XRP Community adaptation.
4. Lead reason for stablecoin issuers, tokenization platforms, wallets, custody and compliance teams.
