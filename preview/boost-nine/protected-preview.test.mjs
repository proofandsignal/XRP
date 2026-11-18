import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { protectedPreview } from './server.mjs';
import { request as httpRequest } from 'node:http';

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
    assert.match(r.headers.get('content-security-policy'),/default-src 'none'/);
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
  assert.match(r.headers.get('content-security-policy'),/style-src 'sha256-/);
  assert.match(r.headers.get('content-security-policy'),/style-src-attr 'none'/);
  assert.doesNotMatch(r.headers.get('content-security-policy'),/'unsafe-inline'/);
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

const rawStatus=(path)=>new Promise((resolve,reject)=>{
 const req=httpRequest({hostname:'127.0.0.1',port:server.address().port,path,headers:{Authorization:auth}},res=>{
   res.resume();res.on('end',()=>resolve(res.statusCode));res.on('error',reject);
 });req.on('error',reject);req.end();
});
test('SEC-01: reject noncanonical request targets even if URL parser normalizes them',async()=>{
 for(const path of ['/rwa.html/../index.html','/%2e%2e/rwa.html','//rwa.html','/%72wa.html','/rwa.html%2f','/rwa.html%5c..']){
   assert.equal(await rawStatus(path),404,path);
 }
 assert.equal(await rawStatus('/rwa.html?case=historical'),200);
});
test('SEC-01: bad and malformed authorization never expose preview',async()=>{
 for(const candidate of ['Bearer secret','Basic !!!!','Basic '+('A'.repeat(1600)),'Basic YQ==!','Basic '+Buffer.from('qa-reviewer:bad').toString('base64')]){
   const response=await page('/rwa.html',{Authorization:candidate});
   assert.equal(response.status,401,candidate.slice(0,24));
   assert.doesNotMatch(await response.text(),/MPT-001/);
 }
});

test('SEC-01: bad credential bursts are throttled without spoofable forwarded IP',async()=>{
  const isolated=protectedPreview({username,password});
  await new Promise(resolve=>isolated.listen(0,'127.0.0.1',resolve));
  const target='http://127.0.0.1:'+isolated.address().port+'/rwa.html';
  try{
    for(let i=0;i<12;i++){
      const r=await fetch(target,{headers:{Authorization:'Basic '+Buffer.from(username+':bad-'+i).toString('base64'),
        'X-Forwarded-For':'198.51.100.'+(i%20+1)}});
      assert.equal(r.status,401);
    }
    const blocked=await fetch(target,{headers:{Authorization:'Basic '+Buffer.from(username+':bad-13').toString('base64'),
      'X-Forwarded-For':'203.0.113.250'}});
    assert.equal(blocked.status,429);
    assert.ok(Number(blocked.headers.get('retry-after'))>0);
    assert.match(blocked.headers.get('content-security-policy'),/default-src 'none'/);
    const valid=await fetch(target,{headers:{Authorization:auth}});
    assert.equal(valid.status,200,'a valid reviewer must never be locked out by failed attempts');
  }finally{await new Promise(resolve=>isolated.close(resolve));}
});
