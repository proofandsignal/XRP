import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const page = new URL("../public/workspace.html",import.meta.url)

test("premium evidence workspace has syntactically valid inline JavaScript",async()=>{
  const html=await readFile(page,"utf8")
  const script=html.match(/<script>([\s\S]*?)<\/script>/)
  assert.ok(script,"workspace script must be inline for the current CSP")
  assert.doesNotThrow(()=>new Function(script[1]))
})

test("five research views and independent evidence workflow are present",async()=>{
  const html=await readFile(page,"utf8")
  for(const id of ["view-overview","view-case","view-decision","view-evidence","view-roadmap","casePicker","memoGenerate","memoPreview","auditRun","auditOutput","vaultDownload","caseTimeline","txLinks"]){
    assert.match(html,new RegExp('id="'+id+'"'))
  }
  assert.match(html,/\/api\/demo-cases/)
  assert.match(html,/historical_transaction_references/)
  assert.match(html,/canonical_sha256/)
  assert.match(html,/Evidence completeness:/)
  assert.match(html,/UNKNOWN/)
  assert.match(html,/No data sent to the server/)
})

test("research memo is local-only with no sensitive form submission",async()=>{
  const html=await readFile(page,"utf8")
  assert.doesNotMatch(html,/<form\b/i)
  assert.doesNotMatch(html,/localStorage|sessionStorage|sendBeacon|analytics\.|postMessage\s*\(/)
  assert.doesNotMatch(html,/<script[^>]+src=/i)
  assert.match(html,/mailto:partners@proofandsignal\.xyz/)
  assert.match(html,/textContent=S\.memo/)
})

test("small-screen layout and accessibility support are built in",async()=>{
  const html=await readFile(page,"utf8")
  assert.match(html,/name="viewport"/)
  assert.match(html,/@media\(max-width:760px\)/)
  assert.match(html,/aria-live="polite"/)
  assert.match(html,/prefers-reduced-motion/)
  assert.match(html,/:focus-visible/)
})

test("original preview visibly links new workspace",async()=>{
  const html=await readFile(new URL("../public/index.html",import.meta.url),"utf8")
  assert.match(html,/href="\/workspace"/)
  assert.match(html,/Premium Decision Workspace/)
})
