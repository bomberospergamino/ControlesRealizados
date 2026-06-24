const CONFIG_KEY = 'seguimientoChecksScriptUrl';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzYiO560Az_Eo_hPzAxeczftZG4h9M3SEPjm-ACtrKzfdtHj_CRiqCCenM3KkIy6vyx/exec';

let state = {
  items: [],
  days: 7
};

const els = {
  configPanel: document.getElementById('configPanel'),
  scriptUrl: document.getElementById('scriptUrl'),
  saveConfig: document.getElementById('saveConfig'),
  btnRefresh: document.getElementById('btnRefresh'),
  doneCount: document.getElementById('doneCount'),
  weekCount: document.getElementById('weekCount'),
  updatedAt: document.getElementById('updatedAt'),
  checksList: document.getElementById('checksList'),
  toast: document.getElementById('toast')
};

init();

function init() {
  if (!localStorage.getItem(CONFIG_KEY)) localStorage.setItem(CONFIG_KEY, DEFAULT_SCRIPT_URL);
  els.scriptUrl.value = getScriptUrl();
  els.saveConfig.addEventListener('click', saveConfig);
  els.btnRefresh.addEventListener('click', loadChecks);
  updateConfigVisibility();
  loadChecks();
}

function getScriptUrl() {
  return localStorage.getItem(CONFIG_KEY) || DEFAULT_SCRIPT_URL;
}

function saveConfig() {
  const url = els.scriptUrl.value.trim();
  if (!url.startsWith('https://script.google.com/')) {
    showToast('Pega una URL valida de Apps Script.');
    return;
  }
  localStorage.setItem(CONFIG_KEY, url);
  updateConfigVisibility();
  loadChecks();
}

function updateConfigVisibility() {
  els.configPanel.classList.toggle('hidden', Boolean(getScriptUrl()));
}

async function loadChecks() {
  try {
    showToast('Actualizando...');
    const data = await api('checksSummary', { days: state.days });
    if (!Array.isArray(data.items)) {
      throw new Error('La Web App responde, pero todavia no tiene publicada la accion checksSummary.');
    }
    state.items = data.items;
    state.days = Number(data.days || state.days);
    render();
    const stamp = data.generatedAt ? formatDateTime(data.generatedAt) : new Date().toLocaleString('es-AR');
    els.updatedAt.textContent = `Actualizado ${stamp}.`;
    showToast('Pizarra actualizada.');
  } catch (error) {
    els.updatedAt.textContent = 'No se pudo actualizar.';
    els.configPanel.classList.remove('hidden');
    els.doneCount.textContent = '0';
    els.checksList.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    showToast(error.message);
  }
}

async function api(action, params = {}) {
  const baseUrl = getScriptUrl();
  if (!baseUrl) throw new Error('Falta configurar URL de Apps Script.');
  const url = new URL(baseUrl);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  const response = await fetch(url.toString());
  const data = await response.json();
  if (!data.ok) throw new Error(data.message || 'Error al leer REGISTROS.');
  return data;
}

function render() {
  const done = state.items
    .filter(item => item.done)
    .sort((a, b) => dateSortValue(b.lastControlDate || b.lastLoadDate) - dateSortValue(a.lastControlDate || a.lastLoadDate));

  els.doneCount.textContent = done.length;
  els.weekCount.textContent = `${state.days}d`;

  if (!done.length) {
    els.checksList.innerHTML = '<div class="empty">No hay checks registrados en los ultimos 7 dias.</div>';
    return;
  }

  els.checksList.innerHTML = done.map(renderCard).join('');
}

function renderCard(item) {
  const dateValue = item.lastControlDate || item.lastLoadDate || '';
  const fullDate = dateValue ? formatDate(dateValue) : 'Sin fecha';
  const responsables = item.responsables && item.responsables.length ? item.responsables.join(', ') : 'Sin responsable';

  return `
    <article class="check-card">
      <div class="date-box">
        <span>${escapeHtml(dayNumber(fullDate))}</span>
        <strong>${escapeHtml(monthLabel(fullDate))}</strong>
      </div>
      <div class="check-main">
        <div class="check-title">${escapeHtml(item.activity || 'Check sin nombre')}</div>
        <div class="check-meta">
          <span>${escapeHtml(fullDate)}</span>
          <strong>${escapeHtml(responsables)}</strong>
        </div>
      </div>
    </article>
  `;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return value || '-';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return value || '-';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function dateSortValue(value) {
  const date = parseDate(value);
  return date ? date.getTime() : 0;
}

function dayNumber(formattedDate) {
  const parts = String(formattedDate || '').split('/');
  return parts[0] || '-';
}

function monthLabel(formattedDate) {
  const parts = String(formattedDate || '').split('/');
  const month = Number(parts[1]);
  const names = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return names[month - 1] || '';
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add('hidden'), 2200);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}
