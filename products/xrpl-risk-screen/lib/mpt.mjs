import { NETWORKS, rpc } from "./runtime.mjs"

const FLAGS=Object.freeze({
  locked:0x01,
  can_lock:0x02,
  require_auth:0x04,
  can_escrow:0x08,
  can_trade:0x10,
  can_transfer:0x20,
  can_clawback:0x40
})

export function normalizeMptIssuanceId(value){
  const id=String(value??"").toUpperCase()
  if(!/^[0-9A-F]{48}$/.test(id)) throw new Error("Invalid MPTokenIssuanceID")
  return id
}

export function decodeMptFlags(raw=0){
  const value=Number(raw)>>>0
  return Object.fromEntries(Object.entries(FLAGS).map(([name,mask])=>[name,(value&mask)!==0]))
}

function metadata(hex){
  if(!hex) return {status:"ABSENT",raw_hex:null,decoded:null}
  if(typeof hex!=="string"||hex.length%2||!/^[0-9A-F]+$/i.test(hex)) return {status:"SELF_DECLARED_INVALID_HEX",raw_hex:String(hex),decoded:null}
  const decoded=Buffer.from(hex,"hex").toString("utf8")
  return {status:"SELF_DECLARED_ON_LEDGER",raw_hex:hex.toUpperCase(),decoded}
}

async function read(endpoints,params,opts){
  let last
  for(const endpoint of [...new Set(endpoints)]){
    try{return {endpoint,payload:await rpc(endpoint,"ledger_entry",params,opts)}}catch(error){last=error}
  }
  throw last??new Error("No XRPL endpoint")
}

export async function scanMptIssuance(value,opts={}){
  const issuanceId=normalizeMptIssuanceId(value)
  const network=opts.network??"mainnet"
  const endpoints=opts.endpoint?[opts.endpoint]:(opts.endpoints??NETWORKS[network])
  if(!endpoints) throw new Error("Unsupported network")

  const primary=await read(endpoints,{mpt_issuance:issuanceId,ledger_index:opts.ledgerIndex??"validated"},opts)
  const result=primary.payload.result
  if(result.validated!==true) throw new Error("MPT evidence not validated")
  const node=result.node
  if(node?.LedgerEntryType!=="MPTokenIssuance") throw new Error("Expected MPTokenIssuance")

  const ledger={index:result.ledger_index??null,hash:result.ledger_hash??null,validated:true}
  const flags=decodeMptFlags(node.Flags??0)
  const findings=[]
  if(flags.locked) findings.push({id:"MPT_GLOBAL_LOCKED",severity:"BLOCK",category:"TOKEN_CONTROL",message:"All balances for this MPT issuance are locked."})
  if(flags.can_clawback) findings.push({id:"MPT_CLAWBACK_CAPABILITY",severity:"REVIEW",category:"TOKEN_CONTROL",message:"Issuer clawback capability is enabled; capability is not evidence of misuse."})
  if(flags.require_auth) findings.push({id:"MPT_REQUIRE_AUTH",severity:"REVIEW",category:"TOKEN_CONTROL",message:"Holder authorization is required."})
  if(Number(node.TransferFee??0)>0) findings.push({id:"MPT_TRANSFER_FEE",severity:"REVIEW",category:"TOKEN_ECONOMICS",message:"A secondary-transfer fee is configured."})

  let permissioned_domain={id:node.DomainID??null,status:node.DomainID?"UNVERIFIED":"NOT_CONFIGURED"}
  const evidence_issues=[]
  if(node.DomainID){
    try{
      const pin=ledger.index!=null?{ledger_index:ledger.index}:{ledger_hash:ledger.hash}
      const domain=await read([primary.endpoint,...endpoints],{index:node.DomainID,...pin},opts)
      const dr=domain.payload.result
      if(dr.validated!==true||dr.node?.LedgerEntryType!=="PermissionedDomain") throw new Error("PermissionedDomain verification failed")
      if(ledger.index!=null&&dr.ledger_index!=null&&ledger.index!==dr.ledger_index) throw new Error("PermissionedDomain ledger index mismatch")
      if(ledger.hash&&dr.ledger_hash&&ledger.hash!==dr.ledger_hash) throw new Error("PermissionedDomain ledger hash mismatch")
      permissioned_domain={id:node.DomainID,status:"VERIFIED",owner:dr.node.Owner,accepted_credentials:dr.node.AcceptedCredentials??[]}
    }catch(error){
      evidence_issues.push({id:"PERMISSIONED_DOMAIN_LOOKUP_FAILED",category:"DATA_INTEGRITY",message:error.message})
    }
  }

  const state=findings.some(x=>x.severity==="BLOCK")?"BLOCK":findings.length?"REVIEW":"PASS"
  return {
    schema_version:"xrpl.mpt_issuance_report.v0.8",
    generated_at:new Date().toISOString(),
    state,
    evidence_status:evidence_issues.length?"PARTIAL":"COMPLETE",
    snapshot:{network,ledger,issuance_id:issuanceId,issuer:node.Issuer,sequence:node.Sequence??null,flags_raw:node.Flags??0,flags,immutable_flags_raw:node.ImmutableFlags??null,asset_scale:node.AssetScale??0,maximum_amount:node.MaximumAmount??null,outstanding_amount:String(node.OutstandingAmount??"0"),transfer_fee:node.TransferFee??0,permissioned_domain,metadata:metadata(node.MPTokenMetadata),previous_txn_id:node.PreviousTxnID??null,previous_txn_ledger:node.PreviousTxnLgrSeq??null},
    findings,
    evidence_issues,
    disclaimer:"On-ledger MPT configuration only. Issuer metadata and credential requirements are not independent proof of backing, legal status, yield, redemption rights, liquidity quality, or investment safety."
  }
}
