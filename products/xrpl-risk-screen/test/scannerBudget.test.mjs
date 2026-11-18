import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:net"
import { spawn } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"
import { createScannerBudget, SCANNER_COSTS } from "../lib/scannerBudget.mjs"

test("weighted scanner budget rejects the fourth costly account request",()=>{
  let now=1_000
  const budget=createScannerBudget({clock:()=>now})
  assert.deepEqual(SCANNER_COSTS,{"/api/account":6,"/api/amm":4,"/api/mpt":3})
  for(let i=0;i<3;i++){
    const lease=budget.acquire("GET","/api/account")
    assert.equal(lease.allowed,true)
    lease.release()
    lease.release() // release is idempotent
  }
  const denied=budget.acquire("GET","/api/account")
  assert.equal(denied.allowed,false)
  assert.equal(denied.error,"XRPL_RPC_BUDGET_EXCEEDED")
  assert.equal(denied.retryAfter,60)
  const cheap=budget.acquire("GET","/api/mpt")
  assert.equal(cheap.allowed,false,"No cheap XRPL bypass once cost budget consumed")
  assert.equal(budget.acquire("GET","/api/demo-cases").allowed,true)
  assert.equal(budget.acquire("POST","/api/account").cost,0)
  now+=60_000
  const renewed=budget.acquire("GET","/api/account")
  assert.equal(renewed.allowed,true)
  renewed.release()
})

test("scanner requests are capped at two concurrent leases across XRPL methods",()=>{
  const budget=createScannerBudget()
  const first=budget.acquire("GET","/api/mpt")
  const second=budget.acquire("GET","/api/amm")
  assert.equal(first.allowed,true)
  assert.equal(second.allowed,true)
  const rejected=budget.acquire("GET","/api/account")
  assert.equal(rejected.allowed,false)
  assert.equal(rejected.error,"XRPL_RPC_CONCURRENCY_LIMIT")
  assert.equal(rejected.retryAfter,1)
  first.release()
  const admitted=budget.acquire("GET","/api/account")
  assert.equal(admitted.allowed,true)
  admitted.release()
  second.release()
})

test("budget validates policy and costs are independent of client-supplied headers",()=>{
  assert.throws(()=>createScannerBudget({maxConcurrent:0}),/Invalid XRPL scanner budget/)
  assert.throws(()=>createScannerBudget({maxCost:-1}),/Invalid XRPL scanner budget/)
  assert.throws(()=>createScannerBudget({windowMs:0}),/Invalid XRPL scanner budget/)
  const budget=createScannerBudget({maxCost:3,maxConcurrent:1})
  const first=budget.acquire("GET","/api/mpt")
  assert.equal(first.allowed,true)
  first.release()
  assert.equal(budget.acquire("GET","/api/mpt").allowed,false)
})

async function freePort(){
  const s=createServer()
  await new Promise(resolve=>s.listen(0,"127.0.0.1",resolve))
  const port=s.address().port
  await new Promise(resolve=>s.close(resolve))
  return port
}

test("real preview HTTP refuses extra authenticated scanner calls without an external RPC request",async()=>{
  const port=await freePort()
  const env={...process.env,PORT:String(port),RENDER_SERVICE_ID:"srv-local-test",
    PREVIEW_REQUIRE_AUTH:"1",DEMO_USER:"reviewer",DEMO_PASSWORD:"dummy-only"}
  const proc=spawn(process.execPath,["server.mjs"],{cwd:new URL("../",import.meta.url),env,stdio:["ignore","pipe","pipe"]})
  let stderr=""
  proc.stderr.on("data",chunk=>{stderr+=chunk.toString()})
  const base="http://127.0.0.1:"+port
  const auth="Basic "+Buffer.from("reviewer:dummy-only").toString("base64")
  try{
    let ready=false
    for(let i=0;i<50;i++){
      try{
        const response=await fetch(base+"/api/health",{signal:AbortSignal.timeout(1_000)})
        if(response.status===401){ready=true;break}
      }catch{}
      if(proc.exitCode!==null)break
      await delay(100)
    }
    assert.ok(ready,"Local preview could not start: "+stderr)
    for(let i=0;i<3;i++){
      // Invalid classic address is rejected BEFORE an external XRPL RPC call.
      const r=await fetch(base+"/api/account?account=not-an-address",{headers:{Authorization:auth}})
      assert.equal(r.status,500)
      assert.match((await r.json()).error,/Invalid XRPL classic address/)
    }
    const denied=await fetch(base+"/api/account?account=not-an-address",{headers:{Authorization:auth}})
    assert.equal(denied.status,429)
    assert.equal(denied.headers.get("cache-control"),"no-store")
    assert.ok(Number(denied.headers.get("retry-after"))>=1)
    assert.equal((await denied.json()).error,"XRPL_RPC_BUDGET_EXCEEDED")
    const cases=await fetch(base+"/api/demo-cases",{headers:{Authorization:auth}})
    assert.equal(cases.status,200,"Historical cases remain available during RPC quota exhaustion")
    const anon=await fetch(base+"/api/demo-cases")
    assert.equal(anon.status,401,"Authentication remains enforced before quota")
  } finally {
    proc.kill("SIGTERM")
  }
})
