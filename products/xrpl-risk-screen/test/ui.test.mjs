import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("inline screen JavaScript parses",async()=>{
  const html=await readFile(new URL("../public/index.html",import.meta.url),"utf8")
  const match=html.match(/<script>([\s\S]*?)<\/script>/)
  assert.ok(match,"inline script must exist")
  assert.doesNotThrow(()=>new Function(match[1]))
})

test("Android/share controls remain wired",async()=>{
  const html=await readFile(new URL("../public/index.html",import.meta.url),"utf8")
  for(const id of ["copySummary","copyPassport","shareResult","exportJson","forgetBaseline","transitionClass","transition","signing"]){
    assert.match(html,new RegExp(`id=["']${id}["']`))
  }
  assert.match(html,/navigator\.share/)
  assert.match(html,/localStorage/)
  assert.match(html,/\/api\/transition/)
})


test("ledger-derived row values are HTML escaped",async()=>{
  const html=await readFile(new URL("../public/index.html",import.meta.url),"utf8")
  assert.match(html,/function row\(a,b\)\{return .*esc\(a\).*esc\(b\?\?'UNKNOWN'\)/)
  assert.match(html,/function esc\(s\)/)
  assert.doesNotMatch(html,/row\('Passport','<span/)
  assert.doesNotMatch(html,/row\('Issuance ID','<span/)
})


test("account UI renders signing authority evidence", async () => {
  const html=await readFile(new URL("../public/index.html",import.meta.url),"utf8")
  assert.match(html,/Master key disabled/)
  assert.match(html,/Signer lists/)
  assert.match(html,/Signer entries/)
  assert.match(html,/signing_authority/)
})


test("BUILD-009 demo case library is wired for mobile distribution", async () => {
  const html=await readFile(new URL("../public/index.html",import.meta.url),"utf8")
  assert.match(html,/Verified Demo Cases/)
  assert.match(html,/\/api\/demo-cases/)
  assert.match(html,/Copy case/)
  assert.match(html,/Public note/)
  assert.match(html,/demoCaseText/)
})


test("demo cases expose shareable deep links", async () => {
  const html=await readFile(new URL("../public/index.html",import.meta.url),"utf8")
  assert.match(html,/function caseLink\(id\)/)
  assert.match(html,/searchParams\.set\('case',id\)/)
  assert.match(html,/Copy case link/)
  assert.match(html,/scrollIntoView/)
  assert.match(html,/classList\.add\('focused'\)/)
})

test("mobile case grid CSS is syntactically structured", async () => {
  const html=await readFile(new URL("../public/index.html",import.meta.url),"utf8")
  assert.match(html,/@media\(max-width:800px\)\{\.cases\{grid-template-columns:1fr\}main\{/)
  assert.doesNotMatch(html,/\.cases\{grid-template-columns:1fr\}\{main/)
})
