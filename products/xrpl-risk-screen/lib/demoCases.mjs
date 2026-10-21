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
    caveat:"Both snapshots used bounded partial trust-line evidence. This does not prove the complete issuer state was unchanged."
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
    caveat:"Clawback capability is an issuer-control capability, not evidence of misuse."
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
    caveat:"XRPL proves configured authorization paths, not off-ledger key custody, signer identity, compromise status, or governance quality."
  }
])

export const PUBLIC_RESEARCH_NOTE_URL="https://github.com/proofandsignal/XRP/issues/27"
