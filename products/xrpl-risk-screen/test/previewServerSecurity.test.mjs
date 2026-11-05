import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { setTimeout as pause } from "node:timers/promises"

async function freePort() {
  const server=createServer()
  await new Promise((resolve,reject)=>server.listen(0,"127.0.0.1",error=>error?reject(error):resolve()))
  const port=server.address().port
  await new Promise(resolve=>server.close(resolve))
  return port
}

test("isolated preview serves audited evidence with response security headers",async()=>{
  const port=await freePort()
  const proc=spawn(process.execPath,["server.mjs"],{
    cwd:new URL("../",import.meta.url),
    env:{...process.env,PORT:String(port)},
    stdio:["ignore","pipe","pipe"]
  })
  let errors=""
  proc.stderr.on("data",chunk=>{errors+=chunk.toString()})
  const base=`http://127.0.0.1:${port}`
  try{
    let health
    for(let i=0;i<50;i++){
      try{
        health=await fetch(base+"/api/health",{signal:AbortSignal.timeout(1000)})
        if(health.ok)break
      }catch{}
      if(proc.exitCode!==null)break
      await pause(100)
    }
    assert.ok(health?.ok,"Preview server failed to start: "+errors)
    const cases=await fetch(base+"/api/demo-cases")
    assert.equal(cases.status,200)
    const list=await cases.json()
    assert.deepEqual(list.cases.map(x=>x.id),["RLUSD-001","RLUSD-002","RLUSD-003"])
    assert.equal(list.cases[2].evidence_status,"UNKNOWN")
    assert.equal(cases.headers.get("x-content-type-options"),"nosniff")
    assert.equal(cases.headers.get("x-frame-options"),"DENY")
    assert.match(cases.headers.get("content-security-policy")??"",/frame-ancestors 'none'/)

    for(const id of ["RLUSD-001","RLUSD-002","RLUSD-003"]){
      const res=await fetch(base+"/api/demo-cases/"+id)
      assert.equal(res.status,200)
      const body=await res.json()
      assert.match(body.audit.canonical_sha256,/^[0-9a-f]{64}$/)
      assert.equal(body.audit.status,id==="RLUSD-003"?"REPOSITORY_ARTIFACT_PARTIAL_CONSISTENCY":"REPOSITORY_ARTIFACT_CONSISTENCY_PASS")
      if(id==="RLUSD-003")assert.equal(body.case.evidence_status,"UNKNOWN")
      assert.ok(Array.isArray(body.audit.historical_transaction_references))
      assert.ok(body.audit.historical_ledger_anchors)
      assert.equal(body.audit.historical_transaction_references.length,
        id==="RLUSD-001"?0:1)
      assert.equal(body.audit.historical_reference_issues.length,id==="RLUSD-003"?1:0)
      if(id==="RLUSD-003"){
        assert.ok(body.audit.unverified_fields.includes("audit.historical_transaction_references"))
      }
      for(const tx of body.audit.historical_transaction_references){
        assert.match(tx.hash,/^[A-Fa-f0-9]{64}$/)
        assert.equal(tx.source,"CHECKED_IN_CANONICAL_ARTIFACT")
      }
    }
    assert.equal((await fetch(base+"/api/demo-cases/UNKNOWN")).status,404)
    assert.equal((await fetch(base+"/api/health",{method:"POST"})).status,405)
    const index=await fetch(base+"/")
    assert.equal(index.status,200)
    assert.match(await index.text(),/Institutional clarity/)
    const workspace=await fetch(base+"/workspace")
    assert.equal(workspace.status,200)
    assert.match(workspace.headers.get("content-type")??"",/text\/html/)
    assert.match(await workspace.text(),/XRPL Evidence & Decision Workspace/)
    const logo=await fetch(base+"/brand.svg")
    assert.equal(logo.status,200)
    assert.match(logo.headers.get("content-type")??"",/image\/svg\+xml/)
    const svg=await logo.text()
    assert.match(svg,/XRPL Evidence by Proof and Signal/)
    assert.doesNotMatch(svg,/<script\b/i)
    assert.equal((await fetch(base+"/workspace",{method:"POST"})).status,405)
  } finally {
    proc.kill("SIGTERM")
  }
})
