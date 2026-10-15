const FLAGS = Object.freeze({
  LOCKED: 0x00000001,
  CAN_LOCK: 0x00000002,
  REQUIRE_AUTH: 0x00000004,
  CAN_ESCROW: 0x00000008,
  CAN_TRADE: 0x00000010,
  CAN_TRANSFER: 0x00000020,
  CAN_CLAWBACK: 0x00000040,
  CAN_HOLD_CONFIDENTIAL_BALANCE: 0x00000080
});

const KNOWN_FLAG_MASK = Object.values(FLAGS).reduce((a, b) => (a | b) >>> 0, 0);

function asUInt32(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) return null;
  return n >>> 0;
}

function asUInt64String(value) {
  if (value === undefined || value === null) return null;
  const s = String(value);
  if (!/^\d+$/.test(s)) return null;
  return s;
}

export function decodeMetadata(hex) {
  if (hex === undefined || hex === null || hex === "") {
    return { status: "ABSENT", text: null, json: null };
  }
  if (
    typeof hex !== "string" ||
    hex.length > 2048 ||
    hex.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(hex)
  ) {
    return { status: "INVALID", text: null, json: null };
  }

  try {
    const text = Buffer.from(hex, "hex").toString("utf8");
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Metadata is arbitrary bytes. JSON is a convention, not a ledger guarantee.
    }
    return { status: "DECODED", text, json };
  } catch {
    return { status: "INVALID", text: null, json: null };
  }
}

export function decodeFlags(value) {
  const flags = asUInt32(value);
  if (flags === null) {
    return {
      valid: false,
      raw: value ?? null,
      unknown_bits: null,
      capabilities: {}
    };
  }

  const capabilities = {
    globally_locked: Boolean(flags & FLAGS.LOCKED),
    can_lock: Boolean(flags & FLAGS.CAN_LOCK),
    require_auth: Boolean(flags & FLAGS.REQUIRE_AUTH),
    can_escrow: Boolean(flags & FLAGS.CAN_ESCROW),
    can_trade: Boolean(flags & FLAGS.CAN_TRADE),
    can_transfer: Boolean(flags & FLAGS.CAN_TRANSFER),
    can_clawback: Boolean(flags & FLAGS.CAN_CLAWBACK),
    can_hold_confidential_balance: Boolean(
      flags & FLAGS.CAN_HOLD_CONFIDENTIAL_BALANCE
    )
  };

  return {
    valid: true,
    raw: flags,
    unknown_bits: (flags & (~KNOWN_FLAG_MASK >>> 0)) >>> 0,
    capabilities
  };
}

export function normalizeMptIssuance(node, issuanceId = null) {
  if (!node || node.LedgerEntryType !== "MPTokenIssuance") {
    return {
      verification: "FAILED",
      reason: "NOT_MPT_ISSUANCE",
      issuance_id: issuanceId,
      issuer: null
    };
  }

  const flags = decodeFlags(node.Flags ?? 0);
  const metadata = decodeMetadata(node.MPTokenMetadata);
  const transferFee = Number(node.TransferFee ?? 0);
  const transferFeeValid =
    Number.isInteger(transferFee) && transferFee >= 0 && transferFee <= 50000;

  return {
    verification: flags.valid && transferFeeValid ? "VERIFIED" : "PARTIAL",
    issuance_id: issuanceId,
    issuer: node.Issuer ?? null,
    asset_scale:
      Number.isInteger(Number(node.AssetScale)) ? Number(node.AssetScale) : null,
    maximum_amount: asUInt64String(node.MaximumAmount),
    outstanding_amount: asUInt64String(node.OutstandingAmount),
    locked_amount: asUInt64String(node.LockedAmount),
    transfer_fee: {
      raw_tenths_of_basis_point: transferFeeValid ? transferFee : null,
      basis_points: transferFeeValid ? transferFee / 10 : null,
      percent: transferFeeValid ? transferFee / 1000 : null
    },
    domain_id: node.DomainID ?? null,
    immutable_flags: asUInt32(node.ImmutableFlags),
    flags,
    metadata,
    previous_txn_id: node.PreviousTxnID ?? null,
    previous_txn_ledger: node.PreviousTxnLgrSeq ?? null,
    sequence: node.Sequence ?? null
  };
}

export function buildRiskPassport({
  issuance,
  issuerAccount = null,
  observedAt = new Date().toISOString(),
  network = "XRPL"
}) {
  if (!issuance || issuance.verification === "FAILED") {
    return {
      schema_version: "0.1",
      product: "RWA_RISK_PASSPORT",
      observed_at: observedAt,
      network,
      decision: "UNKNOWN",
      pass_locked: true,
      reason: "VALID_MPT_ISSUANCE_EVIDENCE_REQUIRED",
      evidence: { issuance: issuance ?? null }
    };
  }

  const c = issuance.flags?.capabilities ?? {};
  const reviewPoints = [];

  if (c.globally_locked) reviewPoints.push("ISSUANCE_GLOBALLY_LOCKED");
  if (c.can_lock) reviewPoints.push("ISSUER_CAN_LOCK");
  if (c.require_auth) reviewPoints.push("HOLDER_AUTH_REQUIRED");
  if (c.can_clawback) reviewPoints.push("ISSUER_CAN_CLAWBACK");
  if (c.can_transfer === false) reviewPoints.push("HOLDER_TRANSFER_RESTRICTED");
  if (Number(issuance.transfer_fee?.raw_tenths_of_basis_point ?? 0) > 0) {
    reviewPoints.push("NONZERO_TRANSFER_FEE");
  }
  if (issuance.domain_id) reviewPoints.push("PERMISSIONED_DOMAIN_LINKED");
  if (issuance.metadata?.status !== "DECODED") {
    reviewPoints.push("METADATA_NOT_DECODED");
  }
  if ((issuance.flags?.unknown_bits ?? 0) !== 0) {
    reviewPoints.push("UNKNOWN_FLAG_BITS_PRESENT");
  }

  return {
    schema_version: "0.1",
    product: "RWA_RISK_PASSPORT",
    observed_at: observedAt,
    network,
    subject: {
      type: "MPTokenIssuance",
      issuance_id: issuance.issuance_id,
      issuer: issuance.issuer
    },
    ledger_evidence: {
      verification: issuance.verification,
      issuance,
      issuer_account: issuerAccount
    },
    external_evidence: {
      issuer_legal_identity: "UNKNOWN",
      asset_backing_or_reserves: "UNKNOWN",
      redemption_rights: "UNKNOWN",
      regulatory_status: "UNKNOWN",
      independent_liquidity_quality: "UNKNOWN"
    },
    review_points: reviewPoints,
    decision: "REVIEW",
    pass_locked: true,
    reason:
      "ON_LEDGER_CONFIGURATION_VERIFIED_BUT_EXTERNAL_ISSUER_BACKING_RIGHTS_AND_LIQUIDITY_EVIDENCE_REQUIRED",
    disclaimer:
      "This passport reports evidence and control surfaces. It is not an investment recommendation, legal opinion, credit rating, or proof of asset backing."
  };
}
