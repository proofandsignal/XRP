# PRODUCT-002 — RWA Risk Passport v0.1

**Status:** TECHNICAL PROTOTYPE / VALIDATION NOT STARTED  
**Source lab:** LAB-005  
**Execution:** read-only  
**Mainnet capital:** locked  
**Commercial claim:** none yet

## Product thesis

Tokenized assets need an interpretable evidence layer that separates:

1. what the ledger proves,
2. what an issuer claims,
3. what independent sources verify,
4. what is still unknown.

The first XRPL surface is Multi-Purpose Token issuance evidence.

## Initial passport

```
Asset / Issuance
  ↓
Issuer + supply + metadata
  ↓
Control capabilities
  ├─ authorization
  ├─ lock / freeze
  ├─ clawback
  ├─ transferability
  ├─ trading
  ├─ fees
  └─ permissioned-domain link
  ↓
External evidence gaps
  ├─ legal identity
  ├─ backing / reserves
  ├─ redemption rights
  ├─ regulatory status
  └─ liquidity quality
  ↓
PASS / REVIEW / UNKNOWN
```

For v0.1, `PASS` remains locked until the external evidence model is independently verified.

## Target users — hypothesis

- RWA issuers and tokenization platforms
- institutional / treasury teams
- wallets, explorers and data providers
- compliance / risk teams
- DeFi protocols evaluating tokenized collateral

These are hypotheses, not validated buyer segments.

## Monetization hypotheses

- B2B passport / due-diligence API
- issuer / asset monitoring
- risk reports
- integrations for wallets, explorers and institutional workflows

Pricing is not validated.

## Next gate

`TECHNICAL PROOF → 5 QUALIFIED EXTERNAL CONTACTS → 2 SERIOUS INTEGRATION ATTEMPTS → 1 MONETIZATION / ECOSYSTEM SIGNAL`

Do not expand into dashboards, execution, custody or generic token scoring before this gate.
