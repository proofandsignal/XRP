# BUILD-009 — Auditable Demo Evidence Export

Status: **DRAFT / READ-ONLY / MERGE LOCKED**  
Scope: provenance hardening for existing verified demo cases. No new RLUSD telemetry, issuer-risk rules, live RPC access, signing, trading, custody, deployment or paid dependencies.

## What was built

- An offline exporter for the **existing** RLUSD-001, RLUSD-002 and RLUSD-003 cases.
- Comparison of curated demo classifications, ledger spans, risk transitions and event lists to the checked-in canonical validation artifacts.
- SHA-256 digest of the **exact canonical file bytes** used by the exporter.
- Fail-closed behavior: any mismatched checked field or unexpected canonical verification status aborts the export and does **not** produce an audit PASS.
- Exact allowlist of canonical statuses for RLUSD-001/002/003; the substring `UNVERIFIED` is never accepted just because it contains `VERIFIED`.
- If the canonical artifact omits evidence-completeness fields, the audited pack downgrades `case.evidence_status` to `UNKNOWN`, lists it in `unverified_fields`, and reports `REPOSITORY_ARTIFACT_PARTIAL_CONSISTENCY` instead of full PASS. This applies to RLUSD-003 in the present checked-in artifact; the separate demo catalogue's previously reported `COMPLETE` is disclosed as `demo_reported_evidence_status`, not independently verified by this audit.
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

`REPOSITORY_ARTIFACT_CONSISTENCY_PASS` proves only that the checked derived demo fields, including any asserted completeness, were consistent with the checked-in artifact read during this run. `REPOSITORY_ARTIFACT_PARTIAL_CONSISTENCY` explicitly identifies unchecked claims in `unverified_fields`; neither status is an independent ledger attestation. They are **not**:

- a fresh query or independent revalidation of XRPL Mainnet;
- an independent authenticity attestation for the repository or artifact;
- proof of off-chain reconciliation, treasury records, reserves, redemption, compliance or investment safety;
- a claim that the pilot is production ready.

For third-party verification, pin the exact Git commit and independently obtain the canonical bytes from that revision before comparing the SHA-256 digest. A hash alone is not a signature.

## Next gate

`FIX + REGRESSION TESTS → EXACT-HEAD GITHUB CI → INDEPENDENT SECURITY REVIEW → HUMAN APPROVAL`

BUILD-009 remains the active stacked Draft PR. Do not merge or deploy without explicit human approval. Use verified cases in customer discovery, but do not claim an institutional pilot or revenue until separately demonstrated.
