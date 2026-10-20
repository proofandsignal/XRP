import { mkdir, writeFile } from "node:fs/promises"
import { rpc, NETWORKS } from "../lib/runtime.mjs"

const account=process.env.RLUSD_ISSUER
if(!account) throw new Error("RLUSD_ISSUER required")

const methods=new Set(["AccountSet","SetRegularKey","SignerListSet"])
const endpoints=NETWORKS.mainnet
const found=[]
let marker
let endpointIndex=0

for(let page=1;page<=40 && found.length<20;page++){
  let payload,last
  for(let tries=0;tries<endpoints.length;tries++){
    const endpoint=endpoints[(endpointIndex+tries)%endpoints.length]
    try{
      payload=await rpc(endpoint,"account_tx",{
        account,
        ledger_index_min:-1,
        ledger_index_max:-1,
        binary:false,
        forward:false,
        limit:200,
        ...(marker!==undefined?{marker}:{})
      },{timeoutMs:15000})
      endpointIndex=(endpointIndex+tries)%endpoints.length
      break
    }catch(e){last=e}
  }
  if(!payload) throw last??new Error("account_tx unavailable")
  const r=payload.result
  for(const item of r.transactions??[]){
    const tx=item.tx??item.tx_json??item.transaction??{}
    const meta=item.meta??item.metaData??{}
    if(methods.has(tx.TransactionType)&&(!meta.TransactionResult||meta.TransactionResult==="tesSUCCESS")){
      found.push({
        transaction_type:tx.TransactionType,
        hash:tx.hash??tx.Hash??item.hash??null,
        ledger_index:item.ledger_index??tx.ledger_index??tx.inLedger??null,
        date:tx.date??null,
        sequence:tx.Sequence??null,
        set_flag:tx.SetFlag??null,
        clear_flag:tx.ClearFlag??null,
        domain:tx.Domain??null,
        transfer_rate:tx.TransferRate??null,
        regular_key:tx.RegularKey??null,
        signer_quorum:tx.SignerQuorum??null,
        raw_transaction:tx
      })
    }
  }
  marker=r.marker
  if(marker==null) break
}

await mkdir("evidence",{recursive:true})
const out={
  case_id:"RLUSD-MATERIAL-DISCOVERY",
  account,
  searched_transaction_types:[...methods],
  matches:found,
  selected:found[0]??null
}
await writeFile("evidence/rlusd-material-discovery.json",JSON.stringify(out,null,2))
console.log(JSON.stringify({
  account,
  matches:found.length,
  selected:found[0]??null,
  sample:found.slice(0,10).map(x=>({
    transaction_type:x.transaction_type,
    hash:x.hash,
    ledger_index:x.ledger_index,
    set_flag:x.set_flag,
    clear_flag:x.clear_flag,
    transfer_rate:x.transfer_rate,
    regular_key:x.regular_key,
    signer_quorum:x.signer_quorum
  }))
},null,2))
