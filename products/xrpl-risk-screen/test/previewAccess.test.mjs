import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { setTimeout as delay } from "node:timers/promises"
import { previewProtectionRequired, authorizePreviewRequest } from "../lib/previewAccess.mjs"

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
  }finally{
    proc.kill("SIGTERM")
  }
})
