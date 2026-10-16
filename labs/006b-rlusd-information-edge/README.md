# LAB-006B — RLUSD Information Edge

## Goal

Test whether comparing two independently verified RLUSD snapshots adds useful information beyond viewing the latest raw snapshot alone.

This lab does **not** add a predictive score.

## Experiment

```
LAB-006 snapshot T0
        +
LAB-006 snapshot T1
        ↓
like-for-like metric extraction
        ↓
absolute + relative deltas
        ↓
evidence-quality accounting
        ↓
change report
        ↓
CANDIDATE_CHANGE_EVIDENCE / NO_CHANGE_OBSERVED / INSUFFICIENT_EVIDENCE
```

## Compared evidence surfaces

- on-ledger outstanding RLUSD signal,
- XRP/RLUSD top-N order-book offer count,
- funded XRP / RLUSD in the captured top-N books,
- median order-book quality,
- XRP/RLUSD AMM reserves,
- AMM implied RLUSD/XRP reserve ratio,
- issuer-account Payment / OfferCreate / OfferCancel mix.

## Baseline

The baseline is the **raw T1 snapshot**.

The candidate edge is not "more data." It is the ability to answer:

> What changed since T0, by how much, and which verified ledger surface proves it?

## Hard boundary

- descriptive, not predictive,
- no depeg prediction,
- no reserve or redemption inference,
- no trading recommendation,
- no profitability claim,
- no complete network-flow claim,
- UNKNOWN propagates when like-for-like evidence is unavailable.

## Gate

A change artifact can only produce **candidate evidence**.

A claim of INFORMATION EDGE requires later human/product review that the deltas improve a real decision compared with the raw T1 baseline.
