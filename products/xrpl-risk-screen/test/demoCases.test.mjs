import test from "node:test"
import assert from "node:assert/strict"
import { DEMO_CASES, PUBLIC_RESEARCH_NOTE_URL, buildDemoEvidencePack } from "../lib/demoCases.mjs"

test("demo library contains the three verified RLUSD cases",()=>{
  assert.deepEqual(DEMO_CASES.map(x=>x.id),["RLUSD-001","RLUSD-002","RLUSD-003"])
  assert.equal(DEMO_CASES[0].classification,"NO_MATERIAL_CHANGE")
  assert.equal(DEMO_CASES[1].classification,"MATERIAL_CHANGE")
  assert.equal(DEMO_CASES[2].classification,"MATERIAL_CHANGE")
})

test("demo cases preserve evidence caveats and public source",()=>{
  assert.equal(DEMO_CASES.every(x=>x.caveat&&x.evidence_status),true)
  assert.match(PUBLIC_RESEARCH_NOTE_URL,/github\.com\/proofandsignal\/XRP\/issues\/27/)
})


test("demo evidence pack preserves case classification and provenance",()=>{
  const p=buildDemoEvidencePack("RLUSD-003")
  assert.equal(p.schema_version,"xrpl.demo_evidence_pack.v0.1")
  assert.equal(p.case.classification,"MATERIAL_CHANGE")
  assert.equal(p.provenance.status,"DERIVED_FROM_VERIFIED_CASE")
  assert.match(p.provenance.source_case_file,/RLUSD-003/)
  assert.match(p.boundary,/not a replacement/i)
})

test("unknown demo case does not fabricate evidence pack",()=>{
  assert.equal(buildDemoEvidencePack("UNKNOWN"),null)
})
