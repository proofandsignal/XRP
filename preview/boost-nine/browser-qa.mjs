import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true});
after(async()=>browser.close());
async function pageFor(name,viewport={width:1280,height:900}){
  const page=await browser.newPage({viewport,acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(join(root,name)).href);
  return {page,errors};
}
test('panel has exactly nine routes, and filters by product family',async()=>{
  const {page,errors}=await pageFor('index.html');
  assert.equal(await page.locator('[data-area]').count(),9);
  await page.getByRole('button',{name:'XRPL'}).click();
  assert.equal(await page.locator('[data-area]:visible').count(),4);
  await page.getByRole('button',{name:'DeFi'}).click();
  assert.equal(await page.locator('[data-area]:visible').count(),4);
  await page.getByRole('button',{name:'Solana'}).click();
  assert.equal(await page.locator('[data-area]:visible').count(),1);
  await page.getByRole('button',{name:'All 9'}).click();
  assert.equal(await page.locator('[data-area]:visible').count(),9);
  assert.deepEqual(errors,[]);
  await page.close();
});
test('RLUSD scenarios honor UNKNOWN and JSON export',async()=>{
  const {page,errors}=await pageFor('rlusd.html');
  assert.equal(await page.locator('#state').innerText(),'REVIEW');
  await page.locator('#case').selectOption('supply');
  assert.equal(await page.locator('#state').innerText(),'VERIFY');
  assert.match(await page.locator('#external').innerText(),/UNKNOWN/);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  assert.match(download.suggestedFilename(),/rlusd-intelligence.*\.json/);
  assert.deepEqual(errors,[]);
  await page.close();
});
test('RWA passport does not confuse issuer configuration with external legal proof',async()=>{
  const {page,errors}=await pageFor('rwa.html');
  assert.equal(await page.locator('#state').innerText(),'REVIEW');
  await page.locator('#case').selectOption('issuer');
  assert.equal(await page.locator('#state').innerText(),'VERIFY');
  assert.match(await page.locator('#decision').innerText(),/Require external/);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  assert.match(download.suggestedFilename(),/xrpl-rwa-risk-passport.*\.json/);
  assert.deepEqual(errors,[]);
  await page.close();
});
test('DeFi Guard uses precedence, uncertainty, and no notification delivery',async()=>{
  const {page,errors}=await pageFor('defi-guard.html');
  assert.equal(await page.locator('#state').innerText(),'OK');
  await page.locator('#preset').selectOption('watch');
  assert.equal(await page.locator('#state').innerText(),'WATCH');
  await page.locator('#preset').selectOption('warning');
  assert.equal(await page.locator('#state').innerText(),'WARNING');
  await page.locator('#preset').selectOption('critical');
  assert.equal(await page.locator('#state').innerText(),'CRITICAL');
  await page.locator('#quality').selectOption('STALE');
  await page.getByRole('button',{name:'Evaluate risk'}).click();
  assert.equal(await page.locator('#state').innerText(),'CRITICAL');
  assert.equal(await page.locator('#verify').innerText(),'Yes');
  await page.locator('#preset').selectOption('stale');
  assert.equal(await page.locator('#state').innerText(),'VERIFY');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  assert.match(download.suggestedFilename(),/defi-guard.*\.json/);
  assert.match(await page.getByText(/no emails, webhooks or external calls/i).innerText(),/no emails/i);
  assert.deepEqual(errors,[]);
  await page.close();
});
test('all nine-panel pages fit mobile viewport without horizontal scrolling',async()=>{
  for(const name of ['index.html','rlusd.html','rwa.html','defi-guard.html']){
    const {page,errors}=await pageFor(name,{width:390,height:844});
    const widths=await page.evaluate(()=>({viewport:window.innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(widths.scroll<=widths.viewport+1,name+' overflows '+JSON.stringify(widths));
    assert.deepEqual(errors,[],name+' JS exceptions');
    await page.close();
  }
});
