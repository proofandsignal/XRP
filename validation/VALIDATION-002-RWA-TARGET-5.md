# VALIDATION-002 — RWA Risk Passport Target 5

**Product:** PRODUCT-002 — RWA Risk Passport  
**Mode:** external validation  
**Engineering:** frozen except evidence-backed correctness/security/integration defects  
**Gate:** `5 SENT → 5 QUALIFIED → 2 INTEGRATION ATTEMPTS → 1 MONETIZATION / ECOSYSTEM SIGNAL`

## Selection principle

Targets must already operate, integrate, issue, administer, settle, custody, or use tokenized assets in or around XRPL. We are not asking generic crypto audiences whether the concept is interesting.

The validation question is:

> Does a separate machine-readable evidence passport — combining XRPL issuer/control facts with explicit off-chain evidence gaps — solve a real workflow problem for institutional tokenized assets?

## First 5

### 1. Licuido — P0

**Why now:** Licuido publicly describes an institutional tokenization and collateral platform using XRPL's MPT standard, with audit/monitoring and legal-ownership workflows.

**Validation angle:** Can an independent asset/issuer evidence passport improve onboarding, collateral eligibility, ongoing monitoring, or downstream integration without duplicating Licuido's internal controls?

**Public route:** hello@licuido.io

**Evidence sources:**
- https://licuido.io/
- https://ripple.com/ripple-press/ripple-strengthens-digital-capital-markets-infrastructure-with-investments-in-zilo-and-licuido/

### 2. ZILO — P0

**Why now:** ZILO launched an integrated digital-assets and transfer-agency platform and announced a strategic Ripple partnership in August 2026.

**Validation angle:** Does a normalized token evidence layer help a transfer agent reconcile on-ledger asset controls/metadata with fund-administration and investor-servicing evidence?

**Public route:** contact@zilo.co.uk

**Evidence sources:**
- https://www.zilo.co.uk/contact-us
- https://www.zilo.co.uk/insight-articles/zilo-tm-launches-fully-integrated-digital-assets-and-transfer-agency-platform
- https://ripple.com/ripple-press/ripple-strengthens-digital-capital-markets-infrastructure-with-investments-in-zilo-and-licuido/

### 3. CRX Markets — P0

**Why now:** Ripple's current tokenization material cites CRX Markets as using Ripple Custody + XRPL for a tokenized-asset platform with significant on-chain settlement activity.

**Validation angle:** Would independent issuer/control/backing/redemption/liquidity evidence be useful for asset onboarding, financing eligibility, monitoring, or external counterparties?

**Public route:** sales@crxmarkets.com

**Evidence sources:**
- https://ripple.com/use-case/issue-tokenized-assets/
- https://www.crxmarkets.com/en/contact
- https://www.crxmarkets.com/en/legal-notice

### 4. CSD BR — P1

**Why now:** On 29 September 2026 CSD BR and Ripple announced a live-market phase using XRPL as an additional recording/audit layer for financial assets, beginning with BTG Pactual investment fund shares, while CSD BR remains the official source of record.

**Validation angle:** This is a direct test of our evidence-boundary thesis: can a passport explicitly distinguish public-ledger facts from authoritative off-chain ownership/registration evidence?

**Public route:** contato@csdbr.com

**Evidence sources:**
- https://ripple.com/ripple-press/csdbr-and-ripple-use-the-xrp-ledger-blockchain-to-expand-brazils-financial-market-infrastructure/
- https://csdbr.com/

### 5. Ondo Finance — P1

**Why now:** OUSG is live on XRPL and Ondo publishes institutional eligibility, backing, redemption and liquidity information for the product.

**Validation angle:** Can a machine-readable evidence passport make chain configuration + issuer/product evidence easier for wallets, collateral venues, institutional integrations, or risk teams to consume?

**Public route:** support@ondo.finance / https://ondo.finance/contact

**Evidence sources:**
- https://ondo.finance/blog/ondo-finance-brings-tokenized-treasuries-to-the-xrp-ledger-with-seamless-mint-redeem-via-ripples-rlusd-stablecoin
- https://ondo.finance/ousg
- https://ondo.finance/contact

## Qualification rule

A response is **QUALIFIED** only when the responder:

1. works on or materially understands a tokenization / custody / transfer-agency / collateral / treasury / institutional-risk workflow;
2. understands where on-ledger evidence ends and external issuer/asset evidence begins;
3. gives specific feedback on integration, risk, compliance, operations, data requirements, or willingness to pay;
4. can evaluate whether a separate passport layer is useful or redundant.

Generic praise, acknowledgements, social engagement, or "interesting idea" do not count.

## Integration attempt

Count only when an external party actually tries to:
- map its asset to the passport schema,
- consume passport JSON/API output,
- compare the output with an existing due-diligence/control process,
- embed it in an onboarding/monitoring/collateral workflow,
- or run a reproducible technical evaluation.

## Monetization / ecosystem signal

Count only:
- paid pilot,
- explicit willingness-to-pay,
- partner integration commitment,
- issuer/platform pilot,
- grant/program/ecosystem support tied to the working artifact.

No inferred signal.
