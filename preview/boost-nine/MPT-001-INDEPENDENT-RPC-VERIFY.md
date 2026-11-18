# MPT-001 — Independent XRPL Mainnet Archive Verification Protocol

**Evidence status:** NOT EXECUTED in this review pack. This document contains reproducible requests, not RPC results.

## Claim to test
- Network: XRP Ledger Mainnet
- Historical validated ledger index: `107775551`
- Claimed ledger hash: `ABB04B5374AA7A141AAA698D372F99BAB7224C07E0E59A7A60B6C4ABCEA1901F`
- MPTokenIssuanceID: `05EECEBE97A7D635DE2393068691A015FED5A89AD203F5AA`
- Claimed ledger issuer account: `rNFta7UKwcoiCpxEYbhH2v92numE3cceB6`

**Do not mislabel the issuance ID as the issuer account.** These identifiers appear in public XRPL examples. Reading documentation is NOT independent verification of historical ledger state.

## Preconditions
1. Obtain a verified, trusted XRPL Mainnet HTTPS **JSON-RPC endpoint with historical state** including ledger `107775551`. Ask the provider to state its history range. Do not assume a typical public server has this history.
2. Record the endpoint hostname, UTC capture time, node/provider, client version, and reviewer identity. Never paste API keys or authentication headers into the evidence pack.
3. Calls must be read-only; no wallet, signing, payment, transaction submission, or seed key.

## Independent JSON-RPC requests
Set `XRPL_ARCHIVE_RPC` to the reviewer-approved archival JSON-RPC endpoint, then use the examples below (no endpoint or result is pre-supplied).

### A. Ledger header

```bash
curl -fsS --max-time 25 -H "Content-Type: application/json" \
  --data '{"method":"ledger","params":[{"ledger_index":107775551,"transactions":false,"expand":false}]}' \
  "$XRPL_ARCHIVE_RPC" > ledger-107775551.response.json
```

Check `result.status`, `result.ledger_index` / `result.ledger.ledger_index`, `result.ledger_hash` / `result.ledger.hash`, and `result.validated` / `result.ledger.validated` depending on server response. A match of an unvalidated header is insufficient.

### B. MPT issuance at the same historical ledger

```bash
curl -fsS --max-time 25 -H "Content-Type: application/json" \
  --data '{"method":"ledger_entry","params":[{"mpt_issuance":"05EECEBE97A7D635DE2393068691A015FED5A89AD203F5AA","ledger_index":107775551,"binary":false}]}' \
  "$XRPL_ARCHIVE_RPC" > mpt-001-ledger-entry.response.json
```

Check `result.status`, `result.ledger_index`, `result.node.LedgerEntryType === "MPTokenIssuance"`, `result.node.Issuer`, flags and reported issuance fields. If the node reports missing historical ledger, document `HISTORY_UNAVAILABLE`, not a negative on-chain finding; if object not found with historical ledger confirmed, investigate issuance timing and identity.

### C. Record independently
- Save **raw** JSON for both RPC calls with UTC time, endpoint (redact keys), and SHA-256 of each raw file.
- Cross-check both queries use the same ledger index and same validated ledger hash.
- Ideally corroborate with an **independent second archival node**. A re-reading of `validation/cases/MPT-001.md` is a claim-source repetition, not independent verification.
- Reviewer report must say **ON-CHAIN HISTORICAL VERIFIED / MISMATCH / INCONCLUSIVE** with exact reasons and source links.

## Non-goals / hard limits
Even an archive RPC PASS does not prove legal issuer identity, off-chain asset ownership, reserve sufficiency, redemption enforceability, investment safety, regulation or liquidity. These fields stay `UNKNOWN` until independently verified by proper sources.

## References
- https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger
- https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger_entry
- https://xrpl.org/docs/concepts/networks-and-servers/ledger-history

`NO PRIMARY RPC CAPTURE → HISTORICAL INDEPENDENT VERIFICATION PENDING`
