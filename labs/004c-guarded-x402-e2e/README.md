# LAB-004C — Guarded x402 Testnet E2E

## What this proves

A real machine-payment request can cross all of these boundaries:

```
merchant 402
→ strict parse
→ AgentPay Guard
→ x402 payer
→ facilitator
→ XRPL Testnet
→ merchant resource
→ settlement receipt
→ independent ledger lookup
```

At the same time an over-limit challenge must stop before the payer client.

## Live run

```bash
cd labs/004c-guarded-x402-e2e
npm install
npm run live
```

The script creates ephemeral Testnet wallets for payer and merchant and starts a local merchant server with two x402-protected endpoints.

No seed is written to disk.

## PASS

- allowed challenge: guard = ALLOW
- exactly one paying-client invocation
- resource returns HTTP 200
- settlement receipt contains a transaction hash
- independent XRPL lookup reports validated transaction
- payer / merchant / 1,000-drop amount match
- blocked 10,001-drop challenge = BLOCK
- blocked challenge does not invoke paying client

## External dependency

The experiment uses the public T54 XRPL Testnet facilitator. External service availability is therefore part of this lab's observed evidence, not something inferred.
