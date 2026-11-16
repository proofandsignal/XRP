# LAB-007 — XRPL XRP/RLUSD Settlement Reconciliation (read-only)

**Status: isolated BUILD candidate; 20 deterministic local tests PASS; NOT independently audited or live-verified.**

The module matches a payment intent against caller-supplied XRPL ledger evidence. No network access, signing, custody, facilitator integration, transactions or funds movement.

## Input

Intent fields:
- network: xrpl:testnet, xrpl:devnet or xrpl:mainnet, pinned explicitly
- tx_hash: 64-character expected transaction hash, required to bind the invoice to the transaction
- payer and destination: pinned exact XRPL addresses
- destination_tag: optional but must match exactly, including its presence
- asset: currency XRP (amount in integer **drops**) or RLUSD (pin the exact network-specific issuer)
- amount: decimal **string**, never JavaScript floating point

Evidence fields:
- network, validated=true, ledger_index and ledger_hash
- tx: TransactionType=Payment, hash, Account, Destination, DestinationTag
- meta: TransactionResult=tesSUCCESS and delivered_amount. Never use tx.Amount as a fallback: a partial payment can deliver less.
- RLUSD delivered_amount contains currency, issuer and decimal string value.

Example: match a synthetic RLUSD 10.50 intent on testnet against a Payment with a 64-character pinned hash and a meta.delivered_amount object with value 10.5, the same pinned issuer and RLUSD currency hex 524C555344000000000000000000000000000000.

**A caller-controlled JSON flag validated=true is NOT proof.** A future authenticated XRPL source adapter must independently confirm validated ledger hash, transaction identity, metadata and network before using this module as evidence.

## Decision semantics

- PASS / PAYMENT_MATCHED: supplied fields match exactly. **Not** a signed attestation, proof of invoice discharge or no replay.
- REVIEW: insufficient, ambiguous or over-delivered evidence.
- BLOCK: definite wrong network, transaction hash, issuer, payer, destination/tag, unsuccessful transaction or under-delivery.
- Output always discloses replay_check=NOT_PERFORMED and external responsibility for ledger-source authentication on PASS.

## Boundaries / release blockers

1. Trusted live XRPL verification of ledger/transaction linkage is not implemented.
2. Durable one-hash-per-invoice replay/idempotency register is not implemented. Do not credit the same tx twice.
3. x402 facilitator receipt verification, merchant resource binding, payer budget reservations, crash recovery, keys and signing are not implemented. Respect AgentPay Guard validation freeze #12.
4. No proof of off-ledger fiat settlement, issuer reserves, regulatory compliance, legal ownership, or economic safety.
5. Independent Security/Financial/Legal/IP review, protected HTTPS, browser + physical Samsung QA and human approval are PENDING.

## Deterministic local QA

Run: cd labs/007-rlusd-settlement-reconciliation && npm test

No dependencies, paid APIs or secrets. Draft PR; MERGE HOLD / DEPLOY HOLD.
