/**
 * Automated Chromium UI QA for an isolated, synthetic-only preview.
 * Not a substitute for a real physical Samsung test or human approval.
 * Requires playwright-core and installed Google Chrome on the CI runner.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import net from 'node:net';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  server.close();
  await once(server, 'close');
  return port;
}
const port = await freePort();
const user = 'ci-preview';
const pass = 'CI-ONLY-NOT-PRODUCTION-AB94F7BAA22C5';
const auth = 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
const base = 'http://127.0.0.1:' + port;
const child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], {
  env: {...process.env, PORT: String(port), DEMO_USER: user, DEMO_PASSWORD: pass },
  stdio: ['ignore','pipe','pipe']
});
let browser;
let errors = [];
async function run() {
  let started = false;
  for (let attempt=0; attempt<70; attempt++) {
    try { const response = await fetch(base+'/healthz'); if(response.ok){started=true;break;} } catch {}
    await new Promise(resolve => setTimeout(resolve, 70));
  }
  assert.ok(started, 'local preview server should start');
  await mkdir('demo/qa-artifacts', {recursive:true});
  browser = await chromium.launch({channel:'chrome', headless:true, args:['--no-sandbox']});
  const exercise = async (name, width, height, mobile) => {
    const context = await browser.newContext({
      viewport:{width,height}, isMobile:mobile, hasTouch:mobile, deviceScaleFactor:mobile?2:1,
      reducedMotion:'reduce', extraHTTPHeaders:{Authorization:auth}, acceptDownloads:false
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(name+': '+e.message));
    page.on('request', req => {
      if(!req.url().startsWith(base+'/')) errors.push(name+': disallowed external request '+req.url());
    });
    const resp = await page.goto(base+'/',{waitUntil:'networkidle',timeout:15000});
    assert.equal(resp.status(),200);
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('.brand-logo').count(),1,'own logo top-left');
    assert.ok(await page.locator('.brand-logo').evaluate(img=>img.complete && img.naturalWidth>0),'logo asset should load');
    assert.ok(await page.locator('.hero-visual img').evaluate(img=>img.complete && img.naturalWidth>0),'thematic cover should load');
    assert.ok((await page.locator('.hero-copy').innerText()).includes('Created by Proof & Signal'));
    assert.ok((await page.locator('.hero-copy').innerText()).includes('fictional fixtures'));
    assert.ok((await page.locator('.hero-copy').innerText()).includes('Payment success.'));
    await page.getByRole('button',{name:/Explore the demo/}).click();
    await page.locator('#workspace').scrollIntoViewIfNeeded();
    await page.locator('#scenario-buttons button').first().waitFor();
    assert.equal(await page.locator('#scenario-buttons button').count(),7);
    await page.getByRole('button',{name:'Zero-value intent'}).click();
    await page.waitForFunction(()=>document.querySelector('#code-badge')?.textContent==='NON_POSITIVE_INTENT_AMOUNT');
    assert.equal(await page.locator('#decision').innerText(),'REVIEW');
    await page.getByRole('button',{name:'Wrong issuer'}).click();
    await page.waitForFunction(()=>document.querySelector('#code-badge')?.textContent==='ASSET_OR_ISSUER_MISMATCH');
    assert.equal(await page.locator('#decision').innerText(),'BLOCK');
    await page.getByRole('button',{name:'Exact match'}).click();
    await page.waitForFunction(()=>document.querySelector('#code-badge')?.textContent==='PAYMENT_MATCHED');
    assert.equal(await page.locator('#decision').innerText(),'FIELDS MATCH');
    assert.ok((await page.locator('.warn').innerText()).includes('not proof'));
    assert.ok((await page.locator('#trace').innerText()).includes('FICTIONAL_FIXTURE_NOT_AUTHENTIC_LEDGER_DATA'));
    const widths = await page.evaluate(()=>({
      viewport:document.documentElement.clientWidth,
      content:document.documentElement.scrollWidth
    }));
    assert.ok(widths.content <= widths.viewport + 2, name+' horizontal overflow '+JSON.stringify(widths));
    await page.screenshot({path:'demo/qa-artifacts/'+name+'.png',fullPage:true,animations:'disabled'});
    await context.close();
    console.log(name+' Chromium QA PASS: own logo + themed cover, 4S, Explore, scenarios, evidence, responsive width');
  };
  await exercise('desktop-1440',1440,900,false);
  await exercise('mobile-390',390,844,true);
  assert.deepEqual(errors,[],'No unexpected JS errors or external resources');
}
try {
  await run();
} finally {
  if(browser) await browser.close();
  child.kill();
}
