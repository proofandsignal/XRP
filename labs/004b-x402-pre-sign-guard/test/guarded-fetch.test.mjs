import test from "node:test";
import assert from "node:assert/strict";
import {
  createGuardedX402Fetch,
  X402GuardError
} from "../src/guarded-fetch.mjs";
import {
  evaluatePaymentIntent
} from "../../004-agentpay-guard/src/policy.mjs";

const merchant =
  "rQpW2bpG9mP6UP8WAfJvB2umrra5RjJNs2";
const facilitator =
  "https://xrpl-facilitator-testnet.t54.ai";

const policy = {
  version: "0.1",
  allowed_networks: ["xrpl:testnet"],
  allowed_assets: ["XRP"],
  allowed_merchants: [merchant],
  allowed_facilitator_hosts: [
    "xrpl-facilitator-testnet.t54.ai"
  ],
  max_per_tx_drops: "10000",
  review_above_drops: "5000",
  daily_budget_drops: "20000",
  spent_today_drops: "0"
};

function required({
  amount = "1000",
  payTo = merchant,
  extra = { sourceTag: 20260601 },
  accepts
} = {}) {
  return new Response(
    JSON.stringify({
      x402Version: 2,
      resource: {
        url: "https://merchant.example/premium"
      },
      accepts:
        accepts ??
        [
          {
            scheme: "exact",
            network: "xrpl:1",
            amount,
            asset: "XRP",
            payTo,
            maxTimeoutSeconds: 60,
            extra
          }
        ]
    }),
    {
      status: 402,
      headers: { "content-type": "application/json" }
    }
  );
}

test("ALLOW is the only path that invokes paying fetch", async () => {
  let payingCalls = 0;

  const guarded = createGuardedX402Fetch({
    rawFetch: async () => required(),
    payingFetch: async () => {
      payingCalls += 1;
      return new Response('{"ok":true}', { status: 200 });
    },
    evaluatePaymentIntent,
    policy,
    facilitatorUrl: facilitator
  });

  const result = await guarded("https://merchant.example/premium");

  assert.equal(result.guard.decision, "ALLOW");
  assert.equal(result.guard.paying_fetch_invoked, true);
  assert.equal(payingCalls, 1);
  assert.equal(result.response.status, 200);
});

test("over-limit requirement blocks before paying fetch", async () => {
  let payingCalls = 0;

  const guarded = createGuardedX402Fetch({
    rawFetch: async () => required({ amount: "10001" }),
    payingFetch: async () => {
      payingCalls += 1;
      return new Response(null, { status: 200 });
    },
    evaluatePaymentIntent,
    policy,
    facilitatorUrl: facilitator
  });

  await assert.rejects(
    () => guarded("https://merchant.example/premium"),
    (error) => {
      assert.ok(error instanceof X402GuardError);
      assert.equal(error.evidence.decision, "BLOCK");
      assert.equal(error.evidence.paying_fetch_invoked, false);
      return true;
    }
  );

  assert.equal(payingCalls, 0);
});

test("review threshold never invokes paying fetch", async () => {
  let payingCalls = 0;

  const guarded = createGuardedX402Fetch({
    rawFetch: async () => required({ amount: "6000" }),
    payingFetch: async () => {
      payingCalls += 1;
      return new Response(null, { status: 200 });
    },
    evaluatePaymentIntent,
    policy,
    facilitatorUrl: facilitator
  });

  await assert.rejects(
    () => guarded("https://merchant.example/premium"),
    (error) => {
      assert.ok(error instanceof X402GuardError);
      assert.equal(error.evidence.decision, "REVIEW");
      assert.equal(error.evidence.paying_fetch_invoked, false);
      return true;
    }
  );

  assert.equal(payingCalls, 0);
});

test("unknown requirement fields fail closed", async () => {
  let payingCalls = 0;
  const response = new Response(
    JSON.stringify({
      x402Version: 2,
      resource: { url: "https://merchant.example/premium" },
      accepts: [
        {
          scheme: "exact",
          network: "xrpl:1",
          amount: "1000",
          asset: "XRP",
          payTo: merchant,
          maxTimeoutSeconds: 60,
          extra: { sourceTag: 20260601 },
          paths: ["unreviewed"]
        }
      ]
    }),
    { status: 402 }
  );

  const guarded = createGuardedX402Fetch({
    rawFetch: async () => response,
    payingFetch: async () => {
      payingCalls += 1;
      return new Response(null, { status: 200 });
    },
    evaluatePaymentIntent,
    policy,
    facilitatorUrl: facilitator
  });

  await assert.rejects(
    () => guarded("https://merchant.example/premium"),
    /UNREVIEWED_REQUIREMENT_FIELDS/
  );
  assert.equal(payingCalls, 0);
});

test("multiple ALLOW requirements fail closed as ambiguous", async () => {
  let payingCalls = 0;
  const option = {
    scheme: "exact",
    network: "xrpl:1",
    amount: "1000",
    asset: "XRP",
    payTo: merchant,
    maxTimeoutSeconds: 60,
    extra: { sourceTag: 20260601 }
  };

  const guarded = createGuardedX402Fetch({
    rawFetch: async () =>
      required({
        accepts: [
          option,
          {
            ...option,
            extra: {
              sourceTag: 20260601,
              invoiceId: "second"
            }
          }
        ]
      }),
    payingFetch: async () => {
      payingCalls += 1;
      return new Response(null, { status: 200 });
    },
    evaluatePaymentIntent,
    policy,
    facilitatorUrl: facilitator
  });

  await assert.rejects(
    () => guarded("https://merchant.example/premium"),
    /AMBIGUOUS_ALLOWED_REQUIREMENTS/
  );
  assert.equal(payingCalls, 0);
});

test("non-402 response bypasses payment path", async () => {
  let payingCalls = 0;

  const guarded = createGuardedX402Fetch({
    rawFetch: async () =>
      new Response('{"free":true}', { status: 200 }),
    payingFetch: async () => {
      payingCalls += 1;
      return new Response(null, { status: 200 });
    },
    evaluatePaymentIntent,
    policy,
    facilitatorUrl: facilitator
  });

  const result = await guarded("https://merchant.example/free");
  assert.equal(result.guard.decision, "NO_PAYMENT_REQUIRED");
  assert.equal(result.guard.paying_fetch_invoked, false);
  assert.equal(payingCalls, 0);
});
