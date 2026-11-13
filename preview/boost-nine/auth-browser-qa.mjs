import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {protectedPreview} from './server.mjs';

const username='qa-reviewer',password='LOCAL_TEST_ONLY_NEVER_USE_IN_RENDER_012345';
const app=protectedPreview({username,password});
await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
after(()=>new Promise(resolve=>app.close(resolve)));
const url='http://127.0.0.1:'+app.address().port;

test('anonymous Chromium session receives only unauthorized response',async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage();
    const response=await page.goto(url+'/rlusd.html');
    assert.equal(response.status(),401);
    assert.doesNotMatch(await page.content(),/RLUSD-001/);
  }finally{await browser.close();}
});
test('authorized Chromium runs interactive RLUSD, RWA and Guard scripts behind CSP',async()=>{
  const browser=await chromium.launch();
  const context=await browser.newContext({httpCredentials:{username,password}});
  try{
    for(const [path,selectOption,expectState] of [
      ['/rlusd.html','supply','VERIFY'],
      ['/rwa.html','issuer','VERIFY'],
      ['/defi-guard.html','critical','CRITICAL']
    ]){
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      const response=await page.goto(url+path);
      assert.equal(response.status(),200,path);
      if(path==='/defi-guard.html')await page.locator('#preset').selectOption(selectOption);
      else await page.locator('#case').selectOption(selectOption);
      assert.equal(await page.locator('#state').innerText(),expectState,path);
      assert.deepEqual(errors,[],path+' script error');
      await page.close();
    }
  }finally{await context.close();await browser.close();}
});
