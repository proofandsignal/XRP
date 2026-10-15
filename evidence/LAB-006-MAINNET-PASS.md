# LAB-006 — RLUSD Intelligence Mainnet Read-Only PASS

## Decision

**TECHNICAL PROOF PASS**

This record proves that LAB-006 v0.1 can read and normalize live RLUSD state from the XRP Ledger Mainnet without signing, submitting transactions, creating trust lines, trading, holding custody or moving capital.

It does **not** prove product-market fit, reserve sufficiency, redemption solvency, regulatory compliance, complete RLUSD network flow, predictive information edge or investment safety.

`PASS` remains locked in the intelligence output. The runtime decision is `REVIEW`.

## Accepted run

- Workflow: `LAB-006 RLUSD Intelligence`
- Pull request: #20
- Run: `38748454435`
- Head: `567c6d31f9db769f8e67dc9f5ca224cb7cac73bf`
- Unit tests: **PASS**
- Live Mainnet read-only smoke: **PASS**
- Artifact ID: `11980382972`
- Artifact digest: `sha256:1dba2dc49db695a18297ca80b72ca8281adb39c48225f79532663a0cf4f61c0e`

## Frozen snapshot

Observed at:

`2026-10-15T14:06:48.913Z`

Validated XRPL ledger:

- ledger index: `107674173`
- ledger hash: `AD93722CB267F0046BECDF794822ED5D2B29D9D2F86D5D8E99320A9F7FB20C09`

All point-in-time issuer, supply, order-book and AMM evidence in the accepted snapshot was pinned to this same validated ledger.

## Official RLUSD identity

- asset: `RLUSD`
- XRPL Mainnet issuer: `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`
- currency hex: `524C555344000000000000000000000000000000`

Issuer account evidence:

- verification: `VERIFIED`
- owner count: `19`
- domain field resolves to the hex representation of `https://ripple.com/`

## On-ledger obligations signal

Source:

`gateway_balances`

Result:

- verification: `VERIFIED`
- outstanding RLUSD signal: `1052260007.841474`

Interpretation boundary:

This is the XRPL on-ledger issued-obligation signal at the frozen ledger. It is **not** proof that off-chain reserves are sufficient and it is **not** an independent reserve attestation.

## XRP / RLUSD market surfaces

Both bounded order-book directions returned successfully at the frozen ledger:

- `XRP_FOR_RLUSD`: `VERIFIED`, 20 offers returned
- `RLUSD_FOR_XRP`: `VERIFIED`, 20 offers returned

The 20-offer limit is an observation window, not a claim of total market depth.

### AMM

XRPL XRP/RLUSD AMM:

- verification: `VERIFIED`
- state: `PRESENT`
- AMM account: `rhWTXC2m2gGGA9WozUaoMm6kLAVPb1tcS3`
- XRP-side amount: `1855637491732` drops
- RLUSD-side amount: `2405014.096525283`
- trading fee field: `205`
- RLUSD side frozen: `false`

This is point-in-time on-ledger liquidity state, not guaranteed executable depth or a profitability claim.

## Bounded issuer activity

The collector inspected the most recent 50 issuer-account transactions with an upper bound at the frozen snapshot ledger.

- verification: `VERIFIED`
- scope: `BOUNDED_ISSUER_ACCOUNT_ACTIVITY`
- transactions scanned: `50`
- OfferCreate: `28`
- Payment: `13`
- OfferCancel: `9`

All 50 normalized records contained transaction hashes in the accepted artifact.

This sample is **not** described as complete RLUSD network flow. Transfers between holders can occur without representing a complete issuer-account flow surface.

## Explicit external evidence gaps

The accepted artifact keeps the following as external evidence requirements:

- reserve sufficiency: `UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED`
- redemption solvency: `UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED`
- regulatory status: `UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED`
- off-chain USD flows: `UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED`

## QA history

The first green smoke exposed two evidence-quality weaknesses:

1. independent `validated` requests could land on adjacent ledgers;
2. one order-book request returned a transient `tooBusy`.

Before accepting technical proof, LAB-006 was corrected to:

- freeze one validated ledger index for the snapshot,
- use that ledger for issuer/supply/book/AMM reads,
- cap issuer activity at that ledger,
- retry transient `tooBusy` responses,
- verify all returned point-in-time ledger indices match the frozen ledger.

The corrected run above passed these checks.

## Technical conclusion

`LAB-006 v0.1 → UNIT TESTS PASS → LIVE MAINNET READ-ONLY PASS → FROZEN SNAPSHOT PASS → TECHNICAL PROOF PASS`

Next sequence remains:

`TECHNICAL PROOF → INFORMATION EDGE → PRODUCT VALUE → MONETIZATION`
