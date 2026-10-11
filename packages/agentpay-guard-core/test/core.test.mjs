import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePaymentIntent,
  validatePaymentRequired,
  requirementToIntent
} from "../src/index.mjs";

const merchant = "rQpW2bpG9mP6UP8WAfJvB2umrra5RjJNs2";
const facilitator = "https://xrpl-facilitator-testnet.t54.ai";

const policy = {
  allowed_networks: ["xrpl:testnet"],
  allowed_assets: ["XRP"],
  allowed_merchants: [merchant],
  allowed_facilitator_hosts: ["xrpl-facilitator-testnet.t54.ai"],
  max_per_tx_drops: "10000",
  review_above_drops: "5000",
  daily_budget_drops: "20000",
  spent_today_drops: "0"
};

test("core converts a strict XRPL x402 requirement into an ALLOW intent", () => {
  const payload = validatePaymentRequired({
    x402Version: 2,
    resource: { url: "https://example.test/resource" },
    accepts: [{
      scheme: "exact",
      network: "xrpl:1",
      amount: "1000",
      asset: "XRP",
      payTo: merchant,
      maxTimeoutSeconds: 60,
      extra: { sourceTag: 20261011 }
    }]
  });

  const intent = requirementToIntent({
    paymentRequired: payload,
    requirement: payload.accepts[0],
    facilitatorUrl: facilitator
  });

  const result = evaluatePaymentIntent(intent, policy);
  assert.equal(result.decision, "ALLOW");
});

test("core blocks an over-limit payment intent", () => {
  const result = evaluatePaymentIntent({
    protocol: "x402",
    network: "xrpl:testnet",
    asset: "XRP",
    amount_drops: "10001",
    pay_to: merchant,
    facilitator_url: facilitator,
    source_tag: 1,
    resource: "/resource",
    request_id: "test"
  }, policy);

  assert.equal(result.decision, "BLOCK");
  assert.ok(result.reasons.includes("MAX_PER_TX_EXCEEDED"));
});
