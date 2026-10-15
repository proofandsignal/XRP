import fs from "node:fs/promises";
import path from "node:path";
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
} from "./intelligence.mjs";

const SERVER_URL = process.env.XRPL_WS ?? "wss://xrplcluster.com";
const ARTIFACT_DIR = path.resolve("artifacts");

function now() {
  return new Date().toISOString();
}

async function write(payload) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const file = path.join(
    ARTIFACT_DIR,
    `lab-006-rlusd-mainnet-${Date.now()}.json`
  );
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  return file;
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

async function safeRequest(client, request) {
  try {
    const response = await client.request(request);
    return { ok: true, result: response.result, error: null };
  } catch (error) {
    return { ok: false, result: null, error: errorInfo(error) };
  }
}

async function main() {
  const client = new xrpl.Client(SERVER_URL);

  try {
    await client.connect();

    const issuerResponse = await client.request({
      command: "account_info",
      account: RLUSD_MAINNET_ISSUER,
      ledger_index: "validated"
    });

    const gateway = await safeRequest(client, {
      command: "gateway_balances",
      account: RLUSD_MAINNET_ISSUER,
      strict: true,
      ledger_index: "validated"
    });

    const rlusd = {
      currency: RLUSD_CURRENCY_HEX,
      issuer: RLUSD_MAINNET_ISSUER
    };

    const xrpForRlusd = await safeRequest(client, {
      command: "book_offers",
      taker_gets: { currency: "XRP" },
      taker_pays: rlusd,
      ledger_index: "validated",
      limit: 20
    });

    const rlusdForXrp = await safeRequest(client, {
      command: "book_offers",
      taker_gets: rlusd,
      taker_pays: { currency: "XRP" },
      ledger_index: "validated",
      limit: 20
    });

    const amm = await safeRequest(client, {
      command: "amm_info",
      asset: { currency: "XRP" },
      asset2: rlusd,
      ledger_index: "validated"
    });

    const activity = await safeRequest(client, {
      command: "account_tx",
      account: RLUSD_MAINNET_ISSUER,
      ledger_index_min: -1,
      ledger_index_max: -1,
      binary: false,
      forward: false,
      limit: 50
    });

    const snapshot = buildRlusdSnapshot({
      observedAt: now(),
      network: SERVER_URL,
      issuerAccount: normalizeIssuerAccount(issuerResponse.result),
      supply: normalizeGatewayBalances(gateway.result, gateway.error),
      bookXrpForRlusd: normalizeOrderBook(
        xrpForRlusd.result,
        "XRP_FOR_RLUSD",
        xrpForRlusd.error
      ),
      bookRlusdForXrp: normalizeOrderBook(
        rlusdForXrp.result,
        "RLUSD_FOR_XRP",
        rlusdForXrp.error
      ),
      amm: normalizeAmm(amm.result, amm.error),
      issuerActivity: normalizeIssuerActivity(
        activity.result,
        activity.error,
        50
      )
    });

    const file = await write(snapshot);

    console.log("\n=== XRPL LAB-006 RLUSD INTELLIGENCE ===");
    console.log(`Issuer: ${RLUSD_MAINNET_ISSUER}`);
    console.log(`Decision: ${snapshot.decision}`);
    console.log(`PASS locked: ${snapshot.pass_locked}`);
    console.log(
      `Outstanding RLUSD signal: ${snapshot.supply.outstanding_rlusd ?? "UNKNOWN"}`
    );
    console.log(
      `Order books: ${snapshot.markets.xrp_for_rlusd.offer_count ?? "UNKNOWN"} / ${snapshot.markets.rlusd_for_xrp.offer_count ?? "UNKNOWN"}`
    );
    console.log(`AMM: ${snapshot.markets.xrp_rlusd_amm.state}`);
    console.log(
      `Issuer tx scanned: ${snapshot.issuer_activity.transactions_scanned}`
    );
    console.log(`Evidence: ${file}`);

    if (snapshot.issuer_account.verification !== "VERIFIED") {
      throw new Error("Validated RLUSD issuer evidence was not verified.");
    }

    if (
      snapshot.markets.xrp_for_rlusd.verification !== "VERIFIED" &&
      snapshot.markets.rlusd_for_xrp.verification !== "VERIFIED" &&
      snapshot.markets.xrp_rlusd_amm.verification !== "VERIFIED"
    ) {
      throw new Error("No validated XRPL market surface was verified.");
    }
  } finally {
    if (client.isConnected()) await client.disconnect();
  }
}

main().catch(async (error) => {
  const failure = {
    schema_version: "0.1",
    lab: "LAB-006",
    observed_at: now(),
    subject: {
      asset: "RLUSD",
      currency_hex: RLUSD_CURRENCY_HEX,
      issuer: RLUSD_MAINNET_ISSUER
    },
    verification: "FAILED",
    decision: "UNKNOWN",
    pass_locked: true,
    error: errorInfo(error)
  };

  const file = await write(failure);
  console.error(error);
  console.error(`Failure evidence: ${file}`);
  process.exitCode = 1;
});
