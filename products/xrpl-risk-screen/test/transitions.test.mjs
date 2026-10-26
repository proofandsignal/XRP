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


test("real RLUSD clawback AccountSet yields material PASS to REVIEW transition",()=>{
  const historicalBefore={
    schema_version:"xrpl.transition_snapshot.v0.1",
    type:"ACCOUNT",
    subject:{network:"mainnet",identifier:"rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"},
    ledger:{index:89925779,hash:"AD7308164F0CBFE88665A36DF1E541FEB24A9E75FCA3C5FA298064BEBF989D3E",validated:true},
    risk_state:"PASS",
    evidence_status:"COMPLETE",
    account:{flags_raw:25821184,domain:"https://ripple.com/",transfer_rate:null,regular_key:null,balance_xrp:null,owner_count:0},
    issuer:{role:"ISSUER_CONFIG_PRESENT_NO_ACTIVE_OBLIGATION",settings:{default_ripple:true,require_auth:false,global_freeze:false,no_freeze:false,clawback_enabled:false,token_escrow_enabled:false,transfer_rate:null},counts:{issued_assets:0,issued_holder_lines:0,issuer_frozen_lines:0}},
    findings:[],evidence_issues:[],
    observed_trust_lines:{count:0,digest_sha256:"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e72555d46f219e8f14a6f4",complete:true,truncated:false,truncation_reason:null},
    passport:{id:null,evidence_fingerprint_sha256:null,artifact_sha256:null}
  }
  const historicalAfter=structuredClone(historicalBefore)
  historicalAfter.ledger={index:89925780,hash:"A8F0BF600D9969FCC6E8BD99E83FADC397CA93CD2DF2F33DC42DF63827C2EBF2",validated:true}
  historicalAfter.risk_state="REVIEW"
  historicalAfter.account.flags_raw=2173304832
  historicalAfter.issuer.settings.clawback_enabled=true
  historicalAfter.findings=[{id:"CLAWBACK_CAPABILITY_ENABLED",severity:"REVIEW",category:"ISSUER_CONTROL"}]

  const r=compareTransitionSnapshots(historicalBefore,historicalAfter)
  assert.equal(r.classification,"MATERIAL_CHANGE")
  assert.equal(r.material_change,true)
  assert.equal(r.event_count,4)
  assert.deepEqual(r.events.map(x=>x.id),[
    "RISK_STATE_CHANGED",
    "FINDING_ADDED",
    "ACCOUNT_FLAGS_CHANGED",
    "ISSUER_CLAWBACK_ENABLED_CHANGED"
  ])
})


test("finding removal remains a material deterministic change",()=>{
  const b=structuredClone(after)
  const a=structuredClone(after)
  a.ledger={index:107761301,hash:"H301",validated:true}
  a.findings=[]
  const r=compareTransitionSnapshots(b,a)
  assert.equal(r.classification,"MATERIAL_CHANGE")
  assert.equal(r.events.some(x=>x.id==="FINDING_REMOVED"&&x.severity==="REVIEW"),true)
})

test("evidence degradation is material but recovery is informational",()=>{
  const degraded=structuredClone(after)
  degraded.ledger={index:107761302,hash:"H302",validated:true}
  degraded.evidence_status="UNKNOWN"
  const d=compareTransitionSnapshots(after,degraded)
  assert.equal(d.classification,"MATERIAL_CHANGE")
  assert.equal(d.events.find(x=>x.id==="EVIDENCE_STATUS_CHANGED")?.severity,"REVIEW")

  const recovered=structuredClone(degraded)
  recovered.ledger={index:107761303,hash:"H303",validated:true}
  recovered.evidence_status="COMPLETE"
  const r=compareTransitionSnapshots(degraded,recovered)
  assert.equal(r.events.find(x=>x.id==="EVIDENCE_STATUS_CHANGED")?.severity,"INFO")
})

test("materiality caveat excludes economic or legal meaning",()=>{
  const r=compareTransitionSnapshots(before,after)
  assert.match(r.caveat,/does not express economic materiality/i)
})


test("real RLUSD signer-list introduction is material without risk-state change",()=>{
  const base={
    schema_version:"xrpl.transition_snapshot.v0.1",
    type:"ACCOUNT",
    subject:{network:"mainnet",identifier:"rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"},
    ledger:{index:89925796,hash:"H89925796",validated:true},
    risk_state:"REVIEW",
    evidence_status:"COMPLETE",
    account:{flags_raw:2173304832,domain:"https://ripple.com/",transfer_rate:null,regular_key:null,balance_xrp:null,owner_count:0},
    issuer:{role:"ISSUER_CONFIG_PRESENT_NO_ACTIVE_OBLIGATION",settings:{default_ripple:true,require_auth:false,global_freeze:false,no_freeze:false,clawback_enabled:true,token_escrow_enabled:false,transfer_rate:null},counts:{issued_assets:0,issued_holder_lines:0,issuer_frozen_lines:0}},
    signing_authority:{evidence_status:"COMPLETE",master_key_disabled:false,regular_key:null,signer_list_count:0,signer_lists_digest_sha256:"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e72555d46f219e8f14a6f4",signer_lists:[]},
    findings:[{id:"CLAWBACK_CAPABILITY_ENABLED",severity:"REVIEW",category:"ISSUER_CONTROL"}],
    evidence_issues:[],
    observed_trust_lines:{count:0,digest_sha256:"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e72555d46f219e8f14a6f4",complete:true,truncated:false,truncation_reason:null},
    passport:{id:null,evidence_fingerprint_sha256:null,artifact_sha256:null}
  }
  const next=structuredClone(base)
  next.ledger={index:89925797,hash:"H89925797",validated:true}
  next.signing_authority={
    evidence_status:"COMPLETE",
    master_key_disabled:false,
    regular_key:null,
    signer_list_count:1,
    signer_lists_digest_sha256:"rlusd-real-signer-list-digest",
    signer_lists:[{signer_list_id:0,quorum:15,entries:[
      {account:"r4J1uYLNDwHmM3aPLZgR62atDsF31ocHWa",weight:1},
      {account:"raavECzoyoiFAcxobxG4kHmLdHEYjAJbct",weight:1},
      {account:"rJYBorvrnZHx3UHEm5UtYnXsFFEWPYtqwW",weight:13},
      {account:"rL8Wd9KNFnL3Dyh3vvf5BK4XhztXptHTA5",weight:13},
      {account:"rP2AD2S8LfvuDdHcf48gq9PNkUzh8VvWhm",weight:13},
      {account:"rPdzZDDCiHpBdSh6ZW4s7dzHefKHjNiEDY",weight:1},
      {account:"rUGEMwnXKs8u2VXGK7CsoBaH69uisqdBHq",weight:13},
      {account:"rwu4JB2C5Lu2BAPMuS7UqD7f3JHx8tJ4ii",weight:1}
    ]}]
  }
  const r=compareTransitionSnapshots(base,next)
  assert.equal(r.classification,"MATERIAL_CHANGE")
  assert.equal(r.events.length,1)
  assert.equal(r.events[0].id,"SIGNER_LIST_CHANGED")
  assert.equal(r.observations.risk_state_stable,true)
  assert.equal(r.observations.signing_authority_stable,false)
})

test("real RLUSD DisableMaster change is material with signer list preserved",()=>{
  const base={
    schema_version:"xrpl.transition_snapshot.v0.1",
    type:"ACCOUNT",
    subject:{network:"mainnet",identifier:"rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"},
    ledger:{index:89925802,hash:"H89925802",validated:true},
    risk_state:"REVIEW",
    evidence_status:"COMPLETE",
    account:{flags_raw:2173304832,domain:"https://ripple.com/",transfer_rate:null,regular_key:null,balance_xrp:null,owner_count:1},
    issuer:{role:"ISSUER_CONFIG_PRESENT_NO_ACTIVE_OBLIGATION",settings:{default_ripple:true,require_auth:false,global_freeze:false,no_freeze:false,clawback_enabled:true,token_escrow_enabled:false,transfer_rate:null},counts:{issued_assets:0,issued_holder_lines:0,issuer_frozen_lines:0}},
    signing_authority:{evidence_status:"COMPLETE",master_key_disabled:false,regular_key:null,signer_list_count:1,signer_lists_digest_sha256:"stable-signer-list",signer_lists:[{signer_list_id:0,quorum:15}]},
    findings:[{id:"CLAWBACK_CAPABILITY_ENABLED",severity:"REVIEW",category:"ISSUER_CONTROL"}],
    evidence_issues:[],
    observed_trust_lines:{count:0,digest_sha256:"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e72555d46f219e8f14a6f4",complete:true,truncated:false,truncation_reason:null},
    passport:{id:null,evidence_fingerprint_sha256:null,artifact_sha256:null}
  }
  const next=structuredClone(base)
  next.ledger={index:89925803,hash:"H89925803",validated:true}
  next.account.flags_raw=2174353408
  next.signing_authority.master_key_disabled=true
  const r=compareTransitionSnapshots(base,next)
  assert.equal(r.classification,"MATERIAL_CHANGE")
  assert.deepEqual(r.events.map(x=>x.id),["ACCOUNT_FLAGS_CHANGED","MASTER_KEY_STATUS_CHANGED"])
  assert.equal(r.observations.risk_state_stable,true)
  assert.equal(r.observations.signing_authority_stable,false)
})
