import { createHash } from "node:crypto"

function canon(v){
  if(Array.isArray(v)) return v.map(canon)
  if(v&&typeof v==="object") return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])]))
  return v
}
function sha(v){ return createHash("sha256").update(JSON.stringify(canon(v))).digest("hex") }
function same(a,b){ return JSON.stringify(canon(a))===JSON.stringify(canon(b)) }
function sortFindings(xs=[]){ return xs.map(x=>({id:x.id,severity:x.severity,category:x.category??null})).sort((a,b)=>a.id.localeCompare(b.id)) }
function lineDigest(lines=[]){
  const fields=["counterparty","currency","balance","limit","limit_peer","authorized","peer_authorized","freeze","freeze_peer","no_ripple","no_ripple_peer"]
  const rows=lines.map(x=>Object.fromEntries(fields.map(k=>[k,x?.[k]??null]))).sort((a,b)=>String(a.counterparty).localeCompare(String(b.counterparty))||String(a.currency).localeCompare(String(b.currency)))
  return sha(rows)
}
function accountId(report){ return report?.subject?.account }
function ammId(report){ return report?.snapshot?.amm_account }
function reportType(report){
  if(report?.schema_version?.startsWith("xrpl.scan_report.")) return "ACCOUNT"
  if(report?.schema_version?.startsWith("xrpl.amm_report.")) return "AMM"
  throw new Error("Unsupported report type")
}

export function buildTransitionSnapshot(report, passport=null){
  const type=reportType(report)
  if(type==="ACCOUNT"){
    if(report?.subject?.validated!==true) throw new Error("Transition snapshot requires validated account evidence")
    const i=report.issuer_intelligence??{}
    return {
      schema_version:"xrpl.transition_snapshot.v0.1",
      type,
      subject:{network:report.subject.network,identifier:accountId(report)},
      ledger:{index:report.subject.ledger_index,hash:report.subject.ledger_hash,validated:true},
      generated_at:report.generated_at??null,
      risk_state:report.summary?.state??"UNKNOWN",
      evidence_status:report.summary?.evidence_status??"UNKNOWN",
      account:{
        flags_raw:report.account?.flags_raw??0,
        domain:report.account?.domain??null,
        transfer_rate:report.account?.transfer_rate??null,
        regular_key:report.account?.regular_key??null,
        balance_xrp:report.account?.balance_xrp??null,
        owner_count:report.account?.owner_count??null
      },
      issuer:{
        role:i.role??null,
        settings:{
          default_ripple:i.settings?.default_ripple??null,
          require_auth:i.settings?.require_auth??null,
          global_freeze:i.settings?.global_freeze??null,
          no_freeze:i.settings?.no_freeze??null,
          clawback_enabled:i.settings?.clawback_enabled??null,
          token_escrow_enabled:i.settings?.token_escrow_enabled??null,
          transfer_rate:i.settings?.transfer_rate??null
        },
        counts:{
          issued_assets:i.counts?.issued_assets??null,
          issued_holder_lines:i.counts?.issued_holder_lines??null,
          issuer_frozen_lines:i.counts?.issuer_frozen_lines??null
        }
      },
      findings:sortFindings(report.findings),
      evidence_issues:(report.evidence_issues??[]).map(x=>x.id).sort(),
      observed_trust_lines:{
        count:report.summary?.observed_trust_lines??report.trust_lines?.length??0,
        digest_sha256:lineDigest(report.trust_lines??[]),
        complete:report.acquisition?.trust_lines_truncated===false,
        truncated:report.acquisition?.trust_lines_truncated===true,
        truncation_reason:report.acquisition?.trust_lines_truncated_reason??null
      },
      passport:{
        id:passport?.passport_id??null,
        evidence_fingerprint_sha256:passport?.integrity?.evidence_fingerprint_sha256??null,
        artifact_sha256:passport?.integrity?.artifact_sha256??null
      }
    }
  }
  if(report?.snapshot?.ledger?.validated!==true) throw new Error("Transition snapshot requires validated AMM evidence")
  return {
    schema_version:"xrpl.transition_snapshot.v0.1",
    type,
    subject:{network:report.snapshot.network,identifier:ammId(report)},
    ledger:report.snapshot.ledger,
    generated_at:report.generated_at??null,
    risk_state:report.state??"UNKNOWN",
    evidence_status:"COMPLETE",
    amm:{
      trading_fee:report.snapshot.trading_fee??null,
      pool:report.snapshot.pool??null,
      structural_verification:report.snapshot.structural_verification??null
    },
    findings:sortFindings(report.findings),
    evidence_issues:[],
    passport:{
      id:passport?.passport_id??null,
      evidence_fingerprint_sha256:passport?.integrity?.evidence_fingerprint_sha256??null,
      artifact_sha256:passport?.integrity?.artifact_sha256??null
    }
  }
}

function event(id,severity,category,message,before,after){
  return {id,severity,category,message,before,after}
}
function keyed(xs=[]){ return new Map(xs.map(x=>[x.id,x])) }

export function compareTransitionSnapshots(before,after){
  if(before?.schema_version!=="xrpl.transition_snapshot.v0.1"||after?.schema_version!=="xrpl.transition_snapshot.v0.1") throw new Error("Unsupported transition snapshot schema")
  if(before.type!==after.type||before.subject?.network!==after.subject?.network||before.subject?.identifier!==after.subject?.identifier) throw new Error("Transition subjects do not match")
  if(before.ledger?.validated!==true||after.ledger?.validated!==true) throw new Error("Transition comparison requires validated ledgers")
  if(Number.isFinite(before.ledger?.index)&&Number.isFinite(after.ledger?.index)&&after.ledger.index<before.ledger.index) throw new Error("Transition snapshots are out of order")

  const events=[]
  if(before.risk_state!==after.risk_state) events.push(event("RISK_STATE_CHANGED","REVIEW","DECISION","Deterministic risk state changed.",before.risk_state,after.risk_state))
  if(before.evidence_status!==after.evidence_status) events.push(event("EVIDENCE_STATUS_CHANGED","INFO","EVIDENCE","Evidence completeness status changed.",before.evidence_status,after.evidence_status))

  const bf=keyed(before.findings), af=keyed(after.findings)
  for(const [id,x] of af) if(!bf.has(id)) events.push(event("FINDING_ADDED","REVIEW","FINDING",`Finding added: ${id}`,null,x))
  for(const [id,x] of bf) if(!af.has(id)) events.push(event("FINDING_REMOVED","INFO","FINDING",`Finding removed: ${id}`,x,null))

  if(before.type==="ACCOUNT"){
    if(before.account?.flags_raw!==after.account?.flags_raw) events.push(event("ACCOUNT_FLAGS_CHANGED","REVIEW","ISSUER_CONTROL","Raw AccountRoot flags changed.",before.account?.flags_raw,after.account?.flags_raw))
    for(const k of ["domain","transfer_rate","regular_key"]){
      if(!same(before.account?.[k],after.account?.[k])) events.push(event(`ACCOUNT_${k.toUpperCase()}_CHANGED`,"REVIEW","ACCOUNT_CONFIGURATION",`Account ${k} changed.`,before.account?.[k],after.account?.[k]))
    }
    const settingKeys=["default_ripple","require_auth","global_freeze","no_freeze","clawback_enabled","token_escrow_enabled","transfer_rate"]
    for(const k of settingKeys){
      if(!same(before.issuer?.settings?.[k],after.issuer?.settings?.[k])) events.push(event(`ISSUER_${k.toUpperCase()}_CHANGED`,"REVIEW","ISSUER_CONTROL",`Issuer setting ${k} changed.`,before.issuer?.settings?.[k],after.issuer?.settings?.[k]))
    }
    if(before.issuer?.role!==after.issuer?.role) events.push(event("ISSUER_ROLE_CHANGED","REVIEW","ISSUER_CONFIGURATION","Observed issuer role changed.",before.issuer?.role,after.issuer?.role))

    const bd=before.observed_trust_lines?.digest_sha256, ad=after.observed_trust_lines?.digest_sha256
    if(bd&&ad&&bd!==ad){
      const complete=before.observed_trust_lines?.complete===true&&after.observed_trust_lines?.complete===true
      events.push(event(
        complete?"TRUST_LINE_SET_CHANGED":"OBSERVED_TRUST_LINE_WINDOW_CHANGED",
        complete?"REVIEW":"INFO",
        "TRUST_LINES",
        complete?"Complete trust-line set changed.":"The bounded observed trust-line window changed; this is not proof of a complete-set change.",
        {count:before.observed_trust_lines?.count,digest_sha256:bd},
        {count:after.observed_trust_lines?.count,digest_sha256:ad}
      ))
    }
    if(before.observed_trust_lines?.count!==after.observed_trust_lines?.count){
      const complete=before.observed_trust_lines?.complete===true&&after.observed_trust_lines?.complete===true
      events.push(event(
        complete?"TRUST_LINE_COUNT_CHANGED":"OBSERVED_TRUST_LINE_COUNT_CHANGED",
        complete?"REVIEW":"INFO",
        "TRUST_LINES",
        complete?"Complete trust-line count changed.":"Observed bounded trust-line count changed; counts may be lower bounds.",
        before.observed_trust_lines?.count,
        after.observed_trust_lines?.count
      ))
    }
  } else {
    if(!same(before.amm?.trading_fee,after.amm?.trading_fee)) events.push(event("AMM_TRADING_FEE_CHANGED","REVIEW","AMM_CONFIGURATION","AMM trading fee changed.",before.amm?.trading_fee,after.amm?.trading_fee))
    if(!same(before.amm?.pool,after.amm?.pool)) events.push(event("AMM_POOL_STATE_CHANGED","REVIEW","AMM_STATE","AMM pool state changed.",before.amm?.pool,after.amm?.pool))
    if(!same(before.amm?.structural_verification,after.amm?.structural_verification)) events.push(event("AMM_STRUCTURE_CHANGED","REVIEW","AMM_STRUCTURE","AMM structural verification changed.",before.amm?.structural_verification,after.amm?.structural_verification))
  }

  const material=events.some(x=>x.severity==="REVIEW"||x.severity==="BLOCK")
  const classification=material?"MATERIAL_CHANGE":events.length?"NON_MATERIAL_CHANGE":"NO_MATERIAL_CHANGE"
  const ledgerDelta=(Number.isFinite(before.ledger?.index)&&Number.isFinite(after.ledger?.index))?after.ledger.index-before.ledger.index:null
  const observedWindowStable=before.type==="ACCOUNT"&&before.observed_trust_lines?.digest_sha256===after.observed_trust_lines?.digest_sha256

  return {
    schema_version:"xrpl.transition_report.v0.1",
    subject:after.subject,
    from_ledger:before.ledger,
    to_ledger:after.ledger,
    ledger_delta:ledgerDelta,
    classification,
    material_change:material,
    event_count:events.length,
    events,
    observations:{
      risk_state_stable:before.risk_state===after.risk_state,
      findings_stable:same(before.findings,after.findings),
      account_flags_stable:before.type==="ACCOUNT"?before.account?.flags_raw===after.account?.flags_raw:null,
      observed_trust_line_window_stable:observedWindowStable,
      evidence_status_before:before.evidence_status,
      evidence_status_after:after.evidence_status
    },
    caveat:before.type==="ACCOUNT"&&(before.evidence_status!=="COMPLETE"||after.evidence_status!=="COMPLETE")
      ?"At least one snapshot has partial evidence. NO_MATERIAL_CHANGE means no material change was detected in the compared validated evidence; it does not prove the complete ledger state was unchanged."
      :"NO_MATERIAL_CHANGE means no material change was detected by this deterministic comparison."
  }
}
