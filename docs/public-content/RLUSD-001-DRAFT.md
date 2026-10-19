# RLUSD on XRPL: what the ledger proves — and what still needs external evidence

Status: DRAFT — LIVE CASE RESULT REQUIRED BEFORE PUBLICATION

Ripple officially identifies the XRPL Mainnet issuer of Ripple USD (RLUSD) as:

`rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`

That gives us a useful real-world case for an evidence-first question:

> What can we verify directly from XRPL, and what still depends on evidence outside the ledger?

## On-ledger layer

BUILD-008 is designed to anchor issuer/account evidence to one validated ledger and inspect:

- issuer configuration,
- control flags,
- trust-line state,
- observable issuer obligations,
- data completeness,
- material deterministic findings,
- provenance and a machine-readable Risk Passport.

**LIVE RESULT PLACEHOLDER — do not publish until verified.**

## External-evidence layer

Claims about reserves, redemption, legal issuer identity and regulatory status are not proven merely because a token exists on XRPL.

Ripple publishes separate RLUSD transparency and reserve-report information. In the Risk Passport model, those sources belong to an external-evidence namespace rather than being silently treated as ledger facts.

## Why this separation matters

A useful institutional evidence system should be able to say:

- **VERIFIED ON XRPL**
- **VERIFIED EXTERNALLY**
- **UNKNOWN**
- **INTERPRETATION**

without collapsing all four into one opaque score.

That is the design direction of the Proof & Signal XRPL Intelligence Screen.

This is technical research, not investment advice.
