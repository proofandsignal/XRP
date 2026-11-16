import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

async function availablePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  server.close();
  await once(server, 'close');
  return port;
}
test('protected premium synthetic preview: auth, controls, no financial execution', {timeout:15000}, async t => {
  const port = await availablePort();
  const user = 'qa';
  const pass = 'only-in-ci-synthetic-demo-qa-secret-12345';
  const child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], {
    env:{...process.env,PORT:String(port),DEMO_USER:user,DEMO_PASSWORD:pass},
    stdio:['ignore','pipe','pipe']
  });
  t.after(() => child.kill());
  const base = 'http://127.0.0.1:' + port;
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try { const res = await fetch(base + '/healthz'); if (res.ok) { ready = true; break; } }
    catch {}
    await new Promise(resolve => setTimeout(resolve, 70));
  }
  assert.equal(ready, true, 'Preview server should be ready');
  const auth = 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
  const get = (p, opts={}) => fetch(base+p, {headers:{Authorization:auth},...opts});
  await t.test('unauthenticated page fails closed with 401', async () => {
    const r=await fetch(base+'/'); assert.equal(r.status,401); assert.match(r.headers.get('www-authenticate')||'',/Basic realm/);
  });
  await t.test('wrong password fails with 401', async () => {
    const r=await fetch(base+'/',{headers:{Authorization:'Basic '+Buffer.from('qa:wrong').toString('base64')}}); assert.equal(r.status,401);
  });
  await t.test('authorized page is premium, clearly synthetic, no external scripts', async () => {
    const r=await get('/'); assert.equal(r.status,200); const text=await r.text();
    assert.match(text,/PROOF/); assert.match(text,/Fictional fixtures only/);
    assert.match(text,/Explore scenarios/); assert.match(text,/Created by Proof & Signal/);
    assert.doesNotMatch(text,/https:\/\/[^" ]+\.js/);
    assert.ok((r.headers.get('content-security-policy')||'').includes("default-src 'none'"));
    assert.match(r.headers.get('cache-control')||'',/no-store/);
    assert.ok(!text.includes(pass));
  });
  await t.test('authorized assets are available, with appropriate MIME', async () => {
    const js=await get('/assets/app.js'); assert.equal(js.status,200); assert.match(js.headers.get('content-type')||'',/javascript/);
    const css=await get('/assets/style.css'); assert.equal(css.status,200); assert.match(css.headers.get('content-type')||'',/css/);
    const icon=await get('/favicon.svg'); assert.equal(icon.status,200); assert.match(icon.headers.get('content-type')||'',/svg/);
  });
  await t.test('predefined scenario catalog is synthetic and read only', async () => {
    const x=await (await get('/api/scenarios')).json();
    assert.equal(x.synthetic,true); assert.equal(x.read_only,true); assert.equal(x.scenarios.length,7);
  });
  const expected = {matched:['PASS','PAYMENT_MATCHED'],zero:['REVIEW','NON_POSITIVE_INTENT_AMOUNT'],under:['BLOCK','UNDERDELIVERED'],issuer:['BLOCK','ASSET_OR_ISSUER_MISMATCH'],unvalidated:['REVIEW','VALIDATION_NOT_CONFIRMED'],missing:['REVIEW','DELIVERED_AMOUNT_UNKNOWN'],network:['BLOCK','NETWORK_MISMATCH']};
  for (const [id,[decision,code]] of Object.entries(expected)) {
    await t.test('synthetic '+id+' produces '+decision+'/'+code,async()=>{
      const r=await get('/api/scenario/'+id); assert.equal(r.status,200);
      const x=await r.json(); assert.equal(x.synthetic,true); assert.equal(x.provenance,'FICTIONAL_FIXTURE_NOT_AUTHENTIC_LEDGER_DATA');
      assert.equal(x.result.decision,decision); assert.equal(x.result.code,code);
      if (decision==='PASS') {assert.equal(x.result.replay_check,'NOT_PERFORMED');assert.equal(x.result.verified_ledger_source,'EXTERNAL_CALLER_RESPONSIBILITY');}
    });
  }
  await t.test('no arbitrary scenario/path or POST execution', async () => {
    assert.equal((await get('/api/scenario/unknown')).status,404);
    assert.equal((await get('/.env')).status,404);
    assert.equal((await get('/api/scenario/matched',{method:'POST'})).status,405);
  });
});
