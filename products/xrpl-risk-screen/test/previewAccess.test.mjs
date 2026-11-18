import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { setTimeout as delay } from "node:timers/promises"
import { previewProtectionRequired, authorizePreviewRequest, createFailureLimiter } from "../lib/previewAccess.mjs"

function responseStub() {
  return {
    status: null, headers: null, body: "",
    writeHead(status, headers) { this.status=status; this.headers=headers },
    end(body) { this.body=body }
  }
}

test("Render-hosted preview always requires credentials", () => {
  assert.equal(previewProtectionRequired({RENDER_SERVICE_ID:"srv-123"}), true)
  assert.equal(previewProtectionRequired({RENDER:"true"}), true)
  assert.equal(previewProtectionRequired({PREVIEW_REQUIRE_AUTH:"1"}), true)
  assert.equal(previewProtectionRequired({}), false)
})

test("fail-closed private access with no credentials or wrong credentials", () => {
  let res=responseStub()
  assert.equal(authorizePreviewRequest({headers:{}},res,{RENDER_SERVICE_ID:"srv-test"}),false)
  assert.equal(res.status,503)
  assert.equal(res.headers["cache-control"],"no-store")
  res=responseStub()
  const env={RENDER_SERVICE_ID:"srv-test",DEMO_USER:"qa-reviewer",DEMO_PASSWORD:"synthetic-secret"}
  assert.equal(authorizePreviewRequest({headers:{authorization:"Basic invalid"}},res,env),false)
  assert.equal(res.status,401)
  assert.match(res.headers["www-authenticate"],/Basic realm/)
  assert.doesNotMatch(res.body,/synthetic-secret/)
  res=responseStub()
  const correct="Basic "+Buffer.from("qa-reviewer:synthetic-secret").toString("base64")
  assert.equal(authorizePreviewRequest({headers:{authorization:correct}},res,env),true)
  assert.equal(res.status,null)
  res=responseStub()
  assert.equal(authorizePreviewRequest({headers:{}},res,{}),true)
})

async function freePort(){
  const s=createServer()
  await new Promise(resolve=>s.listen(0,"127.0.0.1",resolve))
  const port=s.address().port
  await new Promise(resolve=>s.close(resolve))
  return port
}

test("hosted preview rejects unauthenticated access to every real endpoint",async()=>{
  const port=await freePort()
  const env={...process.env,PORT:String(port),RENDER_SERVICE_ID:"srv-test",DEMO_USER:"qa-reviewer",DEMO_PASSWORD:"synthetic-secret"}
  const proc=spawn(process.execPath,["server.mjs"],{cwd:new URL("../",import.meta.url),env,stdio:["ignore","pipe","pipe"]})
  let stderr=""
  proc.stderr.on("data",c=>{stderr+=c.toString()})
  const base="http://127.0.0.1:"+port
  try{
    let ready=false
    for(let attempt=0;attempt<50;attempt++){
      try{
        const r=await fetch(base+"/api/health",{signal:AbortSignal.timeout(1000)})
        ready=r.status===401
        if(ready)break
      }catch{}
      if(proc.exitCode!==null)break
      await delay(100)
    }
    assert.ok(ready,"Preview server failed to start: "+stderr)
    for(const path of ["/","/workspace","/brand.svg","/api/health","/api/demo-cases","/api/account?account=rExample"]){
      const res=await fetch(base+path)
      assert.equal(res.status,401,path)
      assert.equal(res.headers.get("cache-control"),"no-store")
      assert.match(res.headers.get("www-authenticate")||"",/Basic/)
    }
    const authorized="Basic "+Buffer.from("qa-reviewer:synthetic-secret").toString("base64")
    const response=await fetch(base+"/api/demo-cases",{headers:{Authorization:authorized}})
    assert.equal(response.status,200)
    const data=await response.json()
    assert.deepEqual(data.cases.map(c=>c.id),["RLUSD-001","RLUSD-002","RLUSD-003"])
    // Offline/local integration regression: >100 failed attempts; no hosted stress traffic.
    let hitLimit=false
    for(let i=0;i<105;i++){
      const bad=await fetch(base+"/api/demo-cases",{
        headers:{Authorization:"Basic "+Buffer.from("qa-reviewer:wrong-"+i).toString("base64")}
      })
      assert.ok([401,429].includes(bad.status),"Unexpected failure status "+bad.status)
      if(bad.status===429){
        hitLimit=true
        assert.equal(bad.headers.get("cache-control"),"no-store")
        assert.ok(Number(bad.headers.get("retry-after"))>=1)
      }
    }
    assert.equal(hitLimit,true,"Brute-force throttle must activate")
    // Successful credentials must remain usable; attackers cannot lock out the owner.
    const afterAttack=await fetch(base+"/api/demo-cases",{headers:{Authorization:authorized}})
    assert.equal(afterAttack.status,200)

  }finally{
    proc.kill("SIGTERM")
  }
})

test("failure limiter is bounded, ignores spoofed forwarding headers, and expires",()=>{
  let now=1_000
  const limiter=createFailureLimiter({limit:3,windowMs:1_000,lockMs:2_000,maxPeers:2,clock:()=>now})
  const env={PREVIEW_REQUIRE_AUTH:"1",DEMO_USER:"qa-reviewer",DEMO_PASSWORD:"synthetic-secret"}
  const attempt=(peer,spoof)=>{
    const res=responseStub()
    const allowed=authorizePreviewRequest({
      socket:{remoteAddress:peer},
      headers:{authorization:"Basic bad", "x-forwarded-for":spoof}
    },res,env,limiter)
    assert.equal(allowed,false)
    return res
  }
  assert.equal(attempt("10.0.0.1","198.51.100.1").status,401)
  assert.equal(attempt("10.0.0.1","198.51.100.2").status,401)
  let res=attempt("10.0.0.1","198.51.100.3")
  assert.equal(res.status,429)
  assert.equal(res.headers["retry-after"],"2")
  assert.equal(attempt("10.0.0.1","198.51.100.4").status,429)
  assert.equal(attempt("10.0.0.2","198.51.100.4").status,401)
  assert.equal(attempt("10.0.0.3","198.51.100.4").status,429,"peer table must be bounded")
  const valid="Basic "+Buffer.from("qa-reviewer:synthetic-secret").toString("base64")
  res=responseStub()
  assert.equal(authorizePreviewRequest({
    socket:{remoteAddress:"10.0.0.1"},headers:{authorization:valid}
  },res,env,limiter),true,"valid credentials should not be locked out")
  now+=2_001
  assert.equal(attempt("10.0.0.1","203.0.113.10").status,401)
  assert.equal(attempt("10.0.0.3","203.0.113.10").status,401,"expired buckets may be pruned")
})
