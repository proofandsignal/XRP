# PRODUCT-001 — AgentPay Guard v0.1

**Status:** PRODUCT CANDIDATE / VALIDATION  
**Source proof:** LAB-004A → LAB-004B → LAB-004C  
**Mainnet:** locked  
**Commercial claim:** none yet

## Problem

AI agents can receive machine-readable payment requirements from remote services. The remote requirement is untrusted input, while the signing key / wallet is a high-impact capability.

A paying agent therefore needs a deterministic local boundary between:

```
remote 402 response
and
wallet/signing/payment execution
```

## Product thesis

**AgentPay Guard** is a buyer-side pre-sign payment policy firewall for machine payments.

```
Agent
  ↓
HTTP / tool request
  ↓
402 Payment Required
  ↓
AgentPay Guard
  ├─ network policy
  ├─ asset policy
  ├─ merchant allowlist
  ├─ facilitator allowlist
  ├─ max per transaction
  ├─ daily budget
  ├─ review threshold
  ├─ field whitelist
  └─ audit hash
  ↓
BLOCK / REVIEW / ALLOW
  ↓
wallet / x402 paying client
```

## Differentiation boundary

AgentPay Guard is **not**:
- a facilitator,
- custody,
- an XRPL wallet,
- a replacement for facilitator-side risk scoring,
- a generic fraud oracle.

Its initial differentiation is:
1. buyer-side / pre-sign;
2. deterministic and fail-closed;
3. independent of the remote merchant;
4. auditable decision evidence;
5. designed to sit in front of an existing x402 payer.

This is complementary to facilitator-side verification/risk systems rather than a copy of them.

## v0.1 surfaces

### Core library

Reusable deterministic functions:
- normalize payment intent;
- parse x402 payment requirements;
- evaluate local policy;
- produce `ALLOW / REVIEW / BLOCK`;
- hash intent for audit.

### HTTP API prototype

- `GET /health`
- `POST /v1/intent/evaluate`
- `POST /v1/x402/evaluate`

The API **does not sign or pay**. It is intentionally separated from custody.

## Target users — hypothesis

- AI-agent developers using x402 / machine payments;
- wallet or agent-runtime developers;
- enterprise automation / treasury teams evaluating autonomous payments;
- infrastructure teams that want an external policy/audit layer before signing.

These are hypotheses to validate, not established customer segments.

## Monetization hypotheses

1. hosted policy API;
2. team/enterprise policy + audit dashboard;
3. private deployment / enterprise integration;
4. usage-based guard checks;
5. paid support / policy packs.

No pricing is validated yet.

## Product-value gate

Technical proof is already PASS. PRODUCT-001 advances only if external evidence appears.

Initial validation target:
- 5 qualified developer / infrastructure conversations;
- 2 external prototype integrations or serious integration attempts;
- at least 1 concrete monetization signal: paid pilot, willingness-to-pay quote, grant/program interest tied to the artifact, or partner integration.

These numbers are an experiment contract, not a claim of market size.

## Kill / hold criteria

HOLD if:
- standard x402/wallet SDKs absorb equivalent buyer-side policy + audit with no meaningful differentiation;
- external developers do not see a problem worth integrating;
- policy runs cannot be made chain/payment-rail agnostic enough to justify a standalone layer;
- no monetization/ecosystem signal appears after the validation batch.

## Next technical constraint

Do not add more payment rails, dashboards or Mainnet execution before PRODUCT-001 external validation.

Allowed engineering work:
- integration ergonomics,
- correctness,
- security,
- audit schema,
- defects found during pilots.

Not allowed:
- feature expansion without external evidence.
