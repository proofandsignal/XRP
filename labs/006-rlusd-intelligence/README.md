# LAB-006 — RLUSD Intelligence

## Goal

Build a **read-only, evidence-first RLUSD intelligence adapter** for the XRP Ledger.

The lab converts validated public ledger evidence into a machine-readable snapshot for later treasury, payments, liquidity and institutional-integration research.

It does **not** trade, create trust lines, hold custody, sign transactions or move Mainnet capital.

## Official RLUSD identity used by v0.1

- XRPL Mainnet issuer: `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`
- currency hex: `524C555344000000000000000000000000000000`

These values come from Ripple's current RLUSD developer documentation.

## v0.1 flow

```
official RLUSD identity
        ↓
validated issuer account
        ↓
gateway_balances supply signal (when public endpoint supports it)
        ↓
XRP/RLUSD order books + AMM state
        ↓
bounded recent issuer account activity
        ↓
RLUSD intelligence snapshot
        ↓
REVIEW / UNKNOWN
```

## Evidence boundary

The ledger can verify token/account/market state. It cannot by itself prove:

- adequacy of off-chain reserves,
- redemption solvency,
- regulatory compliance,
- off-chain USD movements,
- complete network-wide RLUSD flow,
- investment safety.

If `gateway_balances` is disabled by a public server, outstanding supply remains `UNKNOWN`; the adapter does not estimate or fabricate it.

Recent issuer activity is intentionally labeled **BOUNDED_ISSUER_ACCOUNT_ACTIVITY**, not total RLUSD transaction flow.

## Run tests

```bash
cd labs/006-rlusd-intelligence
npm install
npm test
```

## Run live read-only Mainnet observation

```bash
npm run live
```

Optional endpoint override:

```bash
XRPL_WS=wss://xrplcluster.com npm run live
```

No wallet seed or API key is required.

## Technical gate

- deterministic unit tests PASS,
- official issuer resolves on a validated ledger,
- at least one validated XRP/RLUSD market surface resolves,
- gateway supply is VERIFIED when available or UNKNOWN when unavailable,
- bounded issuer activity is clearly scoped,
- sanitized JSON evidence artifact is produced,
- no signing, trade or capital.
