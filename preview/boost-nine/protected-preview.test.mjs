import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { protectedPreview } from './server.mjs';

const username='qa-reviewer';
const password='LOCAL_TEST_ONLY_NEVER_USE_IN_RENDER_012345';
const server=protectedPreview({username,password});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
after(()=>new Promise(resolve=>server.close(resolve)));
const origin='http://127.0.0.1:'+server.address().port;
const auth='Basic '+Buffer.from(username+':'+password).toString('base64');
const page=(path,headers={},method='GET')=>fetch(origin+path,{headers,method,redirect:'manual'});
test('unauthenticated users cannot access any route or leak content',async()=>{
  for(const path of ['/','/rlusd.html','/rwa.html','/defi-guard.html']){
    const r=await page(path);assert.equal(r.status,401);
    assert.match(r.headers.get('www-authenticate'),/Basic/);
    assert.doesNotMatch(await r.text(),/RLUSD-001|MPT-001|Health Factor/);
    assert.match(r.headers.get('cache-control'),/no-store/);
  }
});
test('bad credentials cannot be used',async()=>{
  const r=await page('/',{Authorization:'Basic '+Buffer.from(username+':wrong').toString('base64')});
  assert.equal(r.status,401);
});
test('authenticated document is available with protective headers',async()=>{
  const r=await page('/',{Authorization:auth});
  assert.equal(r.status,200);
  const body=await r.text();
  assert.match(body,/9-Demo Intelligence Panel/);
  assert.match(r.headers.get('content-security-policy'),/script-src 'sha256-/);
  assert.match(r.headers.get('content-security-policy'),/connect-src 'none'/);
  assert.equal(r.headers.get('x-frame-options'),'DENY');
  assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  assert.equal(r.headers.get('referrer-policy'),'no-referrer');
  assert.ok(!r.headers.get('access-control-allow-origin'));
});
test('all three protected individual Explorer routes resolve',async()=>{
  for(const path of ['/rlusd.html','/rwa.html','/defi-guard.html']){
    const r=await page(path,{Authorization:auth});
    assert.equal(r.status,200,path);
    assert.match(await r.text(),/Created by Proof & Signal/);
  }
});
test('only allowlisted pages, methods and paths are accepted',async()=>{
  for(const path of ['/nope','/.git/config','/README.md','/%2e%2e/README.md','/server.mjs','/rlusd.html/other']){
    const r=await page(path,{Authorization:auth});assert.equal(r.status,404,path);
  }
  const r=await page('/',{Authorization:auth},'POST');
  assert.equal(r.status,405);
});
test('HEAD responses contain no page body',async()=>{
  const r=await page('/rwa.html',{Authorization:auth},'HEAD');
  assert.equal(r.status,200);assert.equal(await r.text(),'');
});
test('never start a preview without strong credentials',()=>{
  assert.throws(()=>protectedPreview({username:'x',password:''}),/credentials/);
  assert.throws(()=>protectedPreview({username:'x',password:'short'}),/credentials/);
});
