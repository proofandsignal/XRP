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
  const expectedStatus = {
    "RLUSD-001": "LIVE_ARTIFACT_PAIR_VERIFIED",
    "RLUSD-002": "LIVE_HISTORICAL_TRANSITION_VERIFIED",
    "RLUSD-003": "LIVE_HISTORICAL_KEY_MANAGEMENT_TRANSITIONS_VERIFIED"
  }[demoCase.id]
  assertMatch("canonical verification status", canonical.status, expectedStatus)
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
  const unverified = []
  if (before?.evidence_status !== undefined && after?.evidence_status !== undefined) {
    assertMatch("before evidence completeness", demoCase.evidence_status, before.evidence_status)
    assertMatch("after evidence completeness", demoCase.evidence_status, after.evidence_status)
    checked.push("evidence completeness")
  } else {
    // Never stamp PASS for a claim absent from the checked-in canonical case.
    unverified.push("case.evidence_status")
  }
  return { checked_fields: checked, unverified_fields: unverified }
}

export async function buildAuditedDemoPack(id, options = {}) {
  const demoCase = getDemoCase(id)
  if (!demoCase) return null
  // The allowlisted case maps to a repository-owned path. The caller cannot supply a path.
  const content = options.canonicalBytes ?? await readFile(new URL(`../../../${demoCase.evidence_file}`, import.meta.url))
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content)
  const canonical = JSON.parse(bytes.toString("utf8"))
  const checks = validateCanonicalDemoCase(demoCase, canonical)
  const base = buildDemoEvidencePack(id)
  // A canonical artifact with no completeness field cannot support a COMPLETE claim.
  if (checks.unverified_fields.includes("case.evidence_status")) base.case.evidence_status = "UNKNOWN"
  return {
    ...base,
    audit: {
      status: checks.unverified_fields.length
        ? "REPOSITORY_ARTIFACT_PARTIAL_CONSISTENCY"
        : "REPOSITORY_ARTIFACT_CONSISTENCY_PASS",
      canonical_path: demoCase.evidence_file,
      canonical_sha256: createHash("sha256").update(bytes).digest("hex"),
      checked_fields: checks.checked_fields,
      unverified_fields: checks.unverified_fields,
      demo_reported_evidence_status: demoCase.evidence_status,
      method: "Compare the curated demo fields with the checked-in canonical case artifact; hash its exact UTF-8 bytes.",
      limitations: "This does not re-query XRPL, verify unrecorded completeness, validate external/issuer records, prove off-ledger settlement or establish the artifact's authenticity beyond the source repository. Compare this digest to independently obtained bytes from a pinned repository revision."
    }
  }
}
