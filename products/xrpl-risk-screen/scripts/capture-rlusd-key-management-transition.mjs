import { mkdir, writeFile } from "node:fs/promises"
import { scanAccount, buildPassport } from "../lib/runtime.mjs"
import { buildTransitionSnapshot, compareTransitionSnapshots } from "../lib/transitions.mjs"

const issuer=process.env.RLUSD_ISSUER??"rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"
const common={network:"mainnet",timeoutMs:15000,maxItemsPerCollection:5000,maxPagesPerCollection:30,includeObjects:true}

async function snap(ledgerIndex){
  const report=await scanAccount(issuer,{...common,ledgerIndex})
  const passport=buildPassport(report)
  return {report,passport,transition_snapshot:buildTransitionSnapshot(report,passport)}
}

const signerBefore=await snap(89925796)
const signerAfter=await snap(89925797)
const signerTransition=compareTransitionSnapshots(signerBefore.transition_snapshot,signerAfter.transition_snapshot)

const masterBefore=await snap(89925802)
const masterAfter=await snap(89925803)
const masterTransition=compareTransitionSnapshots(masterBefore.transition_snapshot,masterAfter.transition_snapshot)

if(signerTransition.classification!=="MATERIAL_CHANGE") throw new Error("SignerListSet pair did not classify as MATERIAL_CHANGE")
if(!signerTransition.events.some(e=>e.id==="SIGNER_LIST_CHANGED")) throw new Error("SIGNER_LIST_CHANGED missing")
if(signerTransition.events.some(e=>e.id==="MASTER_KEY_STATUS_CHANGED")) throw new Error("Unexpected master-key event in signer-list pair")

if(masterTransition.classification!=="MATERIAL_CHANGE") throw new Error("DisableMaster pair did not classify as MATERIAL_CHANGE")
if(!masterTransition.events.some(e=>e.id==="MASTER_KEY_STATUS_CHANGED")) throw new Error("MASTER_KEY_STATUS_CHANGED missing")
if(!masterTransition.events.some(e=>e.id==="ACCOUNT_FLAGS_CHANGED")) throw new Error("ACCOUNT_FLAGS_CHANGED missing")
if(masterTransition.events.some(e=>e.id==="SIGNER_LIST_CHANGED")) throw new Error("Unexpected signer-list event in master-key pair")

const signerList=signerAfter.report.signing_authority?.signer_lists?.[0]??null
if(!signerList) throw new Error("Signer list not visible after SignerListSet")
if(signerAfter.report.signing_authority.evidence_status!=="COMPLETE") throw new Error("Signer authority evidence not complete after SignerListSet")
if(masterAfter.report.signing_authority.master_key_disabled!==true) throw new Error("Master key not disabled after AccountSet")
if(masterAfter.report.signing_authority.alternative_signing_method_visible!==true) throw new Error("No alternative signing path visible after master disable")

const artifact={
  case_id:"RLUSD-003",
  status:"LIVE_HISTORICAL_KEY_MANAGEMENT_TRANSITIONS_VERIFIED",
  subject:{asset:"Ripple USD (RLUSD)",issuer,network:"XRPL Mainnet"},
  stage_a:{
    trigger:{transaction_type:"SignerListSet",ledger_index:89925797,hash:"38E3C789E229FF24778B9A5E6CCC6CABFA62DA98AC217C2A70D1A6A6E39468E8",signer_quorum:15},
    before:signerBefore,
    after:signerAfter,
    transition:signerTransition
  },
  stage_b:{
    trigger:{transaction_type:"AccountSet",ledger_index:89925803,hash:"9A4212D87787986E262164A0A76558D76A6152835DBCC064EEF05A88CF2C92BA",set_flag:4,set_flag_name:"asfDisableMaster"},
    before:masterBefore,
    after:masterAfter,
    transition:masterTransition
  },
  semantics:{
    signer_list:"SignerListSet creates or replaces a multi-sign authorization list. Quorum and weights define which combinations of signers can authorize transactions.",
    disable_master:"asfDisableMaster disables the master key pair and requires another authorization path to exist.",
    boundary:"The ledger proves configured authorization paths, not off-ledger key custody, signer identity, organizational policy, or compromise status."
  }
}

await mkdir("evidence",{recursive:true})
await writeFile("evidence/rlusd-003-key-management-transition.json",JSON.stringify(artifact,null,2))

console.log(JSON.stringify({
  case_id:artifact.case_id,
  stage_a:{
    before_ledger:signerBefore.report.subject.ledger_index,
    after_ledger:signerAfter.report.subject.ledger_index,
    risk_before:signerBefore.report.summary.state,
    risk_after:signerAfter.report.summary.state,
    signing_evidence_before:signerBefore.report.signing_authority,
    signing_evidence_after:signerAfter.report.signing_authority,
    transition:{classification:signerTransition.classification,events:signerTransition.events.map(e=>e.id)}
  },
  stage_b:{
    before_ledger:masterBefore.report.subject.ledger_index,
    after_ledger:masterAfter.report.subject.ledger_index,
    risk_before:masterBefore.report.summary.state,
    risk_after:masterAfter.report.summary.state,
    signing_evidence_before:masterBefore.report.signing_authority,
    signing_evidence_after:masterAfter.report.signing_authority,
    transition:{classification:masterTransition.classification,events:masterTransition.events.map(e=>e.id)}
  }
},null,2))
