import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRiskPassport,
  decodeFlags,
  decodeImmutableFlags,
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

test("decodes immutable MPT properties separately from mutable capabilities", () => {
  const result = decodeImmutableFlags(0x20 | 0x10000 | 0x20000);
  assert.equal(result.valid, true);
  assert.equal(result.immutable.can_transfer, true);
  assert.equal(result.immutable.metadata, true);
  assert.equal(result.immutable.transfer_fee, true);
  assert.equal(result.unknown_bits, 0);
});

test("normalizes supply and transfer fee without treating controls as a score", () => {
  const metadata = Buffer.from(JSON.stringify({ t: "TBILL" }), "utf8").toString("hex");
  const issuance = normalizeMptIssuance(
    {
      LedgerEntryType: "MPTokenIssuance",
      Flags: 0x02 | 0x20 | 0x40,
      ImmutableFlags: 0x20,
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
  assert.equal(issuance.maximum_amount_source, "LEDGER_FIELD");
  assert.equal(issuance.outstanding_amount, "100");
  assert.equal(issuance.transfer_fee.basis_points, 50);
  assert.equal(issuance.transfer_fee.percent, 0.5);
  assert.equal(issuance.immutable_flags.immutable.can_transfer, true);
});

test("applies protocol defaults instead of reporting false unknowns", () => {
  const issuance = normalizeMptIssuance(
    {
      LedgerEntryType: "MPTokenIssuance",
      Flags: 0x20,
      Issuer: "rIssuer",
      OutstandingAmount: "0",
      Sequence: 1
    },
    "00112233445566778899AABBCCDDEEFF0011223344556677"
  );

  assert.equal(issuance.verification, "VERIFIED");
  assert.equal(issuance.asset_scale, 0);
  assert.equal(issuance.asset_scale_source, "PROTOCOL_DEFAULT");
  assert.equal(issuance.maximum_amount, "9223372036854775807");
  assert.equal(issuance.maximum_amount_source, "PROTOCOL_DEFAULT");
  assert.equal(issuance.transfer_fee.percent, 0);
  assert.equal(issuance.immutable_flags.raw, 0);
  assert.equal(issuance.locked_amount, "0");
  assert.equal(issuance.confidential_outstanding_amount, "0");
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
