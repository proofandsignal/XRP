# VALIDATION-003 — XRPL Credit Evidence Adapter Target 5

**Source capability:** LAB-003 / LAB-003B / LAB-003C  
**Mode:** external validation  
**Production information edge:** NOT PROVEN  
**Real-money lending decisions:** locked  
**Gate:** `5 SENT → 5 QUALIFIED → 2 INTEGRATION ATTEMPTS → 1 MONETIZATION / ECOSYSTEM SIGNAL`

## Product thesis under validation

XRPL's native Lending Protocol deliberately leaves borrower underwriting and risk management off-chain.

The narrow product question is:

> Can a read-only adapter that normalizes XRPL borrower, Loan, LoanBroker, first-loss, impairment/default and account evidence make institutional underwriting and monitoring workflows easier, more explainable or more auditable?

This is **not** a predictive credit score.

The adapter must not claim:
- borrower approval,
- default probability,
- credit pricing,
- predictive information edge,
- real-money lending suitability.

Missing evidence remains UNKNOWN.

## First 5

### 1. Cicada Partners — P0

**Why now:** Cicada is the credit manager/originator in the current Clearpool + Ripple XRPL institutional lending model. Public material describes Cicada as responsible for sourcing borrowers, setting terms and managing credit risk.

**Validation angle:** Does normalized XRPL borrower/loan evidence reduce work or improve monitoring around origination, servicing, impairment/default and explainability?

**Public route:** info@cicada.partners

**Evidence sources:**
- https://www.cicada.partners/about
- https://www.cicada.partners/contact
- https://www.linkedin.com/posts/ripple_real-world-yield-institutional-lending-comes-activity-7496210538503344129-fypn

### 2. Clearpool — P0

**Why now:** Clearpool is building/testing institutional lending on XRPL using RLUSD, XLS-65 vaults and XLS-66 lending, while already operating institutional credit markets on other chains.

**Validation angle:** Could an XRPL-native evidence adapter complement borrower onboarding, loan monitoring or lender-facing risk transparency — or is it redundant with Clearpool/Credora/Cicada processes?

**Public route:** Clearpool borrower / institutional onboarding contact route at https://clearpool.finance/

**Evidence sources:**
- https://clearpool.finance/
- https://docs.clearpool.finance/clearpool/products/lending
- https://docs.clearpool.finance/clearpool/products/lending/dynamic

### 3. XRPL Commons — P0/P1

**Why now:** XRPL Commons explicitly works with institutions on use-case definition, lending architecture, operating models, integration paths and partner identification.

**Validation angle:** Is an external borrower/loan evidence adapter a missing integration component for teams adopting native XRPL lending, and which participant role would consume it?

**Public route:** adoption@xrpl-commons.org

**Evidence source:**
- https://www.xrpl-commons.org/newsroom/credit-comes-on-chain-introducing-xrpl-lending

### 4. Hex Trust — P1

**Why now:** Clearpool's XRPL credit stack identifies Hex Trust as custodian for RLUSD. Custody is not underwriting, but custody/operations teams can test whether normalized credit state is useful for institutional controls and reporting.

**Validation angle:** Would borrower/loan/first-loss evidence be useful alongside custody, settlement or institutional reporting, or should it remain entirely in the credit manager's domain?

**Public route:** sales@hextrust.com

**Evidence sources:**
- https://clearpool.finance/
- https://www.hextrust.com/contact
- https://www.hextrust.com/login

### 5. Ripple Partnerships — P1 / ecosystem signal

**Why now:** Ripple is actively supporting the XRPL lending stack and institutional credit model, but is not assumed to be the buyer.

**Validation angle:** Does the adapter fill a real ecosystem/integration gap between native lending objects and off-chain underwriting/monitoring, and should we be speaking to a specific loan-broker / credit-manager team instead?

**Public route:** https://ripple.com/contact/ — Contact Partnerships

**Evidence sources:**
- https://ripple.com/insights/the-xrpl-lending-protocol-bringing-credit-infrastructure-onchain/
- https://ripple.com/contact/

## Qualification rule

A response counts as **QUALIFIED** only if the responder:
1. understands institutional lending, underwriting, loan-broker operations, custody/integration, or XRPL lending architecture;
2. can evaluate where on-ledger lending evidence fits into an off-chain workflow;
3. gives concrete feedback on evidence fields, integration, monitoring, explainability, operational risk or willingness to pay;
4. can state whether the layer is useful, redundant, incomplete or incorrectly scoped.

Generic encouragement does not count.

## Integration attempt

Count only an actual attempt to:
- map an institutional credit workflow to the evidence schema,
- ingest or compare adapter JSON,
- use the output in borrower review or loan monitoring,
- reconcile Loan / LoanBroker state with an existing risk process,
- run a reproducible technical evaluation.

## Monetization / ecosystem signal

Count only:
- paid pilot,
- explicit willingness-to-pay,
- loan-broker / credit-manager integration commitment,
- institutional partner pilot,
- grant/program/ecosystem support tied to the working artifact.

No inferred signal.
