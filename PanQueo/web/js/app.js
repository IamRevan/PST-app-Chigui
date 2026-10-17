// API Base Configuration
const API_BASE = localStorage.getItem('API_BASE') || (window.location.hostname ? `http://${window.location.hostname}:3000/api` : 'http://localhost:3000/api');

let isLoggedIn = false;
let activeOrderFilter = 'all';
let activeInventoryFilter = 'all';

// Centralized API Fetch Helper
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      isLoggedIn = false;
      document.getElementById('main-app').classList.add('hidden');
      document.getElementById('auth-screen').classList.remove('hidden');
      showError('Sesión expirada. Por favor, inicia sesión de nuevo.');
      throw new Error('No autorizado');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ========== INITIALIZATION & SPLASH ==========
document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  initEventListeners();
  checkAuth();
  initTheme();
  checkApiStatus();
  if (isLoggedIn) {
    onSessionReady();
  }
});

function initSplash() {
  const container = document.getElementById('confetti-container');
  if (container) {
    function createSprinkle() {
      const sprinkle = document.createElement('div');
      sprinkle.classList.add('sprinkle');
      const colors = ['#ffc107', '#625f4d', '#ffffff', '#fabd00'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isOval = Math.random() > 0.5;
      const width = Math.random() * 4 + 4;
      const height = Math.random() * 8 + 6;
      sprinkle.style.width = width + 'px';
      sprinkle.style.height = height + 'px';
      sprinkle.style.backgroundColor = color;
      if (isOval) sprinkle.style.borderRadius = '999px';
      sprinkle.style.left = Math.random() * 100 + 'vw';
      const duration = Math.random() * 3 + 4;
      const delay = Math.random() * 5;
      sprinkle.style.animationDuration = duration + 's';
      sprinkle.style.animationDelay = delay + 's';
      container.appendChild(sprinkle);
      setTimeout(() => { sprinkle.remove(); }, (duration + delay) * 1000);
    }
    for (let i = 0; i < 40; i++) createSprinkle();
    setInterval(createSprinkle, 250);
  }

  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.addEventListener('click', () => {
      splash.classList.add('hidden');
      if (isLoggedIn) {
        document.getElementById('main-app').classList.remove('hidden');
      } else {
        document.getElementById('auth-screen').classList.remove('hidden');
      }
    });

    setTimeout(() => {
      splash.classList.add('hidden');
      if (isLoggedIn) {
        document.getElementById('main-app').classList.remove('hidden');
      } else {
        document.getElementById('auth-screen').classList.remove('hidden');
      }
    }, 1500);
  }
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    isLoggedIn = true;
  }
}

function initEventListeners() {
  // Enter key in Auth forms
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const auth = document.getElementById('auth-screen');
      if (auth && !auth.classList.contains('hidden')) {
        if (!document.getElementById('login-form').classList.contains('hidden')) handleLogin();
        else if (!document.getElementById('register-form').classList.contains('hidden')) handleRegister();
        else handleReset();
      }
    }
  });

  // Search input listeners
  const invSearch = document.getElementById('inventory-search');
  if (invSearch) invSearch.addEventListener('input', () => renderInventory());

  const ordersSearch = document.getElementById('orders-search');
  if (ordersSearch) ordersSearch.addEventListener('input', () => renderOrders());

  const clientsSearch = document.getElementById('clients-search');
  if (clientsSearch) clientsSearch.addEventListener('input', () => renderClients());

  // Inventory filter pills
  const invFilters = document.getElementById('inventory-filters');
  if (invFilters) {
    invFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      invFilters.querySelectorAll('button').forEach(b => {
        b.className = 'inactive-pill px-3 py-1 rounded-full font-label-bold text-label-bold whitespace-nowrap hover:bg-secondary-container/50 transition-all shadow-sm text-xs';
      });
      btn.className = 'active-pill px-3 py-1 rounded-full font-label-bold text-label-bold whitespace-nowrap transition-all shadow-sm text-xs';
      activeInventoryFilter = btn.dataset.filter || 'all';
      renderInventory();
    });
  }

  // Orders filter pills
  const ordFilters = document.getElementById('orders-filters');
  if (ordFilters) {
    ordFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      ordFilters.querySelectorAll('button').forEach(b => {
        b.className = 'px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-bold text-label-bold whitespace-nowrap hover:bg-secondary-container/50 transition-colors text-xs';
      });
      btn.className = 'px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-bold text-label-bold whitespace-nowrap text-xs';
      activeOrderFilter = btn.dataset.filter || 'all';
      renderOrders();
    });
  }
}

// ========== AUTHENTICATION HANDLERS ==========
function togglePassword() {
  const pwd = document.getElementById('login-password');
  const eye = document.querySelector('.input-eye');
  if (pwd) {
    if (pwd.type === 'password') {
      pwd.type = 'text';
      if (eye) eye.textContent = 'visibility_off';
    } else {
      pwd.type = 'password';
      if (eye) eye.textContent = 'visibility';
    }
  }
}

function showLogin() {
  hideAllAuthForms();
  document.getElementById('login-form').classList.remove('hidden');
}

function showRegister() {
  hideAllAuthForms();
  document.getElementById('register-form').classList.remove('hidden');
}

function showReset() {
  hideAllAuthForms();
  document.getElementById('reset-form').classList.remove('hidden');
}

function hideAllAuthForms() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('reset-form').classList.add('hidden');
  const err = document.getElementById('error-message');
  if (err) err.classList.add('hidden');
}

function showError(msg) {
  const el = document.getElementById('error-message');
  if (el) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }
}

// Auth handlers with backend API connection
async function handleLogin() {
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  if (!email || !password) {
    showError('Todos los campos son requeridos');
    return;
  }

  const loginBtn = document.querySelector('#login-form .btn-primary') || document.querySelector('#login-form button');
  const originalBtnText = loginBtn ? loginBtn.innerHTML : '';
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando sesión...';
  }

  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const token = res?.data?.token || res?.token;
    if (token) {
      localStorage.setItem('token', token);
      const user = res?.data?.user || res?.data?.usuario || res?.user || res?.usuario;
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      isLoggedIn = true;
      document.getElementById('auth-screen').classList.add('hidden');
      document.getElementById('main-app').classList.remove('hidden');
      onSessionReady();
      renderAll();
    } else {
      showError('Respuesta de autenticación no válida.');
    }
  } catch (err) {
    showError(err.message || 'Error al iniciar sesión. Verifica tus credenciales o la conexión con el servidor.');
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = originalBtnText;
    }
  }
}

async function handleRegister() {
  const nombre = document.getElementById('reg-nombre')?.value.trim();
  const apellido = document.getElementById('reg-apellido')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const telefono = document.getElementById('reg-telefono')?.value.trim();
  const password = document.getElementById('reg-password')?.value;

  if (!nombre || !apellido || !email || !telefono || !password) {
    showError('Todos los campos son requeridos');
    return;
  }

  const regBtn = document.querySelector('#register-form .btn-primary') || document.querySelector('#register-form button');
  const originalBtnText = regBtn ? regBtn.innerHTML : '';
  if (regBtn) {
    regBtn.disabled = true;
    regBtn.textContent = 'Registrando...';
  }

  try {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, apellido, email, telefono, password }),
    });

    const token = res?.data?.token || res?.token;
    if (token) {
      localStorage.setItem('token', token);
    }
    const emailLoginInput = document.getElementById('login-email');
    if (emailLoginInput) {
      emailLoginInput.value = email;
    }
    showLogin();
    showError('Registro exitoso. Inicia sesión.');
  } catch (err) {
    showError(err.message || 'Error al registrar usuario. Verifica la conexión con el servidor.');
  } finally {
    if (regBtn) {
      regBtn.disabled = false;
      regBtn.innerHTML = originalBtnText;
    }
  }
}

function handleReset() {
  const email = document.getElementById('reset-email').value.trim();
  if (!email) { alert('Ingresa tu correo'); return; }
  alert('Si el correo existe, se ha enviado un enlace de restablecimiento a ' + email);
  showLogin();
}

function handleLogout() {
  if (confirm('¿Deseas cerrar sesión?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    isLoggedIn = false;
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    showLogin();
  }
}

// ========== VIEW NAVIGATION & TABS ==========
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabId) btn.classList.add('active');
  });

  // Sincronizar el item activo del sidebar de escritorio
  document.querySelectorAll('.pq-sidebar .pq-nav-item[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  document.querySelectorAll('.full-screen-view.active').forEach(v => v.classList.remove('active'));
  renderTab(tabId);
}

function openView(viewId) {
  document.querySelectorAll('.full-screen-view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');
}

function closeView(viewId) {
  const view = document.getElementById(viewId);
  if (view) view.classList.remove('active');
}

// Views triggers
function openRegisterLot() {
  openView('view-register-lot');
  cargarIngredientesParaLote();
}
function openRegisterClient() { openView('view-register-client'); }
function openClientHistory() { openView('view-client-history'); }
function openProductDetail() { openView('view-product-detail'); }
function openAdjustStock() { openView('view-adjust-stock'); }
function openAdjustSuccess() { openView('view-adjust-success'); }
function openSelectClient() { openView('view-select-client'); }
function openNewOrder() { openView('view-new-order'); }
function openOrderSuccess() { openView('view-order-success'); }
function openOrderDetail() { openView('view-order-detail'); }
function openStockError() { openView('view-stock-error'); }
function openSettings() {
  openView('view-settings');
  const sel = document.getElementById('settings-currency');
  if (sel) sel.value = localStorage.getItem('PQ_CUR_MODE') || 'dual';
}
async function openEditProfile() {
  openView('view-edit-profile');
  try {
    const res = await apiFetch('/auth/perfil');
    const u = res?.data || {};
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
    set('ep-nombre', u.nombre);
    set('ep-apellido', u.apellido);
    set('ep-email', u.email);
    set('ep-telefono', u.telefono);
  } catch (err) {
    showToast('No se pudo cargar tu perfil', 'error');
  }
}

function openSecurity() { openModal('Seguridad', 'Gestión de contraseña y autenticación de dos factores.'); }
function openHelp() { openModal('Ayuda & Soporte', 'Contacto con soporte técnico: soporte@panqueo.com'); }
function openNotifs() { openAlertsSheet(); }

// Modal Helpers
function openModal(title, body) {
  const t = document.getElementById('modal-title');
  const b = document.getElementById('modal-body-text');
  if (t) t.textContent = title;
  if (b) b.textContent = body;
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ============================================================
// ===== FUNDACIONES UNIFICADAS (Fase 3) =====
// Toasts · Dark Mode · Bimoneda DUAL/USD/Bs (tasa BCV real) ·
// Sheets · Alertas FEFO · Estado de API
// ============================================================

// ---------- TOASTS ----------
function showToast(message, type = 'info', icon = null) {
  const container = document.getElementById('pq-toast-container');
  if (!container) { return; }
  const iconName = icon || (type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info');
  const toast = document.createElement('div');
  toast.className = `pq-toast ${type}`;
  toast.innerHTML = `<span class="material-symbols-outlined">${iconName}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.25s, transform 0.25s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

// ---------- DARK MODE ----------
function applyTheme(mode) {
  const html = document.documentElement;
  html.classList.toggle('dark', mode === 'dark');
  html.classList.toggle('light', mode !== 'dark');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = mode === 'dark' ? 'light_mode' : 'dark_mode';
}

function initTheme() {
  applyTheme(localStorage.getItem('PQ_THEME') || 'light');
}

function toggleTheme(persist) {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(next);
  if (persist) {
    localStorage.setItem('PQ_THEME', next);
    showToast(`Tema cambiado a modo ${next === 'dark' ? 'oscuro' : 'claro'}`, 'info', next === 'dark' ? 'dark_mode' : 'light_mode');
  }
}

// ---------- BIMONEDA (tasa BCV real) ----------
const PQ_CURRENCY = {
  order: ['dual', 'usd', 'bs'],
  modeLabels: { dual: 'DUAL $ / Bs.', usd: 'SOLO USD', bs: 'SOLO Bs.' },
  mode: localStorage.getItem('PQ_CUR_MODE') || 'dual',
  rate: parseFloat(localStorage.getItem('PQ_RATE')) || null,
  rateFetched: false,
};

function loadTasa() {
  if (!isLoggedIn) return Promise.resolve(null);
  return apiFetch('/finanzas/tasas/actual')
    .then(res => {
      const valor = res?.data?.valor_bs_por_usd;
      if (valor) {
        PQ_CURRENCY.rate = parseFloat(valor);
        localStorage.setItem('PQ_RATE', String(PQ_CURRENCY.rate));
      }
      PQ_CURRENCY.rateFetched = true;
      renderRatePill();
      return PQ_CURRENCY.rate;
    })
    .catch(() => null);
}

function renderRatePill() {
  const rateEl = document.getElementById('rate-label');
  const modeEl = document.getElementById('currency-mode-label');
  if (rateEl) rateEl.textContent = PQ_CURRENCY.rate ? `${PQ_CURRENCY.rate} Bs/$` : 'Sin tasa';
  if (modeEl) modeEl.textContent = PQ_CURRENCY.modeLabels[PQ_CURRENCY.mode];
}

function cycleCurrencyMode() {
  const i = PQ_CURRENCY.order.indexOf(PQ_CURRENCY.mode);
  PQ_CURRENCY.mode = PQ_CURRENCY.order[(i + 1) % PQ_CURRENCY.order.length];
  localStorage.setItem('PQ_CUR_MODE', PQ_CURRENCY.mode);
  renderRatePill();
  renderAll();
  showToast(`Vista de montos: ${PQ_CURRENCY.modeLabels[PQ_CURRENCY.mode]}`, 'info', 'payments');
}

function fmtBs(usd) {
  return `${(parseFloat(usd || 0) * (PQ_CURRENCY.rate || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;
}

/** Formatea un monto USD según el modo bimoneda activo. */
function fmtMoney(usd) {
  const usdNum = parseFloat(usd || 0);
  if (PQ_CURRENCY.mode === 'bs') {
    return PQ_CURRENCY.rate ? fmtBs(usdNum) : `$ ${usdNum.toFixed(2)} (sin tasa)`;
  }
  return `$ ${usdNum.toFixed(2)}`;
}

/** Versión con línea secundaria Bs. para KPIs y tarjetas (modo dual). */
function fmtMoneyHTML(usd) {
  const usdNum = parseFloat(usd || 0);
  if (PQ_CURRENCY.mode === 'usd') {
    return `<span>$ ${usdNum.toFixed(2)}</span>`;
  }
  if (!PQ_CURRENCY.rate) {
    return `<span>$ ${usdNum.toFixed(2)}</span>`;
  }
  if (PQ_CURRENCY.mode === 'bs') {
    return `<span>${fmtBs(usdNum)}</span>`;
  }
  return `<span class="pq-money-dual"><span>$ ${usdNum.toFixed(2)}</span><span class="pq-money-bs">${fmtBs(usdNum)}</span></span>`;
}

// ---------- SHEETS (bottom-sheet móvil / modal desktop) ----------
function openSheet(sheetId) {
  closeSheets();
  const overlay = document.getElementById('pq-sheet-overlay');
  const sheet = document.getElementById(sheetId);
  if (overlay) overlay.classList.add('open');
  if (sheet) sheet.classList.add('open');
}

function closeSheets() {
  document.querySelectorAll('.pq-sheet.open').forEach(s => s.classList.remove('open'));
  const overlay = document.getElementById('pq-sheet-overlay');
  if (overlay) overlay.classList.remove('open');
}

// ---------- TASA BCV (sheet) ----------
function openTasaSheet() {
  const current = document.getElementById('pq-tasa-current');
  if (current) current.textContent = PQ_CURRENCY.rate ? `${PQ_CURRENCY.rate} Bs. / 1 USD` : 'Sin tasa registrada';
  const input = document.getElementById('pq-tasa-input');
  if (input) input.value = PQ_CURRENCY.rate || '';
  openSheet('sheet-tasa');
}

async function saveTasa() {
  const input = document.getElementById('pq-tasa-input');
  const valor = parseFloat(input ? input.value : '');
  if (!valor || valor <= 0) {
    showToast('Ingresa una tasa válida (mayor a 0)', 'error');
    return;
  }
  try {
    await apiFetch('/finanzas/tasas', {
      method: 'POST',
      body: JSON.stringify({ valor_bs_por_usd: valor, fuente_referencia: 'Manual' }),
    });
    PQ_CURRENCY.rate = valor;
    localStorage.setItem('PQ_RATE', String(valor));
    closeSheets();
    renderRatePill();
    renderAll();
    showToast(`Tasa actualizada: ${valor} Bs/$ (Regla 4 aplicada a la bimoneda)`, 'success');
  } catch (err) {
    showToast(err.message || 'No se pudo registrar la tasa', 'error');
  }
}

// ---------- NOTIFICACIONES (alertas FEFO reales) ----------
async function openAlertsSheet() {
  if (!isLoggedIn) return;
  updateAlertBadges(0); // optimista: se reactualiza tras la consulta
  const body = document.getElementById('pq-notifs-body');
  if (body) body.innerHTML = getLoadingHTML();
  openSheet('sheet-notifs');
  try {
    const res = await apiFetch('/inventario/alertas');
    const data = res?.data || {};
    const venc = Array.isArray(data.proximosAVencer) ? data.proximosAVencer : [];
    const bajo = Array.isArray(data.stockBajo) ? data.stockBajo : [];
    if (body) {
      body.innerHTML = (venc.length + bajo.length) === 0
        ? getEmptyHTML('Sin alertas activas. Cocina bajo control 🐹')
        : `
        ${bajo.length ? `<h4 style="font-size:12px;color:var(--pq-on-surface-muted);text-transform:uppercase;margin:8px 0;">Stock bajo (${bajo.length})</h4>
        ${bajo.map(a => `
          <div style="display:flex;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:12px;background:var(--pq-error-container);color:#93000a;margin-bottom:6px;font-size:13px;">
            <span style="font-weight:600;">${a.nombre || a.ingrediente || 'Ingrediente'}</span>
            <span style="font-weight:700;">${parseFloat(a.stockActual ?? a.cantidad ?? 0)} ${a.unidad || ''}</span>
          </div>`).join('')}` : ''}
        ${venc.length ? `<h4 style="font-size:12px;color:var(--pq-on-surface-muted);text-transform:uppercase;margin:12px 0 8px;">Lotes por vencer ≤ 7 días (${venc.length})</h4>
        ${venc.map(a => `
          <div style="display:flex;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:12px;background:var(--pq-surface-1);margin-bottom:6px;font-size:13px;">
            <div>
              <div style="font-weight:600;">${a.ingrediente || 'Lote'}</div>
              <div style="font-size:11px;color:var(--pq-on-surface-muted);">${a.cantidad} ${a.unidad || ''} · vence ${a.fechaVencimiento}</div>
            </div>
            <span style="font-weight:700;color:#b26a00;white-space:nowrap;">${a.diasRestantes === 0 ? 'HOY' : `${a.diasRestantes}d`}</span>
          </div>`).join('')}` : ''}
      `;
    }
    updateAlertBadges(venc.length + bajo.length);
  } catch (err) {
    if (body) body.innerHTML = getErrorHTML('No se pudieron cargar las alertas.', 'openAlertsSheet()');
  }
}

function updateAlertBadges(total) {
  ['pq-nav-alert-badge', 'pq-nav-alert-badge-2'].forEach(id => {
    const badge = document.getElementById(id);
    if (!badge) return;
    if (total > 0) {
      badge.textContent = total;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  });
}

// ---------- MÓDULOS SIDEBAR (compras / recetas) ----------
async function openAuthedModule(name) {
  if (!isLoggedIn) return;
  const title = document.getElementById('pq-module-title');
  const sub = document.getElementById('pq-module-sub');
  const body = document.getElementById('pq-module-body');
  body.innerHTML = getLoadingHTML();
  openSheet('sheet-recetas');

  try {
    if (name === 'recetas') {
      if (title) title.textContent = 'Recetas y Producción';
      if (sub) sub.textContent = 'Catálogo de recetas con sus requerimientos de ingredientes.';
      const res = await apiFetch('/recetas?limit=50');
      const recetas = Array.isArray(res?.data) ? res.data : (res?.data?.recetas || res?.data?.items || []);
      if (recetas.length === 0) {
        body.innerHTML = getEmptyHTML('No hay recetas registradas todavía.');
        return;
      }
      body.innerHTML = recetas.map(r => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--pq-surface-1);margin-bottom:6px;">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,193,7,.2);display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined" style="color:#785900;">bakery_dining</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:13px;">${r.nombre_receta}</div>
            <div style="font-size:11px;color:var(--pq-on-surface-muted);">${r.Descripcion || r.descripcion || ''}</div>
          </div>
          <button class="material-symbols-outlined" style="border:0;background:none;color:#785900;cursor:pointer;" onclick="openRecetaDetalle(${r.id_receta})" title="Ver detalle / costo">visibility</button>
        </div>
      `).join('');
    } else if (name === 'compras') {
      if (title) title.textContent = 'Listas de Compra';
      if (sub) sub.textContent = 'Sugeridas por la predicción de compras; se convierten en lotes al completarse (RF-02).';
      const res = await apiFetch('/compras/listas?limit=20');
      const listas = Array.isArray(res?.data) ? res.data : (res?.data?.listas || res?.data?.items || []);
      if (listas.length === 0) {
        body.innerHTML = getEmptyHTML('No hay listas de compra registradas.');
        return;
      }
      body.innerHTML = listas.map(l => {
        const estado = l.estado_lista || 'Borrador';
        const color = estado === 'Completada' ? '#2e7d32' : '#b26a00';
        const bg = estado === 'Completada' ? 'rgba(76,175,80,.12)' : 'rgba(255,193,7,.15)';
        return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;background:var(--pq-surface-1);margin-bottom:6px;">
          <div style="min-width:0;">
            <div style="font-weight:600;font-size:13px;">Lista #${l.id_lista} · ${l.createdAt ? new Date(l.createdAt).toLocaleDateString('es-VE') : ''}</div>
            <div style="font-size:11px;color:var(--pq-on-surface-muted);">${(l.DetalleListaCompras || []).length} ítem(s)</div>
          </div>
          <span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:999px;color:${color};background:${bg};">${estado}</span>
        </div>`;
      }).join('');
    }
  } catch (err) {
    body.innerHTML = getErrorHTML('No se pudo cargar el módulo.', `openAuthedModule('${name}')`);
  }
}

async function openRecetaDetalle(id) {
  const body = document.getElementById('pq-module-body');
  body.innerHTML = getLoadingHTML();
  try {
    const res = await apiFetch(`/recetas/${id}`);
    const r = res?.data || {};
    const ingresos = Array.isArray(r.Ingredientes) ? r.Ingredientes : (Array.isArray(r.RecetaIngredientes) ? r.RecetaIngredientes : []);
    const title = document.getElementById('pq-module-title');
    if (title) title.textContent = r.nombre_receta || 'Receta';
    body.innerHTML = `
      <div style="font-size:13px;color:var(--pq-on-surface-muted);margin-bottom:10px;">${r.instrucciones ? 'Instrucciones: ' + r.instrucciones : 'Sin instrucciones registradas.'}</div>
      <div style="font-weight:700;font-size:12px;text-transform:uppercase;color:var(--pq-on-surface-muted);margin-bottom:8px;">Ingredientes requeridos</div>
      ${ingresos.length === 0 ? getEmptyHTML('Sin ingredientes asociados.') : ingresos.map(i => `
        <div style="display:flex;justify-content:space-between;padding:8px 12px;border-radius:10px;background:var(--pq-surface-1);margin-bottom:5px;font-size:12px;">
          <span style="font-weight:600;">${i.Ingrediente?.nombre_ing || i.nombre_ing || `ID ${i.id_ingrediente}`}</span>
          <span>${parseFloat(i.cantidad_requerida)} ${i.Ingrediente?.unidad_medida || ''}</span>
        </div>`).join('')}
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button onclick="toolReceta(${id}, 'stock')" style="flex:1;padding:10px;border:0;border-radius:12px;background:#785900;color:#fff;font-weight:600;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:16px;">inventory</span> Verificar stock
        </button>
        <button onclick="toolReceta(${id}, 'costo')" style="flex:1;padding:10px;border:0;border-radius:12px;background:#785900;color:#fff;font-weight:600;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:16px;">calculate</span> Simular costo
        </button>
      </div>
    `;
  } catch (err) {
    body.innerHTML = getErrorHTML('No se pudo cargar la receta.', `openRecetaDetalle(${id})`);
  }
}

// ---------- ESTADO DE API (sidebar) ----------
async function checkApiStatus() {
  const dot = document.getElementById('pq-api-dot');
  const text = document.getElementById('pq-api-text');
  try {
    const res = await fetch(`${API_BASE.replace(/\/api\/?$/, '')}/api/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      if (dot) dot.classList.remove('off');
      if (text) text.textContent = 'API Conectada';
    } else {
      throw new Error('health no ok');
    }
  } catch (err) {
    if (dot) dot.classList.add('off');
    if (text) text.textContent = 'API sin conexión';
  }
}

// ---------- LOGIN: refrescar datos de sesión ----------
function onSessionReady() {
  initTheme();
  loadTasa();
  checkAlertBadgesOnLoad();
  // Con sesión persistida (recarga de página) el MVP no re-renderizaba nada
  renderAll();
}

async function checkAlertBadgesOnLoad() {
  try {
    const res = await apiFetch('/inventario/alertas');
    updateAlertBadges(res?.data?.totalAlertas || 0);
  } catch (err) { /* silencio: las alertas se consultan al abrir el sheet */ }
}

function renderTab(tabId) {
  if (tabId === 'dashboard') renderDashboard();
  else if (tabId === 'inventory') renderInventory();
  else if (tabId === 'orders') renderOrders();
  else if (tabId === 'clients') renderClients();
  else if (tabId === 'profile') renderProfile();
}

function renderAll() {
  renderDashboard();
  renderInventory();
  renderOrders();
  renderClients();
  renderProfile();
}

// ========== RENDER DATA FROM BACKEND APIs ==========

// Helper for UI loading / empty / error state templates
function getLoadingHTML() {
  return `<div class="p-6 text-center"><div class="loader-ring"></div><p class="mt-2 text-sm text-secondary">Cargando datos...</p></div>`;
}

function getEmptyHTML(message = 'No se encontraron registros.') {
  return `<div class="p-6 text-center text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-xl card-shadow">${message}</div>`;
}

function getErrorHTML(message, retryFn) {
  return `
    <div class="p-6 text-center bg-error-container/30 rounded-xl border border-error/20 card-shadow">
      <span class="material-symbols-outlined text-error text-3xl mb-1">wifi_off</span>
      <p class="text-error font-semibold text-sm mb-3">${message}</p>
      <button class="px-4 py-2 bg-primary-container text-on-primary-container font-button-text text-xs rounded-xl shadow-sm hover:brightness-95 active:scale-95 transition-all" onclick="${retryFn}">
        Reintentar conexión
      </button>
    </div>
  `;
}

// --- DASHBOARD ---
async function renderDashboard() {
  const container = document.getElementById('dashboard-orders');
  if (!container) return;

  container.innerHTML = getLoadingHTML();

  try {
    const [pedRes, alertRes] = await Promise.all([
      apiFetch('/pedidos?limit=100'),
      apiFetch('/inventario/alertas').catch(() => null),
    ]);
    const pedidos = pedRes?.data?.pedidos || [];

    // KPIs reales
    const hoy = new Date().toISOString().slice(0, 10);
    const porCobrar = pedidos
      .filter(p => p.estado_pago !== 'Pagado')
      .reduce((sum, p) => sum + (parseFloat(p.costo_total) - parseFloat(p.monto_abonado || 0)), 0);
    const entregaHoy = pedidos
      .filter(p => (p.fecha_entrega || '').slice(0, 10) === hoy).length;
    const enCocina = pedidos.filter(p => p.estado_entrega === 'En Cocina').length;
    const stockBajo = alertRes?.data?.stockBajo?.length ?? null;

    const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
    setKpi('kpi-pedidos', pedidos.length);
    setKpi('kpi-stock', stockBajo === null ? '—' : stockBajo);
    setKpi('kpi-porcobrar', fmtMoney(porCobrar));
    setKpi('kpi-entrega', entregaHoy);
    const badgeCocina = document.getElementById('kpi-cocina-badge');
    if (badgeCocina) badgeCocina.textContent = `${enCocina} en cocina`;

    // Producción activa: aún no entregada
    const activeOrders = pedidos.filter(p => ['Por Preparar', 'En Cocina', 'Listo'].includes(p.estado_entrega));

    if (activeOrders.length === 0) {
      container.innerHTML = getEmptyHTML('No hay producción activa en este momento.');
      return;
    }

    container.innerHTML = activeOrders.map(o => {
      const clienteNombre = o.Cliente ? `${o.Cliente.nombre} ${o.Cliente.apellido || ''}`.trim() : 'Cliente general';
      const statusClass = o.estado_entrega === 'En Cocina' ? 'production' : o.estado_entrega === 'Listo' ? 'done' : 'pending';
      const totalFmt = fmtMoneyHTML(o.costo_total);
      return `
        <div class="order-item" onclick="showOrderDetailBackend(${o.id_pedido || o.id})" style="cursor:pointer;">
          <div>
            <div class="order-id">#${o.id_pedido || o.id}</div>
            <div class="order-detail">${clienteNombre}</div>
            <div style="font-size:11px;color:#827660;">Total: <span style="display:inline-block;">${totalFmt}</span></div>
          </div>
          <span class="order-status ${statusClass}">${o.estado_entrega}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = getErrorHTML('Error al cargar datos del dashboard.', 'renderDashboard()');
  }
}

// --- INVENTORY ---
async function renderInventory() {
  const container = document.getElementById('inventory-list');
  if (!container) return;

  container.innerHTML = getLoadingHTML();

  const searchVal = document.getElementById('inventory-search') ? document.getElementById('inventory-search').value.trim() : '';

  try {
    let url = `/inventario/ingredientes?limit=50`;
    if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;

    const res = await apiFetch(url);
    let items = Array.isArray(res.data) ? res.data : (res.data && res.data.ingredientes ? res.data.ingredientes : []);

    // Apply front filter pills
    if (activeInventoryFilter === 'low') {
      items = items.filter(item => parseFloat(item.stock_actual) <= parseFloat(item.stock_minimo));
    } else if (activeInventoryFilter === 'out') {
      items = items.filter(item => parseFloat(item.stock_actual) <= 0);
    }

    if (items.length === 0) {
      container.innerHTML = getEmptyHTML('No hay productos en el inventario.');
      return;
    }

    container.innerHTML = items.map(item => {
      const stock = parseFloat(item.stock_actual || 0);
      const minStock = parseFloat(item.stock_minimo || 0);
      const isCritical = stock <= minStock;

      return `
        <div class="bg-surface-container-lowest p-3 rounded-xl card-shadow flex flex-col gap-2 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-1.5 h-full ${isCritical ? 'bg-error' : 'bg-tertiary'}"></div>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                <span class="material-symbols-outlined text-primary text-2xl">bakery_dining</span>
              </div>
              <div>
                <h3 class="font-title-sm text-sm text-on-surface">${item.nombre_ing || item.nombre_ingrediente}</h3>
                <p class="font-body-sm text-xs text-outline">Unidad: ${item.unidad_medida}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="${isCritical ? 'text-error' : 'text-tertiary'} font-label-bold text-xs flex items-center justify-end gap-1">
                <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL'1;">${isCritical ? 'warning' : 'check_circle'}</span>
                ${isCritical ? 'Stock Bajo' : 'Óptimo'}
              </span>
              <p class="font-display-lg text-lg ${isCritical ? 'text-error' : 'text-tertiary'}">${stock} ${item.unidad_medida}</p>
            </div>
          </div>
          <div class="flex items-center justify-between mt-1 pt-2 border-t border-surface-variant">
            <div class="flex items-center gap-1 text-on-surface-variant">
              <span class="material-symbols-outlined text-sm">inventory_2</span>
              <span class="font-body-sm text-xs">Mínimo: ${minStock} ${item.unidad_medida}</span>
            </div>
            <div class="flex gap-1">
              <button class="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-90" onclick="showProductDetails('${item.id_ingrediente}')">
                <span class="material-symbols-outlined text-sm">visibility</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = getErrorHTML('Error al cargar inventario desde el servidor.', 'renderInventory()');
  }
}

function showProductDetails(id) {
  openIngredienteDetail(id);
}

// ---------- LOTES: formulario real (trazabilidad FEFO) ----------
async function cargarIngredientesParaLote() {
  const select = document.getElementById('lot-product');
  if (!select) return;
  select.innerHTML = '<option value="">Cargando ingredientes…</option>';
  try {
    const res = await apiFetch('/inventario/ingredientes?limit=100');
    const items = Array.isArray(res?.data) ? res.data : [];
    if (items.length === 0) {
      select.innerHTML = '<option value="">Primero registra un ingrediente</option>';
      return;
    }
    select.innerHTML = items.map(i =>
      `<option value="${i.id_ingrediente}" data-unidad="${i.unidad_medida || ''}">${i.nombre_ing}</option>`
    ).join('');
    select.onchange = () => {
      const opt = select.selectedOptions[0];
      const unitEl = document.getElementById('lot-unit');
      if (unitEl) unitEl.textContent = opt?.dataset.unidad || '';
    };
    select.onchange();
    const hoy = new Date().toISOString().slice(0, 10);
    const entryEl = document.getElementById('lot-entry');
    if (entryEl && !entryEl.value) entryEl.value = hoy;
  } catch (err) {
    select.innerHTML = '<option value="">Error al cargar ingredientes</option>';
  }
}

async function saveLote() {
  const select = document.getElementById('lot-product');
  const idIngrediente = select?.value;
  const cantidad = parseFloat(document.getElementById('lot-qty')?.value);
  const fechaIngreso = document.getElementById('lot-entry')?.value;
  const fechaVenc = document.getElementById('lot-expiry')?.value;
  const precio = document.getElementById('lot-price')?.value;
  const moneda = document.getElementById('lot-coin')?.value || 'USD';

  if (!idIngrediente) { showToast('Selecciona un ingrediente', 'error'); return; }
  if (!cantidad || cantidad <= 0) { showToast('Cantidad inválida', 'error'); return; }
  if (!fechaIngreso) { showToast('Indica la fecha de ingreso', 'error'); return; }
  if (!fechaVenc) { showToast('Indica la fecha de vencimiento', 'error'); return; }

  try {
    await apiFetch('/inventario/lotes', {
      method: 'POST',
      body: JSON.stringify({
        id_ingrediente: Number(idIngrediente),
        cantidad_actual: cantidad,
        fecha_ingreso: fechaIngreso,
        fecha_venc: fechaVenc,
        precio_compra_unitario: precio && parseFloat(precio) > 0 ? parseFloat(precio) : null,
        moneda,
      }),
    });
    closeView('view-register-lot');
    showToast('Lote registrado ✓ (trazabilidad FEFO)', 'ok');
    renderInventory();
    checkAlertBadgesOnLoad();
  } catch (err) {
    showToast(err.message || 'Error al registrar el lote', 'error');
  }
}

// ---------- INGREDIENTE: detalle con lotes + ajuste FEFO ----------
async function openIngredienteDetail(id) {
  const title = document.getElementById('pq-ing-title');
  const sub = document.getElementById('pq-ing-sub');
  const body = document.getElementById('pq-ing-body');
  if (!body) return;
  body.innerHTML = getLoadingHTML();
  if (title) title.textContent = 'Ingrediente';
  if (sub) sub.textContent = 'Lotes disponibles y ajuste de stock (FEFO).';
  openSheet('sheet-ingrediente');

  try {
    const res = await apiFetch(`/inventario/ingredientes/${id}`);
    const ing = res?.data || {};
    const lotes = ing.LoteIngredientes || [];
    if (title) title.textContent = ing.nombre_ing || 'Ingrediente';
    if (sub) sub.textContent = `Stock actual: ${(ing.stock_actual ?? 0)} ${ing.unidad_medida || ''} · Mínimo: ${ing.stock_minimo ?? 0}`;

    body.innerHTML = lotes.length === 0
      ? getEmptyHTML('Sin lotes registrados. Usa "Agregar Lote".')
      : `
        <div style="font-weight:700;font-size:12px;text-transform:uppercase;color:var(--pq-on-surface-muted);margin-bottom:8px;">Lotes (procedimiento FEFO)</div>
        ${lotes.map(l => {
          const cant = parseFloat(l.cantidad_actual || 0);
          const venc = l.fecha_venc ? l.fecha_venc.slice(0, 10) : '—';
          const dias = l.fecha_venc ? Math.ceil((new Date(l.fecha_venc) - new Date()) / 86400000) : null;
          const vencePronto = dias !== null && dias <= 7;
          const precio = l.precio_compra_unitario ? `${monedaFmt(l.precio_compra_unitario, l.moneda)}` : '—';
          return `
          <div style="padding:10px 12px;border-radius:12px;background:var(--pq-surface-1);margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div>
                <div style="font-weight:600;font-size:13px;">Lote #${l.id_lote} · ${cant} ${ing.unidad_medida || ''}</div>
                <div style="font-size:11px;color:var(--pq-on-surface-muted);">Vence ${venc}${dias !== null ? ` · ${dias >= 0 ? dias + ' días' : 'VENCIDO'}` : ''} · ${precio}</div>
              </div>
              ${vencePronto ? '<span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:999px;color:#b26a00;background:rgba(255,193,7,.15);">PRÓXIMO A VENCER</span>' : ''}
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="number" min="0" step="0.01" placeholder="Cantidad real"
                style="flex:1;padding:8px 10px;border:1px solid var(--pq-outline);border-radius:10px;background:var(--pq-surface);color:var(--pq-on-surface);font-size:12px;"
                id="ajuste-${l.id_lote}">
              <button onclick="saveAjuste(${l.id_lote}, ${id})"
                style="padding:8px 14px;border:0;border-radius:10px;background:#785900;color:#fff;font-weight:600;font-size:12px;cursor:pointer;white-space:nowrap;">Ajustar</button>
            </div>
          </div>`;
        }).join('')}
    `;
  } catch (err) {
    body.innerHTML = getErrorHTML('No se pudo cargar el ingrediente.', `openIngredienteDetail(${id})`);
  }
}

function monedaFmt(v, moneda) {
  const num = parseFloat(v || 0);
  return moneda === 'Bs' ? `${num.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.` : `$ ${num.toFixed(2)}`;
}

async function saveAjuste(idLote, idIngrediente) {
  const input = document.getElementById(`ajuste-${idLote}`);
  const nuevaCantidad = input ? parseFloat(input.value) : NaN;
  if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
    showToast('Ingresa la cantidad real del lote', 'error');
    return;
  }
  try {
    const res = await apiFetch('/inventario/ajuste', {
      method: 'POST',
      body: JSON.stringify({ id_lote: idLote, nueva_cantidad: nuevaCantidad, motivo: 'Ajuste manual desde la web' }),
    });
    const anomalia = res?.data?.anomalia;
    if (anomalia) {
      showToast(`Ajustado, pero ojo: ${anomalia.mensaje}`, 'error');
    } else {
      showToast(`Lote #${idLote} ajustado a ${nuevaCantidad} ✓`, 'ok');
    }
    openIngredienteDetail(idIngrediente);
    renderInventory();
    checkAlertBadgesOnLoad();
  } catch (err) {
    showToast(err.message || 'Error al ajustar el lote', 'error');
  }
}

// ---------- RECETAS: verificar stock + simular costo ----------
async function toolReceta(id, tipo) {
  const title = document.getElementById('pq-tool-title');
  const sub = document.getElementById('pq-tool-sub');
  const body = document.getElementById('pq-tool-body');
  if (!body) return;
  openSheet('sheet-receta-tool');
  body.innerHTML = getLoadingHTML();

  try {
    if (tipo === 'stock') {
      if (title) title.textContent = 'Verificar Stock';
      if (sub) sub.textContent = '¿Ingredientes suficientes para producir esta receta?';
      const [detalleRes, recetaRes] = await Promise.all([
        apiFetch(`/recetas/${id}/verificar-stock`),
        apiFetch(`/recetas/${id}`).catch(() => null),
      ]);
      const nombreReceta = recetaRes?.data?.nombre_receta;
      if (nombreReceta && title) title.textContent = `Verificar Stock · ${nombreReceta}`;
      const mapaNombres = new Map(((recetaRes?.data?.RecetaIngredientes) || [])
        .map(ri => [ri.id_ingrediente, ri.Ingrediente?.nombre_ing || ri.Ingrediente?.nombre || null]));
      const d = detalleRes?.data || {};
      const detalles = d.detalles || [];
      if (detalles.length === 0) {
        body.innerHTML = getEmptyHTML('La receta no tiene ingredientes asociados.');
        return;
      }
      body.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:${d.suficiente ? 'rgba(76,175,80,.12)' : 'rgba(255,82,82,.12)'};">
          <span class="material-symbols-outlined" style="color:${d.suficiente ? '#2e7d32' : '#c62828'};">${d.suficiente ? 'check_circle' : 'error'}</span>
          <span style="font-weight:700;font-size:13px;color:${d.suficiente ? '#2e7d32' : '#c62828'};">${d.suficiente ? 'Stock suficiente para producir' : 'Stock insuficiente'}</span>
        </div>
        ${detalles.map(x => {
          const ok = x.suficiente !== undefined ? x.suficiente : (parseFloat(x.disponible) >= parseFloat(x.requerido));
          const nombre = x.ingrediente || x.nombre_ing || x.Ingrediente?.nombre_ing || mapaNombres.get(x.id_ingrediente) || `Ingrediente #${x.id_ingrediente}`;
          return `
          <div style="display:flex;justify-content:space-between;padding:8px 12px;border-radius:10px;background:var(--pq-surface-1);margin-bottom:5px;font-size:12px;">
            <span style="font-weight:600;">${nombre}</span>
            <span style="color:${ok ? 'var(--pq-ok,#2e7d32)' : '#c62828'};">Requiere ${parseFloat(x.cantidad_requerida ?? x.requerido ?? 0)} · Dispone ${parseFloat(x.disponible ?? 0)}</span>
          </div>`;
        }).join('')}
      `;
    } else {
      if (title) title.textContent = 'Simular Costo';
      if (sub) sub.textContent = 'Calculadora de precios con la tasa BCV vigente.';
      const [costoRes] = await Promise.all([
        apiFetch(`/recetas/${id}/simular-costo`),
        apiFetch(`/recetas/${id}`).then(r => {
          const nm = r?.data?.nombre_receta;
          if (nm && title) title.textContent = `Simular Costo · ${nm}`;
        }).catch(() => {}),
      ]);
      const c = costoRes?.data || {};
      const cp = c.costoProduccion || {};
      const pm = c.precioMinimoRecomendado || {};
      const ps = c.precioSugerido || {};
      const fila = (label, usd, bs, strong) => `
        <div style="display:flex;justify-content:space-between;padding:${strong ? '10px' : '8px'} 12px;border-radius:10px;background:var(--pq-surface-1);margin-bottom:5px;font-size:${strong ? '13px' : '12px'};${strong ? 'font-weight:700;border:1px solid rgba(255,193,7,.35);' : ''}">
          <span>${label}</span>
          <span>$ ${parseFloat(usd ?? 0).toFixed(2)} · ${parseFloat(bs ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
        </div>`;
      body.innerHTML = `
        ${fila('Costo de producción', cp.USD, cp.Bs)}
        ${fila('Precio mínimo (20% margen)', pm.USD, pm.Bs)}
        ${fila('Precio sugerido (35% margen)', ps.USD, ps.Bs, true)}
        <div style="font-size:11px;color:var(--pq-on-surface-muted);margin-top:8px;">Márgenes: mínimo ${c.margenMinimo || '20%'} · sugerido ${c.margenSugerido || '35%'}</div>
      `;
    }
  } catch (err) {
    body.innerHTML = getErrorHTML('No se pudo calcular la herramienta.', `toolReceta(${id}, '${tipo}')`);
  }
}

// --- ORDERS ---
async function renderOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  container.innerHTML = getLoadingHTML();

  try {
    let url = '/pedidos?limit=50';
    if (activeOrderFilter !== 'all') {
      const filterMap = {
        'pending': 'Pendiente',
        'production': 'En Cocina',
        'done': 'Listo',
        'delivered': 'Entregado'
      };
      if (filterMap[activeOrderFilter]) {
        url += `&estado_entrega=${encodeURIComponent(filterMap[activeOrderFilter])}`;
      }
    }

    const res = await apiFetch(url);
    let orders = res.data && res.data.pedidos ? res.data.pedidos : [];

    const searchVal = document.getElementById('orders-search') ? document.getElementById('orders-search').value.trim().toLowerCase() : '';
    if (searchVal) {
      orders = orders.filter(o => {
        const clientName = o.Cliente ? `${o.Cliente.nombre} ${o.Cliente.apellido || ''}`.toLowerCase() : '';
        const orderId = String(o.id_pedido || o.id);
        return orderId.includes(searchVal) || clientName.includes(searchVal);
      });
    }

    if (orders.length === 0) {
      container.innerHTML = getEmptyHTML('No hay órdenes registradas.');
      return;
    }

    const statusMap = {
      'Pendiente': { label: 'Pendiente', class: 'bg-[#FFF8E1] text-[#FF9800]', border: 'border-orange-400' },
      'En Cocina': { label: 'En Cocina', class: 'bg-blue-50 text-blue-600', border: 'border-blue-400' },
      'Listo': { label: 'Listo', class: 'bg-tertiary-container/20 text-tertiary', border: 'border-tertiary-container' },
      'Entregado': { label: 'Entregado', class: 'bg-gray-100 text-gray-600', border: 'border-gray-400' }
    };

    container.innerHTML = orders.map(o => {
      const clientName = o.Cliente ? `${o.Cliente.nombre} ${o.Cliente.apellido || ''}`.trim() : 'Sin cliente';
      const statusConfig = statusMap[o.estado_entrega] || { label: o.estado_entrega, class: 'bg-gray-100 text-gray-600', border: 'border-gray-300' };
      const fecha = o.fecha_pedido ? new Date(o.fecha_pedido).toLocaleDateString('es-VE') : '—';
      const total = fmtMoneyHTML(o.costo_total);

      return `
        <div class="bg-surface-container-lowest p-3 rounded-xl card-shadow border-l-3 ${statusConfig.border}">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-1.5">
              <span class="font-label-bold text-sm text-on-surface">#${o.id_pedido || o.id}</span>
              <span class="${statusConfig.class} px-2 py-0.5 rounded-lg text-xs font-label-bold flex items-center gap-1">
                ${statusConfig.label}
              </span>
            </div>
            <span class="text-primary font-title-sm text-sm">${total}</span>
          </div>
          <div class="grid grid-cols-2 gap-y-0.5 text-xs text-on-surface-variant mb-2">
            <span class="font-label-bold">Cliente:</span><span>${clientName}</span>
            <span class="font-label-bold">Fecha:</span><span>${fecha}</span>
            <span class="font-label-bold">Pago:</span><span>${o.estado_pago || 'Pendiente'}</span>
          </div>
          <button class="w-full flex items-center justify-between text-primary font-button-text py-1.5 border-t border-surface-variant mt-1.5 group text-sm" onclick="showOrderDetailBackend('${o.id_pedido || o.id}')">
            Ver Detalle <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform text-sm">arrow_forward</span>
          </button>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = getErrorHTML('Error al obtener órdenes desde el backend.', 'renderOrders()');
  }
}

async function showOrderDetailBackend(orderId) {
  try {
    const res = await apiFetch(`/pedidos/${orderId}`);
    if (res && res.data) {
      const o = res.data;
      const clientName = o.Cliente ? `${o.Cliente.nombre} ${o.Cliente.apellido || ''}`.trim() : 'Sin datos';
      openModal(`Detalle del Pedido #${o.id_pedido}`, `
        Costo Total: ${fmtMoney(o.costo_total)}\n
        Cliente: ${clientName}\n
        Estado Entrega: ${o.estado_entrega}\n
        Estado Pago: ${o.estado_pago}\n
        Fecha: ${o.fecha_pedido ? new Date(o.fecha_pedido).toLocaleString('es-VE') : '—'}
      `);
    }
  } catch (err) {
    alert('Error al consultar el detalle de la orden.');
  }
}

// --- CLIENTS ---
async function renderClients() {
  const container = document.getElementById('clients-list');
  if (!container) return;

  container.innerHTML = getLoadingHTML();

  const searchVal = document.getElementById('clients-search') ? document.getElementById('clients-search').value.trim() : '';

  try {
    let url = '/clientes?limit=50';
    if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;

    const res = await apiFetch(url);
    const clients = res.data && res.data.clientes ? res.data.clientes : [];

    if (clients.length === 0) {
      container.innerHTML = getEmptyHTML('No se encontraron clientes.');
      return;
    }

    container.innerHTML = clients.map(c => {
      const name = `${c.nombre} ${c.apellido || ''}`.trim();
      const initial = name ? name.charAt(0).toUpperCase() : 'C';
      const phone = c.telefono || 'Sin teléfono';
      const cedula = c.cedula ? `C.I. ${c.cedula}` : '';

      return `
        <div class="bg-surface-container-lowest p-3 rounded-xl card-shadow flex items-center justify-between group active:scale-[0.99] transition-transform">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#FFC107] flex items-center justify-center text-on-primary-container font-bold text-sm">${initial}</div>
            <div>
              <h3 class="font-title-sm text-sm font-semibold text-on-surface">${name}</h3>
              <p class="text-xs text-[#757575] flex items-center gap-1"><span class="material-symbols-outlined text-sm">call</span> ${phone}</p>
              <p class="text-[11px] font-medium text-primary bg-[#FFF8E1] px-2 py-0.5 rounded-full inline-block">${cedula}</p>
            </div>
          </div>
          <button class="w-8 h-8 rounded-full flex items-center justify-center text-[#FFC107] hover:bg-secondary-container transition-colors" onclick="showClientHistoryBackend('${c.id_cliente}')">
            <span class="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </button>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = getErrorHTML('Error al cargar la lista de clientes.', 'renderClients()');
  }
}

async function showClientHistoryBackend(clientId) {
  try {
    const res = await apiFetch(`/clientes/${clientId}/historial`);
    const pedidos = res.data || [];
    openModal(`Historial de Cliente`, `El cliente tiene ${pedidos.length} pedido(s) registrado(s).`);
  } catch (err) {
    alert('Error al consultar historial del cliente.');
  }
}

// --- PROFILE ---
async function renderProfile() {
  const nombreEl = document.querySelector('.profile-name');
  const rolEl = document.querySelector('.profile-role');
  const emailEl = document.getElementById('profile-email');
  const phoneEl = document.getElementById('profile-phone');
  const miembroEl = document.getElementById('stat-miembro');
  const pedidosEl = document.getElementById('stat-pedidos');
  const ingEl = document.getElementById('stat-ingredientes');

  // Datos base del token almacenado (instantáneo)
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch (e) {}

  try {
    const res = await apiFetch('/auth/perfil');
    const u = res?.data || user || {};
    if (nombreEl) nombreEl.textContent = [u.nombre, u.apellido].filter(Boolean).join(' ') || 'PanQueo';
    if (rolEl) rolEl.textContent = (u.rol || 'Propietario').charAt(0).toUpperCase() + (u.rol || 'Propietario').slice(1);
    if (emailEl) emailEl.textContent = u.email || '—';
    if (phoneEl) phoneEl.textContent = u.telefono || '—';
    if (miembroEl) miembroEl.textContent = u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-VE') : '—';

    // Estadísticas reales
    if (pedidosEl) {
      apiFetch('/pedidos?limit=100').then(r => {
        const pedidos = r?.data?.pedidos || [];
        pedidosEl.textContent = pedidos.length;
      }).catch(() => { pedidosEl.textContent = '—'; });
    }
    if (ingEl) {
      apiFetch('/inventario/ingredientes?limit=100').then(r => {
        const ings = Array.isArray(r?.data) ? r.data : [];
        ingEl.textContent = ings.length;
      }).catch(() => { ingEl.textContent = '—'; });
    }
  } catch (err) {
    // fallback con datos de sesión local
    if (nombreEl) nombreEl.textContent = user?.nombre || 'PanQueo';
    if (rolEl) rolEl.textContent = user?.rol || 'Propietario';
    if (emailEl) emailEl.textContent = user?.email || '—';
  }
}

// Guardar cambios de perfil (PUT /auth/perfil)
async function handleUpdateProfile() {
  const btn = event?.target?.closest('form')?.querySelector('button[type="submit"]');
  const original = btn ? btn.innerHTML : null;
  if (btn) { btn.disabled = true; }
  try {
    const nombre = document.getElementById('ep-nombre')?.value.trim();
    const apellido = document.getElementById('ep-apellido')?.value.trim();
    const telefono = document.getElementById('ep-telefono')?.value.trim();
    if (!nombre) { showToast('El nombre es obligatorio', 'error'); return; }

    const res = await apiFetch('/auth/perfil', {
      method: 'PUT',
      body: JSON.stringify({ nombre, apellido, telefono }),
    });
    const u = res?.data || {};
    // sincronizar el usuario de la sesión local
    let local = {};
    try { local = JSON.parse(localStorage.getItem('user')) || {}; } catch (e) {}
    localStorage.setItem('user', JSON.stringify({ ...local, ...u }));

    closeView('view-edit-profile');
    showToast('Perfil actualizado ✓', 'ok');
    renderProfile();
  } catch (err) {
    showToast(err.message || 'No se pudo actualizar el perfil', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}

// Form Submission Actions
async function submitNewClient(e) {
  if (e) e.preventDefault();
  const nombre = document.getElementById('newcli-name') ? document.getElementById('newcli-name').value.trim() : '';
  const phone = document.getElementById('newcli-phone') ? document.getElementById('newcli-phone').value.trim() : '';

  if (!nombre) {
    alert('El nombre del cliente es obligatorio.');
    return;
  }

  try {
    await apiFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        telefono: phone || '—',
        cedula: `CLI-${Date.now().toString().slice(-6)}`
      })
    });
    closeModal();
    renderClients();
    alert('Cliente registrado exitosamente en el servidor.');
  } catch (err) {
    alert(err.message || 'Error al guardar cliente.');
  }
}

function adjustQty(delta) {
  const input = document.getElementById('lot-qty');
  if (input) {
    let val = parseInt(input.value) || 0;
    val += delta;
    if (val < 1) val = 1;
    input.value = val;
  }
}

function selectAdjustType(type) {
  ['entrada','salida','merma'].forEach(t => {
    const el = document.getElementById(`btn-${t}`);
    if (el) {
      if (t === type) { el.classList.add('tab-active'); el.classList.remove('text-secondary'); }
      else { el.classList.remove('tab-active'); el.classList.add('text-secondary'); }
    }
  });
}

function validateAdjustAmount(val) {
  const warning = document.getElementById('adjust-warning');
  if (warning) {
    if (parseFloat(val) > 30) warning.classList.remove('hidden');
    else warning.classList.add('hidden');
  }
}

function setTheme(mode) {
  localStorage.setItem('PQ_THEME', mode);
  applyTheme(mode);
}

// Cambia el modo de visualización de la bimoneda desde Configuración
function setPQCurrencyMode(mode) {
  if (!['dual', 'usd', 'bs'].includes(mode)) return;
  localStorage.setItem('PQ_CUR_MODE', mode);
  renderRatePill();
  renderAll();
}
