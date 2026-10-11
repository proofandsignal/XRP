# VALIDATION-001 — First 5 Outreach Drafts

These messages are public technical outreach. They intentionally disclose only the product boundary already present in the public repository.

## 1 — Good Meta

**Repo:** `goodmeta/a2a-x402-payment-agent`  
**Suggested issue title:** Integration feedback request: pre-sign policy gate for A2A x402 payer

Hi Good Meta team — your A2A+x402 payment agent is one of the cleanest examples we found of an agent reaching the payment/signing boundary directly.

We have a small open Testnet prototype called **AgentPay Guard** that sits between an untrusted `402 Payment Required` response and the payer/signing path:

`402 → strict parse → local policy → ALLOW / REVIEW / BLOCK → payer`

The specific question for your architecture is whether a deterministic policy step before ERC-2612 permit/signing would be useful as a separate reusable layer, or whether it belongs directly inside your payment agent.

We have already verified the same boundary end-to-end on XRPL Testnet: an allowed request settled and reconciled on-ledger, while an over-limit request was blocked with zero additional payer calls.

Reference: `proofandsignal/XRP → docs/PRODUCT-001-AGENTPAY-GUARD.md`

Would you be open to a quick technical opinion or a small integration attempt around your `src/server/x402.ts` path? Negative feedback is equally useful — we are explicitly testing whether this should exist as a separate layer.

If Issues is not the right place for this, please close/redirect us.

---

## 2 — NearDeFi

**Repo:** `NearDeFi/agent-payments-skill`  
**Suggested issue title:** Feedback request: machine-enforced pre-sign policy before x402 wallet execution

Hi NearDeFi team — your x402 Pay skill explicitly recommends approval before commands, wallet spend limits, and reviewing price/recipient/amount before payment. That is very close to the boundary we are validating.

We built **AgentPay Guard**, a non-custodial pre-sign policy layer:

`402 → normalize requirement → merchant/asset/network/budget policy → ALLOW / REVIEW / BLOCK → wallet`

The goal is not to replace wallet controls or human approval. It is to make those checks deterministic and reusable before any wallet-specific signing path (CDP, Privy, Turnkey, private key, etc.).

Reference: `proofandsignal/XRP → docs/PRODUCT-001-AGENTPAY-GUARD.md`

Would this be useful as an optional policy adapter in front of your wallet abstraction, or do your current wallet-level controls already make a separate layer redundant?

We are looking for technical/integration feedback, not promoting a paid service yet. If Issues is not the right channel, please redirect us.

---

## 3 — Xenarch

**Repo:** `xenarch-ai/x402-agent`  
**Suggested issue title:** Could an external pre-sign guard plug cleanly into X402Payer _pre_payment_hook?

Hi Xenarch team — your `X402Payer` and `_pre_payment_hook` look like a very natural validation point for something we are testing.

We built **AgentPay Guard**, a deterministic buyer-side policy firewall that evaluates the remote x402 requirement before signing:

`402 → strict parse → policy → ALLOW / REVIEW / BLOCK → payer`

It overlaps with `BudgetPolicy` on spend caps, but the intended scope is broader: merchant/facilitator allowlists, strict field whitelisting, ambiguous requirement rejection, asset/network policy, review thresholds, and an audit hash.

We do not want to duplicate functionality your payer already handles. The question is whether this belongs as an implementation behind/beside `_pre_payment_hook`, or whether it is unnecessary abstraction.

Reference: `proofandsignal/XRP → docs/PRODUCT-001-AGENTPAY-GUARD.md`

Would you be open to a quick architecture opinion or a tiny adapter experiment? A “this should just stay inside BudgetPolicy” answer would also be a useful validation result.

If this issue is out of scope, please close it.

---

## 4 — Primer Systems

**Repo:** `primer-systems/x402`  
**Suggested issue title:** Integration feedback: external policy decision before x402Fetch signing

Hi Primer Systems team — Primer already has useful payer controls such as `maxAmount` and CLI dry-run. We are validating whether there is still value in a separate deterministic policy layer before signing.

Our prototype, **AgentPay Guard**, evaluates a 402 requirement before the payer is invoked:

`402 → strict parse → merchant/network/asset/budget policy → ALLOW / REVIEW / BLOCK → x402Fetch`

It is deliberately non-custodial and does not sign, settle, or replace the facilitator. We have verified the boundary end-to-end on XRPL Testnet, including an over-limit challenge that never reached the payer.

Reference: `proofandsignal/XRP → docs/PRODUCT-001-AGENTPAY-GUARD.md`

From Primer's perspective, would an external policy decision hook add anything beyond `maxAmount` / dry-run for autonomous agents (e.g. recipient allowlists, facilitator policy, strict untrusted-field handling, audit evidence), or would you keep all of this inside the SDK?

We would be happy to try a minimal adapter if the architecture makes sense. If Issues is not the right venue, please redirect us.

---

## 5 — Omnivalent

**Repo:** `Omnivalent/x402-agent-pay`  
**Suggested issue title:** Validation question: separate non-custodial policy layer vs integrated AgentPay controls

Hi — your project is probably the strongest comparison case for something we are validating, because you already enforce spending limits, velocity limits, recipient controls, audit trails, and block-before-signing.

We built **AgentPay Guard** as a separate non-custodial policy layer in front of an x402 payer:

`402 → strict parser → deterministic policy → ALLOW / REVIEW / BLOCK → payer`

The product question is whether separation has real value (shared policy service across wallets/runtimes, independent audit boundary, facilitator/merchant policy, strict requirement-field validation), or whether an integrated client like `x402-agent-pay` is simply the better design.

Reference: `proofandsignal/XRP → docs/PRODUCT-001-AGENTPAY-GUARD.md`

Would you be open to giving a technical view on where, if anywhere, a separate policy service would complement your current controls? We are explicitly looking for disconfirming feedback too.

If this is not appropriate for Issues, please close it.
