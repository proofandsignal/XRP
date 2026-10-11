import fs from "node:fs/promises";
import path from "node:path";
import express from "express";
import xrpl from "xrpl";
import { requirePayment } from "x402-xrpl/express";
import { x402Fetch } from "x402-xrpl";
import {
  evaluatePaymentIntent
} from "../../004-agentpay-guard/src/policy.mjs";
import {
  createGuardedX402Fetch,
  X402GuardError
} from "../../004b-x402-pre-sign-guard/src/guarded-fetch.mjs";

const WS =
  process.env.XRPL_TESTNET_WS ??
  "wss://s.altnet.rippletest.net:51233";
const FACILITATOR =
  process.env.XRPL_FACILITATOR_URL ??
  "https://xrpl-facilitator-testnet.t54.ai";
const ARTIFACT_DIR = path.resolve("artifacts");

function decodeBase64Json(value) {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getSettlementHeader(response) {
  return (
    response.headers.get("PAYMENT-RESPONSE") ??
    response.headers.get("payment-response") ??
    response.headers.get("X-PAYMENT-RESPONSE") ??
    response.headers.get("x-payment-response")
  );
}

function txHashFromReceipt(receipt) {
  return (
    receipt?.transaction ??
    receipt?.transactionHash ??
    receipt?.txHash ??
    receipt?.hash ??
    null
  );
}

async function main() {
  const client = new xrpl.Client(WS);
  await client.connect();

  let server;
  try {
    const payerFund = await client.fundWallet();
    const merchantFund = await client.fundWallet();
    const payer = payerFund.wallet;
    const merchant = merchantFund.wallet;

    const app = express();

    app.use(
      requirePayment({
        path: "/allowed",
        price: "1000",
        payToAddress: merchant.address,
        network: "xrpl:1",
        asset: "XRP",
        facilitatorUrl: FACILITATOR,
        resource: "lab004c:allowed",
        description: "LAB-004C allowed Testnet resource",
        extra: { sourceTag: 20261011 }
      })
    );

    app.use(
      requirePayment({
        path: "/blocked",
        price: "10001",
        payToAddress: merchant.address,
        network: "xrpl:1",
        asset: "XRP",
        facilitatorUrl: FACILITATOR,
        resource: "lab004c:blocked",
        description: "LAB-004C over-limit Testnet resource",
        extra: { sourceTag: 20261011 }
      })
    );

    app.get("/allowed", (_req, res) =>
      res.json({ ok: true, resource: "allowed" })
    );
    app.get("/blocked", (_req, res) =>
      res.json({ ok: true, resource: "blocked" })
    );

    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : null;
    if (!port) throw new Error("Could not determine local merchant port.");

    const origin = `http://127.0.0.1:${port}`;

    const policy = {
      version: "0.1",
      allowed_networks: ["xrpl:testnet"],
      allowed_assets: ["XRP"],
      allowed_merchants: [merchant.address],
      allowed_facilitator_hosts: [
        new URL(FACILITATOR).host.toLowerCase()
      ],
      max_per_tx_drops: "10000",
      review_above_drops: "5000",
      daily_budget_drops: "20000",
      spent_today_drops: "0"
    };

    const sdkPayingFetch = x402Fetch({
      wallet: payer,
      network: "xrpl:1",
      wsUrl: WS
    });

    let payingFetchCalls = 0;
    const countedPayingFetch = async (...args) => {
      payingFetchCalls += 1;
      return sdkPayingFetch(...args);
    };

    const guarded = createGuardedX402Fetch({
      rawFetch: fetch,
      payingFetch: countedPayingFetch,
      evaluatePaymentIntent,
      policy,
      facilitatorUrl: FACILITATOR
    });

    const allowedResult = await guarded(`${origin}/allowed`);
    const allowedBody = await allowedResult.response.json();

    if (allowedResult.response.status !== 200 || allowedBody?.ok !== true) {
      throw new Error("Allowed resource was not delivered after payment.");
    }

    const settlementHeader = getSettlementHeader(
      allowedResult.response
    );
    const receipt = decodeBase64Json(settlementHeader);

    if (!receipt) {
      throw new Error("Missing or undecodable settlement receipt.");
    }

    const txHash = txHashFromReceipt(receipt);
    if (!txHash) {
      throw new Error("Settlement receipt did not contain transaction hash.");
    }

    const ledgerTx = await client.request({
      command: "tx",
      transaction: txHash
    });

    const tx = ledgerTx.result;
    const ledgerAmount =
      typeof tx.Amount === "string"
        ? tx.Amount
        : typeof tx.DeliverMax === "string"
          ? tx.DeliverMax
          : tx.tx_json?.Amount ?? tx.tx_json?.DeliverMax ?? null;
    const ledgerDestination =
      tx.Destination ?? tx.tx_json?.Destination ?? null;
    const ledgerAccount =
      tx.Account ?? tx.tx_json?.Account ?? null;

    const independentLedgerPass =
      tx.validated === true &&
      ledgerAmount === "1000" &&
      ledgerDestination === merchant.address &&
      ledgerAccount === payer.address;

    if (!independentLedgerPass) {
      throw new Error(
        `Independent ledger reconciliation failed: validated=${tx.validated === true} account=${ledgerAccount} destination=${ledgerDestination} amount=${JSON.stringify(ledgerAmount)}`
      );
    }

    const payingCallsAfterAllowed = payingFetchCalls;

    let blockedEvidence = null;
    try {
      await guarded(`${origin}/blocked`);
      throw new Error("Expected blocked x402 request to be denied.");
    } catch (error) {
      if (!(error instanceof X402GuardError)) throw error;
      blockedEvidence = error.evidence;
    }

    const blockedDidNotInvokePayer =
      payingFetchCalls === payingCallsAfterAllowed &&
      blockedEvidence?.decision === "BLOCK";

    if (!blockedDidNotInvokePayer) {
      throw new Error("Blocked requirement reached paying client.");
    }

    const evidence = {
      schema_version: "0.1",
      lab: "LAB-004C",
      mode: "GUARDED_X402_TESTNET_E2E",
      observed_at: new Date().toISOString(),
      network: "xrpl:1",
      facilitator_origin: new URL(FACILITATOR).origin,
      allowed_case: {
        guard: allowedResult.guard,
        http_status: allowedResult.response.status,
        resource_delivered: allowedBody?.ok === true,
        settlement_receipt: {
          success: receipt.success ?? null,
          network: receipt.network ?? null,
          payer: receipt.payer ?? null,
          transaction: txHash
        },
        ledger_reconciliation: {
          validated: tx.validated === true,
          account_matches: ledgerAccount === payer.address,
          destination_matches: ledgerDestination === merchant.address,
          amount_matches: ledgerAmount === "1000",
          amount_drops: ledgerAmount,
          transaction: txHash
        }
      },
      blocked_case: {
        decision: blockedEvidence?.decision ?? null,
        reason:
          blockedEvidence?.reason ??
          blockedEvidence?.candidates?.[0]?.decision?.reasons ??
          null,
        paying_client_invoked: false
      },
      counters: {
        paying_fetch_calls_total: payingFetchCalls,
        paying_fetch_calls_after_allowed: payingCallsAfterAllowed
      },
      safety: {
        testnet_only: true,
        ephemeral_wallets: true,
        seeds_persisted: false,
        mainnet_configured: false
      },
      status:
        independentLedgerPass &&
        blockedDidNotInvokePayer &&
        payingCallsAfterAllowed === 1
          ? "PASS"
          : "REVIEW"
    };

    await fs.mkdir(ARTIFACT_DIR, { recursive: true });
    const file = path.join(
      ARTIFACT_DIR,
      `lab-004c-x402-e2e-${Date.now()}.json`
    );
    await fs.writeFile(file, JSON.stringify(evidence, null, 2), "utf8");

    console.log("\n=== XRPL LAB-004C GUARDED X402 E2E ===");
    console.log(`Allowed HTTP: ${allowedResult.response.status}`);
    console.log(`Guard: ${allowedResult.guard.decision}`);
    console.log(`TX: ${txHash}`);
    console.log(`Ledger validated: ${tx.validated === true}`);
    console.log(`Blocked decision: ${blockedEvidence?.decision}`);
    console.log(`Paying client calls: ${payingFetchCalls}`);
    console.log(`Status: ${evidence.status}`);
    console.log(`Evidence: ${file}`);

    if (evidence.status !== "PASS") process.exitCode = 2;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (client.isConnected()) await client.disconnect();
  }
}

main().catch(async (error) => {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const file = path.join(
    ARTIFACT_DIR,
    `lab-004c-x402-e2e-failed-${Date.now()}.json`
  );
  await fs.writeFile(
    file,
    JSON.stringify(
      {
        schema_version: "0.1",
        lab: "LAB-004C",
        status: "FAIL",
        observed_at: new Date().toISOString(),
        error: {
          name: error?.name ?? "Error",
          message: error?.message ?? String(error)
        },
        safety: {
          testnet_only: true,
          seeds_persisted: false
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
