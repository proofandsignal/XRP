# XRPL Intelligence Screen

## Product direction

Build one evidence-first decision surface for XRPL accounts, issuers, issued assets, AMMs, MPT/RWA instruments, transitions and Risk Passports.

The user should not need to choose a separate product before analysis. A subject is entered once, applicable analyzers are selected automatically, and results are rendered in one screen.

## Surface

```
INPUT
  ↓
SUBJECT DETECTION
  ↓
XRPL CORE
  ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Account      │ Issuer/Asset │ AMM          │ MPT / RWA    │
│ Analyzer     │ Analyzer     │ Analyzer     │ Analyzer     │
└──────────────┴──────────────┴──────────────┴──────────────┘
  ↓
Transition Engine
  ↓
Risk Engine
  ↓
Evidence Layer
  ↓
Risk Passport
  ↓
XRPL Intelligence Screen
```

## Screen sections

- Overview: PASS / REVIEW / BLOCK without a synthetic 0–100 score.
- Issuer & Asset Controls.
- AMM & Liquidity.
- Change Intelligence.
- External Evidence.
- Findings.
- Evidence / provenance.
- Tools: Risk Passport, issuer view, AMM view, transitions, raw evidence, compare, JSON export, API.

## Evidence boundary

Three namespaces remain separate:

1. XRPL ledger facts.
2. External evidence and claims.
3. Analyst/system interpretation.

Missing evidence remains `UNKNOWN`. On-ledger capability does not by itself prove misuse, solvency, legal status, backing, liquidity quality or investment safety.

## Current build lineage

`v0.3 CORE → BUILD-004 ISSUER → BUILD-005 AMM → BUILD-006 TRANSITIONS → BUILD-007 RISK PASSPORT → BUILD-008 UNIFIED SCREEN`

BUILD-008 is a product-surface direction. It does not change the evidence standard or unlock signing/trading.

## Commercial direction

The same screen can support:
- stablecoin issuers,
- RWA/tokenization platforms,
- wallets and explorers,
- institutional DeFi,
- custody and compliance teams,
- payment infrastructure,
- internal risk/research teams.

The machine-readable Risk Passport remains the shared contract underneath the UI and future API.
