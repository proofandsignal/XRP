import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcilePayment, RLUSD_HEX } from '../src/reconcile.mjs';
const HASH = 'A'.repeat(64), LEDGER_HASH = 'B'.repeat(64);
const payer = 'rTestPayer', destination = 'rTestMerchant', issuer = 'rPinnedIssuer';
const intent = () => ({ network: 'xrpl:testnet', tx_hash: HASH, payer, destination, destination_tag: 19, asset: { currency: 'RLUSD', issuer }, amount: '10.500' });
const evidence = () => ({
  network: 'xrpl:testnet', validated: true, ledger_index: 12345, ledger_hash: LEDGER_HASH,
  tx: { TransactionType: 'Payment', hash: HASH, Account: payer, Destination: destination, DestinationTag: 19 },
  meta: { TransactionResult: 'tesSUCCESS', delivered_amount: { currency: RLUSD_HEX, issuer, value: '10.5' } }
});
const evaluate = (changeIntent = () => {}, changeEvidence = () => {}) => {
  const i = intent(), e = evidence(); changeIntent(i); changeEvidence(e); return reconcilePayment(i, e);
};
const check = (code, i, e) => assert.equal(evaluate(i, e).code, code);

test('exact RLUSD amount: hexadecimal issuer currency and decimal equivalence', () => { const r = evaluate(); assert.equal(r.decision, 'PASS'); assert.equal(r.code, 'PAYMENT_MATCHED'); assert.equal(r.replay_check, 'NOT_PERFORMED'); });
test('exact XRP drops (not XRP float) matches', () => check('PAYMENT_MATCHED', i => { i.asset = { currency: 'XRP' }; i.amount = '1000'; }, e => { e.meta.delivered_amount = '1000'; }));
test('underpayment blocks (even if requested tx.Amount was sufficient)', () => check('UNDERDELIVERED', () => {}, e => { e.tx.Amount = { currency: RLUSD_HEX, issuer, value: '10.5' }; e.meta.delivered_amount.value = '10.499'; }));
test('overpayment is review not automatic paid', () => check('OVERDELIVERED_REQUIRES_REVIEW', () => {}, e => { e.meta.delivered_amount.value = '10.501'; }));
test('wrong issuer blocks', () => check('ASSET_OR_ISSUER_MISMATCH', () => {}, e => { e.meta.delivered_amount.issuer = 'rWrongIssuer'; }));
test('wrong currency blocks', () => check('ASSET_OR_ISSUER_MISMATCH', () => {}, e => { e.meta.delivered_amount.currency = 'USD'; }));
test('wrong destination blocks', () => check('DESTINATION_MISMATCH', () => {}, e => { e.tx.Destination = 'rWrong'; }));
test('missing destination tag blocks', () => check('DESTINATION_TAG_MISMATCH', () => {}, e => { delete e.tx.DestinationTag; }));
test('wrong payer blocks', () => check('PAYER_MISMATCH', () => {}, e => { e.tx.Account = 'rWrong'; }));
test('different network blocks, even with same tx hash', () => check('NETWORK_MISMATCH', () => {}, e => { e.network = 'xrpl:mainnet'; }));
test('unvalidated evidence is review', () => check('VALIDATION_NOT_CONFIRMED', () => {}, e => { e.validated = false; }));
test('failed transaction blocks', () => check('TX_NOT_SUCCESS', () => {}, e => { e.meta.TransactionResult = 'tecNO_DST'; }));
test('missing delivered_amount is unknown, no amount fallback', () => check('DELIVERED_AMOUNT_UNKNOWN', () => {}, e => { e.tx.Amount = '1000000'; delete e.meta.delivered_amount; }));
test('missing ledger proof is review', () => check('LEDGER_ANCHOR_INCOMPLETE', () => {}, e => { e.ledger_hash = null; }));
test('missing intent tx binding is review', () => check('INTENT_TRANSACTION_UNBOUND', i => { delete i.tx_hash; }));
test('different hash blocks', () => check('TRANSACTION_HASH_MISMATCH', () => {}, e => { e.tx.hash = 'C'.repeat(64); }));
test('reject unsupported asset without treating as good', () => check('ASSET_UNSUPPORTED_BY_LAB', i => { i.asset.currency = 'USDC'; }));
test('decimal parser rejects exponent to avoid ambiguous precision', () => check('AMOUNT_INVALID_OR_UNKNOWN', i => { i.amount = '1.05e1'; }));
test('enormous decimal amounts compared exactly without floating point', () => check('PAYMENT_MATCHED', i => { i.amount = '123456789123456789123456789.123456789123456789'; }, e => { e.meta.delivered_amount.value = '123456789123456789123456789.1234567891234567890'; }));
test('no issuer pin = REVIEW', () => check('ISSUER_NOT_PINNED', i => { delete i.asset.issuer; }));
