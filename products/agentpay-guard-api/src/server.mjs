import { createApp } from "./app.mjs";

function readPolicy() {
  const raw = process.env.AGENTPAY_POLICY_JSON;
  if (!raw) {
    throw new Error("AGENTPAY_POLICY_JSON is required.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AGENTPAY_POLICY_JSON must be valid JSON.");
  }
}

const facilitatorUrl =
  process.env.XRPL_FACILITATOR_URL ??
  "https://xrpl-facilitator-testnet.t54.ai";

const port = Number(process.env.PORT ?? "8787");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

const app = createApp({
  policy: readPolicy(),
  facilitatorUrl
});

app.listen(port, () => {
  console.log(`AgentPay Guard API v0.1 listening on :${port}`);
  console.log("Signing/payment execution: DISABLED");
});
