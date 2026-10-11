import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.mjs";

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

async function withServer(fn) {
  const app = createApp({ policy, facilitatorUrl: facilitator });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });

  try {
    const addr = server.address();
    await fn(`http://127.0.0.1:${addr.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("health explicitly reports signing disabled", async () => {
  await withServer(async (origin) => {
    const res = await fetch(`${origin}/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.signing_enabled, false);
  });
});

test("intent API ALLOWs approved small Testnet payment", async () => {
  await withServer(async (origin) => {
    const res = await fetch(`${origin}/v1/intent/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        protocol: "x402",
        network: "xrpl:testnet",
        asset: "XRP",
        amount_drops: "1000",
        pay_to: merchant,
        facilitator_url: facilitator,
        source_tag: 1,
        resource: "/resource",
        request_id: "api-test"
      })
    });
    const body = await res.json();
    assert.equal(body.decision, "ALLOW");
    assert.ok(body.intent_hash);
  });
});

test("x402 API blocks over-limit requirement", async () => {
  await withServer(async (origin) => {
    const res = await fetch(`${origin}/v1/x402/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payment_required: {
          x402Version: 2,
          resource: { url: "https://merchant.example/premium" },
          accepts: [{
            scheme: "exact",
            network: "xrpl:1",
            amount: "10001",
            asset: "XRP",
            payTo: merchant,
            maxTimeoutSeconds: 60,
            extra: { sourceTag: 1 }
          }]
        }
      })
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.decision, "BLOCK");
  });
});

test("x402 API fails closed on unreviewed requirement field", async () => {
  await withServer(async (origin) => {
    const res = await fetch(`${origin}/v1/x402/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payment_required: {
          x402Version: 2,
          resource: { url: "https://merchant.example/premium" },
          accepts: [{
            scheme: "exact",
            network: "xrpl:1",
            amount: "1000",
            asset: "XRP",
            payTo: merchant,
            maxTimeoutSeconds: 60,
            extra: { sourceTag: 1 },
            unexpected: true
          }]
        }
      })
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.decision, "BLOCK");
    assert.match(body.reason, /UNREVIEWED_REQUIREMENT_FIELDS/);
  });
});
