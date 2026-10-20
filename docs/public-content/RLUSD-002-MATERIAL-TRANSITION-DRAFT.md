# RLUSD-002 — How a real XRPL issuer-control change appears in validated evidence

Status: **LIVE-HISTORICAL VERIFIED — READY FOR PUBLICATION REVIEW**

The first RLUSD transition case showed that the Transition Engine can correctly stay quiet when the compared evidence is stable.

The second case asks the opposite question:

> Can the same engine detect a real historical issuer-control change without inventing a cause or relying on an opaque score?

## The real transaction

On XRPL Mainnet ledger **89,925,780**, the RLUSD issuer account submitted a successful `AccountSet` transaction:

`9B1042DD30188C9BAE7F81C5B3DB91F9C121669A359F4124FBB88531F8BAADA2`

The transaction used:

`SetFlag: 16`

XRPL defines this as `asfAllowTrustLineClawback`: enable the issuer's ability to claw back tokens it has issued on trust lines.

That capability is a control feature. Its presence is **not evidence of misuse**.

## Before

Validated ledger **89,925,779**

- risk state: `PASS`
- evidence status: `COMPLETE`
- clawback capability: `false`
- deterministic findings: none

Ledger hash:

`AD7308164F0CBFE88665A36DF1E541FEB24A9E75FCA3C5FA298064BEBF989D3E`

## After

Validated ledger **89,925,780**

- risk state: `REVIEW`
- evidence status: `COMPLETE`
- clawback capability: `true`
- finding added: `CLAWBACK_CAPABILITY_ENABLED`

Ledger hash:

`A8F0BF600D9969FCC6E8BD99E83FADC397CA93CD2DF2F33DC42DF63827C2EBF2`

## Transition result

The deterministic Transition Engine classified the pair as:

> **MATERIAL_CHANGE**

It emitted four events:

- `RISK_STATE_CHANGED`
- `FINDING_ADDED`
- `ACCOUNT_FLAGS_CHANGED`
- `ISSUER_CLAWBACK_ENABLED_CHANGED`

This is the behavior we want from evidence-first monitoring: do not alert because the ledger number changed; alert because a defined, verifiable control property changed.

## Why this matters for institutional workflows

A wallet, custodian, tokenization platform or risk team may care less about a generic score than about a precise statement:

> "At ledger X, this issuer did not have capability Y. At ledger X+1, it did."

That result can be independently checked against ledger evidence and then passed into policy, review or counterparty workflows.

The system does not claim that enabling clawback is malicious, unsafe or inappropriate. It only proves that the control state changed and that the configured deterministic policy moved the case from PASS to REVIEW.

This is technical evidence research, not investment advice.
