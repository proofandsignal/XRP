import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const directory=dirname(fileURLToPath(import.meta.url));
const allowed=new Set(['index.html','rlusd.html','rwa.html','defi-guard.html']);


function sameSecret(given,expected){
  // Equal-length digests avoid exposing the length of a supplied credential.
  const a=createHash('sha256').update(given).digest();
  const b=createHash('sha256').update(expected).digest();
  return timingSafeEqual(a,b);
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
  const hash=content=>"'sha256-"+createHash('sha256').update(content,'utf8').digest('base64')+"'";
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>hash(m[1]));
  const styles=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>hash(m[1]));
  return [
    "default-src 'none'",
    "script-src "+(scripts.join(' ')||"'none'"),
    "style-src "+(styles.join(' ')||"'none'"),
    "style-src-attr 'none'",
    "img-src 'self'", "font-src 'none'", "connect-src 'none'",
    "frame-ancestors 'none'", "object-src 'none'", "base-uri 'none'",
    "form-action 'none'", "upgrade-insecure-requests"
  ].join('; ');
}
export function protectedPreview({ username, password, readPage=readFile, rwaOnly=false }){
  if(!username||!password||password.length<24)throw Error('Missing secure preview credentials');
  // Injectable read-only loader lets the test deterministically exercise HTTP 500.
  if(typeof readPage!=='function')throw TypeError('Invalid preview page loader');
  // Bounded failed-attempt throttling; never trust spoofable X-Forwarded-For.
  // Valid credentials are always accepted to avoid locking out reviewers
  // who share a reverse-proxy socket with failed attempts.
  const failed=new Map();
  const windowMs=60_000;
  const maxFailures=12;
  function throttle(socketAddress){
    const address=socketAddress||'unknown';
    const now=Date.now();
    let entry=failed.get(address);
    if(!entry||now-entry.start>=windowMs)entry={start:now,count:0};
    entry.count++;
    failed.delete(address);failed.set(address,entry);
    if(failed.size>256){
      for(const [key,value] of failed)if(now-value.start>=windowMs)failed.delete(key);
      while(failed.size>256)failed.delete(failed.keys().next().value);
    }
    return entry.count>maxFailures?Math.max(1,Math.ceil((windowMs-(now-entry.start))/1000)):0;
  }
  return createServer(async(request,response)=>{
    response.setHeader('Cache-Control','private, no-store, max-age=0');
    response.setHeader('Pragma','no-cache');
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('X-Frame-Options','DENY');
    response.setHeader('Referrer-Policy','no-referrer');
    response.setHeader('Cross-Origin-Resource-Policy','same-origin');
    response.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()');
    response.setHeader('Strict-Transport-Security','max-age=31536000');
    response.setHeader('Content-Security-Policy',"default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; object-src 'none'");
    if(!authorized(request,username,password)){
      const retryAfter=throttle(request.socket.remoteAddress);
      if(retryAfter){
        response.writeHead(429,{'Content-Type':'text/plain; charset=utf-8','Retry-After':String(retryAfter)});
        response.end('Too many attempts');return;
      }
      response.writeHead(401,{'Content-Type':'text/plain; charset=utf-8','WWW-Authenticate':'Basic realm="Proof & Signal QA Preview", charset="UTF-8"'});
      response.end('Authentication required');return;
    }
    if(request.method!=='GET'&&request.method!=='HEAD'){
      response.writeHead(405,{'Allow':'GET, HEAD','Content-Type':'text/plain; charset=utf-8'});
      response.end('Method not allowed');return;
    }
    let pathname;
    try{pathname=new URL(request.url||'/', 'http://preview.local').pathname;}catch{response.writeHead(400);response.end();return;}
    // Require a canonical, literal allowlisted route. URL() normalizes dot segments,
    // so check the raw target before trusting its normalized pathname.
    const rawPath=(request.url||'/').split(/[?#]/,1)[0];
    const name=pathname==='/'?(rwaOnly?'rwa.html':'index.html'):pathname.slice(1);
    if(rawPath!==pathname||!rawPath.startsWith('/')||!allowed.has(name)||name.includes('/')||name.includes('\\')||(rwaOnly&&name!=='rwa.html')){
      response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('Not found');return;
    }
    try{
      const page=await readPage(join(directory,name),'utf8');
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
