import test from "node:test"
import assert from "node:assert/strict"
import { compareTransitionSnapshots } from "../lib/transitions.mjs"

const before={
  schema_version:"xrpl.transition_snapshot.v0.1",
  type:"ACCOUNT",
  subject:{network:"mainnet",identifier:"rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"},
  ledger:{index:107761255,hash:"592DA3E3EE264BBE22D2B9C843A76E48F5F333F46F10FB6AAEFCD664191C531F",validated:true},
  generated_at:"2026-10-19T11:55:19.143Z",
  risk_state:"REVIEW",
  evidence_status:"PARTIAL",
  account:{flags_raw:2174353408,domain:"https://ripple.com/",transfer_rate:null,regular_key:null,balance_xrp:"99.77836",owner_count:19},
  issuer:{role:"ACTIVE_ISSUER",settings:{default_ripple:true,require_auth:false,global_freeze:false,no_freeze:false,clawback_enabled:true,token_escrow_enabled:false,transfer_rate:null},counts:{issued_assets:1,issued_holder_lines:15513,issuer_frozen_lines:0}},
  findings:[{id:"CLAWBACK_CAPABILITY_ENABLED",severity:"REVIEW",category:"ISSUER_CONTROL"}],
  evidence_issues:["DATA_TRUNCATED"],
  observed_trust_lines:{count:20000,digest_sha256:"b7f4f8aa0edf0a7338840c2edc39bf829fd9ec4131c480d936db045adce915ee",complete:false,truncated:true,truncation_reason:"MAX_ITEMS"},
  passport:{id:"xrpl:account:mainnet:rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De:107761255:ee5e66d097f74c61",evidence_fingerprint_sha256:null,artifact_sha256:null}
}

const after={
  ...before,
  ledger:{index:107761290,hash:"137E4B85103AA3E67224EDAB8933DB1E8F2A038B769E505FCC198CBABBADABF7",validated:true},
  generated_at:"2026-10-19T11:57:16.234Z",
  passport:{id:"xrpl:account:mainnet:rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De:107761290:b4fd6eafc5702019",evidence_fingerprint_sha256:"b4fd6eafc5702019c1419a12cc7caa28d6bd90e4f1867a06f0305439c30c0422",artifact_sha256:"259baefa013c74c655086177aeb9b0ed48c921777a533160a9487507d2dbaf2b"}
}

test("real RLUSD snapshot pair yields no material change",()=>{
  const r=compareTransitionSnapshots(before,after)
  assert.equal(r.ledger_delta,35)
  assert.equal(r.classification,"NO_MATERIAL_CHANGE")
  assert.equal(r.material_change,false)
  assert.equal(r.event_count,0)
  assert.equal(r.observations.risk_state_stable,true)
  assert.equal(r.observations.account_flags_stable,true)
  assert.equal(r.observations.observed_trust_line_window_stable,true)
  assert.match(r.caveat,/partial evidence/i)
})

test("issuer control change becomes material transition",()=>{
  const changed=structuredClone(after)
  changed.ledger={index:107761300,hash:"H2",validated:true}
  changed.account.flags_raw=after.account.flags_raw+1
  changed.issuer.settings.global_freeze=true
  changed.risk_state="BLOCK"
  changed.findings=[...changed.findings,{id:"GLOBAL_FREEZE_ENABLED",severity:"BLOCK",category:"ISSUER_CONTROL"}]
  const r=compareTransitionSnapshots(after,changed)
  assert.equal(r.classification,"MATERIAL_CHANGE")
  assert.equal(r.material_change,true)
  assert.equal(r.events.some(x=>x.id==="ACCOUNT_FLAGS_CHANGED"),true)
  assert.equal(r.events.some(x=>x.id==="ISSUER_GLOBAL_FREEZE_CHANGED"),true)
  assert.equal(r.events.some(x=>x.id==="FINDING_ADDED"),true)
  assert.equal(r.events.some(x=>x.id==="RISK_STATE_CHANGED"),true)
})

test("subject mismatch is rejected",()=>{
  const changed=structuredClone(after)
  changed.subject.identifier="rDifferent"
  assert.throws(()=>compareTransitionSnapshots(before,changed),/subjects do not match/)
})
