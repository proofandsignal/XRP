import test from "node:test";
import assert from "node:assert/strict";
import {
  RLUSD_CURRENCY_HEX,
  RLUSD_MAINNET_ISSUER,
  buildRlusdSnapshot,
  normalizeAmm,
  normalizeGatewayBalances,
  normalizeIssuerAccount,
  normalizeIssuerActivity,
  normalizeOrderBook
} from "../src/intelligence.mjs";

test("normalizes validated issuer evidence", () => {
  const value = normalizeIssuerAccount({
    validated: true,
    ledger_index: 100,
    account_data: {
      Account: RLUSD_MAINNET_ISSUER,
      Flags: 123,
      OwnerCount: 5
    }
  });

  assert.equal(value.verification, "VERIFIED");
  assert.equal(value.address, RLUSD_MAINNET_ISSUER);
  assert.equal(value.flags, 123);
});

test("uses gateway obligations only when present", () => {
  const value = normalizeGatewayBalances({
    validated: true,
    ledger_index: 101,
    obligations: {
      [RLUSD_CURRENCY_HEX]: "1250000.50"
    }
  });

  assert.equal(value.verification, "VERIFIED");
  assert.equal(value.outstanding_rlusd, "1250000.50");
});

test("does not invent supply when gateway evidence is unavailable", () => {
  const value = normalizeGatewayBalances(null, {
    code: "noPermission",
    message: "disabled"
  });

  assert.equal(value.verification, "UNKNOWN");
  assert.equal(value.outstanding_rlusd, null);
});

test("normalizes order-book evidence without converting it into a price claim", () => {
  const value = normalizeOrderBook(
    {
      validated: true,
      ledger_index: 102,
      offers: [
        {
          quality: "2",
          TakerGets: "1000000",
          TakerPays: {
            currency: RLUSD_CURRENCY_HEX,
            issuer: RLUSD_MAINNET_ISSUER,
            value: "0.5"
          }
        }
      ]
    },
    "XRP_FOR_RLUSD"
  );

  assert.equal(value.verification, "VERIFIED");
  assert.equal(value.offer_count, 1);
  assert.equal(value.offers[0].quality, "2");
});

test("treats actNotFound AMM as verified absence", () => {
  const value = normalizeAmm(null, {
    code: "actNotFound",
    message: "Account not found."
  });

  assert.equal(value.verification, "VERIFIED");
  assert.equal(value.state, "ABSENT");
});

test("issuer activity is explicitly bounded", () => {
  const value = normalizeIssuerActivity(
    {
      validated: true,
      transactions: [
        {
          validated: true,
          ledger_index: 200,
          tx_json: { TransactionType: "Payment", hash: "ABC" }
        },
        {
          validated: true,
          ledger_index: 199,
          tx_json: { TransactionType: "TrustSet", hash: "DEF" }
        }
      ]
    },
    null,
    1
  );

  assert.equal(value.transactions_scanned, 1);
  assert.deepEqual(value.transaction_types, { Payment: 1 });
  assert.match(value.limitation, /not equivalent to complete network-wide RLUSD flow/);
});

test("snapshot remains REVIEW with PASS locked even when core evidence verifies", () => {
  const snapshot = buildRlusdSnapshot({
    observedAt: "2026-10-15T00:00:00.000Z",
    network: "wss://example.invalid",
    issuerAccount: { verification: "VERIFIED" },
    supply: { verification: "VERIFIED", outstanding_rlusd: "100" },
    bookXrpForRlusd: { verification: "VERIFIED" },
    bookRlusdForXrp: { verification: "VERIFIED" },
    amm: { verification: "VERIFIED", state: "ABSENT" },
    issuerActivity: { verification: "VERIFIED" }
  });

  assert.equal(snapshot.decision, "REVIEW");
  assert.equal(snapshot.pass_locked, true);
  assert.equal(
    snapshot.external_evidence.reserve_sufficiency,
    "UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED"
  );
});
