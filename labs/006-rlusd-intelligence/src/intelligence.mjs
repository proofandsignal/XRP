export const RLUSD_MAINNET_ISSUER =
  "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De";

export const RLUSD_CURRENCY_HEX =
  "524C555344000000000000000000000000000000";

function verificationFromResult(result) {
  return result?.validated === true ? "VERIFIED" : "UNKNOWN";
}

function normalizeError(error) {
  if (!error) return null;
  return {
    code:
      error?.data?.error ??
      error?.error ??
      error?.code ??
      error?.name ??
      "UNKNOWN_ERROR",
    message:
      error?.data?.error_message ??
      error?.message ??
      String(error)
  };
}

export function normalizeIssuerAccount(result) {
  const account = result?.account_data;
  if (!account) {
    return {
      verification: "UNKNOWN",
      address: RLUSD_MAINNET_ISSUER,
      ledger_index: result?.ledger_index ?? null,
      flags: null,
      owner_count: null,
      domain: null
    };
  }

  return {
    verification: verificationFromResult(result),
    address: account.Account ?? RLUSD_MAINNET_ISSUER,
    ledger_index: result?.ledger_index ?? null,
    ledger_hash: result?.ledger_hash ?? null,
    flags: account.Flags ?? null,
    owner_count: account.OwnerCount ?? null,
    domain: account.Domain ?? null
  };
}

export function normalizeGatewayBalances(result, error = null) {
  if (!result) {
    return {
      verification: "UNKNOWN",
      source: "gateway_balances",
      outstanding_rlusd: null,
      frozen_rlusd: null,
      limitation:
        "The public endpoint did not provide gateway_balances; no supply value is inferred.",
      error: normalizeError(error)
    };
  }

  const obligations = result.obligations ?? {};
  const frozen = result.frozen_balances ?? {};

  const outstanding =
    obligations[RLUSD_CURRENCY_HEX] ??
    obligations.RLUSD ??
    null;

  let frozenValue = null;
  if (frozen && typeof frozen === "object") {
    if (typeof frozen[RLUSD_CURRENCY_HEX] === "string") {
      frozenValue = frozen[RLUSD_CURRENCY_HEX];
    } else if (typeof frozen.RLUSD === "string") {
      frozenValue = frozen.RLUSD;
    }
  }

  return {
    verification: verificationFromResult(result),
    source: "gateway_balances",
    ledger_index: result.ledger_index ?? null,
    ledger_hash: result.ledger_hash ?? null,
    outstanding_rlusd: outstanding,
    frozen_rlusd: frozenValue,
    limitation:
      "On-ledger obligations are not proof of off-chain reserve sufficiency or redemption solvency.",
    error: null
  };
}

export function normalizeOrderBook(result, label, error = null) {
  if (!result) {
    return {
      verification: "UNKNOWN",
      label,
      offer_count: null,
      offers: [],
      error: normalizeError(error)
    };
  }

  const offers = Array.isArray(result.offers) ? result.offers : [];

  return {
    verification: verificationFromResult(result),
    label,
    ledger_index: result.ledger_index ?? null,
    ledger_hash: result.ledger_hash ?? null,
    offer_count: offers.length,
    offers: offers.slice(0, 10).map((offer) => ({
      quality: offer.quality ?? null,
      taker_gets: offer.TakerGets ?? null,
      taker_pays: offer.TakerPays ?? null,
      taker_gets_funded: offer.taker_gets_funded ?? null,
      taker_pays_funded: offer.taker_pays_funded ?? null
    })),
    error: null
  };
}

export function normalizeAmm(result, error = null) {
  if (!result) {
    const normalized = normalizeError(error);
    const absent = normalized?.code === "actNotFound";

    return {
      verification: absent ? "VERIFIED" : "UNKNOWN",
      state: absent ? "ABSENT" : "UNKNOWN",
      amm: null,
      error: normalized
    };
  }

  const amm = result.amm;
  if (!amm) {
    return {
      verification: "UNKNOWN",
      state: "UNKNOWN",
      amm: null,
      error: null
    };
  }

  return {
    verification: verificationFromResult(result),
    state: "PRESENT",
    ledger_index: result.ledger_index ?? null,
    ledger_hash: result.ledger_hash ?? null,
    amm: {
      account: amm.account ?? null,
      amount: amm.amount ?? null,
      amount2: amm.amount2 ?? null,
      lp_token: amm.lp_token ?? null,
      trading_fee: amm.trading_fee ?? null,
      asset_frozen: amm.asset_frozen ?? null,
      asset2_frozen: amm.asset2_frozen ?? null
    },
    error: null
  };
}

export function normalizeIssuerActivity(result, error = null, max = 50) {
  if (!result) {
    return {
      verification: "UNKNOWN",
      scope: "BOUNDED_ISSUER_ACCOUNT_ACTIVITY",
      transactions_scanned: 0,
      transaction_types: {},
      recent: [],
      limitation:
        "Issuer account activity is not equivalent to complete network-wide RLUSD flow.",
      error: normalizeError(error)
    };
  }

  const transactions = Array.isArray(result.transactions)
    ? result.transactions.slice(0, max)
    : [];

  const transactionTypes = {};
  const recent = [];

  for (const item of transactions) {
    const tx = item?.tx_json ?? item?.tx ?? {};
    const type = tx.TransactionType ?? "UNKNOWN";
    transactionTypes[type] = (transactionTypes[type] ?? 0) + 1;

    recent.push({
      hash: tx.hash ?? tx.Hash ?? null,
      transaction_type: type,
      ledger_index:
        item?.ledger_index ??
        tx.ledger_index ??
        tx.LedgerSequence ??
        null,
      validated: item?.validated === true
    });
  }

  return {
    verification: verificationFromResult(result),
    scope: "BOUNDED_ISSUER_ACCOUNT_ACTIVITY",
    transactions_scanned: transactions.length,
    transaction_types: transactionTypes,
    recent,
    limitation:
      "Issuer account activity is bounded and is not equivalent to complete network-wide RLUSD flow.",
    error: null
  };
}

export function buildRlusdSnapshot({
  observedAt,
  network,
  issuerAccount,
  supply,
  bookXrpForRlusd,
  bookRlusdForXrp,
  amm,
  issuerActivity
}) {
  const issuerVerified = issuerAccount?.verification === "VERIFIED";
  const marketVerified =
    bookXrpForRlusd?.verification === "VERIFIED" ||
    bookRlusdForXrp?.verification === "VERIFIED" ||
    amm?.verification === "VERIFIED";

  const decision = issuerVerified && marketVerified ? "REVIEW" : "UNKNOWN";

  return {
    schema_version: "0.1",
    lab: "LAB-006",
    product_hypothesis: "RLUSD Treasury & Flow Intelligence",
    observed_at: observedAt,
    network,
    subject: {
      asset: "RLUSD",
      currency_hex: RLUSD_CURRENCY_HEX,
      issuer: RLUSD_MAINNET_ISSUER
    },
    issuer_account: issuerAccount,
    supply,
    markets: {
      xrp_for_rlusd: bookXrpForRlusd,
      rlusd_for_xrp: bookRlusdForXrp,
      xrp_rlusd_amm: amm
    },
    issuer_activity: issuerActivity,
    external_evidence: {
      reserve_sufficiency: "UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED",
      redemption_solvency: "UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED",
      regulatory_status: "UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED",
      offchain_usd_flows: "UNKNOWN_EXTERNAL_EVIDENCE_REQUIRED"
    },
    decision,
    pass_locked: true,
    limitations: [
      "On-ledger supply does not prove reserve sufficiency.",
      "Issuer account activity is not total RLUSD network flow.",
      "Order-book and AMM state are point-in-time liquidity surfaces, not guaranteed executable depth.",
      "No investment-safety or credit-quality conclusion is produced."
    ]
  };
}
