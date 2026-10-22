# BUILD-009 — Auditable Demo Evidence Export

Status: **DRAFT / READ-ONLY / MERGE LOCKED**  
Scope: provenance hardening for existing verified demo cases. No new RLUSD telemetry, issuer-risk rules, live RPC access, signing, trading, custody, deployment or paid dependencies.

## What was built

- An offline exporter for the **existing** RLUSD-001, RLUSD-002 and RLUSD-003 cases.
- Comparison of curated demo classifications, ledger spans, risk transitions and event lists to the checked-in canonical validation artifacts.
- SHA-256 digest of the **exact canonical file bytes** used by the exporter.
- Fail-closed behavior: any mismatched checked field aborts the export and does **not** produce an audit PASS.
- Explicit evidence boundary; RLUSD-001 remains **PARTIAL**, and off-chain settlement or reserve claims remain unverified.

## Run locally

From the repository root:

```bash
cd products/xrpl-risk-screen
npm test
node scripts/export-audited-case.mjs RLUSD-001 > rlusd-001-audited-pack.json
node scripts/export-audited-case.mjs RLUSD-002 > rlusd-002-audited-pack.json
node scripts/export-audited-case.mjs RLUSD-003 > rlusd-003-audited-pack.json
```

Generated outputs are local and are **not** automatically published, sent or uploaded.

## Meaning of PASS

`REPOSITORY_ARTIFACT_CONSISTENCY_PASS` proves only that the derived demo fields were consistent with the checked-in artifact read during this run. It is **not**:

- a fresh query or independent revalidation of XRPL Mainnet;
- an independent authenticity attestation for the repository or artifact;
- proof of off-chain reconciliation, treasury records, reserves, redemption, compliance or investment safety;
- a claim that the pilot is production ready.

For third-party verification, pin the exact Git commit and independently obtain the canonical bytes from that revision before comparing the SHA-256 digest. A hash alone is not a signature.

## Next gate

`LOCAL UNIT PASS → EXACT-HEAD GITHUB CI → REVIEW → HUMAN APPROVAL`

BUILD-009 remains the active stacked Draft PR. Do not merge or deploy without explicit human approval. Use verified cases in customer discovery, but do not claim an institutional pilot or revenue until separately demonstrated.
