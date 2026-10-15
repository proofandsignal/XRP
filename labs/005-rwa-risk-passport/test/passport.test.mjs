import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRiskPassport,
  decodeFlags,
  decodeMetadata,
  normalizeMptIssuance
} from "../src/passport.mjs";

test("decodes conventional JSON metadata", () => {
  const hex = Buffer.from(JSON.stringify({ t: "TBILL", ac: "rwa" }), "utf8").toString("hex");
  const result = decodeMetadata(hex);
  assert.equal(result.status, "DECODED");
  assert.equal(result.json.t, "TBILL");
  assert.equal(result.json.ac, "rwa");
});

test("preserves invalid metadata as evidence failure instead of inventing fields", () => {
  const result = decodeMetadata("XYZ");
  assert.equal(result.status, "INVALID");
  assert.equal(result.json, null);
});

test("decodes material MPT issuer capabilities", () => {
  const result = decodeFlags(0x02 | 0x04 | 0x20 | 0x40);
  assert.equal(result.valid, true);
  assert.equal(result.capabilities.can_lock, true);
  assert.equal(result.capabilities.require_auth, true);
  assert.equal(result.capabilities.can_transfer, true);
  assert.equal(result.capabilities.can_clawback, true);
});

test("normalizes supply and transfer fee without treating controls as a score", () => {
  const metadata = Buffer.from(JSON.stringify({ t: "TBILL" }), "utf8").toString("hex");
  const issuance = normalizeMptIssuance(
    {
      LedgerEntryType: "MPTokenIssuance",
      Flags: 0x02 | 0x20 | 0x40,
      Issuer: "rIssuer",
      AssetScale: 2,
      MaximumAmount: "100000000",
      OutstandingAmount: "100",
      TransferFee: 500,
      MPTokenMetadata: metadata
    },
    "00112233445566778899AABBCCDDEEFF0011223344556677"
  );

  assert.equal(issuance.verification, "VERIFIED");
  assert.equal(issuance.maximum_amount, "100000000");
  assert.equal(issuance.outstanding_amount, "100");
  assert.equal(issuance.transfer_fee.basis_points, 50);
  assert.equal(issuance.transfer_fee.percent, 0.5);
});

test("valid ledger evidence remains REVIEW because external RWA evidence is unknown", () => {
  const issuance = normalizeMptIssuance(
    {
      LedgerEntryType: "MPTokenIssuance",
      Flags: 0x20 | 0x40,
      Issuer: "rIssuer",
      OutstandingAmount: "10",
      TransferFee: 0
    },
    "00112233445566778899AABBCCDDEEFF0011223344556677"
  );
  const passport = buildRiskPassport({ issuance });

  assert.equal(passport.decision, "REVIEW");
  assert.equal(passport.pass_locked, true);
  assert.equal(passport.external_evidence.asset_backing_or_reserves, "UNKNOWN");
  assert.ok(passport.review_points.includes("ISSUER_CAN_CLAWBACK"));
});

test("non-MPT input fails closed to UNKNOWN", () => {
  const issuance = normalizeMptIssuance(
    { LedgerEntryType: "AccountRoot", Flags: 0 },
    "00112233445566778899AABBCCDDEEFF0011223344556677"
  );
  const passport = buildRiskPassport({ issuance });
  assert.equal(passport.decision, "UNKNOWN");
  assert.equal(passport.pass_locked, true);
});
