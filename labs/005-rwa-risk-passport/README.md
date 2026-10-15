# LAB-005 — RWA / MPT Risk Passport

## Goal

Build a **read-only evidence passport** for XRPL Multi-Purpose Tokens (MPTs).

The lab reports what the validated ledger proves about an issuance and clearly separates that from evidence the ledger does **not** prove.

## v0.1 flow

```
MPTokenIssuanceID
        ↓
validated ledger_entry
        ↓
MPTokenIssuance normalization
        ↓
issuer account evidence
        ↓
control / metadata / supply facts
        ↓
RWA Risk Passport
        ↓
REVIEW / UNKNOWN
```

`PASS` is intentionally locked in v0.1 until independent evidence exists for issuer identity, backing/reserves, redemption rights, regulatory status and liquidity quality.

## Ledger facts normalized

- issuer
- asset scale
- maximum amount
- outstanding amount
- locked amount when available
- transfer fee
- metadata
- permissioned-domain link when present
- lock capability / current global lock
- holder authorization requirement
- escrow capability
- trading capability
- transfer capability
- clawback capability
- confidential-balance capability when present
- unknown flag bits

These are **capabilities and constraints**, not an automatic risk score.

## Run tests

```bash
cd labs/005-rwa-risk-passport
npm install
npm test
```

## Run a live read-only check

```bash
MPT_ISSUANCE_ID=<48-hex-character-id> npm run live
```

Optional:

```bash
XRPL_WS=<websocket-endpoint> MPT_ISSUANCE_ID=<id> npm run live
```

No seed, signing key, issuance transaction, trade or Mainnet capital is required.

## Hard evidence boundary

On-ledger configuration does not by itself prove:
- legal issuer identity,
- off-chain asset backing,
- reserve sufficiency,
- redemption enforceability,
- regulatory compliance,
- liquidity quality,
- creditworthiness,
- investment safety.

Missing evidence remains `UNKNOWN`.

## Technical gate

- deterministic tests PASS
- validated-ledger read succeeds on a real MPT issuance
- sanitized JSON artifact is captured
- no secrets persisted

Only after the technical gate do we open a separate external validation batch.
