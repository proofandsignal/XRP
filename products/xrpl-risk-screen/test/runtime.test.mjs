import test from "node:test"
import assert from "node:assert/strict"
import { scanAccount, buildPassport, verifyPassport } from "../lib/runtime.mjs"
const account="rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn"
const ok=result=>({ok:true,status:200,async json(){return{result}}})
test("account scan pins one validated ledger and emits passport",async()=>{const fetchImpl=async(_url,init)=>{const {method}=JSON.parse(init.body);if(method==="account_info")return ok({validated:true,ledger_index:888,ledger_hash:"H888",account_data:{Account:account,Balance:"5000000",OwnerCount:0,Sequence:1,Flags:0}});if(method==="account_lines")return ok({validated:true,ledger_index:888,ledger_hash:"H888",lines:[]});if(method==="account_objects")return ok({validated:true,ledger_index:888,ledger_hash:"H888",account_objects:[]})};const report=await scanAccount(account,{endpoint:"https://example/",fetchImpl});assert.equal(report.subject.ledger_index,888);assert.equal(report.summary.state,"PASS");assert.equal(report.summary.evidence_status,"COMPLETE");const p=buildPassport(report,{createdAt:"2026-10-19T12:00:00.000Z"});assert.equal(p.subject.ledger.index,888);assert.equal(verifyPassport(p).valid,true)})
test("passport tamper breaks artifact integrity",async()=>{const report={schema_version:"xrpl.scan_report.v0.8",subject:{network:"mainnet",account,ledger_index:1,ledger_hash:"H1",validated:true},summary:{state:"PASS"},findings:[]};const p=buildPassport(report,{createdAt:"2026-10-19T12:00:00.000Z"});p.decision.state="BLOCK";assert.equal(verifyPassport(p).valid,false)})


test("pagination restarts from page one when failover changes endpoint", async () => {
  const calls=[]
  const fetchImpl=async(url,init)=>{
    const {method,params:[p]}=JSON.parse(init.body); calls.push({url,method,marker:p.marker??null})
    if(method==="account_info") return ok({validated:true,ledger_index:999,ledger_hash:"H999",account_data:{Account:account,Balance:"1000000",OwnerCount:0,Sequence:1,Flags:0}})
    if(method==="account_lines") return ok({validated:true,ledger_index:999,ledger_hash:"H999",lines:[]})
    if(method==="account_objects"){
      if(url==="https://a/"){
        if(p.marker==null) return ok({validated:true,ledger_index:999,ledger_hash:"H999",account_objects:[{LedgerEntryType:"Offer",index:"A1"}],marker:"CURSOR-A"})
        throw new Error("endpoint A interrupted")
      }
      if(url==="https://b/"){
        if(p.marker==="CURSOR-A") return ok({error:"invalidParams",error_message:"Malformed cursor."})
        if(p.marker==null) return ok({validated:true,ledger_index:999,ledger_hash:"H999",account_objects:[{LedgerEntryType:"Offer",index:"B1"}],marker:"CURSOR-B"})
        if(p.marker==="CURSOR-B") return ok({validated:true,ledger_index:999,ledger_hash:"H999",account_objects:[{LedgerEntryType:"Offer",index:"B2"}]})
      }
    }
    throw new Error("unexpected request")
  }
  const report=await scanAccount(account,{endpoints:["https://a/","https://b/"],fetchImpl,timeoutMs:1000,includeObjects:true})
  assert.equal(report.summary.objects_scanned,2)
  const bObjectCalls=calls.filter(x=>x.url==="https://b/"&&x.method==="account_objects")
  assert.equal(bObjectCalls[0].marker,null)
  assert.equal(bObjectCalls[1].marker,"CURSOR-B")
  assert.equal(bObjectCalls.some(x=>x.marker==="CURSOR-A"),false)
})


test("partial evidence does not become a BLOCK risk decision", async () => {
  let linePage=0
  const fetchImpl=async(_url,init)=>{
    const {method}=JSON.parse(init.body)
    if(method==="account_info") return ok({validated:true,ledger_index:1001,ledger_hash:"H1001",account_data:{Account:account,Balance:"1000000",OwnerCount:0,Sequence:1,Flags:2147483648}})
    if(method==="account_lines"){
      linePage++
      return ok({validated:true,ledger_index:1001,ledger_hash:"H1001",lines:[{account:"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",currency:"USD",balance:"-1",limit:"0",limit_peer:"100"}],marker:"MORE"})
    }
    throw new Error("unexpected request")
  }
  const report=await scanAccount(account,{endpoint:"https://example/",fetchImpl,maxItemsPerCollection:1,maxPagesPerCollection:1})
  assert.equal(report.summary.evidence_status,"PARTIAL")
  assert.equal(report.summary.state,"REVIEW")
  assert.equal(report.findings.some(x=>x.id==="DATA_TRUNCATED"),false)
  assert.equal(report.evidence_issues.some(x=>x.id==="DATA_TRUNCATED"),true)
  const passport=buildPassport(report,{createdAt:"2026-10-19T12:00:00.000Z"})
  assert.equal(passport.decision.evidence_status,"PARTIAL")
})


test("RLUSD observed raw AccountRoot flags decode without dropping known bits", async () => {
  const raw=2174353408
  const fetchImpl=async(_url,init)=>{
    const {method}=JSON.parse(init.body)
    if(method==="account_info") return ok({validated:true,ledger_index:107761255,ledger_hash:"H",account_data:{Account:account,Balance:"1",OwnerCount:19,Sequence:1,Flags:raw}})
    if(method==="account_lines") return ok({validated:true,ledger_index:107761255,ledger_hash:"H",lines:[]})
    throw new Error("unexpected request")
  }
  const report=await scanAccount(account,{endpoint:"https://example/",fetchImpl})
  assert.equal(report.account.flags.allow_trustline_clawback,true)
  assert.equal(report.account.flags.deposit_auth,true)
  assert.equal(report.account.flags.default_ripple,true)
  assert.equal(report.account.flags.disable_master,true)
  assert.equal(report.account.flags.disallow_xrp,true)
  assert.equal(report.account.flags.require_dest_tag,true)
  assert.equal(report.account.flags.global_freeze,false)
})


test("account scan accepts exact historical validated ledger index", async () => {
  const calls=[]
  const fetchImpl=async(_url,init)=>{
    const {method,params:[p]}=JSON.parse(init.body);calls.push({method,ledger_index:p.ledger_index})
    if(method==="account_info") return ok({validated:true,ledger_index:777,ledger_hash:"H777",account_data:{Account:account,Balance:"1000000",OwnerCount:0,Sequence:1,Flags:0}})
    if(method==="account_lines") return ok({validated:true,ledger_index:777,ledger_hash:"H777",lines:[]})
    throw new Error("unexpected request")
  }
  const report=await scanAccount(account,{endpoint:"https://example/",fetchImpl,ledgerIndex:777})
  assert.equal(report.subject.ledger_index,777)
  assert.equal(calls.find(x=>x.method==="account_info").ledger_index,777)
  assert.equal(calls.find(x=>x.method==="account_lines").ledger_index,777)
})
