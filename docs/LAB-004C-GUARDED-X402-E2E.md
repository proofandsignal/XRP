# LAB-004C — Guarded x402 End-to-End Testnet

## Goal

Prove the complete buyer-side machine-payment path:

```
HTTP request
→ 402 Payment Required
→ LAB-004B pre-sign guard
→ x402 paying client
→ T54 Testnet facilitator
→ XRPL Testnet settlement
→ PAYMENT-RESPONSE receipt
→ independent ledger reconciliation
```

## Two mandatory cases

### Allowed
- 1,000 drops
- approved merchant
- approved facilitator
- XRPL Testnet / XRP
- local policy returns ALLOW
- paying client is invoked exactly once
- facilitator settles
- merchant returns resource
- settlement transaction is independently queried on XRPL
- destination and amount match the guarded intent

### Blocked
- 10,001 drops
- same merchant / network / facilitator
- exceeds local max-per-transaction policy
- local policy returns BLOCK
- paying client invocation count does not increase
- no settlement is attempted

## Safety

- Testnet only.
- Ephemeral faucet-funded payer and merchant.
- No seed/private key is persisted or uploaded.
- Mainnet is not configured.
- Failure to obtain/reconcile a settlement receipt is FAIL/REVIEW, never inferred success.

## Gate

LAB-004C PASS requires both:
1. real guarded Testnet x402 settlement with independent ledger proof;
2. over-limit x402 challenge blocked before payer invocation.

Only after this gate may the project evaluate a product-facing AgentPay Guard demo/API.
