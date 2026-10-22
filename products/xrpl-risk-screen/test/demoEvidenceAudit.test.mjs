import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { buildAuditedDemoPack } from "../lib/demoEvidenceAudit.mjs"

for (const id of ["RLUSD-001", "RLUSD-002", "RLUSD-003"]) {
  test(`${id}: auditable pack matches checked-in canonical evidence`, async () => {
    const pack = await buildAuditedDemoPack(id)
    const bytes = await readFile(new URL(`../../../${pack.audit.canonical_path}`, import.meta.url))
    assert.equal(pack.audit.status, "REPOSITORY_ARTIFACT_CONSISTENCY_PASS")
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
