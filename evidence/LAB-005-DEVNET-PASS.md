# LAB-005 — RWA / MPT Risk Passport — Devnet Technical Proof

**Status:** TECHNICAL PROOF PASS  
**Environment:** XRPL Devnet  
**Mode:** read-only / validated-ledger evidence  
**Mainnet capital:** none  
**Product demand:** not validated

## Verified run

- GitHub Actions workflow: `LAB-005 RWA Risk Passport`
- Run ID: `38678846556`
- Head commit: `c421e1792286a85b3815b8b6c8fc92f8157ba3a9`
- Unit tests job: PASS
- Live Devnet smoke job: PASS
- Artifact ID: `11946862073`
- Artifact digest: `sha256:da1d39293f2331a9e363052ffb831a61598028c12c9d665a4fb4cb96fd164944`

## Validated MPT evidence

- MPTokenIssuanceID: `00000001ADABAC76113A5DEA1D5899856711EA6722387922`
- Issuer: `rGqHZHQRKo9Tv3wiXyf8T69DrAunySpgH8`
- Validated ledger index: `6133381`
- Validated ledger hash: `62A6ED1BBB0CD240F6D834BBAD07048285362988E6242179BA22F9B1E0DD6B58`
- Ledger evidence verification: `VERIFIED`

Normalized facts from the live artifact:

- AssetScale: `1` (ledger field)
- MaximumAmount: `9223372036854775807` (protocol default because the field was absent)
- OutstandingAmount: `100000`
- LockedAmount: `0`
- ConfidentialOutstandingAmount: `0`
- TransferFee: `0%`
- Flags: `56`
  - can escrow: true
  - can trade: true
  - can transfer: true
  - can lock: false
  - require auth: false
  - can clawback: false
  - confidential balance capability: false
- ImmutableFlags: `0`
- Metadata: absent
- DomainID: absent
- Issuer encryption key: absent
- Auditor encryption key: absent

## Passport result

```
decision = REVIEW
pass_locked = true
review_points = [METADATA_NOT_DECODED]
```

The result is intentionally not `PASS`. On-ledger configuration does not independently prove:

- legal issuer identity,
- off-chain backing or reserves,
- redemption rights,
- regulatory status,
- independent liquidity quality,
- creditworthiness,
- investment safety.

Those fields remain `UNKNOWN`.

## Failure that improved the gate

The first live smoke used the static MPT ID from current XRPL documentation:

`05EECEBE97A7D635DE2393068691A015FED5A89AD203F5AA`

Devnet returned `entryNotFound` at validated ledger `6133300`, consistent with a reset/stale example. The lab was changed to discover a current `MPTokenIssuance` from the validated ledger, derive its 192-bit issuance ID from `Sequence + AccountID`, then independently resolve that ID with `ledger_entry`.

This prevents a stale documentation fixture from being mistaken for a product failure.

## Gate conclusion

`LAB-005 TECHNICAL PROOF = PASS`

What this proves:

- current validated MPT issuance discovery works,
- issuance ID derivation resolves independently,
- ledger facts normalize deterministically,
- protocol defaults are represented explicitly,
- missing external evidence stays UNKNOWN,
- the passport does not silently promote an asset to PASS.

What this does **not** prove:

- product-market fit,
- buyer demand,
- monetization,
- real-world asset backing,
- production/Mainnet readiness.

Next product gate after merge:

`5 QUALIFIED EXTERNAL CONTACTS → 2 SERIOUS INTEGRATION ATTEMPTS → 1 MONETIZATION / ECOSYSTEM SIGNAL`
