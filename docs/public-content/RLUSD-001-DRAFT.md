# RLUSD on XRPL: what the ledger proves — and what still needs external evidence

Status: **LIVE-VERIFIED — READY FOR PUBLICATION REVIEW**

Ripple officially identifies the XRPL Mainnet issuer of Ripple USD (RLUSD) as:

`rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`

We used that address as the first live case for the Proof & Signal XRPL Intelligence Screen.

## The on-ledger result

The scan was anchored to validated XRPL ledger **107,761,290** with ledger hash:

`137E4B85103AA3E67224EDAB8933DB1E8F2A038B769E505FCC198CBABBADABF7`

The deterministic risk state was **REVIEW**, with **0 BLOCK findings**.

The REVIEW finding was **Clawback capability enabled**. This means the issuer account has the XRPL trust-line clawback capability enabled. It is a control capability — not evidence that clawback has been misused.

Other observed AccountRoot facts included Global Freeze off, DepositAuth on, Default Ripple on, Disable Master on, Disallow XRP on, Require Auth off and Require Destination Tag on.

## A second result matters just as much: evidence completeness

The live scan observed **20,000 trust lines** before reaching its configured safety bound. Within that bounded set it observed one issued asset, RLUSD, and **15,513 issuer-holder lines**.

So the evidence status is **PARTIAL**.

> **Risk state: REVIEW**  
> **Evidence status: PARTIAL**

We do not turn incomplete data into an asset-risk BLOCK, and we do not present bounded counts or obligation sums as complete totals.

## The first change-intelligence result

We also compared two independently captured validated RLUSD snapshots:

- ledger **107,761,255**
- ledger **107,761,290**

The deterministic transition result was:

> **NO MATERIAL CHANGE**

Across the compared evidence, the raw AccountRoot flags, risk state, finding set and the bounded 20,000-line observed trust-line window remained stable.

Because both snapshots contain partial bounded evidence, this result means **no material change was detected in the compared evidence**. It does not prove that every element of the complete issuer state was unchanged.

That distinction is the point of the Transition Engine: ledger movement alone is not an alert.

## What XRPL still does not prove by itself

The ledger can establish account configuration, control flags, trust-line state and a validated ledger anchor.

It does not by itself prove reserve sufficiency, redemption enforceability, legal issuer identity or regulatory compliance.

Ripple publishes separate RLUSD transparency and reserve information. In the Risk Passport model, that information belongs to an **external-evidence namespace** rather than being silently promoted to a ledger fact.

## Why this matters

Institutional systems need to distinguish **VERIFIED ON XRPL**, **VERIFIED EXTERNALLY**, **UNKNOWN** and **INTERPRETATION**.

The XRPL Intelligence Screen is being built around that separation, with a machine-readable Risk Passport and deterministic Transition Engine underneath the UI.

The live case produced an unsigned deterministic Risk Passport anchored to the validated ledger. Its hashes verify artifact integrity; they are not a publisher signature.

### Primary sources

- Ripple RLUSD token addresses: https://docs.ripple.com/products/stablecoin/overview/token-addresses
- Ripple RLUSD transparency: https://ripple.com/products/stablecoin/transparency/
- XRPL AccountRoot reference: https://xrpl.org/docs/references/protocol/ledger-data/ledger-entry-types/accountroot

This is technical evidence research, not investment advice.
