import assert from "node:assert/strict"
import { chromium } from "playwright"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { mkdir } from "node:fs/promises"
import { setTimeout as delay } from "node:timers/promises"

async function freePort() {
  const s=createServer()
  await new Promise(resolve=>s.listen(0,"127.0.0.1",resolve))
  const port=s.address().port
  await new Promise(resolve=>s.close(resolve))
  return port
}

const port=await freePort()
const base="http://127.0.0.1:"+port
const env={...process.env,PORT:String(port),RENDER_SERVICE_ID:"srv-qa-mock",DEMO_USER:"qa-reviewer",DEMO_PASSWORD:"synthetic-secret"}
const proc=spawn(process.execPath,["server.mjs"],{cwd:new URL("../",import.meta.url),env,stdio:["ignore","pipe","pipe"]})
let stderr=""
proc.stderr.on("data",part=>{stderr+=part.toString()})
let browser
const qaDir=new URL("./screenshots/",import.meta.url)
try {
  let ready=false
  for(let n=0;n<60;n++){
    try{
      const r=await fetch(base+"/api/health",{signal:AbortSignal.timeout(1000)})
      if(r.status===401){ready=true;break}
    }catch{}
    if(proc.exitCode!==null)break
    await delay(100)
  }
  assert.ok(ready,"Preview server not ready: "+stderr)
  assert.equal((await fetch(base+"/api/demo-cases")).status,401)
  await mkdir(qaDir,{recursive:true})

  browser=await chromium.launch({headless:true})
  for(const viewport of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
    const context=await browser.newContext({
      viewport:{width:viewport.width,height:viewport.height},
      httpCredentials:{username:"qa-reviewer",password:"synthetic-secret"},
      acceptDownloads:true
    })
    const page=await context.newPage()
    const pageErrors=[]
    const thirdPartyRequests=[]
    page.on("pageerror",e=>pageErrors.push(e.message))
    page.on("request",r=>{
      if(!r.url().startsWith(base+"/") && r.url()!==base) thirdPartyRequests.push(r.url())
    })
    try{
      const nav=await page.goto(base+"/",{waitUntil:"networkidle"})
      assert.equal(nav.status(),200)
      assert.match(await page.title(),/XRPL Intelligence Screen/)
      const logo=await page.request.get(base+"/brand.svg")
      assert.equal(logo.status(),200)
      await page.locator('#premiumCasePicker option[value="RLUSD-001"]').waitFor({state:"attached",timeout:15000})
      await page.locator("#premiumExplore").click()
      assert.equal(await page.locator("#premiumCasePicker option").count(),3)
      await page.locator("#premiumCasePicker").selectOption("RLUSD-002")
      await page.locator("#premiumVerifyEvidence").click()
      await page.waitForFunction(()=>document.querySelector("#premiumAuditResult")?.textContent?.includes("Repository consistency:"),undefined,{timeout:15000})
      const audit=await page.locator("#premiumAuditResult").innerText()
      assert.match(audit,/REPOSITORY_ARTIFACT_CONSISTENCY_PASS/)
      assert.match(audit,/Canonical SHA-256/)
      const downloadPromise=page.waitForEvent("download",{timeout:15000})
      await page.locator("#premiumDownloadPack").click()
      const download=await downloadPromise
      assert.match(download.suggestedFilename(),/rlusd-002|case/i)
      await page.locator("#premiumCasePicker").selectOption("RLUSD-003")
      await page.locator("#premiumVerifyEvidence").click()
      await page.waitForFunction(()=>document.querySelector("#premiumAuditResult")?.textContent?.includes("REPOSITORY_ARTIFACT_PARTIAL_CONSISTENCY"),undefined,{timeout:15000})
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)
      assert.equal(overflow,false,viewport.name+" horizontal overflow on historical explorer")
      await page.screenshot({path:new URL(viewport.name+"-explore.png",qaDir).pathname,fullPage:true})
      const workspaceNav=await page.goto(base+"/workspace",{waitUntil:"networkidle"})
      assert.equal(workspaceNav.status(),200)
      assert.match(await page.title(),/XRPL Evidence OS/)
      const workspaceOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)
      assert.equal(workspaceOverflow,false,viewport.name+" horizontal overflow on workspace")
      await page.screenshot({path:new URL(viewport.name+"-workspace.png",qaDir).pathname,fullPage:true})
      assert.deepEqual(pageErrors,[],viewport.name+" uncaught browser exceptions")
      assert.deepEqual(thirdPartyRequests,[],viewport.name+" attempted third-party network access")
      process.stdout.write("BOOST-010 "+viewport.name+" Chrome QA PASS: Explore, historical evidence, partial consistency, export, workspace, auth, branding, overflow and isolation\n")
    }finally{
      await context.close()
    }
  }
}finally{
  if(browser) await browser.close()
  proc.kill("SIGTERM")
}
