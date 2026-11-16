import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash, timingSafeEqual } from 'node:crypto';
import { reconcilePayment, RLUSD_HEX } from '../src/reconcile.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), 'public');
const username = process.env.DEMO_USER;
const password = process.env.DEMO_PASSWORD;
const port = Number(process.env.PORT || 10000);
if (!username || !password || password.length < 20) {
  throw new Error('Protected demo requires DEMO_USER and strong DEMO_PASSWORD environment variables');
}
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');

const digest = value => createHash('sha256').update(value).digest();
const expectedAuth = digest('Basic ' + Buffer.from(username + ':' + password).toString('base64'));
const hasAuth = value => {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('Basic ')) return false;
  return timingSafeEqual(digest(value), expectedAuth);
};
const headers = {
  'Cache-Control': 'no-store, private, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; font-src 'self'"
};
function respond(res, status, body, type='text/plain; charset=utf-8', extra={}) {
  res.writeHead(status, { ...headers, 'Content-Type': type, ...extra });
  res.end(body);
}
function json(res, status, data) {
  respond(res, status, JSON.stringify(data), 'application/json; charset=utf-8');
}
const HASH = 'A'.repeat(64), LEDGER = 'B'.repeat(64);
function fixture() {
  const issuer = 'rSYNTHETIC_ISSUER_NOT_REAL';
  return {
    intent: {
      network: 'xrpl:testnet', tx_hash: HASH,
      payer: 'rSYNTHETIC_PAYER_NOT_REAL',
      destination: 'rSYNTHETIC_MERCHANT_NOT_REAL',
      destination_tag: 19,
      asset: { currency: 'RLUSD', issuer },
      amount: '10.50'
    },
    evidence: {
      network: 'xrpl:testnet', validated: true, ledger_index: 12345, ledger_hash: LEDGER,
      tx: {
        TransactionType: 'Payment', hash: HASH,
        Account: 'rSYNTHETIC_PAYER_NOT_REAL',
        Destination: 'rSYNTHETIC_MERCHANT_NOT_REAL',
        DestinationTag: 19
      },
      meta: { TransactionResult: 'tesSUCCESS', delivered_amount: {
        currency: RLUSD_HEX, issuer, value: '10.50'
      } }
    }
  };
}
const scenarios = {
  matched: {
    title:'Exact match', note:'All submitted synthetic fields match the intent. This is not verified ledger settlement.',
    mutate: () => {}
  },
  zero: {
    title:'Zero-value intent', note:'A zero-value payment must never count as a paid invoice.',
    mutate: x => { x.intent.amount = '0'; x.evidence.meta.delivered_amount.value = '0'; }
  },
  under: {
    title:'Under-delivery', note:'A successful transaction can deliver less than the requested amount.',
    mutate: x => { x.evidence.meta.delivered_amount.value = '9.99'; }
  },
  issuer: {
    title:'Wrong issuer', note:'A lookalike currency is not the pinned RLUSD asset.',
    mutate: x => { x.evidence.meta.delivered_amount.issuer = 'rSYNTHETIC_WRONG_ISSUER'; }
  },
  unvalidated: {
    title:'Unvalidated status', note:'A pending or unverified ledger status must not be counted as final.',
    mutate: x => { x.evidence.validated = false; }
  },
  missing: {
    title:'Missing delivered amount', note:'The requested Amount does not substitute for delivered_amount.',
    mutate: x => { delete x.evidence.meta.delivered_amount; }
  },
  network: {
    title:'Network mismatch', note:'Mainnet evidence cannot satisfy a pinned Testnet intent.',
    mutate: x => { x.evidence.network = 'xrpl:mainnet'; }
  }
};
const routeFiles = Object.freeze({
  '/':'index.html', '/assets/style.css':'assets/style.css',
  '/assets/app.js':'assets/app.js', '/favicon.svg':'favicon.svg'
});
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml' };
function fileType(path) {
  return mime[path.substring(path.lastIndexOf('.'))] || 'application/octet-stream';
}

http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return respond(res, 405, 'Method Not Allowed', 'text/plain; charset=utf-8', {Allow:'GET, HEAD'});
  const uri = new URL(req.url || '/', 'http://localhost');
  const path = uri.pathname;
  if (path === '/healthz') return respond(res, 200, 'ok');
  if (!hasAuth(req.headers.authorization)) return respond(res, 401, 'Authentication required', 'text/plain; charset=utf-8', {'WWW-Authenticate':'Basic realm="Proof and Signal Demo", charset="UTF-8"'});
  if (path === '/api/scenarios') {
    return json(res, 200, {
      synthetic:true, read_only:true,
      scenarios:Object.entries(scenarios).map(([id, item]) => ({id, title:item.title, note:item.note}))
    });
  }
  if (path.startsWith('/api/scenario/')) {
    const id = path.substring('/api/scenario/'.length);
    if (!Object.hasOwn(scenarios, id)) return json(res, 404, {error:'Unknown synthetic scenario'});
    const f = fixture();
    scenarios[id].mutate(f);
    return json(res, 200, {
      id, title:scenarios[id].title, note:scenarios[id].note,
      synthetic:true, provenance:'FICTIONAL_FIXTURE_NOT_AUTHENTIC_LEDGER_DATA',
      intent:f.intent, evidence:f.evidence,
      result:reconcilePayment(f.intent, f.evidence)
    });
  }
  const target = routeFiles[path];
  if (!target) return respond(res, 404, 'Not found');
  try {
    const data = await readFile(join(root, target));
    return respond(res, 200, data, fileType(target));
  } catch {
    return respond(res, 503, 'Demo asset unavailable');
  }
}).listen(port, '0.0.0.0', () => {
  console.log('Protected synthetic LAB-007 preview running on PORT ' + port);
});
