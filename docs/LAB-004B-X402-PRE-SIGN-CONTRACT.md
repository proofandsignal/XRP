# LAB-004B — X402 Pre-Sign Guard Contract

## Goal

Prove that a real x402 `402 Payment Required` response can be treated as untrusted input and gated **before** any paying client or signing path is invoked.

## Boundary

LAB-004A proved:

```
normalized intent → policy → ALLOW/BLOCK → simulate → sign → Testnet settlement
```

LAB-004B proves the missing HTTP-native boundary:

```
HTTP request
  ↓
402 Payment Required
  ↓
strict x402 parse
  ↓
normalize selected requirement
  ↓
AgentPay Guard
  ↓
BLOCK / REVIEW / ALLOW
  ↓
paying client invoked only on ALLOW
```

## Differentiation

This lab is intentionally **buyer-side / pre-signing**.

It does not attempt to replace:
- the XRPL x402 facilitator,
- facilitator-side verification and settlement,
- T54 X402 Secure / Trustline risk decisions,
- wallet custody or signing infrastructure.

The product hypothesis is a local deterministic policy firewall that can sit in front of any compatible x402 paying client.

## Fail-closed rules

- unsupported x402 version → BLOCK
- malformed payment requirements → BLOCK
- non-`exact` scheme → BLOCK
- non-XRPL network → BLOCK
- unreviewed top-level requirement fields → BLOCK
- unreviewed `extra` fields → BLOCK
- no policy-compatible option → BLOCK or REVIEW
- more than one policy-allowed option → BLOCK as ambiguous
- merchant, amount, asset, network, facilitator or SourceTag policy failure → BLOCK
- human-review threshold → REVIEW
- only exactly one `ALLOW` requirement can reach `payingFetch`

## No-spend CI proof

Unit/integration tests inject a fake paying client and assert:

```
BLOCK  → signer/payer invocations = 0
REVIEW → signer/payer invocations = 0
ALLOW  → paying client invocations = 1
```

## External compatibility smoke

A separate workflow:
1. imports pinned `x402-xrpl`,
2. confirms the buyer API is available,
3. calls the public T54 Testnet facilitator `/supported` endpoint,
4. records sanitized compatibility evidence.

This smoke performs **no payment** and uses **no wallet seed**.

## Next gate

Only after LAB-004B passes do we consider LAB-004C:

> guarded end-to-end x402 Testnet settlement + receipt reconciliation.

No Mainnet payment is allowed in this phase.
