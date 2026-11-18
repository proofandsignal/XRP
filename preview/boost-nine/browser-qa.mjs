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
test('RWA passport isolates synthetic cases from historical provenance and exports correct evidence',async()=>{
  const {page,errors}=await pageFor('rwa.html');
  assert.equal(await page.locator('#state').innerText(),'REVIEW');
  const warning=page.locator('#rwaLegalWarning');
  assert.equal(await warning.isVisible(),true);
  assert.match(await warning.innerText(),/Validated XRPL ledger fields are not independent verification/i);
  assert.equal(await page.locator('#ledger').innerText(),'107775551');
  assert.match(await page.locator('#issuance').innerText(),/^05EECEBE/);
  assert.equal(await page.locator('#sourceLink').isVisible(),true);
  await page.locator('#case').selectOption('issuer');
  assert.equal(await page.locator('#state').innerText(),'VERIFY');
  assert.equal(await warning.isVisible(),true);
  assert.match(await warning.innerText(),/other scenarios are synthetic/i);
  assert.match(await page.locator('#ledger').innerText(),/synthetic/i);
  assert.match(await page.locator('#issuance').innerText(),/no real issuance/i);
  assert.match(await page.locator('#issuerAccount').innerText(),/no real account/i);
  assert.equal(await page.locator('#sourceLink').isVisible(),false);
  assert.equal(await page.locator('#syntheticNotice').isVisible(),true);
  assert.match(await page.locator('#decision').innerText(),/Require real issuer identity documents/);
  const [syntheticDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  assert.match(syntheticDownload.suggestedFilename(),/xrpl-rwa-risk-passport.*\.json/);
  const synthetic=JSON.parse(await (await import('node:fs/promises')).readFile(await syntheticDownload.path(),'utf8'));
  assert.equal(synthetic.on_chain_evidence.issuance_id,null);
  assert.equal(synthetic.on_chain_evidence.issuer_account,null);
  assert.equal(synthetic.on_chain_evidence.validated_ledger,null);
  assert.equal(synthetic.mode,'synthetic');
  assert.equal(synthetic.archive_rpc_independent_replay,'PENDING');
  assert.equal(synthetic.claim_source_type,'SYNTHETIC EDUCATIONAL CASE');
  assert.equal(synthetic.independently_verified_off_chain.backing,'UNKNOWN');
  assert.equal(synthetic.pass_allowed,false);
  assert.equal(synthetic.live_feed,false);
  await page.locator('#case').selectOption('lock');
  assert.equal(await page.locator('#state').innerText(),'REVIEW');
  assert.match(await page.locator('#control').innerText(),/NOT observed/);
  await page.locator('#case').selectOption('metadata');
  assert.equal(await page.locator('#state').innerText(),'VERIFY');
  assert.match(await page.locator('#issuerClaim').innerText(),/fully backed/i);
  await page.locator('#reset').click();
  assert.equal(await page.locator('#case').inputValue(),'mainnet');
  assert.equal(await page.locator('#sourceLink').isVisible(),true);
  const [historicalDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  const historical=JSON.parse(await (await import('node:fs/promises')).readFile(await historicalDownload.path(),'utf8'));
  assert.equal(historical.mode,'historical evidence replay');
  assert.equal(historical.archive_rpc_independent_replay,'PENDING');
  assert.equal(historical.claim_source_type,'AUTHOR-CAPTURED CASE RECORD');
  assert.equal(historical.on_chain_evidence.validated_ledger,'107775551');
  assert.equal(historical.on_chain_evidence.captured_date,'2026-10-20');
  assert.equal(historical.independently_verified_off_chain.legal_identity,'UNKNOWN');
  assert.match(historical.legal_disclaimer,/On-chain evidence does not establish legal issuer identity/i);
  assert.equal(historical.external_proof_status,'NOT_INDEPENDENTLY_VERIFIED');
  assert.equal(historical.pass_allowed,false);
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
    const overflow=widths.scroll>widths.viewport+1?await page.evaluate(()=>[...document.querySelectorAll('*')].map(el=>({tag:el.tagName,id:el.id,cls:typeof el.className==='string'?el.className:'',right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left),width:Math.round(el.getBoundingClientRect().width)})).filter(el=>el.right>window.innerWidth+1||el.left< -1).slice(0,25)):[];
    assert.ok(widths.scroll<=widths.viewport+1,name+' overflows '+JSON.stringify({widths,overflow}));
    assert.deepEqual(errors,[],name+' JS exceptions');
    await page.close();
  }
});

test('RWA premium standalone identity, Explore CTA and responsive touch layout',async()=>{
  for(const width of [360,390,412,768,1440]){
    const {page,errors}=await pageFor('rwa.html',{width,height:900});
    assert.equal(await page.locator('.brand-name strong').innerText(),'XRPL RWA Risk Passport');
    assert.match(await page.locator('.brand').innerText(),/Created by Proof & Signal/);
    assert.equal(await page.locator('.brand-icon svg').count(),0,'original SVG logo is direct branded SVG');
    assert.equal(await page.locator('svg.brand-icon').count(),1);
    assert.equal(await page.locator('svg.hero-art').count(),1);
    const overflow=await page.evaluate(()=>({screen:innerWidth,doc:document.documentElement.scrollWidth}));
    assert.ok(overflow.doc<=overflow.screen+1,'RWA overflow at '+width+': '+JSON.stringify(overflow));
    const explore=page.getByRole('link',{name:/Explore the Passport/i});
    assert.equal(await explore.isVisible(),true,'CTA visible '+width);
    await explore.click();
    assert.equal(new URL(page.url()).hash,'#lab-explorer');
    assert.equal(await page.locator('#lab-explorer').isVisible(),true);
    for(const key of ['issuer','lock','metadata','mainnet']){
      await page.locator('#case').selectOption(key);
      const status=await page.locator('#state').innerText();
      assert.ok(['VERIFY','REVIEW'].includes(status),key+' unexpected '+status);
      assert.equal(await page.locator('#rwaLegalWarning').isVisible(),true);
    }
    assert.deepEqual(errors,[],width+' page errors');
    await page.close();
  }
});
