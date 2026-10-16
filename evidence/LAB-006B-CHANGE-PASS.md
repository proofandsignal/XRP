# LAB-006B — RLUSD Information Edge PASS

## Decision

**DESCRIPTIVE INFORMATION EDGE PASS — RELATIVE TO RAW T1 BASELINE**

This experiment proves a narrow information edge:

> A verified T0/T1 comparator can show what changed, by how much, and from which XRPL evidence surface — information that a raw T1 snapshot alone does not contain.

This is **not** a predictive edge, market-timing edge, reserve-verification claim, trading signal or product-market-fit result.

**PRODUCT VALUE: NOT PROVEN**

## Accepted implementation head

- Branch: `lab/006b-rlusd-information-edge`
- Head: `f28edfcfbdfb8edbd2c631249941215613803a02`
- Workflow run: `38750823153`
- Comparator tests: **PASS**
- Live short-horizon T0/T1 experiment: **PASS**
- Historical frozen-horizon experiment: **PASS**

## Artifact A — short live horizon

- Artifact ID: `11980872424`
- Digest: `sha256:71abc639ab50fbe5a78256c79c487ae25c7f1ed4fdf524b65266c8d361e0aa4c`

This run demonstrates that the comparator can capture live changes between independently verified snapshots.

The short window is treated as a **pipeline validation**, not as evidence of durable market significance.

## Artifact B — frozen historical horizon

- Artifact ID: `11982180102`
- Digest: `sha256:94782bc1da874b787439d9d72f05d2a7d3439cc2e989366309e0695e2a4e6f67`
- Experiment: `FROZEN_HISTORICAL_HORIZON`
- Horizon: `1000 ledgers`
- T0 ledger: `107673421`
- T1 ledger: `107674421`

Evidence quality:

- comparable metrics: `15 / 15`
- changed metrics: `13 / 15`
- unknown metrics: `0`
- status: `CANDIDATE_CHANGE_EVIDENCE`

## Verified historical changes

### On-ledger RLUSD obligations signal

- T0: `1,059,760,300.841462`
- T1: `1,049,887,496.341493`
- delta: approximately `-9,872,804.50 RLUSD`
- relative change: approximately `-0.9316%`

Boundary:

This is a change in the XRPL on-ledger obligations signal. It is **not** an independent reserve, redemption or solvency conclusion.

### XRP_FOR_RLUSD captured top-N depth

Funded XRP-equivalent observation:

- T0: `2,695.775404 XRP`
- T1: `9,273.951505 XRP`
- relative change: approximately `+244.02%`

Funded RLUSD-equivalent observation:

- T0: `3,507.277639...`
- T1: `12,127.052836...`
- relative change: approximately `+245.77%`

Median quality changed by approximately `+0.5404%`.

Boundary:

These metrics describe the bounded captured book surface, not guaranteed executable total market depth.

### RLUSD_FOR_XRP captured top-N depth

Funded XRP-equivalent observation:

- T0: `10,399.871506 XRP`
- T1: `23,292.292212 XRP`
- relative change: approximately `+123.97%`

Funded RLUSD-equivalent observation:

- T0: `13,501.255400...`
- T1: `30,371.396428...`
- relative change: approximately `+124.95%`

Median quality changed by approximately `-0.5338%`.

### XRP / RLUSD AMM

XRP reserve:

- relative change: approximately `-0.3839%`

RLUSD reserve:

- relative change: approximately `+0.3911%`

Implied RLUSD/XRP reserve ratio:

- T0: `1.298114444568`
- T1: `1.308214086381`
- relative change: approximately `+0.7780%`

Boundary:

The reserve ratio is a descriptive pool-state metric, not a price forecast or trading recommendation.

### Bounded issuer-account activity mix

Across the rolling 50-transaction issuer-account window:

- Payment share: `0.12 → 0.14`
- OfferCreate share: `0.70 → 0.68`
- OfferCancel share: `0.16 → 0.18`

Boundary:

Issuer-account activity is not complete network-wide RLUSD flow.

## Why this is an information edge relative to the baseline

The baseline is a raw T1 snapshot.

A raw T1 snapshot can show the current obligations, order-book surface, AMM state and bounded issuer activity.

It cannot independently answer:

- what changed since T0,
- the direction of change,
- the magnitude of change,
- which evidence surface changed,
- whether some evidence remained stable while another moved.

LAB-006B adds those verified delta dimensions without introducing a predictive score.

Therefore:

`RAW T1 → CURRENT STATE`

`T0 + T1 → VERIFIED CHANGE STATE`

That difference is accepted as a **descriptive information edge**.

## What is NOT proven

This experiment does not prove:

- predictive alpha,
- depeg prediction,
- reserve quality,
- redemption solvency,
- regulatory status,
- total RLUSD network flow,
- trading profitability,
- willingness to pay,
- workflow value for a real treasury / payment / risk team,
- product-market fit.

## Next gate

`INFORMATION EDGE PASS → PRODUCT VALUE VALIDATION`

The next question is not whether more metrics can be added.

The next question is:

> Does a real treasury, payments, custody, lending or integration team make a better decision using the verified change report than using a raw RLUSD snapshot alone?
