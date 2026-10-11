# LAB-004B — x402 Pre-Sign Guard

## Purpose

Connect the proven LAB-004 AgentPay policy engine to the actual HTTP x402 boundary.

The core rule is:

> The paying client must never see a 402 requirement until the requirement has passed local deterministic policy.

## Flow

```
raw fetch
  ↓
HTTP 402
  ↓
strict PaymentRequired parser
  ↓
select XRPL/XRP exact requirement
  ↓
LAB-004 policy
  ├─ BLOCK  → stop; paying client calls = 0
  ├─ REVIEW → stop; paying client calls = 0
  └─ ALLOW  → paying client calls = 1
```

## Why this is separate from facilitator risk

The facilitator decides whether a payment is valid/settleable and may apply its own risk controls.

LAB-004B is buyer-side:
- remote payment requirements are untrusted;
- merchant/amount/network/asset/facilitator policy is local;
- signing is downstream of policy;
- ambiguity fails closed.

## Tests

```bash
cd labs/004b-x402-pre-sign-guard
npm install
npm test
```

## External compatibility smoke

```bash
npm run compat
```

This checks:
- pinned `x402-xrpl@0.3.3` buyer export exists,
- T54 Testnet facilitator `/supported` is reachable,
- XRPL Testnet support is advertised.

The compatibility smoke makes **no payment**.

## Safety

- no Mainnet,
- no wallet seed,
- no signing in compatibility smoke,
- BLOCK/REVIEW must never invoke the injected paying client.

## Next

LAB-004C may perform a guarded end-to-end Testnet x402 settlement and reconcile the receipt against ledger evidence.
