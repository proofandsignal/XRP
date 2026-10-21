import { mkdir, writeFile } from "node:fs/promises"
import { scanAccount, buildPassport } from "../lib/runtime.mjs"
import { buildTransitionSnapshot, compareTransitionSnapshots } from "../lib/transitions.mjs"

const issuer=process.env.RLUSD_ISSUER??"rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"
const txHash="9B1042DD30188C9BAE7F81C5B3DB91F9C121669A359F4124FBB88531F8BAADA2"
const changeLedger=89925780
const beforeLedger=changeLedger-1

const common={network:"mainnet",timeoutMs:15000,maxItemsPerCollection:5000,maxPagesPerCollection:30}
const beforeReport=await scanAccount(issuer,{...common,ledgerIndex:beforeLedger})
const afterReport=await scanAccount(issuer,{...common,ledgerIndex:changeLedger})
const beforePassport=buildPassport(beforeReport)
const afterPassport=buildPassport(afterReport)
const before=buildTransitionSnapshot(beforeReport,beforePassport)
const after=buildTransitionSnapshot(afterReport,afterPassport)
const transition=compareTransitionSnapshots(before,after)

const expected=[
  "ACCOUNT_FLAGS_CHANGED",
  "ISSUER_CLAWBACK_ENABLED_CHANGED",
  "FINDING_ADDED",
  "RISK_STATE_CHANGED"
]
const missing=expected.filter(id=>!transition.events.some(e=>e.id===id))
if(transition.classification!=="MATERIAL_CHANGE") throw new Error(`Expected MATERIAL_CHANGE, got ${transition.classification}`)
if(missing.length) throw new Error(`Missing expected events: ${missing.join(", ")}`)

await mkdir("evidence",{recursive:true})
const artifact={
  case_id:"RLUSD-002",
  status:"LIVE_HISTORICAL_TRANSITION_VERIFIED",
  subject:{asset:"Ripple USD (RLUSD)",issuer,network:"XRPL Mainnet"},
  trigger_transaction:{
    hash:txHash,
    transaction_type:"AccountSet",
    ledger_index:changeLedger,
    set_flag:16,
    set_flag_name:"asfAllowTrustLineClawback",
    semantics:"Enable the issuer's ability to claw back issued trust-line tokens. Capability is not evidence of misuse."
  },
  before:{report:beforeReport,passport:beforePassport,transition_snapshot:before},
  after:{report:afterReport,passport:afterPassport,transition_snapshot:after},
  transition
}
await writeFile("evidence/rlusd-002-material-transition.json",JSON.stringify(artifact,null,2))

console.log(JSON.stringify({
  case_id:artifact.case_id,
  trigger_transaction:artifact.trigger_transaction,
  before:{
    ledger_index:beforeReport.subject.ledger_index,
    ledger_hash:beforeReport.subject.ledger_hash,
    state:beforeReport.summary.state,
    evidence_status:beforeReport.summary.evidence_status,
    flags_raw:beforeReport.account.flags_raw,
    clawback:beforeReport.account.flags.allow_trustline_clawback,
    findings:beforeReport.findings.map(x=>x.id)
  },
  after:{
    ledger_index:afterReport.subject.ledger_index,
    ledger_hash:afterReport.subject.ledger_hash,
    state:afterReport.summary.state,
    evidence_status:afterReport.summary.evidence_status,
    flags_raw:afterReport.account.flags_raw,
    clawback:afterReport.account.flags.allow_trustline_clawback,
    findings:afterReport.findings.map(x=>x.id)
  },
  transition:{
    classification:transition.classification,
    material_change:transition.material_change,
    event_count:transition.event_count,
    events:transition.events.map(x=>x.id)
  }
},null,2))
