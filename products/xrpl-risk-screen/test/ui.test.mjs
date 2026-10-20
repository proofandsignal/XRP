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
  for(const id of ["copySummary","copyPassport","shareResult","exportJson","forgetBaseline","transitionClass","transition"]){
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
