import fs from "node:fs/promises";

const RLUSD_HEX = "524C555344000000000000000000000000000000";

function n(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, places = 12) {
  if (!Number.isFinite(value)) return null;
  const p = 10 ** places;
  return Math.round(value * p) / p;
}

function amountParts(amount) {
  if (typeof amount === "string" || typeof amount === "number") {
    const drops = n(amount);
    return {
      xrp: drops === null ? null : drops / 1_000_000,
      rlusd: null
    };
  }

  if (!amount || typeof amount !== "object") {
    return { xrp: null, rlusd: null };
  }

  const currency = amount.currency;
  const value = n(amount.value);
  const isRlusd = currency === "RLUSD" || currency === RLUSD_HEX;

  return {
    xrp: null,
    rlusd: isRlusd ? value : null
  };
}

function bookMetrics(book) {
  if (!book || book.verification !== "VERIFIED") {
    return {
      verification: "UNKNOWN",
      offer_count: null,
      funded_xrp: null,
      funded_rlusd: null,
      median_quality: null
    };
  }

  const offers = Array.isArray(book.offers) ? book.offers : [];
  let fundedXrp = 0;
  let fundedRlusd = 0;
  let sawXrp = false;
  let sawRlusd = false;
  const qualities = [];

  for (const offer of offers) {
    const gets = amountParts(offer.taker_gets_funded ?? offer.taker_gets);
    const pays = amountParts(offer.taker_pays_funded ?? offer.taker_pays);

    for (const part of [gets, pays]) {
      if (part.xrp !== null) {
        fundedXrp += part.xrp;
        sawXrp = true;
      }
      if (part.rlusd !== null) {
        fundedRlusd += part.rlusd;
        sawRlusd = true;
      }
    }

    const quality = n(offer.quality);
    if (quality !== null) qualities.push(quality);
  }

  qualities.sort((a, b) => a - b);
  let medianQuality = null;
  if (qualities.length > 0) {
    const mid = Math.floor(qualities.length / 2);
    medianQuality =
      qualities.length % 2 === 0
        ? (qualities[mid - 1] + qualities[mid]) / 2
        : qualities[mid];
  }

  return {
    verification: "VERIFIED",
    offer_count: book.offer_count ?? offers.length,
    funded_xrp: sawXrp ? round(fundedXrp) : null,
    funded_rlusd: sawRlusd ? round(fundedRlusd) : null,
    median_quality: round(medianQuality)
  };
}

function ammMetrics(amm) {
  if (!amm || amm.verification !== "VERIFIED" || amm.state !== "PRESENT") {
    return {
      verification: amm?.verification === "VERIFIED" ? "VERIFIED" : "UNKNOWN",
      state: amm?.state ?? "UNKNOWN",
      xrp_reserve: null,
      rlusd_reserve: null,
      implied_rlusd_per_xrp: null
    };
  }

  const amountA = amountParts(amm.amm?.amount);
  const amountB = amountParts(amm.amm?.amount2);

  const xrpReserve =
    amountA.xrp !== null ? amountA.xrp : amountB.xrp;
  const rlusdReserve =
    amountA.rlusd !== null ? amountA.rlusd : amountB.rlusd;

  return {
    verification: "VERIFIED",
    state: "PRESENT",
    xrp_reserve: round(xrpReserve),
    rlusd_reserve: round(rlusdReserve),
    implied_rlusd_per_xrp:
      xrpReserve && rlusdReserve
        ? round(rlusdReserve / xrpReserve)
        : null
  };
}

function txMix(activity) {
  if (!activity || activity.verification !== "VERIFIED") {
    return {
      verification: "UNKNOWN",
      scanned: null,
      payment_share: null,
      offer_create_share: null,
      offer_cancel_share: null
    };
  }

  const scanned = n(activity.transactions_scanned);
  const counts = activity.transaction_types ?? {};

  const share = (key) =>
    scanned && scanned > 0
      ? round((n(counts[key]) ?? 0) / scanned)
      : null;

  return {
    verification: "VERIFIED",
    scanned,
    payment_share: share("Payment"),
    offer_create_share: share("OfferCreate"),
    offer_cancel_share: share("OfferCancel")
  };
}

export function extractMetrics(snapshot) {
  return {
    observed_at: snapshot?.observed_at ?? null,
    snapshot_ledger: snapshot?.snapshot_ledger ?? snapshot?.issuer_account?.ledger_index ?? null,
    outstanding_rlusd:
      snapshot?.supply?.verification === "VERIFIED"
        ? n(snapshot?.supply?.outstanding_rlusd)
        : null,
    xrp_for_rlusd: bookMetrics(snapshot?.markets?.xrp_for_rlusd),
    rlusd_for_xrp: bookMetrics(snapshot?.markets?.rlusd_for_xrp),
    amm: ammMetrics(snapshot?.markets?.xrp_rlusd_amm),
    issuer_activity: txMix(snapshot?.issuer_activity)
  };
}

function delta(t0, t1) {
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) {
    return {
      verification: "UNKNOWN",
      t0,
      t1,
      absolute_delta: null,
      relative_pct: null
    };
  }

  const absolute = t1 - t0;
  return {
    verification: "VERIFIED",
    t0: round(t0),
    t1: round(t1),
    absolute_delta: round(absolute),
    relative_pct:
      t0 === 0 ? null : round((absolute / Math.abs(t0)) * 100, 9)
  };
}

function flattenComparable(metrics0, metrics1) {
  return {
    outstanding_rlusd: delta(metrics0.outstanding_rlusd, metrics1.outstanding_rlusd),

    xrp_for_rlusd_offer_count: delta(
      n(metrics0.xrp_for_rlusd.offer_count),
      n(metrics1.xrp_for_rlusd.offer_count)
    ),
    xrp_for_rlusd_funded_xrp: delta(
      metrics0.xrp_for_rlusd.funded_xrp,
      metrics1.xrp_for_rlusd.funded_xrp
    ),
    xrp_for_rlusd_funded_rlusd: delta(
      metrics0.xrp_for_rlusd.funded_rlusd,
      metrics1.xrp_for_rlusd.funded_rlusd
    ),
    xrp_for_rlusd_median_quality: delta(
      metrics0.xrp_for_rlusd.median_quality,
      metrics1.xrp_for_rlusd.median_quality
    ),

    rlusd_for_xrp_offer_count: delta(
      n(metrics0.rlusd_for_xrp.offer_count),
      n(metrics1.rlusd_for_xrp.offer_count)
    ),
    rlusd_for_xrp_funded_xrp: delta(
      metrics0.rlusd_for_xrp.funded_xrp,
      metrics1.rlusd_for_xrp.funded_xrp
    ),
    rlusd_for_xrp_funded_rlusd: delta(
      metrics0.rlusd_for_xrp.funded_rlusd,
      metrics1.rlusd_for_xrp.funded_rlusd
    ),
    rlusd_for_xrp_median_quality: delta(
      metrics0.rlusd_for_xrp.median_quality,
      metrics1.rlusd_for_xrp.median_quality
    ),

    amm_xrp_reserve: delta(metrics0.amm.xrp_reserve, metrics1.amm.xrp_reserve),
    amm_rlusd_reserve: delta(metrics0.amm.rlusd_reserve, metrics1.amm.rlusd_reserve),
    amm_implied_rlusd_per_xrp: delta(
      metrics0.amm.implied_rlusd_per_xrp,
      metrics1.amm.implied_rlusd_per_xrp
    ),

    issuer_payment_share: delta(
      metrics0.issuer_activity.payment_share,
      metrics1.issuer_activity.payment_share
    ),
    issuer_offer_create_share: delta(
      metrics0.issuer_activity.offer_create_share,
      metrics1.issuer_activity.offer_create_share
    ),
    issuer_offer_cancel_share: delta(
      metrics0.issuer_activity.offer_cancel_share,
      metrics1.issuer_activity.offer_cancel_share
    )
  };
}

export function compareSnapshots(snapshot0, snapshot1) {
  const t0 = extractMetrics(snapshot0);
  const t1 = extractMetrics(snapshot1);
  const changes = flattenComparable(t0, t1);

  const values = Object.values(changes);
  const comparable = values.filter((x) => x.verification === "VERIFIED");
  const changed = comparable.filter((x) => x.absolute_delta !== 0);

  return {
    schema_version: "0.1",
    lab: "LAB-006B",
    subject: "RLUSD",
    baseline: "RAW_T1_SNAPSHOT",
    candidate_edge: "VERIFIED_T0_T1_CHANGE_EXPLANATION",
    observed_at: new Date().toISOString(),
    t0: {
      observed_at: t0.observed_at,
      snapshot_ledger: t0.snapshot_ledger
    },
    t1: {
      observed_at: t1.observed_at,
      snapshot_ledger: t1.snapshot_ledger
    },
    metrics: changes,
    evidence_quality: {
      comparable_metrics: comparable.length,
      changed_metrics: changed.length,
      unknown_metrics: values.length - comparable.length
    },
    information_edge_status:
      comparable.length === 0
        ? "INSUFFICIENT_EVIDENCE"
        : changed.length === 0
          ? "NO_CHANGE_OBSERVED"
          : "CANDIDATE_CHANGE_EVIDENCE",
    claim_gate:
      "Human/product review required before any INFORMATION EDGE claim.",
    boundaries: [
      "Deltas are descriptive, not predictive.",
      "No reserve sufficiency or redemption inference.",
      "No trading recommendation or profitability claim.",
      "Issuer-account activity is not complete RLUSD network flow.",
      "Top-N order-book metrics describe the captured observation window only."
    ]
  };
}

async function main() {
  const t0Path = process.argv[2];
  const t1Path = process.argv[3];
  const outPath = process.argv[4] ?? "artifacts/lab-006b-change.json";

  if (!t0Path || !t1Path) {
    throw new Error("Usage: node src/compare.mjs <t0.json> <t1.json> [output.json]");
  }

  const [raw0, raw1] = await Promise.all([
    fs.readFile(t0Path, "utf8"),
    fs.readFile(t1Path, "utf8")
  ]);

  const report = compareSnapshots(JSON.parse(raw0), JSON.parse(raw1));

  await fs.mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log("=== LAB-006B RLUSD INFORMATION EDGE ===");
  console.log(`T0 ledger: ${report.t0.snapshot_ledger}`);
  console.log(`T1 ledger: ${report.t1.snapshot_ledger}`);
  console.log(`Comparable metrics: ${report.evidence_quality.comparable_metrics}`);
  console.log(`Changed metrics: ${report.evidence_quality.changed_metrics}`);
  console.log(`Status: ${report.information_edge_status}`);
  console.log(`Evidence: ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
