import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const home=dirname(fileURLToPath(import.meta.url));
const source=resolve(home,'../boost-nine/rwa.html');
const output=resolve(home,'../../dist/rwa-passport');

export async function buildStandalone({destination=output}={}){
  const html=await readFile(source,'utf8');
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
  await mkdir(destination,{recursive:true});
  await writeFile(resolve(destination,'index.html'),html,'utf8');
  await writeFile(resolve(destination,'robots.txt'),'User-agent: *\nDisallow: /\n','utf8');
  const evidence={
    product:'XRPL RWA Risk Passport',
    source:'preview/boost-nine/rwa.html',
    html_sha256:createHash('sha256').update(html).digest('hex'),
    commit:process.env.GITHUB_SHA||'LOCAL_BUILD_NOT_ATTESTED',
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
