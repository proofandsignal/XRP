import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const directory=dirname(fileURLToPath(import.meta.url));
const allowed=new Set(['index.html','rlusd.html','rwa.html','defi-guard.html']);
const enc=new TextEncoder();

function sameSecret(given,expected){
  const a=enc.encode(given),b=enc.encode(expected);
  return a.length===b.length && timingSafeEqual(a,b);
}
function authorized(request,username,password){
  const raw=request.headers.authorization;
  if(typeof raw!=='string'||!raw.startsWith('Basic ')||raw.length>1500)return false;
  const encoded=raw.slice(6);
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))return false;
  const decoded=Buffer.from(encoded,'base64').toString('utf8');
  return sameSecret(decoded,username+':'+password);
}
function contentPolicy(html){
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const hashes=scripts.map(m=>"'sha256-"+createHash('sha256').update(m[1],'utf8').digest('base64')+"'");
  return "default-src 'none'; script-src "+(hashes.join(' ')||"'none'")+"; style-src 'unsafe-inline'; img-src 'self'; font-src 'none'; connect-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests";
}
export function protectedPreview({ username, password }){
  if(!username||!password||password.length<24)throw Error('Missing secure preview credentials');
  return createServer(async(request,response)=>{
    response.setHeader('Cache-Control','private, no-store, max-age=0');
    response.setHeader('Pragma','no-cache');
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('X-Frame-Options','DENY');
    response.setHeader('Referrer-Policy','no-referrer');
    response.setHeader('Cross-Origin-Resource-Policy','same-origin');
    response.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()');
    response.setHeader('Strict-Transport-Security','max-age=31536000');
    if(!authorized(request,username,password)){
      response.writeHead(401,{'Content-Type':'text/plain; charset=utf-8','WWW-Authenticate':'Basic realm="Proof & Signal QA Preview", charset="UTF-8"'});
      response.end('Authentication required');return;
    }
    if(request.method!=='GET'&&request.method!=='HEAD'){
      response.writeHead(405,{'Allow':'GET, HEAD','Content-Type':'text/plain; charset=utf-8'});
      response.end('Method not allowed');return;
    }
    let pathname;
    try{pathname=new URL(request.url||'/', 'http://preview.local').pathname;}catch{response.writeHead(400);response.end();return;}
    const name=pathname==='/'?'index.html':pathname.slice(1);
    if(!allowed.has(name)||name.includes('/')||name.includes('\\')){
      response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('Not found');return;
    }
    try{
      const page=await readFile(join(directory,name),'utf8');
      response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':contentPolicy(page)});
      response.end(request.method==='HEAD'?'':page);
    }catch{
      response.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});
      response.end('Preview unavailable');
    }
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||10000);
  const app=protectedPreview({username:process.env.PREVIEW_USER,password:process.env.PREVIEW_PASSWORD});
  app.listen(port,'0.0.0.0',()=>process.stdout.write('Protected preview listening\n'));
}
