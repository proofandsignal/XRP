export const DEMO_CASES = Object.freeze([
  {
    id:"RLUSD-001",
    title:"Stable issuer evidence",
    category:"NO MATERIAL CHANGE",
    classification:"NO_MATERIAL_CHANGE",
    subject:"Ripple USD (RLUSD) issuer",
    network:"XRPL Mainnet",
    ledgers:"107761255 → 107761290",
    evidence_status:"PARTIAL",
    risk_transition:"REVIEW → REVIEW",
    headline:"Validated snapshots changed ledger position, but no deterministic material change was detected in the compared evidence.",
    events:[],
    caveat:"Both snapshots used bounded partial trust-line evidence. This does not prove the complete issuer state was unchanged.",
    evidence_file:"validation/cases/RLUSD-001-TRANSITION-001.json"
  },
  {
    id:"RLUSD-002",
    title:"Issuer control change",
    category:"MATERIAL CHANGE",
    classification:"MATERIAL_CHANGE",
    subject:"Ripple USD (RLUSD) issuer",
    network:"XRPL Mainnet",
    ledgers:"89925779 → 89925780",
    evidence_status:"COMPLETE",
    risk_transition:"PASS → REVIEW",
    headline:"A real AccountSet enabled trust-line clawback capability and moved the deterministic policy from PASS to REVIEW.",
    events:["RISK_STATE_CHANGED","FINDING_ADDED","ACCOUNT_FLAGS_CHANGED","ISSUER_CLAWBACK_ENABLED_CHANGED"],
    caveat:"Clawback capability is an issuer-control capability, not evidence of misuse.",
    evidence_file:"validation/cases/RLUSD-002-MATERIAL-TRANSITION.json"
  },
  {
    id:"RLUSD-003",
    title:"Signing authority change",
    category:"MATERIAL CHANGE",
    classification:"MATERIAL_CHANGE",
    subject:"Ripple USD (RLUSD) issuer",
    network:"XRPL Mainnet",
    ledgers:"89925796 → 89925803",
    evidence_status:"COMPLETE",
    risk_transition:"REVIEW → REVIEW",
    headline:"A SignerListSet introduced multi-signing and a later AccountSet disabled the master key while an alternative signing path remained visible.",
    events:["SIGNER_LIST_CHANGED","ACCOUNT_FLAGS_CHANGED","MASTER_KEY_STATUS_CHANGED"],
    caveat:"XRPL proves configured authorization paths, not off-ledger key custody, signer identity, compromise status, or governance quality.",
    evidence_file:"validation/cases/RLUSD-003-KEY-MANAGEMENT-TRANSITION.json"
  }
])

export const PUBLIC_RESEARCH_NOTE_URL="https://github.com/proofandsignal/XRP/issues/27"

export function getDemoCase(id){
  return DEMO_CASES.find(x=>x.id===id)??null
}

export function buildDemoEvidencePack(id){
  const c=getDemoCase(id)
  if(!c) return null
  return {
    schema_version:"xrpl.demo_evidence_pack.v0.1",
    product:"Proof & Signal XRPL Intelligence Screen",
    build:"BUILD-009",
    case:{
      id:c.id,
      title:c.title,
      subject:c.subject,
      network:c.network,
      ledgers:c.ledgers,
      classification:c.classification,
      risk_transition:c.risk_transition,
      evidence_status:c.evidence_status,
      events:c.events,
      headline:c.headline,
      caveat:c.caveat
    },
    provenance:{
      source_case_file:c.evidence_file,
      public_research_note:PUBLIC_RESEARCH_NOTE_URL,
      status:"DERIVED_FROM_VERIFIED_CASE"
    },
    boundary:"This compact demo pack summarizes an already verified case. It is not a replacement for the canonical case artifact and does not add new evidence."
  }
}
