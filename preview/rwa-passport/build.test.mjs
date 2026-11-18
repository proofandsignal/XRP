import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStandalone } from './build.mjs';

test('standalone RWA build preserves the canonical explorer, evidence limits and attribution',async()=>{
 const destination=await mkdtemp(join(tmpdir(),'rwa-standalone-'));
 try{
  const result=await buildStandalone({destination});
  const html=await readFile(join(destination,'index.html'),'utf8');
  const css=await readFile(join(destination,'styles.css'),'utf8');
  const js=await readFile(join(destination,'app.js'),'utf8');
  const evidence=JSON.parse(await readFile(join(destination,'evidence.json'),'utf8'));
  assert.match(html,/<html lang="en">/);
  assert.match(html,/<svg class="brand-icon"/);
  assert.match(html,/<svg class="hero-art"/);
  assert.match(html,/href="#lab-explorer"/);
  assert.match(html,/Created by Proof &amp; Signal/);
  assert.match(html,/Created by Proof & Signal/);
  assert.match(js,/pass_allowed:false,live_feed:false,real_funds:false/);
  assert.match(html,/<link rel="stylesheet" href="\.\/styles\.css">/);
  assert.match(html,/<script src="\.\/app\.js" defer><\/script>/);
  assert.doesNotMatch(html,/<script>[\s\S]*?<\/script>/);
  assert.doesNotMatch(html,/<style>/);
  assert.match(css,/\.hero-layout/);
  assert.match(js,/archive_rpc_independent_replay:'PENDING'/);
  assert.match(html,/NO LIVE FEED/i);
  assert.equal(evidence.public_release,'HOLD');
  assert.equal(evidence.physical_samsung_qa,false);
  assert.equal(evidence.owner_approval,false);
  assert.equal(result.evidence.html_sha256.length,64);
  assert.equal(result.evidence.css_sha256.length,64);
  assert.equal(result.evidence.js_sha256.length,64);
  assert.match(await readFile(join(destination,'robots.txt'),'utf8'),/Disallow:\s*\//);
 }finally{await rm(destination,{recursive:true,force:true});}
});
