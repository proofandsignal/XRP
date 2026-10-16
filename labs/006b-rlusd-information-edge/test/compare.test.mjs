import test from "node:test";
import assert from "node:assert/strict";
import { compareSnapshots, extractMetrics } from "../src/compare.mjs";

function snapshot({
  ledger,
  supply = "100",
  xrpBook = 2,
  rlusdBook = 2,
  ammXrp = "1000000000",
  ammRlusd = "500",
  payments = 2,
  creates = 2,
  cancels = 1
} = {}) {
  const offer = {
    quality: "2",
    taker_gets: "1000000",
    taker_pays: {
      currency: "524C555344000000000000000000000000000000",
      value: "0.5"
    }
  };

  return {
    observed_at: "2026-10-15T00:00:00Z",
    snapshot_ledger: ledger,
    supply: { verification: "VERIFIED", outstanding_rlusd: supply },
    markets: {
      xrp_for_rlusd: {
        verification: "VERIFIED",
        offer_count: xrpBook,
        offers: Array.from({ length: xrpBook }, () => offer)
      },
      rlusd_for_xrp: {
        verification: "VERIFIED",
        offer_count: rlusdBook,
        offers: Array.from({ length: rlusdBook }, () => offer)
      },
      xrp_rlusd_amm: {
        verification: "VERIFIED",
        state: "PRESENT",
        amm: {
          amount: ammXrp,
          amount2: {
            currency: "524C555344000000000000000000000000000000",
            value: ammRlusd
          }
        }
      }
    },
    issuer_activity: {
      verification: "VERIFIED",
      transactions_scanned: payments + creates + cancels,
      transaction_types: {
        Payment: payments,
        OfferCreate: creates,
        OfferCancel: cancels
      }
    }
  };
}

test("extracts comparable snapshot metrics", () => {
  const m = extractMetrics(snapshot({ ledger: 10 }));
  assert.equal(m.snapshot_ledger, 10);
  assert.equal(m.outstanding_rlusd, 100);
  assert.equal(m.xrp_for_rlusd.offer_count, 2);
  assert.equal(m.xrp_for_rlusd.funded_xrp, 2);
  assert.equal(m.xrp_for_rlusd.funded_rlusd, 1);
  assert.equal(m.amm.xrp_reserve, 1000);
  assert.equal(m.amm.rlusd_reserve, 500);
  assert.equal(m.amm.implied_rlusd_per_xrp, 0.5);
});

test("reports deterministic deltas without predictive claim", () => {
  const report = compareSnapshots(
    snapshot({ ledger: 10, supply: "100", ammRlusd: "500" }),
    snapshot({ ledger: 20, supply: "110", ammRlusd: "550" })
  );

  assert.equal(report.metrics.outstanding_rlusd.absolute_delta, 10);
  assert.equal(report.metrics.outstanding_rlusd.relative_pct, 10);
  assert.equal(report.metrics.amm_rlusd_reserve.absolute_delta, 50);
  assert.equal(report.information_edge_status, "CANDIDATE_CHANGE_EVIDENCE");
  assert.match(report.claim_gate, /Human\/product review required/);
});

test("propagates UNKNOWN rather than fabricating a delta", () => {
  const t0 = snapshot({ ledger: 10 });
  t0.supply = { verification: "UNKNOWN", outstanding_rlusd: null };

  const report = compareSnapshots(t0, snapshot({ ledger: 20, supply: "110" }));

  assert.equal(report.metrics.outstanding_rlusd.verification, "UNKNOWN");
  assert.equal(report.metrics.outstanding_rlusd.absolute_delta, null);
});

test("no observed change is not called information edge", () => {
  const report = compareSnapshots(
    snapshot({ ledger: 10 }),
    snapshot({ ledger: 20 })
  );

  assert.equal(report.information_edge_status, "NO_CHANGE_OBSERVED");
});
