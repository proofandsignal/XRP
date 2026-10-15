import fs from "node:fs/promises";
import path from "node:path";
import xrpl from "xrpl";
import { buildRiskPassport, normalizeMptIssuance } from "./passport.mjs";

const SERVER_URL =
  process.env.XRPL_WS ?? "wss://s.devnet.rippletest.net:51233/";
const MAX_PAGES = Math.max(
  1,
  Math.min(20, Number(process.env.MPT_DISCOVERY_MAX_PAGES ?? "5"))
);
const ARTIFACT_DIR = path.resolve("artifacts");

function now() {
  return new Date().toISOString();
}

function issuanceIdFromNode(node) {
  if (
    !node ||
    node.LedgerEntryType !== "MPTokenIssuance" ||
    !Number.isInteger(Number(node.Sequence)) ||
    !node.Issuer ||
    !xrpl.isValidAddress(node.Issuer)
  ) {
    return null;
  }

  const sequence = Number(node.Sequence);
  if (sequence < 0 || sequence > 0xffffffff) return null;

  const sequenceHex = sequence.toString(16).padStart(8, "0").toUpperCase();
  const issuerHex = xrpl.accountIdHex(node.Issuer).toUpperCase();
  const id = `${sequenceHex}${issuerHex}`;
  return /^[0-9A-F]{48}$/.test(id) ? id : null;
}

async function discover(client) {
  let marker;
  let pages = 0;

  do {
    const response = await client.request({
      command: "ledger_data",
      ledger_index: "validated",
      type: "MPTokenIssuance",
      binary: false,
      limit: 256,
      ...(marker ? { marker } : {})
    });

    pages += 1;
    const state = response.result?.state ?? [];

    for (const node of state) {
      if (node?.LedgerEntryType !== "MPTokenIssuance") continue;
      const issuanceId = issuanceIdFromNode(node);
      if (!issuanceId) continue;

      try {
        const verified = await client.request({
          command: "ledger_entry",
          mpt_issuance: issuanceId,
          ledger_index: "validated"
        });
        if (verified.result?.node?.LedgerEntryType === "MPTokenIssuance") {
          return {
            pages,
            issuance_id: issuanceId,
            node: verified.result.node,
            ledger_index: verified.result.ledger_index ?? null,
            ledger_hash: verified.result.ledger_hash ?? null,
            validated: verified.result.validated ?? true
          };
        }
      } catch {
        // Continue until a derived ID independently resolves via ledger_entry.
      }
    }

    marker = response.result?.marker;
  } while (marker && pages < MAX_PAGES);

  return { pages, issuance_id: null, node: null, validated: false };
}

async function write(payload) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const file = path.join(ARTIFACT_DIR, `lab-005-discovery-${Date.now()}.json`);
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  return file;
}

async function main() {
  const client = new xrpl.Client(SERVER_URL);

  try {
    await client.connect();
    const found = await discover(client);

    if (!found.issuance_id || !found.node) {
      const noEvidence = {
        schema_version: "0.1",
        lab: "LAB-005",
        experiment: "VALIDATED_MPT_DISCOVERY",
        observed_at: now(),
        network: SERVER_URL,
        verification: "INCOMPLETE_NO_MPT_DISCOVERED",
        decision: "UNKNOWN",
        pass_locked: true,
        pages_scanned: found.pages
      };
      const file = await write(noEvidence);
      console.log(JSON.stringify(noEvidence, null, 2));
      console.log(`Evidence: ${file}`);
      process.exitCode = 2;
      return;
    }

    const issuance = normalizeMptIssuance(found.node, found.issuance_id);

    let issuerAccount = null;
    if (issuance.issuer && xrpl.isValidAddress(issuance.issuer)) {
      const info = await client.request({
        command: "account_info",
        account: issuance.issuer,
        ledger_index: "validated"
      });
      issuerAccount = {
        verification: "VERIFIED",
        address: issuance.issuer,
        flags: info.result?.account_data?.Flags ?? null,
        owner_count: info.result?.account_data?.OwnerCount ?? null,
        ledger_index: info.result?.ledger_index ?? null
      };
    }

    const passport = buildRiskPassport({
      issuance,
      issuerAccount,
      observedAt: now(),
      network: SERVER_URL
    });

    const result = {
      lab: "LAB-005",
      experiment: "VALIDATED_MPT_DISCOVERY",
      discovery: {
        pages_scanned: found.pages,
        ledger_index: found.ledger_index,
        ledger_hash: found.ledger_hash,
        validated: found.validated
      },
      passport
    };
    const file = await write(result);

    console.log("\n=== LAB-005 VALIDATED MPT DISCOVERY ===");
    console.log(`Issuance: ${found.issuance_id}`);
    console.log(`Issuer: ${issuance.issuer ?? "UNKNOWN"}`);
    console.log(`Ledger: ${found.ledger_index ?? "UNKNOWN"}`);
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
    experiment: "VALIDATED_MPT_DISCOVERY",
    observed_at: now(),
    network: SERVER_URL,
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
