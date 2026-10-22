import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { buildAuditedDemoPack } from "../lib/demoEvidenceAudit.mjs"

for (const id of ["RLUSD-001", "RLUSD-002", "RLUSD-003"]) {
  test(`${id}: auditable pack matches checked-in canonical evidence`, async () => {
    const pack = await buildAuditedDemoPack(id)
    const bytes = await readFile(new URL(`../../../${pack.audit.canonical_path}`, import.meta.url))
    assert.equal(pack.audit.status, id === "RLUSD-003"
      ? "REPOSITORY_ARTIFACT_PARTIAL_CONSISTENCY"
      : "REPOSITORY_ARTIFACT_CONSISTENCY_PASS")
    assert.deepEqual(pack.audit.unverified_fields, id === "RLUSD-003" ? ["case.evidence_status"] : [])
    if (id === "RLUSD-003") {
      assert.equal(pack.case.evidence_status, "UNKNOWN")
      assert.equal(pack.audit.demo_reported_evidence_status, "COMPLETE")
    }
    assert.equal(pack.audit.canonical_sha256, createHash("sha256").update(bytes).digest("hex"))
    assert.equal(pack.case.id, id)
    assert.equal(pack.provenance.status, "DERIVED_FROM_VERIFIED_CASE")
    assert.match(pack.audit.limitations, /does not re-query XRPL/)
  })
}

test("rejects tampered canonical classification, never issues PASS", async () => {
  const path = new URL("../../../validation/cases/RLUSD-002-MATERIAL-TRANSITION.json", import.meta.url)
  const canonical = JSON.parse(await readFile(path, "utf8"))
  canonical.transition.classification = "NO_MATERIAL_CHANGE"
  await assert.rejects(
    () => buildAuditedDemoPack("RLUSD-002", { canonicalBytes: JSON.stringify(canonical) }),
    /EVIDENCE_MISMATCH: classification/
  )
})

test("rejects modified ledger ranges", async () => {
  const path = new URL("../../../validation/cases/RLUSD-001-TRANSITION-001.json", import.meta.url)
  const canonical = JSON.parse(await readFile(path, "utf8"))
  canonical.after.ledger_index += 1
  await assert.rejects(
    () => buildAuditedDemoPack("RLUSD-001", { canonicalBytes: JSON.stringify(canonical) }),
    /EVIDENCE_MISMATCH: ledger span/
  )
})

test("unknown case cannot produce an audit report", async () => {
  assert.equal(await buildAuditedDemoPack("RLUSD-999"), null)
})

test("rejects UNVERIFIED status even though it contains VERIFIED", async () => {
  const path = new URL("../../../validation/cases/RLUSD-001-TRANSITION-001.json", import.meta.url)
  const canonical = JSON.parse(await readFile(path, "utf8"))
  canonical.status = "UNVERIFIED"
  await assert.rejects(
    () => buildAuditedDemoPack("RLUSD-001", { canonicalBytes: JSON.stringify(canonical) }),
    /EVIDENCE_MISMATCH: canonical verification status/
  )
})

test("rejects a revoked status with a VERIFIED substring", async () => {
  const path = new URL("../../../validation/cases/RLUSD-002-MATERIAL-TRANSITION.json", import.meta.url)
  const canonical = JSON.parse(await readFile(path, "utf8"))
  canonical.status = "LIVE_HISTORICAL_TRANSITION_VERIFIED_REVOKED"
  await assert.rejects(
    () => buildAuditedDemoPack("RLUSD-002", { canonicalBytes: JSON.stringify(canonical) }),
    /EVIDENCE_MISMATCH: canonical verification status/
  )
})

test("incomplete canonical completeness never earns full PASS", async () => {
  const path = new URL("../../../validation/cases/RLUSD-002-MATERIAL-TRANSITION.json", import.meta.url)
  const canonical = JSON.parse(await readFile(path, "utf8"))
  delete canonical.before.evidence_status
  const result = await buildAuditedDemoPack("RLUSD-002", { canonicalBytes: JSON.stringify(canonical) })
  assert.equal(result.audit.status, "REPOSITORY_ARTIFACT_PARTIAL_CONSISTENCY")
  assert.equal(result.case.evidence_status, "UNKNOWN")
  assert.deepEqual(result.audit.unverified_fields, ["case.evidence_status"])
})
