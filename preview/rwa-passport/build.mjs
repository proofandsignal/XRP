import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const home=dirname(fileURLToPath(import.meta.url));
const source=resolve(home,'../boost-nine/rwa.html');
const output=resolve(home,'../../dist/rwa-passport');

export async function buildStandalone({destination=output}={}){
  const sourceHtml=await readFile(source,'utf8');
  let html=sourceHtml;
  for(const [name,pattern] of [
    ['English document',/<html lang="en">/],
    ['standalone identity',/XRPL RWA Risk Passport/],
    ['original logo',/<svg class="brand-icon"/],
    ['original cover',/<svg class="hero-art"/],
    ['Explore CTA',/href="#lab-explorer"/],
    ['interactive scenario selector',/<select id="case">/],
    ['export control',/id="export"/],
    ['Proof & Signal attribution',/Created by Proof &(?:amp;| ) Signal/],
    ['read-only boundary',/pass_allowed:false,live_feed:false,real_funds:false/],
    ['visible evidence caveat',/id="rwaLegalWarning"/]
  ]){if(!pattern.test(html))throw Error('Missing RWA demo requirement: '+name);}
  if(/<script\b[^>]*\bsrc\s*=|<iframe\b|\b(?:walletconnect|window\.ethereum)\b/i.test(html)){
    throw Error('Standalone candidate includes prohibited runtime integration');
  }
  // Extract assets from the SINGLE canonical source; the standalone static output
  // can then enforce CSP script-src/style-src 'self' without unsafe-inline.
  const styleMatches=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  const scriptMatches=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if(styleMatches.length!==1||scriptMatches.length!==1){
    throw Error('Standalone export requires exactly one inline stylesheet and one inline script');
  }
  const css=styleMatches[0][1], js=scriptMatches[0][1];
  html=html.replace(styleMatches[0][0],'<link rel="stylesheet" href="./styles.css">');
  html=html.replace(scriptMatches[0][0],'<script src="./app.js" defer></script>');
  await mkdir(destination,{recursive:true});
  await writeFile(resolve(destination,'index.html'),html,'utf8');
  await writeFile(resolve(destination,'styles.css'),css,'utf8');
  await writeFile(resolve(destination,'app.js'),js,'utf8');
  await writeFile(resolve(destination,'robots.txt'),'User-agent: *\nDisallow: /\n','utf8');
  const evidence={
    product:'XRPL RWA Risk Passport',
    source:'preview/boost-nine/rwa.html',
    html_sha256:createHash('sha256').update(html).digest('hex'),
    css_sha256:createHash('sha256').update(css).digest('hex'),
    js_sha256:createHash('sha256').update(js).digest('hex'),
    source_head_sha:process.env.RWA_SOURCE_SHA||'LOCAL_SOURCE_REVISION_UNATTESTED',
    ci_checkout_sha:process.env.GITHUB_SHA||'LOCAL_CHECKOUT_UNATTESTED',
    provenance_note:'On pull_request, the CI checkout SHA may be a synthetic merge commit; use source_head_sha for PR source tracking.',
    build_type:'static research-only candidate',
    public_release:'HOLD',
    independently_verified_issuer_backing:false,
    physical_samsung_qa:false,
    owner_approval:false
  };
  await writeFile(resolve(destination,'evidence.json'),JSON.stringify(evidence,null,2)+'\n','utf8');
  return {destination,evidence};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await buildStandalone();
  process.stdout.write('RWA standalone static candidate built: '+result.destination+'\n');
}
