# VALIDATION-001 — XRPL/x402 Target 10

**Status:** ACTIVE VALIDATION  
**Product:** AgentPay Guard v0.1  
**Goal:** 5 qualified conversations → 2 real integration attempts → 1 monetization/ecosystem signal.

## Target 10

| # | Target | Why fit | Contact route | Priority |
|---|---|---|---|---|
| 1 | Good Meta — `goodmeta/a2a-x402-payment-agent` | Active A2A+x402 payer agent; payment logic is directly in the agent execution path. | GitHub Issues | P0 |
| 2 | NearDeFi — `NearDeFi/agent-payments-skill` | Agent payment skill already warns about approvals and wallet spend limits; strong pre-sign policy fit. | GitHub Issues | P0 |
| 3 | Xenarch — `xenarch-ai/x402-agent` | Framework-agnostic payer with BudgetPolicy and a documented `_pre_payment_hook`; clean integration surface. | GitHub Issues | P0 |
| 4 | Primer Systems — `primer-systems/x402` | x402 SDK + OpenClaw support + maxAmount/dry-run; external deterministic policy could sit before signing. | GitHub Issues | P0 |
| 5 | Omnivalent — `Omnivalent/x402-agent-pay` | Already has spending controls, recipient controls and audit trails; ideal differentiation/comparison target. | GitHub Issues | P0 |
| 6 | T54 / Garage Tech — `garage-tech/t54-labs-x402-secure` | XRPL-native x402 infrastructure and risk layer; strategic compatibility/positioning target. | Website/community / GitHub org | P1 |
| 7 | ObolAI — `obolai/x402-ai-agent` | Real autonomous payer buying paid intelligence across multiple x402 services. | GitHub Issues | P1 |
| 8 | xpay — `xpaysh/agent-kit` | Payment-enabled agent kit designed for x402/AP2; useful framework-level integration target. | GitHub Issues | P1 |
| 9 | Plagtech — `plagtech/agent-payments-x402` | Agent skill for pay-per-call x402 plus batch payments/payroll/escrow. | GitHub Issues | P1 |
| 10 | Good Meta / broader A2A ecosystem follow-up OR QUSD — `QUSD-ai/x402-payments` | Agent-to-agent x402 payment implementation; useful secondary compatibility test if first cohort is weak. | GitHub Issues | P2 |

## Qualification criteria

A conversation is qualified when the other side:
1. currently builds or maintains an agent/payment/x402 runtime;
2. understands where signing/payment happens;
3. can evaluate a buyer-side pre-sign policy layer;
4. gives concrete integration, product, security or willingness-to-pay feedback.

A generic "looks cool" response does not count.

## What we are validating

We are not asking whether x402 is interesting.

We are testing whether a separate buyer-side policy firewall is useful enough to integrate:

```
402 Payment Required
→ strict parser
→ local policy
→ ALLOW / REVIEW / BLOCK
→ signer / wallet / payer
```

The guard is non-custodial and does not replace facilitators, wallets or facilitator-side risk systems.

## First 5 hypothesis

### Good Meta
Question: should an A2A payment agent expose a deterministic policy step before permit/signing?

### NearDeFi
Question: can explicit approval guidance be strengthened with a reusable machine-enforced pre-sign policy decision?

### Xenarch
Question: is AgentPay Guard useful as an implementation behind or beside `_pre_payment_hook`, rather than duplicating BudgetPolicy?

### Primer Systems
Question: would an external policy decision layer add value beyond `maxAmount` and `--dry-run` for autonomous agents?

### Omnivalent
Question: where is the real gap between their integrated controls and our separate non-custodial policy service? If there is no gap, that is a valuable HOLD signal.

## Decision rule

- **PASS:** 5 conversations + 2 integration attempts + 1 monetization/ecosystem signal.
- **EXTEND:** real integration interest but no monetization signal yet.
- **HOLD:** no meaningful external need, or existing payer SDK controls make a separate layer redundant.

No new payment rails, dashboards or Mainnet execution during this validation batch.
