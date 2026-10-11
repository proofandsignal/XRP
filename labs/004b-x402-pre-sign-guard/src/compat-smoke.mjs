import fs from "node:fs/promises";
import path from "node:path";
import { x402Fetch } from "x402-xrpl";

const FACILITATOR =
  process.env.XRPL_FACILITATOR_URL ??
  "https://xrpl-facilitator-testnet.t54.ai";
const ARTIFACT_DIR = path.resolve("artifacts");

async function main() {
  const started = new Date().toISOString();

  if (typeof x402Fetch !== "function") {
    throw new Error("x402-xrpl x402Fetch export unavailable");
  }

  const url = new URL("/supported", FACILITATOR).toString();
  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    },
    signal: AbortSignal.timeout(15000)
  });

  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 1000) };
  }

  if (!response.ok) {
    throw new Error(`Facilitator /supported returned HTTP ${response.status}`);
  }

  const serialized = JSON.stringify(body);
  const xrplTestnetAdvertised =
    serialized.includes("xrpl:1") ||
    serialized.toLowerCase().includes("xrpl-testnet");

  const evidence = {
    schema_version: "0.1",
    lab: "LAB-004B",
    mode: "EXTERNAL_COMPATIBILITY_NO_SPEND",
    observed_at: started,
    package: {
      name: "x402-xrpl",
      pinned_version: "0.3.3",
      x402_fetch_export: true
    },
    facilitator: {
      origin: new URL(FACILITATOR).origin,
      endpoint: "/supported",
      http_status: response.status,
      xrpl_testnet_advertised: xrplTestnetAdvertised
    },
    safety: {
      wallet_created: false,
      seed_used: false,
      payment_attempted: false,
      signing_attempted: false
    },
    status: response.ok && xrplTestnetAdvertised ? "PASS" : "REVIEW"
  };

  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const file = path.join(
    ARTIFACT_DIR,
    `lab-004b-compat-${Date.now()}.json`
  );
  await fs.writeFile(file, JSON.stringify(evidence, null, 2), "utf8");

  console.log(JSON.stringify(evidence, null, 2));
  console.log(`Evidence: ${file}`);

  if (evidence.status !== "PASS") process.exitCode = 2;
}

main().catch(async (error) => {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const file = path.join(
    ARTIFACT_DIR,
    `lab-004b-compat-failed-${Date.now()}.json`
  );
  await fs.writeFile(
    file,
    JSON.stringify(
      {
        schema_version: "0.1",
        lab: "LAB-004B",
        status: "FAIL",
        observed_at: new Date().toISOString(),
        error: {
          name: error?.name ?? "Error",
          message: error?.message ?? String(error)
        },
        safety: {
          payment_attempted: false,
          signing_attempted: false
        }
      },
      null,
      2
    ),
    "utf8"
  );
  console.error(error);
  console.error(`Failure evidence: ${file}`);
  process.exitCode = 1;
});
