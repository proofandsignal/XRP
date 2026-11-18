import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

const browser=await chromium.launch({headless:true});
after(async()=>browser.close());
const target=pathToFileURL(resolve('dist/rwa-passport/index.html')).href;

test('standalone RWA output: original branding, CTA, synthetic decisions, JSON and five viewports',async()=>{
 for(const width of [360,390,412,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(target);
  assert.match(await page.locator('header').innerText(),/XRPL RWA Risk Passport/);
  assert.match(await page.locator('header').innerText(),/Created by Proof & Signal/);
  assert.equal(await page.locator('svg.hero-art').count(),1);
  const size=await page.evaluate(()=>({w:window.innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(size.scroll<=size.w+1,'overflow at '+width+'px '+JSON.stringify(size));
  await page.getByRole('link',{name:/Explore the Passport/}).click();
  assert.equal(new URL(page.url()).hash,'#lab-explorer');
  assert.equal(await page.locator('#state').innerText(),'REVIEW');
  await page.locator('#case').selectOption('issuer');
  assert.equal(await page.locator('#state').innerText(),'VERIFY');
  assert.equal(await page.locator('#sourceLink').isVisible(),false);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  const payload=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(payload.mode,'synthetic');
  assert.equal(payload.on_chain_evidence.issuance_id,null);
  assert.equal(payload.independently_verified_off_chain.backing,'UNKNOWN');
  assert.equal(payload.pass_allowed,false);
  assert.equal(payload.archive_rpc_independent_replay,'PENDING');
  assert.equal(payload.claim_source_type,'SYNTHETIC EDUCATIONAL CASE');
  assert.equal(payload.real_funds,false);
  await page.locator('#reset').click();
  assert.equal(await page.locator('#case').inputValue(),'mainnet');
  assert.deepEqual(errors,[],width+'px browser exceptions');
  await page.close();
 }
});
