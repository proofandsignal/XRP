import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const root=dirname(fileURLToPath(import.meta.url));
const load=(name)=>readFileSync(join(root,name),'utf8');
const htmlNames=['index.html','rlusd.html','rwa.html','defi-guard.html'];
test('all four preview pages exist and identify synthetic QA scope',()=>{
  for(const name of htmlNames){
    const h=load(name);
    assert.match(h,/<!doctype html>/i);
    assert.match(h,/<meta name="viewport"/);
    assert.match(h,/Created by Proof & Signal/);
    assert.match(h,/Samsung/);
    assert.match(h,/NOT|NO|not|no/);
  }
});
test('all inline scripts are parseable JavaScript',()=>{
  for(const name of htmlNames){
    const h=load(name);const script=h.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(script,name+' has a script');
    assert.doesNotThrow(()=>new vm.Script(script[1],{filename:name}));
  }
});
test('nine cards and three local standalone demos',()=>{
  const h=load('index.html');
  assert.equal((h.match(/data-area="/g)||[]).length,9);
  for(const name of ['rlusd.html','rwa.html','defi-guard.html']){
    assert.ok(existsSync(join(root,name)));
    assert.ok(h.includes('href="'+name+'"'));
  }
  assert.match(h,/0<\/strong><small>Confirmed full Demo PASS/);
});
test('historical case labels avoid live feed misrepresentation',()=>{
  const rl=load('rlusd.html'), rwa=load('rwa.html');
  assert.match(rl,/RLUSD-001/);
  assert.match(rl,/PARTIAL/);
  assert.match(rl,/live_feed:false/);
  assert.match(rwa,/MPT-001/);
  assert.match(rwa,/external proof|external-proof|off-chain/i);
  assert.match(rwa,/live_feed:false/);
});
test('guard explicitly does not deliver notifications',()=>{
  const h=load('defi-guard.html');
  assert.match(h,/NO|No/);
  assert.match(h,/delivered:false/);
  assert.match(h,/HF_CRITICAL/);
  assert.match(h,/EVIDENCE_VERIFY/);
});
test('external links using new tabs disallow opener access',()=>{
  for(const name of htmlNames){
    const h=load(name);
    assert.ok(!/target="_blank"(?!\s+rel="noopener noreferrer")/.test(h),name+' must protect external tabs');
  }
});
