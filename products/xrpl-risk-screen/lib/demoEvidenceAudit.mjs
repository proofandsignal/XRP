import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { buildDemoEvidencePack, getDemoCase } from "./demoCases.mjs"

function assertMatch(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`EVIDENCE_MISMATCH: ${label}`)
  }
}

export function validateCanonicalDemoCase(demoCase, canonical) {
  if (!canonical || typeof canonical !== "object") throw new Error("EVIDENCE_MISMATCH: missing canonical evidence")
  if (!canonical.status?.includes("VERIFIED")) throw new Error("EVIDENCE_MISMATCH: unverified canonical status")
  assertMatch("network", demoCase.network, canonical.subject?.network)
  if (canonical.case_id) assertMatch("case id", demoCase.id, canonical.case_id)
  else if (!canonical.transition_id?.startsWith(`${demoCase.id}-`)) throw new Error("EVIDENCE_MISMATCH: transition id")

  let before, after, classification, events
  const checked = ["canonical verification status", "case id", "network"]
  if (canonical.stage_a && canonical.stage_b) {
    const a = canonical.stage_a, b = canonical.stage_b
    before = a.before
    after = b.after
    assertMatch("stage A classification", a.transition?.classification, demoCase.classification)
    assertMatch("stage B classification", b.transition?.classification, demoCase.classification)
    events = [...(a.transition?.events ?? []), ...(b.transition?.events ?? [])]
    classification = a.transition.classification
    checked.push("both stage classifications", "both stage event lists")
  } else {
    before = canonical.before
    after = canonical.after
    classification = canonical.transition?.classification
    events = canonical.transition?.events ?? []
    if (canonical.transition?.event_count !== undefined) {
      assertMatch("event count", events.length, canonical.transition.event_count)
      checked.push("event count")
    }
    checked.push("transition classification", "transition event list")
  }
  assertMatch("classification", demoCase.classification, classification)
  assertMatch("ledger span", demoCase.ledgers, `${before?.ledger_index} → ${after?.ledger_index}`)
  assertMatch("risk transition", demoCase.risk_transition, `${before?.risk_state} → ${after?.risk_state}`)
  assertMatch("events", demoCase.events, events)
  checked.push("ledger span", "risk transition", "events")
  if (before?.evidence_status !== undefined && after?.evidence_status !== undefined) {
    assertMatch("before evidence completeness", demoCase.evidence_status, before.evidence_status)
    assertMatch("after evidence completeness", demoCase.evidence_status, after.evidence_status)
    checked.push("evidence completeness")
  }
  return checked
}

export async function buildAuditedDemoPack(id, options = {}) {
  const demoCase = getDemoCase(id)
  if (!demoCase) return null
  // The allowlisted case maps to a repository-owned path. The caller cannot supply a path.
  const content = options.canonicalBytes ?? await readFile(new URL(`../../../${demoCase.evidence_file}`, import.meta.url))
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content)
  const canonical = JSON.parse(bytes.toString("utf8"))
  const checkedFields = validateCanonicalDemoCase(demoCase, canonical)
  const base = buildDemoEvidencePack(id)
  return {
    ...base,
    audit: {
      status: "REPOSITORY_ARTIFACT_CONSISTENCY_PASS",
      canonical_path: demoCase.evidence_file,
      canonical_sha256: createHash("sha256").update(bytes).digest("hex"),
      checked_fields: checkedFields,
      method: "Compare the curated demo fields with the checked-in canonical case artifact; hash its exact UTF-8 bytes.",
      limitations: "This does not re-query XRPL, validate external/issuer records, prove off-ledger settlement or establish the artifact's authenticity beyond the source repository. Compare this digest to independently obtained bytes from a pinned repository revision."
    }
  }
}
