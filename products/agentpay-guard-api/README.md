# AgentPay Guard API v0.1

A non-custodial policy API prototype built from the XRPL AgentPay Guard labs.

**Signing is disabled by design.**

## Endpoints

### Health

```
GET /health
```

### Evaluate normalized intent

```
POST /v1/intent/evaluate
```

Returns:
- `ALLOW`
- `REVIEW`
- `BLOCK`

### Evaluate x402 PaymentRequired

```
POST /v1/x402/evaluate
```

The service strictly parses x402 payment requirements, normalizes XRPL/XRP candidates and applies the configured local policy.

## Run

Install the core dependency first:

```bash
cd packages/agentpay-guard-core
npm install
npm test
```

Then:

```bash
cd ../../products/agentpay-guard-api
npm install
export AGENTPAY_POLICY_JSON='{"allowed_networks":["xrpl:testnet"],"allowed_assets":["XRP"],"allowed_merchants":["r..."],"allowed_facilitator_hosts":["xrpl-facilitator-testnet.t54.ai"],"max_per_tx_drops":"10000","review_above_drops":"5000","daily_budget_drops":"20000","spent_today_drops":"0"}'
npm start
```

## Boundary

This API returns policy decisions only.

It does not:
- store a seed,
- hold custody,
- sign,
- broadcast,
- settle,
- claim merchant/facilitator safety.

The tested paying flow remains in LAB-004C. Productization keeps policy and custody separated.
