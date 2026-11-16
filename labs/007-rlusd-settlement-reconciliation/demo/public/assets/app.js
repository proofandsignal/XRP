(() => {
  'use strict';
  const buttons = document.querySelector('#scenario-buttons');
  const decision = document.querySelector('#decision');
  const code = document.querySelector('#code-badge');
  const description = document.querySelector('#decision-description');
  const asset = document.querySelector('#asset');
  const expected = document.querySelector('#expected');
  const delivered = document.querySelector('#delivered');
  const trace = document.querySelector('#trace');
  const caseId = document.querySelector('#scenario-id');
  const copy = document.querySelector('#copy-evidence');
  const explore = document.querySelector('#explore');
  let traceText = '';
  let active = '';

  function resultLabel(out) {
    if (out === 'PASS') return 'FIELDS MATCH';
    if (out === 'REVIEW') return 'REVIEW';
    if (out === 'BLOCK') return 'BLOCK';
    return 'UNKNOWN';
  }
  async function loadCase(id) {
    if (!/^[a-z]+$/.test(id)) return;
    decision.className = 'decision';
    decision.textContent = 'CHECKING';
    code.textContent = 'SIMULATED';
    try {
      const response = await fetch('/api/scenario/' + encodeURIComponent(id), {cache:'no-store', credentials:'same-origin'});
      if (!response.ok) throw new Error('Unable to retrieve synthetic case');
      const data = await response.json();
      if (!data.synthetic || data.provenance !== 'FICTIONAL_FIXTURE_NOT_AUTHENTIC_LEDGER_DATA') throw new Error('Unexpected provenance');
      active = id;
      buttons.querySelectorAll('button').forEach(b => {
        const isActive = b.dataset.scenario === id;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });
      const out = data.result || {};
      const state = ['PASS','REVIEW','BLOCK'].includes(out.decision) ? out.decision : 'REVIEW';
      decision.textContent = resultLabel(state);
      decision.className = 'decision ' + state.toLowerCase();
      code.textContent = typeof out.code === 'string' ? out.code : 'UNKNOWN';
      description.textContent = data.note + ' Outcome is based on synthetic, caller-supplied evidence only.';
      caseId.textContent = 'CASE / ' + id.toUpperCase();
      asset.textContent = data.intent.asset.currency + ' / TESTNET';
      expected.textContent = data.intent.amount + (data.intent.asset.currency === 'RLUSD' ? ' RLUSD' : ' drops');
      const d = data.evidence.meta.delivered_amount;
      delivered.textContent = d == null ? 'UNKNOWN' : (typeof d === 'string' ? d : d.value);
      traceText = JSON.stringify(data, null, 2);
      trace.textContent = traceText;
      copy.textContent = 'Copy JSON ⧉';
    } catch {
      decision.textContent = 'UNAVAILABLE';
      code.textContent = 'NO EVIDENCE';
      description.textContent = 'Scenario could not be loaded. No verified settlement claim can be made.';
      trace.textContent = 'Error loading synthetic evidence.';
      traceText = '';
    }
  }
  async function init() {
    try {
      const response = await fetch('/api/scenarios', {cache:'no-store', credentials:'same-origin'});
      if (!response.ok) throw new Error('No scenarios');
      const data = await response.json();
      if (!data.synthetic || !Array.isArray(data.scenarios)) throw new Error('Invalid scenarios');
      buttons.replaceChildren();
      for (const item of data.scenarios) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.scenario = item.id;
        button.textContent = item.title;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => loadCase(item.id));
        buttons.append(button);
      }
      if (data.scenarios.length) await loadCase(data.scenarios[0].id);
    } catch {
      buttons.textContent = 'Synthetic scenario service unavailable. No live data is connected.';
    }
  }
  explore.addEventListener('click', () => document.querySelector('#workspace').scrollIntoView({behavior:'smooth', block:'start'}));
  copy.addEventListener('click', async () => {
    if (!traceText) return;
    try {
      await navigator.clipboard.writeText(traceText);
      copy.textContent = 'Copied ✓';
    } catch {
      copy.textContent = 'Copy unavailable';
    }
  });
  init();
})();
