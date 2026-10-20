import test from "node:test"
import assert from "node:assert/strict"
import { scanMptIssuance, decodeMptFlags } from "../lib/mpt.mjs"
import { buildPassport, verifyPassport } from "../lib/runtime.mjs"

const issuanceId="000004C463C52827307480341125DA0577DEFC38405B0E3E"
const issuer="rBT9cUqK6UvpvZhPFNQ2qpUTin8rDokBeL"
const domainId="A".repeat(64)
const ok=result=>({ok:true,status:200,async json(){return{result}}})

test("MPT flags decode deterministically",()=>{
  const flags=decodeMptFlags(0x64)
  assert.equal(flags.require_auth,true)
  assert.equal(flags.can_transfer,true)
  assert.equal(flags.can_clawback,true)
  assert.equal(flags.locked,false)
})

test("MPT issuance scan preserves issuer-declared metadata boundary",async()=>{
  const metadata=Buffer.from(JSON.stringify({t:"TBILL",ac:"rwa",note:"issuer claim"}),"utf8").toString("hex").toUpperCase()
  const calls=[]
  const fetchImpl=async(_url,init)=>{
    const {method,params:[params]}=JSON.parse(init.body)
    calls.push({method,params})
    if(params.mpt_issuance){
      return ok({
        validated:true,
        ledger_index:777,
        ledger_hash:"H777",
        node:{
          LedgerEntryType:"MPTokenIssuance",
          Issuer:issuer,
          Sequence:1220,
          Flags:0x64,
          ImmutableFlags:0x20,
          AssetScale:2,
          MaximumAmount:"1000000",
          OutstandingAmount:"250000",
          TransferFee:25,
          DomainID:domainId,
          MPTokenMetadata:metadata,
          PreviousTxnID:"B".repeat(64),
          PreviousTxnLgrSeq:776
        }
      })
    }
    if(params.index===domainId){
      assert.equal(params.ledger_index,777)
      return ok({
        validated:true,
        ledger_index:777,
        ledger_hash:"H777",
        node:{
          LedgerEntryType:"PermissionedDomain",
          Owner:issuer,
          AcceptedCredentials:[
            {Credential:{Issuer:issuer,CredentialType:"4B5943"}}
          ]
        }
      })
    }
    throw new Error("unexpected request")
  }

  const report=await scanMptIssuance(issuanceId,{endpoint:"https://example/",fetchImpl})
  assert.equal(report.state,"REVIEW")
  assert.equal(report.evidence_status,"COMPLETE")
  assert.equal(report.snapshot.issuance_id,issuanceId)
  assert.equal(report.snapshot.flags.can_clawback,true)
  assert.equal(report.snapshot.permissioned_domain.status,"VERIFIED")
  assert.equal(report.snapshot.metadata.status,"SELF_DECLARED_ON_LEDGER")
  assert.match(report.disclaimer,/not independent proof/)
  const passport=buildPassport(report,{createdAt:"2026-10-20T00:00:00.000Z"})
  assert.equal(passport.subject.type,"MPT_ISSUANCE")
  assert.equal(passport.subject.identifier,issuanceId)
  assert.equal(passport.current_evidence.kind,"MPT_ISSUANCE_REPORT")
  assert.equal(verifyPassport(passport).valid,true)
  assert.equal(calls.length,2)
})

test("MPT domain mismatch degrades evidence instead of inventing certainty",async()=>{
  const fetchImpl=async(_url,init)=>{
    const {params:[params]}=JSON.parse(init.body)
    if(params.mpt_issuance){
      return ok({
        validated:true,
        ledger_index:888,
        ledger_hash:"H888",
        node:{LedgerEntryType:"MPTokenIssuance",Issuer:issuer,Sequence:1,Flags:4,OutstandingAmount:"0",DomainID:domainId}
      })
    }
    return ok({
      validated:true,
      ledger_index:889,
      ledger_hash:"H889",
      node:{LedgerEntryType:"PermissionedDomain",Owner:issuer,AcceptedCredentials:[]}
    })
  }
  const report=await scanMptIssuance(issuanceId,{endpoint:"https://example/",fetchImpl})
  assert.equal(report.evidence_status,"PARTIAL")
  assert.equal(report.snapshot.permissioned_domain.status,"UNVERIFIED")
  assert.equal(report.evidence_issues[0].id,"PERMISSIONED_DOMAIN_LOOKUP_FAILED")
})

test("invalid MPT issuance id is rejected before RPC",async()=>{
  await assert.rejects(
    ()=>scanMptIssuance("not-an-id",{endpoint:"https://example/",fetchImpl:async()=>{throw new Error("should not call")}}),
    /Invalid MPTokenIssuanceID/
  )
})
