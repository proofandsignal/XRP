import http from "node:http"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { scanAccount, scanAmm, buildPassport } from "./lib/runtime.mjs"

const here=dirname(fileURLToPath(import.meta.url)); const port=Number(process.env.PORT??8787)
function send(res,status,body,type="application/json; charset=utf-8"){res.writeHead(status,{"content-type":type,"cache-control":"no-store"});res.end(body)}
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,`http://${req.headers.host??"localhost"}`);if(u.pathname==="/api/health")return send(res,200,JSON.stringify({ok:true,version:"0.8.0",build:"BUILD-008"}));if(u.pathname==="/api/account"){const account=u.searchParams.get("account");if(!account)return send(res,400,JSON.stringify({error:"Missing account"}));const report=await scanAccount(account,{network:u.searchParams.get("network")??"mainnet"});return send(res,200,JSON.stringify({report,passport:buildPassport(report)}))}if(u.pathname==="/api/amm"){const amm=u.searchParams.get("amm_account");if(!amm)return send(res,400,JSON.stringify({error:"Missing amm_account"}));const report=await scanAmm(amm,{network:u.searchParams.get("network")??"mainnet"});return send(res,200,JSON.stringify({report,passport:buildPassport(report)}))}if(u.pathname==="/"||u.pathname==="/index.html")return send(res,200,await readFile(join(here,"public","index.html"),"utf8"),"text/html; charset=utf-8");return send(res,404,JSON.stringify({error:"Not found"}))}catch(e){return send(res,500,JSON.stringify({error:e?.message??String(e),name:e?.name??"Error"}))}})
server.listen(port,()=>console.log(`XRPL Intelligence Screen v0.8 http://localhost:${port}`))
