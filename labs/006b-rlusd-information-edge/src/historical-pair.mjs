import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import xrpl from "xrpl";
import {
  RLUSD_MAINNET_ISSUER,
  RLUSD_CURRENCY_HEX,
  buildRlusdSnapshot,
  normalizeAmm,
  normalizeGatewayBalances,
  normalizeIssuerAccount,
  normalizeIssuerActivity,
  normalizeOrderBook
} from "../../006-rlusd-intelligence/src/intelligence.mjs";
import { compareSnapshots } from "./compare.mjs";

const SERVER_URL = process.env.XRPL_WS ?? "wss://xrplcluster.com";
const HORIZON_LEDGERS = Number(process.env.HORIZON_LEDGERS ?? "1000");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR = path.resolve(HERE, "../artifacts");

function now() {
  return new Date().toISOString();
}

function errorInfo(error) {
  return {
    name: error?.name ?? "Error",
    code:
      error?.data?.error ??
      error?.error ??
      error?.code ??
      null,
    message:
      error?.data?.error_message ??
      error?.message ??
      String(error)
  };
}

async function write(name, payload) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const file = path.join(ARTIFACT_DIR, name);
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  return file;
}

async function safeRequest(client, request) {
  try {
    const response = await client.request(request);
    return { ok: true, result: response.result, error: null };
  } catch (error) {
    return { ok: false, result: null, error: errorInfo(error) };
  }
}

function markValidated(result, frozenLedger) {
  if (!result) return result;
  return {
    ...result,
    validated: true,
    ledger_index: result.ledger_index ?? frozenLedger
  };
}

async function captureAtLedger(client, ledgerIndex) {
  const ledgerProof = await client.request({
    command: "ledger",
    ledger_index: ledgerIndex,
    transactions: false,
    expand: false
  });

  if (ledgerProof.result?.validated !== true) {
    throw new Error(`Ledger ${ledgerIndex} is not independently validated.`);
  }

  const issuerResponse = await client.request({
    command: "account_info",
    account: RLUSD_MAINNET_ISSUER,
    ledger_index: ledgerIndex
  });

  const rlusd = {
    currency: RLUSD_CURRENCY_HEX,
    issuer: RLUSD_MAINNET_ISSUER
  };

  const [gateway, xrpForRlusd, rlusdForXrp, amm, activity] =
    await Promise.all([
      safeRequest(client, {
        command: "gateway_balances",
        account: RLUSD_MAINNET_ISSUER,
        strict: true,
        ledger_index: ledgerIndex
      }),
      safeRequest(client, {
        command: "book_offers",
        taker_gets: { currency: "XRP" },
        taker_pays: rlusd,
        ledger_index: ledgerIndex,
        limit: 20
      }),
      safeRequest(client, {
        command: "book_offers",
        taker_gets: rlusd,
        taker_pays: { currency: "XRP" },
        ledger_index: ledgerIndex,
        limit: 20
      }),
      safeRequest(client, {
        command: "amm_info",
        asset: { currency: "XRP" },
        asset2: rlusd,
        ledger_index: ledgerIndex
      }),
      safeRequest(client, {
        command: "account_tx",
        account: RLUSD_MAINNET_ISSUER,
        ledger_index_min: -1,
        ledger_index_max: ledgerIndex,
        binary: false,
        forward: false,
        limit: 50
      })
    ]);

  const snapshot = buildRlusdSnapshot({
    observedAt: now(),
    network: SERVER_URL,
    issuerAccount: normalizeIssuerAccount(
      markValidated(issuerResponse.result, ledgerIndex)
    ),
    supply: normalizeGatewayBalances(
      markValidated(gateway.result, ledgerIndex),
      gateway.error
    ),
    bookXrpForRlusd: normalizeOrderBook(
      markValidated(xrpForRlusd.result, ledgerIndex),
      "XRP_FOR_RLUSD",
      xrpForRlusd.error
    ),
    bookRlusdForXrp: normalizeOrderBook(
      markValidated(rlusdForXrp.result, ledgerIndex),
      "RLUSD_FOR_XRP",
      rlusdForXrp.error
    ),
    amm: normalizeAmm(
      markValidated(amm.result, ledgerIndex),
      amm.error
    ),
    issuerActivity: normalizeIssuerActivity(
      markValidated(activity.result, ledgerIndex),
      activity.error,
      50
    )
  });

  snapshot.snapshot_ledger = ledgerIndex;
  snapshot.ledger_hash =
    ledgerProof.result?.ledger_hash ??
    ledgerProof.result?.ledger?.hash ??
    null;

  return snapshot;
}

async function main() {
  if (!Number.isInteger(HORIZON_LEDGERS) || HORIZON_LEDGERS < 1) {
    throw new Error("HORIZON_LEDGERS must be a positive integer.");
  }

  const client = new xrpl.Client(SERVER_URL);

  try {
    await client.connect();

    const info = await client.request({ command: "server_info" });
    const current =
      info.result?.info?.validated_ledger?.seq ??
      info.result?.info?.validated_ledger?.ledger_index ??
      null;

    if (!Number.isInteger(current)) {
      throw new Error("Validated ledger sequence was not available.");
    }

    const t1Ledger = current;
    const t0Ledger = current - HORIZON_LEDGERS;

    const t0 = await captureAtLedger(client, t0Ledger);
    const t1 = await captureAtLedger(client, t1Ledger);
    const report = compareSnapshots(t0, t1);

    report.experiment = {
      type: "FROZEN_HISTORICAL_HORIZON",
      horizon_ledgers: HORIZON_LEDGERS,
      t0_ledger: t0Ledger,
      t1_ledger: t1Ledger
    };

    const t0File = await write("lab-006b-historical-t0.json", t0);
    const t1File = await write("lab-006b-historical-t1.json", t1);
    const reportFile = await write("lab-006b-historical-change.json", report);

    console.log("=== LAB-006B HISTORICAL HORIZON ===");
    console.log(`T0 ledger: ${t0Ledger}`);
    console.log(`T1 ledger: ${t1Ledger}`);
    console.log(`Comparable metrics: ${report.evidence_quality.comparable_metrics}`);
    console.log(`Changed metrics: ${report.evidence_quality.changed_metrics}`);
    console.log(`Status: ${report.information_edge_status}`);
    console.log(`T0: ${t0File}`);
    console.log(`T1: ${t1File}`);
    console.log(`Change: ${reportFile}`);

    if (report.evidence_quality.comparable_metrics === 0) {
      throw new Error("No comparable verified metrics in historical experiment.");
    }
  } finally {
    if (client.isConnected()) await client.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
