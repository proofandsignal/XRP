# Ripple Attention — Five-track execution map

Date: 2026-11-16
Primary issue: https://github.com/proofandsignal/XRP/issues/32
**Status: BOOST ACTIVE / RELEASE HOLD.** Planned items are not certified releases.

## Architecture: adapters, not islands

1. **XRPL Change Intelligence — P0 first.** Independently recheck historical RLUSD issuer clawback, SignerList and DisableMaster transitions with validated ledger anchors. Produce reproducible evidence pack and English 4S technical publication. Existing material: docs/public-content/FIRST-PUBLICATION-XRPL-CHANGE-INTELLIGENCE.md and #27.
2. **AgentPay Guard XRPL x402 — P0 feasibility; engineering freeze.** Record facilitator/network/token support, design isolated Testnet adapter and negative security fixtures. Reuse proven protocol-neutral policy, budget reservation and finality logic from Solana-Lab-Settlement-Assurance. Do NOT create a duplicate core; AgentPay validation #12 5/2/1 freeze remains until external signal and explicit rescope.
3. **RLUSD Settlement Assurance — P0 read-only.** LAB-007 introduces strict payment-intent reconciliation against supplied evidence. Next: authenticated XRPL adapter, replay-proof invoice ledger and independent Financial QA. No execution.
4. **XRPL Credit & RWA Risk Passport — P1.** Independently verify SingleAssetVault, LendingProtocol, LendingProtocolV1_1 and PermissionedDEX amendment status on the target network. Model subscription/investment/redemption locks, cash-basis vs scheduled interest, late/default loans, permissions/credentials and MPT issuer controls. Issuer-declared backing must remain UNKNOWN until independently verified.
5. **Developer Compatibility Monitor — P1.** Track xrpld release/amendments, regression-check read-only API semantics. Around the scheduled 2026-11-25 Testnet/Devnet reset, capture sanitized pre-reset fixtures, rerun after reset, report differences. Do not assume old accounts/data survive.

## Official source references

- XRPL x402: https://xrpl.org/docs/agents/agentic-payments-x402
- Vaults: https://xrpl.org/docs/concepts/tokens/single-asset-vaults
- Known amendments: https://xrpl.org/resources/known-amendments
- Reset notice: https://xrpl.org/blog/2026/testnet-devnet-reset
- RLUSD token identities: https://docs.ripple.com/products/stablecoin/overview/token-addresses

A web status displaying Loading... is NOT verification that an amendment is active; check the relevant network node.

## Hard gates and outcome metrics

- Independent Security / Financial (when relevant) / Legal / IP review, not author self-signoff.
- Protected HTTPS -> Desktop/Browser QA -> physical Samsung QA -> Human Approval.
- No mainnet funds, signing, custody, paid APIs, unsafe merge or public deploy.
- Historical validated XRPL evidence must not be marketed as real-time monitoring.
- Claim source must differ from verification source; NO NEW EVIDENCE means NO GATE CHANGE.
- Targets not achieved yet: 1 reproducible pack, 2 meaningful developer replies, 1 independent reproduction/accepted contribution, 1 pilot discussion.
