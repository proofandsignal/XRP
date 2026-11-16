/**
 * Deterministic, read-only XRPL payment reconciliation against a caller-supplied
 * validated-ledger evidence envelope. No signing, RPC access or custody.
 * IMPORTANT: the caller must independently authenticate the RPC/evidence source.
 */
export const RLUSD_HEX = '524C555344000000000000000000000000000000';

function currency(value) {
  if (value === 'RLUSD' || value === RLUSD_HEX) return 'RLUSD';
  return value;
}
function compareDecimal(left, right) {
  const re = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
  if (typeof left !== 'string' || typeof right !== 'string' || !re.test(left) || !re.test(right)) return null;
  const [li, lf = ''] = left.split('.');
  const [ri, rf = ''] = right.split('.');
  const scale = Math.max(lf.length, rf.length);
  const l = BigInt(li + lf.padEnd(scale, '0'));
  const r = BigInt(ri + rf.padEnd(scale, '0'));
  return l === r ? 0 : l > r ? 1 : -1;
}
function isHash(x) { return typeof x === 'string' && /^[a-fA-F0-9]{64}$/.test(x); }
function isTag(x) { return Number.isInteger(x) && x >= 0 && x <= 0xFFFFFFFF; }

export function reconcilePayment(intent, evidence) {
  const findings = [];
  const result = (decision, code, details = {}) => ({
    decision, code, findings: [...findings, code],
    scope: 'VALIDATED_LEDGER_PAYMENT_MATCH_ONLY',
    limitations: [
      'Caller must independently authenticate source, validated ledger and transaction evidence.',
      'This is not proof of invoice discharge, no replay, regulatory status, or off-chain reserve sufficiency.'
    ], ...details
  });
  if (!intent || typeof intent !== 'object' || !evidence || typeof evidence !== 'object') return result('REVIEW', 'MISSING_INPUT');
  if (!['xrpl:testnet', 'xrpl:mainnet', 'xrpl:devnet'].includes(intent.network)) return result('REVIEW', 'INTENT_NETWORK_UNKNOWN');
  if (evidence.network == null || evidence.network === '') return result('REVIEW', 'EVIDENCE_NETWORK_UNKNOWN');
  if (evidence.network !== intent.network) return result('BLOCK', 'NETWORK_MISMATCH');
  if (evidence.validated !== true) return result('REVIEW', 'VALIDATION_NOT_CONFIRMED');
  if (!Number.isSafeInteger(evidence.ledger_index) || evidence.ledger_index <= 0 || !isHash(evidence.ledger_hash)) {
    return result('REVIEW', 'LEDGER_ANCHOR_INCOMPLETE');
  }
  const tx = evidence.tx, meta = evidence.meta;
  if (!tx || !meta || typeof tx !== 'object' || typeof meta !== 'object') return result('REVIEW', 'TX_OR_META_MISSING');
  if (tx.TransactionType !== 'Payment') return result('BLOCK', 'NOT_A_PAYMENT');
  if (!isHash(tx.hash)) return result('REVIEW', 'TRANSACTION_HASH_MISSING');
  if (!isHash(intent.tx_hash)) return result('REVIEW', 'INTENT_TRANSACTION_UNBOUND');
  if (tx.hash.toUpperCase() !== intent.tx_hash.toUpperCase()) return result('BLOCK', 'TRANSACTION_HASH_MISMATCH');
  if (meta.TransactionResult !== 'tesSUCCESS') {
    return meta.TransactionResult == null ? result('REVIEW', 'TX_RESULT_UNKNOWN') : result('BLOCK', 'TX_NOT_SUCCESS');
  }
  if (typeof intent.destination !== 'string' || !intent.destination) return result('REVIEW', 'INTENT_DESTINATION_MISSING');
  if (tx.Destination !== intent.destination) return result('BLOCK', 'DESTINATION_MISMATCH');
  if (typeof intent.payer !== 'string' || !intent.payer) return result('REVIEW', 'INTENT_PAYER_MISSING');
  if (tx.Account !== intent.payer) return result('BLOCK', 'PAYER_MISMATCH');
  const expectedTag = intent.destination_tag;
  const deliveredTag = tx.DestinationTag;
  if (expectedTag !== undefined && !isTag(expectedTag)) return result('REVIEW', 'INTENT_DESTINATION_TAG_INVALID');
  if (deliveredTag !== undefined && !isTag(deliveredTag)) return result('REVIEW', 'TRANSACTION_TAG_INVALID');
  if (expectedTag !== deliveredTag) return result('BLOCK', 'DESTINATION_TAG_MISMATCH');

  // Never infer delivered_amount from tx.Amount: a Payment can be partial.
  const delivered = meta.delivered_amount;
  if (delivered === undefined || delivered === 'unavailable' || delivered === null) return result('REVIEW', 'DELIVERED_AMOUNT_UNKNOWN');
  if (!intent.asset || typeof intent.asset !== 'object') return result('REVIEW', 'INTENT_ASSET_MISSING');
  const expectedCurrency = currency(intent.asset.currency);
  const expectedAmount = intent.amount;
  if (expectedCurrency === 'XRP') {
    if (intent.asset.issuer != null) return result('REVIEW', 'XRP_INTENT_HAS_ISSUER');
    if (typeof delivered !== 'string') return result('BLOCK', 'ASSET_MISMATCH');
    if (!/^(?:0|[1-9]\d*)$/.test(expectedAmount ?? '') || !/^(?:0|[1-9]\d*)$/.test(delivered)) {
      return result('REVIEW', 'INVALID_XRP_DROPS');
    }
  } else {
    if (expectedCurrency !== 'RLUSD') return result('REVIEW', 'ASSET_UNSUPPORTED_BY_LAB');
    if (typeof intent.asset.issuer !== 'string' || !intent.asset.issuer) return result('REVIEW', 'ISSUER_NOT_PINNED');
    if (!delivered || typeof delivered !== 'object') return result('BLOCK', 'ASSET_MISMATCH');
    if (currency(delivered.currency) !== 'RLUSD' || delivered.issuer !== intent.asset.issuer) return result('BLOCK', 'ASSET_OR_ISSUER_MISMATCH');
  }
  const observedAmount = typeof delivered === 'string' ? delivered : delivered.value;
  const diff = compareDecimal(observedAmount, expectedAmount);
  if (diff == null) return result('REVIEW', 'AMOUNT_INVALID_OR_UNKNOWN');
  // A zero-value intent is not a successful commercial payment, even if it matches
  // the supplied metadata. Do not let 0 XRP drops or 0 RLUSD become PAYMENT_MATCHED.
  if (compareDecimal(expectedAmount, '0') === 0) return result('REVIEW', 'NON_POSITIVE_INTENT_AMOUNT');
  if (diff < 0) return result('BLOCK', 'UNDERDELIVERED', { observed_amount: observedAmount, expected_amount: expectedAmount });
  if (diff > 0) return result('REVIEW', 'OVERDELIVERED_REQUIRES_REVIEW', { observed_amount: observedAmount, expected_amount: expectedAmount });
  return result('PASS', 'PAYMENT_MATCHED', {
    network: evidence.network,
    transaction_hash: tx.hash.toUpperCase(),
    ledger_index: evidence.ledger_index,
    ledger_hash: evidence.ledger_hash.toUpperCase(),
    observed_amount: observedAmount,
    expected_amount: expectedAmount,
    asset: { currency: expectedCurrency, ...(expectedCurrency === 'RLUSD' ? { issuer: intent.asset.issuer } : {}) },
    replay_check: 'NOT_PERFORMED',
    verified_ledger_source: 'EXTERNAL_CALLER_RESPONSIBILITY'
  });
}
