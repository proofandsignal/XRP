# LAB-007 protected synthetic demo — release candidate

**Target:** Premium English interactive synthetic-only preview of XRP/RLUSD payment reconciliation. Own Proof & Signal logo upper left, functional Explore and seven predefined failure scenarios. No signing, real funds, wallet connections, live RPC, invoice settlement or data submission.

## Deployment guardrails
- Isolated Render FREE web service, Auto-Deploy OFF, pinned demo branch, not main. No paid APIs, production DB or production merge.
- DEMO_USER and strong DEMO_PASSWORD (20+ chars) must be secret Render environment variables; never commit them. Server fails closed if absent.
- HTTPS via Render, app-level Basic auth, CSP self-only, no-store, X-Frame-Options DENY and strict route allowlist. Health check /healthz unprotected and returns only the word ok.
- Preset fictional fixtures generated server-side, not user-supplied financial data; zero real transactions. No external calls.
- Synthetic PASS = matching *supplied* fields, NOT proof of settlement. UI labels FIELDS MATCH and warns that ledger data is fictional.

## Seven synthetic scenarios
1. Exact fields match => PASS (not financial verification).
2. Zero-value RLUSD intent => REVIEW.
3. Under-delivery => BLOCK.
4. Wrong issuer => BLOCK.
5. Unvalidated ledger => REVIEW.
6. Missing delivered_amount => REVIEW.
7. Network mismatch => BLOCK.

## Demo QA acceptance
- GitHub CI on exact demo head: npm run demo:check and npm test pass (including protected-server integration checks).
- Manual HTTPS/desktop browser: authenticated sign-in; Explore scroll; all seven buttons; accurate labels; JSON evidence; Copy JSON; unauthorized route returns 401; unknown path 404; security headers.
- Premium UI English; distinctive logo top left; Created by Proof & Signal; synthetic disclaimer above fold; no misleading real-time language; no tracking or untrusted outbound content.
- Browser QA is NOT established by a successful HTTP response or Node integration tests alone.
- **Physical Samsung test:** owner opens preview on device, authenticates, taps Explore, changes zero/issuer/under-delivery cases, checks JSON copy, layout and scroll.
- **Human Approval:** explicit owner go/no-go before any public or external sharing.

## Post-demo Lead-001, not pre-demo blocker
Per owner instruction 2026-11-16, #34 is the first external lead/technical feedback opportunity AFTER the owner-approved synthetic demo, not an independent pre-demo Security/Financial approval. Lead feedback is not automatically an audit.

## Production exclusion
Real funds, x402 execution, production/merge and verified live settlement claims stay BLOCKED until appropriate independent Security/Financial/Legal/IP assurance, authenticated XRPL evidence, replay/idempotency controls and separate authorization.

NO NEW EVIDENCE => NO GATE CHANGE.

Parent: #32. Engine Draft PR: #33.
