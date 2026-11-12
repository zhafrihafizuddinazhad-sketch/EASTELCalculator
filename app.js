(() => {
  const PACKAGES = [35, 50, 68, 98];
  const RATES = [0.13, 0.03, 0.08];
  const STARTER_BONUS = [128, 38, 28];
  const DEFAULTS = { duplication: 10, price: 98, overrides: [false, false, false], drafts: ['', '', ''] };
  let state = structuredClone(DEFAULTS);
  let starterDuplication = 10;
  let starterOverrides = [false, false, false];
  let starterDrafts = ['', '', ''];
  const $ = (selector) => document.querySelector(selector);
  const money = (value) => `RM${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const number = (value) => value === null || value === undefined || value === '' ? '—' : Math.floor(value).toLocaleString('en-MY');
  const projection = (duplication) => [1, 2, 3].map((tier) => duplication ** tier);
  const commission = (price, rate, members) => price * rate * members;
  const total = (values) => values.reduce((sum, value) => sum + value, 0);
  const actualValue = (value) => {
    if (value === '') return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : null;
  };
  const projections = () => state.duplication === null ? [null, null, null] : projection(state.duplication);
  const validActuals = () => projections().map((projected, index) => projected === null ? null : state.overrides[index] ? actualValue(state.drafts[index]) : projected);
  const canCalculate = () => state.duplication !== null && state.price !== null;

  function renderProjection() {
    const values = projections();
    $('#projection-cards').innerHTML = values.map((count, index) => `<article class="tier-card network-tier-${index + 1}"><div class="tier-overline">TIER 0${index + 1}</div><div class="tier-count">${number(count)}</div><div class="tier-growth">${count === null ? 'Enter duplication to see this tier' : index === 0 ? `<b>${state.duplication}</b> direct members` : `<b>${state.duplication}×</b> the previous tier`}</div></article>`).join('');
    $('#projected-total').textContent = state.duplication === null ? 'Enter duplication to see total members' : `${number(total(values))} members in total`;
  }
  function renderPackages() {
    $('#packages').innerHTML = PACKAGES.map((price) => `<button type="button" role="radio" aria-checked="${state.price === price}" class="package-option ${state.price === price ? 'selected' : ''}" data-price="${price}"><span class="package-name">Package ${PACKAGES.indexOf(price) + 1}</span><span class="package-price">RM${price}</span>${state.price === price ? '<span class="package-tick" aria-hidden="true">✓</span>' : ''}</button>`).join('');
  }
  function renderCommissions() {
    const projected = projections();
    const valid = validActuals();
    $('#commission-cards').innerHTML = RATES.map((rate, i) => {
      const amount = !canCalculate() || valid[i] === null ? null : commission(state.price, rate, valid[i]);
      const editing = state.overrides[i];
      const memberControl = projected[i] === null
        ? '<span class="waiting-tag">Enter duplication first</span>'
        : editing
        ? `<div class="member-input-row"><label class="member-editor"><input type="text" pattern="[0-9]*" maxlength="4" inputmode="numeric" autocomplete="off" aria-label="Actual members in tier ${i + 1}" aria-describedby="tier-error-${i}" value="${state.drafts[i]}" class="${valid[i] === null ? 'invalid' : ''}" data-tier="${i}" /><span>people</span></label><button class="use-projection" type="button" data-use-projection="${i}">Use projection</button></div>`
        : `<div class="member-display"><strong>${number(valid[i])} <small>people</small></strong><span class="following-tag">Following projection</span><button class="adjust-button" type="button" data-adjust-tier="${i}">Adjust</button></div>`;
      const projectionLabel = projected[i] === null ? 'PERFECT DUPLICATION · — MEMBERS' : `PERFECT DUPLICATION · ${number(projected[i])} MEMBERS`;
      const formula = !canCalculate() ? 'Select duplication and a package to calculate.' : valid[i] === null ? 'Enter a valid actual member count.' : `RM${state.price} × ${rate * 100}% × ${number(valid[i])}`;
      return `<article class="commission-card tier-accent-${i + 1}"><div class="commission-top"><span class="tier-overline">TIER 0${i + 1}</span><span class="rate">${rate * 100}%</span></div><div class="commission-meta"><span>TOP-UP PACKAGE</span><strong>${state.price === null ? 'Not selected' : `RM${state.price}`}</strong><span class="projection-label">${projectionLabel}</span></div><div class="actual-control"><div class="actual-control-title"><span>YOUR ACTUAL MEMBERS</span>${editing ? '<span class="editing-tag">EDITING</span>' : ''}</div>${memberControl}<div id="tier-error-${i}" class="tier-error" aria-live="polite">${editing && valid[i] === null ? 'Enter a whole number from 1 to 1,000.' : ''}</div></div><div class="formula"><span>Commission calculation</span><span data-tier-formula="${i}">${formula}</span></div><div class="commission-result"><span>Tier commission</span><strong data-tier-amount="${i}">${amount === null ? '—' : money(amount)}</strong></div></article>`;
    }).join('');
    renderActualTotal(valid);
  }
  function renderActualTotal(valid = validActuals()) {
    const invalid = valid.some((value, i) => state.overrides[i] && value === null);
    const actualTotal = !canCalculate() || invalid ? null : total(valid.map((value, i) => commission(state.price, RATES[i], value)));
    const totalLabel = state.duplication === null ? 'ENTER DUPLICATION TO START' : state.price === null ? 'CHOOSE A TOP-UP PACKAGE TO SEE COMMISSION' : invalid ? 'CHECK THE HIGHLIGHTED MEMBER COUNTS' : 'TOTAL ACTUAL COMMISSION';
    $('#actual-total').innerHTML = `<span>${totalLabel}</span><strong>${actualTotal === null ? '—' : money(actualTotal)}</strong>`;
  }
  function renderComparison() {
    const projected = projections();
    const actual = validActuals();
    const perfectAmounts = projected.map((count, i) => !canCalculate() || count === null ? null : commission(state.price, RATES[i], count));
    const actualAmounts = actual.map((count, i) => !canCalculate() || count === null ? null : commission(state.price, RATES[i], count));
    const labels = ['Tier 1', 'Tier 2', 'Tier 3'];
    const headers = ['Tier', 'Rate', 'Perfect members', 'Actual members', 'Perfect commission', 'Actual commission'];
    $('#comparison-table').innerHTML = `<div class="table-head">${headers.map((h) => `<span>${h}</span>`).join('')}</div>` + labels.map((label, i) => `<div class="table-row"><span>${label}</span><span>${RATES[i] * 100}%</span><span>${number(projected[i])}</span><span>${actual[i] === null ? '—' : number(actual[i])}</span><span>${perfectAmounts[i] === null ? '—' : money(perfectAmounts[i])}</span><span>${actualAmounts[i] === null ? '—' : money(actualAmounts[i])}</span></div>`).join('');
    const projectedPeople = state.duplication === null ? null : total(projected);
    const actualPeople = state.duplication === null || actual.some((value) => value === null) ? null : total(actual);
    const perfectTotal = !canCalculate() ? null : total(perfectAmounts);
    const actualCommission = !canCalculate() || actualAmounts.some((value) => value === null) ? null : total(actualAmounts);
    const difference = actualCommission === null ? null : perfectTotal - actualCommission;
    const summaries = [['Projected members', projectedPeople === null ? '—' : number(projectedPeople)], ['Actual members', actualPeople === null ? '—' : number(actualPeople)], ['Perfect commission', perfectTotal === null ? '—' : money(perfectTotal)], ['Actual commission', actualCommission === null ? '—' : money(actualCommission)], ['Difference · perfect − actual', difference === null ? '—' : money(difference)]];
    $('#summary-grid').innerHTML = summaries.map(([label, value], i) => `<div class="summary-item ${i === 4 ? 'difference' : ''}"><span>${label}</span><strong>${value}</strong></div>`).join('');
  }
  function renderStarterKit() {
    const members = starterDuplication === null ? [null, null, null] : projection(starterDuplication);
    const actualMembers = members.map((projected, index) => projected === null ? null : starterOverrides[index] ? starterActualValue(starterDrafts[index]) : projected);
    $('#starter-projection-cards').innerHTML = members.map((count, index) => `<article class="starter-projection-card starter-accent-${index + 1}"><span>LEVEL 0${index + 1}</span><strong>${number(count)}</strong><small>${count === null ? 'Select duplication' : `${number(count)} members`}</small></article>`).join('');
    const projectedBonuses = members.map((count, index) => count === null ? null : count * STARTER_BONUS[index]);
    const actualBonuses = actualMembers.map((count, index) => count === null ? null : count * STARTER_BONUS[index]);
    $('#starter-commission-cards').innerHTML = STARTER_BONUS.map((rate, index) => {
      const editing = starterOverrides[index];
      const memberControl = members[index] === null
        ? '<span class="waiting-tag">Enter duplication first</span>'
        : editing
        ? `<div class="starter-member-input"><input type="text" pattern="[0-9]*" maxlength="10" inputmode="numeric" autocomplete="off" aria-label="Actual members in Starter Kit level ${index + 1}" aria-describedby="starter-tier-error-${index}" value="${starterDrafts[index]}" class="${actualMembers[index] === null ? 'invalid' : ''}" data-starter-tier="${index}" /><span>people</span><button type="button" data-starter-use-projection="${index}">Use projection</button></div>`
        : `<div class="starter-member-display"><strong>${number(actualMembers[index])} <small>people</small></strong><span class="starter-following ${editing ? 'adjusted' : ''}">${editing ? 'Adjusted' : 'Following projection'}</span><button type="button" data-starter-adjust-tier="${index}">Adjust</button></div>`;
      const formula = members[index] === null ? 'Set duplication to calculate.' : actualMembers[index] === null ? 'Enter a valid whole number of members.' : `RM${number(rate)} × ${number(actualMembers[index])} ${actualMembers[index] === 1 ? 'member' : 'members'}`;
      return `<article class="starter-commission-card starter-accent-${index + 1}"><div class="starter-level-label"><span>LEVEL 0${index + 1}</span><b>RM${number(rate)} <small>/ member</small></b></div><div class="starter-count"><span>Perfect duplication</span><strong>${number(members[index])}</strong></div><div class="starter-actual-control"><div class="starter-actual-label">ACTUAL MEMBERS${editing && members[index] !== null ? '<span>EDITING</span>' : ''}</div>${memberControl}<div class="starter-tier-error" id="starter-tier-error-${index}" aria-live="polite">${editing && members[index] !== null && actualMembers[index] === null ? 'Enter a whole number from 1 to 1,000,000,000.' : ''}</div></div><div class="starter-formula"><span>Calculation</span><span data-starter-formula="${index}">${formula}</span></div><div class="starter-result"><span>Level bonus</span><strong data-starter-amount="${index}">${actualBonuses[index] === null ? '—' : `RM${number(actualBonuses[index])}`}</strong></div></article>`;
    }).join('');
    renderStarterTotals(members, actualMembers);
    document.querySelectorAll('[data-starter-dup]').forEach((button) => button.classList.toggle('active', Number(button.dataset.starterDup) === starterDuplication));
    $('#starter-duplication').value = starterDuplication ?? '';
  }
  function renderStarterTotals(members, actualMembers) {
    const projectedBonuses = members.map((count, index) => count === null ? null : count * STARTER_BONUS[index]);
    const actualBonuses = actualMembers.map((count, index) => count === null ? null : count * STARTER_BONUS[index]);
    const projectedTotal = projectedBonuses.some((value) => value === null) ? null : total(projectedBonuses);
    const actualTotal = actualBonuses.some((value) => value === null) ? null : total(actualBonuses);
    $('#starter-total').innerHTML = `<div><span>TOTAL ACTUAL STARTER KIT BONUS</span><strong>${actualTotal === null ? '—' : `RM${number(actualTotal)}`}</strong></div><div class="starter-total-projected"><span>Perfect duplication</span><strong>${projectedTotal === null ? '—' : `RM${number(projectedTotal)}`}</strong></div>`;
    $('#starter-chip-caption').textContent = starterDuplication === null ? 'SET DUPLICATION TO SEE BONUS' : `YOUR BONUS AT DUPLICATION ${number(starterDuplication)}`;
    $('#starter-total-chip-value').textContent = actualTotal === null ? '—' : `RM${number(actualTotal)}`;
  }
  function starterActualValue(value) {
    if (value === '') return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1000000000 ? parsed : null;
  }
  function render() {
    renderProjection(); renderPackages(); renderCommissions(); renderComparison();
    document.querySelectorAll('[data-dup]').forEach((button) => button.classList.toggle('active', Number(button.dataset.dup) === state.duplication));
    $('#duplication').value = state.duplication ?? '';
    renderStarterKit();
  }
  document.querySelectorAll('[data-dup]').forEach((button) => button.addEventListener('click', () => { state.duplication = Number(button.dataset.dup); $('#dup-error').textContent = ''; render(); }));
  $('#duplication').addEventListener('input', (event) => {
    const raw = event.target.value;
    if (raw === '') { state.duplication = null; $('#dup-error').textContent = ''; render(); return; }
    if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 1000) { $('#dup-error').textContent = 'Enter a whole number from 1 to 1,000.'; return; }
    $('#dup-error').textContent = ''; state.duplication = Number(raw); render();
  });
  $('#packages').addEventListener('click', (event) => { const button = event.target.closest('[data-price]'); if (!button) return; state.price = Number(button.dataset.price); render(); });
  $('#commission-cards').addEventListener('click', (event) => {
    const edit = event.target.closest('[data-adjust-tier]');
    const resetTier = event.target.closest('[data-use-projection]');
    if (edit) {
      const tier = Number(edit.dataset.adjustTier);
      state.overrides[tier] = true;
      state.drafts[tier] = String(projections()[tier]);
      renderCommissions(); renderComparison();
      const input = $(`[data-tier="${tier}"]`); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    } else if (resetTier) {
      const tier = Number(resetTier.dataset.useProjection);
      state.overrides[tier] = false; state.drafts[tier] = '';
      renderCommissions(); renderComparison();
    }
  });
  $('#commission-cards').addEventListener('input', (event) => {
    const input = event.target.closest('[data-tier]'); if (!input) return;
    const tier = Number(input.dataset.tier);
    const raw = input.value;
    const cursor = input.selectionStart ?? raw.length;
    const value = raw.replace(/\D/g, '');
    const nextCursor = raw.slice(0, cursor).replace(/\D/g, '').length;
    state.drafts[tier] = value;
    if (input.value !== value) input.value = value;
    input.setSelectionRange(nextCursor, nextCursor);
    const valid = actualValue(value);
    input.classList.toggle('invalid', valid === null);
    $(`#tier-error-${tier}`).textContent = valid === null ? 'Enter a whole number from 1 to 1,000.' : '';
    $(`[data-tier-formula="${tier}"]`).textContent = !canCalculate() ? 'Select duplication and a package to calculate.' : valid === null ? 'Enter a valid actual member count.' : `RM${state.price} × ${RATES[tier] * 100}% × ${number(valid)}`;
    $(`[data-tier-amount="${tier}"]`).textContent = !canCalculate() || valid === null ? '—' : money(commission(state.price, RATES[tier], valid));
    renderActualTotal(); renderComparison();
  });
  $('#reset-button').addEventListener('click', () => { state = { duplication: null, price: null, overrides: [false, false, false], drafts: ['', '', ''] }; $('#dup-error').textContent = ''; render(); });
  document.querySelectorAll('[data-starter-dup]').forEach((button) => button.addEventListener('click', () => { starterDuplication = Number(button.dataset.starterDup); $('#starter-dup-error').textContent = ''; renderStarterKit(); }));
  $('#starter-duplication').addEventListener('input', (event) => {
    const raw = event.target.value;
    if (raw === '') { starterDuplication = null; $('#starter-dup-error').textContent = ''; renderStarterKit(); return; }
    if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 1000) { $('#starter-dup-error').textContent = 'Enter a whole number from 1 to 1,000.'; return; }
    starterDuplication = Number(raw); $('#starter-dup-error').textContent = ''; renderStarterKit();
  });
  $('#starter-reset-button').addEventListener('click', () => { starterDuplication = null; starterOverrides = [false, false, false]; starterDrafts = ['', '', '']; $('#starter-dup-error').textContent = ''; renderStarterKit(); });
  $('#starter-commission-cards').addEventListener('click', (event) => {
    const edit = event.target.closest('[data-starter-adjust-tier]');
    const resetTier = event.target.closest('[data-starter-use-projection]');
    if (edit) {
      const tier = Number(edit.dataset.starterAdjustTier);
      starterOverrides[tier] = true;
      starterDrafts[tier] = String(projection(starterDuplication)[tier]);
      renderStarterKit();
      const input = $(`[data-starter-tier="${tier}"]`); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    } else if (resetTier) {
      const tier = Number(resetTier.dataset.starterUseProjection);
      starterOverrides[tier] = false; starterDrafts[tier] = '';
      renderStarterKit();
    }
  });
  $('#starter-commission-cards').addEventListener('input', (event) => {
    const input = event.target.closest('[data-starter-tier]'); if (!input) return;
    const tier = Number(input.dataset.starterTier);
    const raw = input.value;
    const cursor = input.selectionStart ?? raw.length;
    const value = raw.replace(/\D/g, '');
    const nextCursor = raw.slice(0, cursor).replace(/\D/g, '').length;
    starterDrafts[tier] = value;
    if (input.value !== value) input.value = value;
    input.setSelectionRange(nextCursor, nextCursor);
    const actual = starterActualValue(value);
    input.classList.toggle('invalid', actual === null);
    $(`#starter-tier-error-${tier}`).textContent = actual === null ? 'Enter a whole number from 1 to 1,000,000,000.' : '';
    $(`[data-starter-formula="${tier}"]`).textContent = actual === null ? 'Enter a valid whole number of members.' : `RM${STARTER_BONUS[tier]} × ${number(actual)} ${actual === 1 ? 'member' : 'members'}`;
    $(`[data-starter-amount="${tier}"]`).textContent = actual === null ? '—' : `RM${number(actual * STARTER_BONUS[tier])}`;
    const projected = projection(starterDuplication);
    const currentActual = projected.map((count, index) => starterOverrides[index] ? starterActualValue(starterDrafts[index]) : count);
    renderStarterTotals(projected, currentActual);
  });
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach((navButton) => { const active = navButton === button; navButton.classList.toggle('active', active); if (active) navButton.setAttribute('aria-current', 'page'); else navButton.removeAttribute('aria-current'); });
    document.querySelectorAll('.calculator-view').forEach((view) => { view.hidden = view.id !== button.dataset.view; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
  render();
  let installPrompt;
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; $('#install-button').hidden = false; });
  $('#install-button').addEventListener('click', async () => { if (!installPrompt) { $('#install-button').textContent = 'Use your browser menu to install'; return; } installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $('#install-button').hidden = true; });
  window.addEventListener('appinstalled', () => { $('#install-button').hidden = true; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
