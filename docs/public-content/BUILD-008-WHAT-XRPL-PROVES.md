# What XRPL Proves — and What It Does Not

Status: PUBLIC CONTENT DRAFT
Audience: International XRPL builders, issuers, tokenization teams, wallets, risk and compliance teams.

A blockchain can make some facts highly verifiable. It cannot make every business or legal claim true.

That distinction is the foundation of the Proof & Signal XRPL Intelligence Screen.

## What validated XRPL data can establish

Depending on the asset and account type, validated ledger evidence can establish facts such as:

- account configuration,
- issuer control flags,
- trust-line state,
- observable issued-asset balances and relationships,
- AMM ledger state,
- MPT configuration,
- a specific validated ledger index and hash,
- whether selected on-ledger properties changed between two observations.

These facts can be anchored to the ledger evidence used by the analysis.

## What the ledger does not prove by itself

On-ledger configuration alone does not prove:

- legal issuer identity,
- reserve sufficiency,
- off-chain asset ownership,
- redemption enforceability,
- regulatory compliance,
- creditworthiness,
- liquidity quality outside the observed ledger evidence,
- investment safety.

Those claims need separate external evidence.

## Why this matters

A single opaque risk score can hide the difference between:

1. a fact directly observed on XRPL,
2. an external claim supported by another source,
3. an interpretation made by an analyst or system.

The Risk Passport model keeps those categories separate.

Missing evidence remains `UNKNOWN`. It does not silently become `PASS`.

## BUILD-008 direction

The XRPL Intelligence Screen is being designed as one surface for:

- account and issuer controls,
- asset evidence,
- AMM state,
- RWA/MPT evidence,
- material transitions,
- deterministic findings,
- provenance,
- Risk Passport export.

The goal is not to predict whether an asset is "good" or "bad."

The goal is to make the evidence, changes and remaining unknowns easier to verify.

## Current maturity

The product is under active development and validation. Automated success is not represented as production readiness, and live verification remains a separate gate.

Proof of Action ≠ Proof of Outcome ≠ Proof of Value.
