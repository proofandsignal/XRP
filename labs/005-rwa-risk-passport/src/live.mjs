import fs from "node:fs/promises";
import path from "node:path";
import xrpl from "xrpl";
import { buildRiskPassport, normalizeMptIssuance } from "./passport.mjs";

const SERVER_URL =
  process.env.XRPL_WS ?? "wss://s.altnet.rippletest.net:51233";
const ISSUANCE_ID = process.env.MPT_ISSUANCE_ID;
const ARTIFACT_DIR = path.resolve("artifacts");

function now() {
  return new Date().toISOString();
}

function validIssuanceId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{48}$/.test(value);
}

async function write(payload) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const safeId = ISSUANCE_ID ?? "unknown";
  const file = path.join(
    ARTIFACT_DIR,
    `lab-005-${safeId}-${Date.now()}.json`
  );
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  return file;
}

async function main() {
  if (!validIssuanceId(ISSUANCE_ID)) {
    throw new Error("MPT_ISSUANCE_ID must be a 192-bit / 48-hex-character ID.");
  }

  const client = new xrpl.Client(SERVER_URL);

  try {
    await client.connect();

    const issuanceResponse = await client.request({
      command: "ledger_entry",
      mpt_issuance: ISSUANCE_ID,
      ledger_index: "validated"
    });

    const node = issuanceResponse.result?.node;
    const issuance = normalizeMptIssuance(node, ISSUANCE_ID);

    let issuerAccount = null;
    if (issuance.issuer && xrpl.isValidAddress(issuance.issuer)) {
      const accountInfo = await client.request({
        command: "account_info",
        account: issuance.issuer,
        ledger_index: "validated"
      });
      issuerAccount = {
        verification: "VERIFIED",
        address: issuance.issuer,
        flags: accountInfo.result?.account_data?.Flags ?? null,
        owner_count: accountInfo.result?.account_data?.OwnerCount ?? null,
        ledger_index: accountInfo.result?.ledger_index ?? null
      };
    }

    const passport = buildRiskPassport({
      issuance,
      issuerAccount,
      observedAt: now(),
      network: SERVER_URL
    });

    const file = await write(passport);

    console.log("\n=== XRPL LAB-005 RWA RISK PASSPORT ===");
    console.log(`MPT issuance: ${ISSUANCE_ID}`);
    console.log(`Issuer: ${issuance.issuer ?? "UNKNOWN"}`);
    console.log(`Decision: ${passport.decision}`);
    console.log(`PASS locked: ${passport.pass_locked}`);
    console.log(`Evidence: ${file}`);
  } finally {
    if (client.isConnected()) await client.disconnect();
  }
}

main().catch(async (error) => {
  const failure = {
    schema_version: "0.1",
    lab: "LAB-005",
    observed_at: now(),
    subject: ISSUANCE_ID ?? null,
    verification: "FAILED",
    decision: "UNKNOWN",
    pass_locked: true,
    error: {
      name: error?.name ?? "Error",
      message: error?.message ?? String(error)
    }
  };
  const file = await write(failure);
  console.error(error);
  console.error(`Failure evidence: ${file}`);
  process.exitCode = 1;
});
