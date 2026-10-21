# RLUSD-003 — A real XRPL signing-authority transition

Status: **LIVE-HISTORICAL VERIFIED — READY FOR PUBLICATION REVIEW**

The previous RLUSD cases established two things:

1. stable validated evidence can correctly produce **NO MATERIAL CHANGE**;
2. a real issuer-control change can correctly produce **MATERIAL CHANGE**.

RLUSD-003 tests a deeper institutional question:

> Can the same system detect a material change in who or what is allowed to authorize transactions, even when the risk state itself does not change?

The answer is yes.

## Stage A — a signer list appears

Between validated ledgers **89,925,796** and **89,925,797**, a successful `SignerListSet` transaction created a multi-signing configuration for the RLUSD issuer account.

Transaction:

`38E3C789E229FF24778B9A5E6CCC6CABFA62DA98AC217C2A70D1A6A6E39468E`

Observed after the transaction:

- signer lists: `0 → 1`
- signer quorum: `15`
- signer entries: `8`
- total configured signer weight: `56`
- regular key: none observed
- master key: still enabled

The deterministic risk state stayed:

`REVIEW → REVIEW`

But the Transition Engine classified the change as:

> **MATERIAL_CHANGE**

Event:

`SIGNER_LIST_CHANGED`

That is intentional. A signing-authority change can be operationally important even when no risk label changes.

## Stage B — the master key is disabled

A few ledgers later, between **89,925,802** and **89,925,803**, the issuer account submitted a successful `AccountSet` transaction with:

`SetFlag: 4`

XRPL defines this as `asfDisableMaster`.

Transaction:

`9A4212D87787986E262164A0A76558D76A6152835DBCC064EEF05A88CF2C92BA`

Observed transition:

- master key disabled: `false → true`
- signer list count: `1 → 1`
- alternative signing path visible: `true → true`
- risk state: `REVIEW → REVIEW`

The Transition Engine emitted:

- `ACCOUNT_FLAGS_CHANGED`
- `MASTER_KEY_STATUS_CHANGED`

Classification:

> **MATERIAL_CHANGE**

## Why this matters

For institutional infrastructure, “risk score changed” is too narrow a monitoring model.

A custodian, wallet, tokenization platform, exchange or compliance team may need to know that:

- a signer list was introduced or replaced;
- quorum or signer weights changed;
- a regular key changed;
- the master key was disabled or re-enabled.

These are authorization-surface changes.

The ledger can prove the configured signing paths at each validated state. It cannot prove who controls those keys off-chain, whether a signer is compromised, or whether the organization's governance process is sound.

That separation is essential.

## Three verified behaviors now exist

`STABLE EVIDENCE → NO_MATERIAL_CHANGE`

`ISSUER CONTROL CHANGE → MATERIAL_CHANGE`

`SIGNING AUTHORITY CHANGE → MATERIAL_CHANGE`

This is the direction of the Proof & Signal XRPL Intelligence Screen: precise, evidence-backed change intelligence rather than a generic alert feed.

Primary XRPL references:
- SignerListSet / multi-signing
- AccountSet / asfDisableMaster

This is technical evidence research, not investment advice.
