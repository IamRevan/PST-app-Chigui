let isLoggedIn = false;
let activeOrderFilter = 'Todos';

const API_BASE = 'http://192.168.1.100:3000/api';

const mockOrders = [
  { id: '#1045', client: 'Juan Pérez', total: '$25.50', status: 'Pendiente', date: '18/06/2024 - 10:00', delivery: true, items: 'Pastel de Tres Leches x1, Cupcakes x6' },
  { id: '#1044', client: 'María García', total: 'Bs 850,00', status: 'En Cocina', date: '18/06/2024 - 09:30', delivery: false, items: 'Torta de Chocolate x1, Galletas x12' },
  { id: '#1043', client: 'Eventos S.A.', total: '$120.00', status: 'Listo', date: '17/06/2024 - 16:00', delivery: false, items: 'Pastel Corporativo x1, Cupcakes x24' },
];

const mockClients = [
  { name: 'María Pérez', initial: 'M', phone: '+58 412 123 4567', orders: 12, lastOrder: '15/06/2026', email: 'maria@ejemplo.com', address: 'Calle Sucre #45' },
  { name: 'Juan Rodríguez', initial: 'J', phone: '+58 414 765 4321', orders: 5, lastOrder: '10/06/2026', email: 'juan@ejemplo.com', address: 'Av. Bolívar #123' },
  { name: 'Ana Martínez', initial: 'A', phone: '+58 426 998 8776', orders: 28, lastOrder: '14/06/2026', email: 'ana@ejemplo.com', address: 'Urb. Las Flores' },
  { name: 'Roberto Salas', initial: 'R', phone: '+58 412 555 0199', orders: 1, lastOrder: '01/06/2026', email: 'roberto@ejemplo.com', address: 'Calle Junín #67' },
];

const mockInventory = [
  { name: 'Leche Entera', unit: 'Litros', stock: 15, max: 20, status: 'En Stock', icon: '🥛' },
  { name: 'Harina 0000', unit: 'Kilogramos', stock: 2, max: 50, status: 'Bajo', icon: '🌾' },
  { name: 'Huevos de Campo', unit: 'Docenas', stock: 12, max: 24, status: 'En Stock', icon: '🥚' },
];

const mockDashOrders = [
  { id: '#1042', name: 'Pastel de Tres Leches', client: 'Cliente A', due: '14:00' },
  { id: '#1043', name: 'Docena de Empanadas', client: 'Cliente B', due: '16:30' },
  { id: '#1044', name: 'Torta de Chocolate', client: 'Evento Z', due: '18:00' },
];

const mockMovements = [
  { type: 'Entrada', qty: '+50 kg', desc: 'Compra a Proveedor', date: '07 Oct 2023', color: '#2E7D32', bg: '#E8F5E9' },
  { type: 'Salida', qty: '-2 kg', desc: 'Producción - Pan de Mantequilla', date: '07 Oct 2023', color: '#C62828', bg: '#FFEBEE' },
  { type: 'Salida', qty: '-1.5 kg', desc: 'Producción - Croissant', date: '06 Oct 2023', color: '#C62828', bg: '#FFEBEE' },
  { type: 'Ajuste', qty: '-0.5 kg', desc: 'Ajuste de inventario', date: '05 Oct 2023', color: '#1565C0', bg: '#E3F2FD' },
];

const mockNotifs = [
  { title: 'Stock bajo', desc: 'Harina de Trigo está por debajo del mínimo (45 kg restantes)', time: 'Hace 2 horas', color: '#FF9800', bg: '#FFF8E1' },
  { title: 'Lote próximo a vencer', desc: 'Lote #L-023 de Leche vence en 3 días', time: 'Hace 5 horas', color: '#ba1a1a', bg: '#FFEBEE' },
  { title: 'Pedido #P-102 completado', desc: 'El pedido de María González está listo para entrega', time: 'Hace 1 día', color: '#4CAF50', bg: '#E8F5E9' },
];

// Splash
setTimeout(() => {
  showScreen('splash-screen', false);
  showScreen('auth-screen', true);
}, 1500);

function showScreen(id, show) {
  const el = document.getElementById(id);
  if (show) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

function togglePassword() {
  const input = document.getElementById('login-password');
  const icon = document.querySelector('.toggle-password');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.textContent = '🙈';
  } else {
    input.type = 'password';
    if (icon) icon.textContent = '👁️';
  }
}

// Modal system
function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// Auth navigation
function showRegister() {
  hideAllAuthForms();
  document.getElementById('register-form').classList.remove('hidden');
}
function showLogin() {
  hideAllAuthForms();
  document.getElementById('login-form').classList.remove('hidden');
}
function showReset() {
  hideAllAuthForms();
  document.getElementById('reset-form').classList.remove('hidden');
}
function hideAllAuthForms() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('reset-form').classList.add('hidden');
  document.getElementById('error-message').classList.add('hidden');
}

function showError(msg) {
  const el = document.getElementById('error-message');
  el.textContent = msg;
  el.classList.remove('hidden');
}

// Auth handlers (MVP demo: instant, sin backend)
function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showError('Todos los campos son requeridos'); return; }
  localStorage.setItem('token', 'demo_token');
  enterApp();
}

function handleRegister() {
  const ids = ['reg-nombre','reg-apellido','reg-email','reg-telefono','reg-password'];
  if (ids.some(id => !document.getElementById(id).value.trim())) {
    showError('Todos los campos son requeridos');
    return;
  }
  document.getElementById('login-email').value = document.getElementById('reg-email').value;
  showLogin();
  showError('Registro exitoso. Inicia sesión.');
}

function handleReset() {
  showLogin();
}

function enterApp() {
  isLoggedIn = true;
  ['splash-screen','auth-screen'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('main-screen').classList.remove('hidden');
  renderDashboardOrders();
  renderInventory();
  renderOrders();
  renderClients();
  renderOrderFilters();
}

function handleLogout() {
  isLoggedIn = false;
  localStorage.removeItem('token');
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
}

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Currency toggle
function toggleCurrency(currency) {
  document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.currency-btn.${currency}`).classList.add('active');
}

// Status helpers
function statusStyle(s) {
  const m = { 'Pendiente':'pendiente','En Cocina':'enCocina','Listo':'listo','Entregado':'entregado' };
  return m[s] || 'default';
}
function statusBorder(s) {
  const m = { 'Pendiente':'#FF9800','En Cocina':'#2196F3','Listo':'#4CAF50','Entregado':'#9E9E9E' };
  return m[s] || '#e5e2e1';
}

// Dashboard orders
function renderDashboardOrders() {
  const c = document.getElementById('dashboard-orders');
  c.innerHTML = mockDashOrders.map(o => `
    <div class="dash-order">
      <div class="dash-order-left">
        <div class="dash-order-id-row">
          <span class="dash-order-num">${o.id}</span>
          <span class="dash-order-dot"></span>
          <span class="dash-order-due">Due: ${o.due}</span>
        </div>
        <div class="dash-order-name">${o.name}</div>
        <div class="dash-order-client">${o.client}</div>
      </div>
      <button class="dash-order-btn" onclick="switchTab('orders')">Ver →</button>
    </div>
  `).join('');
}

// Inventory
function renderInventory() {
  const c = document.getElementById('inventory-list');
  c.innerHTML = mockInventory.map(item => {
    const pct = Math.round((item.stock / item.max) * 100);
    const isCritical = item.status === 'Bajo';
    return `
      <div class="inv-item${isCritical ? ' critical' : ''}">
        <div class="inv-top">
          <div class="inv-top-left">
            <div class="inv-icon">${item.icon}</div>
            <div>
              <div class="inv-name">${item.name}</div>
              <div class="inv-unit">Unidad: ${item.unit}</div>
            </div>
          </div>
          <span class="badge ${isCritical ? 'critical' : 'success'}">${item.status}</span>
        </div>
        <div class="inv-stock">
          <span>Nivel de inventario</span>
          <span${isCritical ? ' style="color:#ba1a1a;"' : ''}>${item.stock} / ${item.max} ${item.unit.charAt(0)}</span>
        </div>
        <div class="inv-bar">
          <div class="inv-bar-fill" style="width:${pct}%;background:${isCritical ? '#ba1a1a' : '#006e1c'};"></div>
        </div>
        <div class="inv-actions">
          <button class="inv-btn-secondary" onclick="showHistory('${item.name}')">Ver Historial</button>
          <button class="${isCritical ? 'inv-btn-restock-critical' : 'inv-btn-primary'}" onclick="showRestockForm('${item.name}')">Restock</button>
        </div>
      </div>
    `;
  }).join('');
}

function showHistory(productName) {
  const movs = mockMovements.map(m => `
    <div class="modal-mov-item">
      <div>
        <span class="modal-mov-type" style="background:${m.bg};color:${m.color}">${m.type}</span>
        <div class="modal-mov-desc">${m.desc}</div>
        <div class="modal-mov-date">${m.date}</div>
      </div>
      <span class="modal-mov-qty" style="color:${m.color}">${m.qty}</span>
    </div>
  `).join('');
  openModal('Historial — ' + productName, `
    <div class="modal-field" style="margin-bottom:12px;">
      <div class="modal-detail-row"><span class="modal-detail-label">Stock actual</span><span class="modal-detail-value">42.5 kg</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Stock mínimo</span><span class="modal-detail-value">5 kg</span></div>
    </div>
    ${movs}
  `);
}

function showRestockForm(productName) {
  openModal('Restock — ' + productName, `
    <form class="modal-form" onsubmit="submitRestock(event, '${productName}')">
      <div class="modal-field">
        <label>N° de Lote</label>
        <input type="text" id="restock-lote" placeholder="Ej: LT-10500" required />
      </div>
      <div class="modal-field">
        <label>Cantidad</label>
        <input type="text" id="restock-qty" placeholder="Ej: 25 kg" required />
      </div>
      <div class="modal-field">
        <label>Fecha de ingreso</label>
        <input type="date" id="restock-ingress" required />
      </div>
      <div class="modal-field">
        <label>Fecha de vencimiento</label>
        <input type="date" id="restock-expiry" required />
      </div>
      <div class="modal-field">
        <label>Proveedor</label>
        <input type="text" id="restock-provider" placeholder="Nombre del proveedor" />
      </div>
      <button type="submit" class="btn btn-primary">Registrar Lote</button>
    </form>
  `);
}

function submitRestock(e, productName) {
  e.preventDefault();
  closeModal();
  openModal('✅ Lote Registrado', `
    <p style="text-align:center;margin-bottom:16px;font-size:15px;color:#4f4632;">
      Se ha registrado el lote de <strong>${productName}</strong> exitosamente.
    </p>
    <button class="btn btn-primary" onclick="closeModal()">Listo</button>
  `);
}

// Notifications
function openNotifs() {
  const notifs = mockNotifs.map(n => `
    <div class="modal-notif-item" style="background:${n.bg}">
      <div class="modal-notif-icon" style="background:${n.color}20;color:${n.color};font-size:14px;">•</div>
      <div class="modal-notif-text">
        <div class="modal-notif-title">${n.title}</div>
        <div class="modal-notif-desc">${n.desc}</div>
        <div class="modal-notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
  openModal('Notificaciones', notifs || '<p style="text-align:center;color:#4f4632;">No hay notificaciones</p>');
}

// Orders
function renderOrderFilters() {
  const filters = ['Todos', 'Pendientes', 'En Cocina', 'Listos', 'Entregados'];
  const c = document.getElementById('order-filters');
  c.innerHTML = filters.map(f =>
    `<button class="filter-pill${f === activeOrderFilter ? ' active' : ''}" onclick="setFilter('${f}')">${f}</button>`
  ).join('');
}

function setFilter(f) {
  activeOrderFilter = f;
  renderOrderFilters();
  renderOrders();
}

function renderOrders() {
  const c = document.getElementById('orders-list');
  let filtered = mockOrders;
  if (activeOrderFilter !== 'Todos') {
    if (activeOrderFilter === 'Pendientes') filtered = mockOrders.filter(o => o.status === 'Pendiente');
    else if (activeOrderFilter === 'En Cocina') filtered = mockOrders.filter(o => o.status === 'En Cocina');
    else if (activeOrderFilter === 'Listos') filtered = mockOrders.filter(o => o.status === 'Listo');
    else if (activeOrderFilter === 'Entregados') filtered = mockOrders.filter(o => o.status === 'Entregado');
  }
  c.innerHTML = filtered.map(o => `
    <div class="order-item" style="border-left-color:${statusBorder(o.status)};">
      <div class="order-top">
        <div class="order-top-left">
          <span class="order-id">${o.id}</span>
          <span class="badge ${statusStyle(o.status)}"><span class="dot" style="background:${statusBorder(o.status)}"></span> ${o.status}</span>
          ${o.delivery ? '<span>🚚</span>' : ''}
        </div>
        <span class="order-total">${o.total}</span>
      </div>
      <div class="order-details">
        <div class="order-detail"><strong>Cliente:</strong> <span>${o.client}</span></div>
        <div class="order-detail"><strong>Fecha:</strong> <span>${o.date}</span></div>
      </div>
      <div class="order-view" onclick="showOrderDetail('${o.id}')"><span>Ver Detalle</span><span>→</span></div>
    </div>
  `).join('');
}

function showOrderDetail(orderId) {
  const o = mockOrders.find(x => x.id === orderId);
  if (!o) return;
  openModal('Detalle de ' + orderId, `
    <div class="modal-field">
      <div class="modal-detail-row"><span class="modal-detail-label">Cliente</span><span class="modal-detail-value">${o.client}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Estado</span><span class="badge ${statusStyle(o.status)}"><span class="dot" style="background:${statusBorder(o.status)}"></span> ${o.status}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Total</span><span class="modal-detail-value">${o.total}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Fecha</span><span class="modal-detail-value">${o.date}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Productos</span><span class="modal-detail-value" style="font-size:13px;">${o.items}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Entrega</span><span class="modal-detail-value">${o.delivery ? '🚚 A domicilio' : '📍 Recoge en local'}</span></div>
    </div>
    <button class="btn btn-primary" style="margin-top:12px;" onclick="closeModal()">Cerrar</button>
  `);
}

function addMockOrder() {
  const num = Math.floor(Math.random() * 9000) + 1000;
  mockOrders.unshift({
    id: `#${num}`,
    client: 'Nuevo Cliente',
    total: `Bs ${(Math.random() * 500).toFixed(2)}`,
    status: 'Pendiente',
    date: new Date().toLocaleDateString('es-VE') + ' - ' + new Date().toLocaleTimeString('es-VE', {hour:'2-digit',minute:'2-digit'}),
    delivery: Math.random() > 0.5,
    items: 'Producto personalizado x1'
  });
  renderOrders();
}

// Clients
function renderClients() {
  const c = document.getElementById('clients-list');
  c.innerHTML = mockClients.map(cl => `
    <div class="client-item" onclick="showClientProfile('${cl.name}')">
      <div class="client-left">
        <div class="client-avatar">${cl.initial}</div>
        <div>
          <div class="client-name">${cl.name}</div>
          <div class="client-phone">📞 ${cl.phone}</div>
          <div class="client-meta">${cl.orders} pedidos · Último: ${cl.lastOrder}</div>
        </div>
      </div>
      <span class="client-arrow">→</span>
    </div>
  `).join('');
}

function showClientProfile(clientName) {
  const cl = mockClients.find(x => x.name === clientName);
  if (!cl) return;
  openModal('Perfil de ' + cl.name, `
    <div class="modal-client-card">
      <div class="modal-client-avatar">${cl.initial}</div>
      <div class="modal-client-info">
        <div class="modal-client-name">${cl.name}</div>
        <div class="modal-client-meta">📞 ${cl.phone}</div>
      </div>
    </div>
    <div class="modal-field">
      <div class="modal-detail-row"><span class="modal-detail-label">Email</span><span class="modal-detail-value">${cl.email}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Dirección</span><span class="modal-detail-value">${cl.address}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Total pedidos</span><span class="modal-detail-value">${cl.orders}</span></div>
      <div class="modal-detail-row"><span class="modal-detail-label">Último pedido</span><span class="modal-detail-value">${cl.lastOrder}</span></div>
    </div>
    <button class="btn btn-primary" style="margin-top:12px;" onclick="closeModal()">Cerrar</button>
  `);
}

// Nuevo Cliente form
function openNewClientForm() {
  openModal('Nuevo Cliente', `
    <form class="modal-form" onsubmit="submitNewClient(event)">
      <div class="modal-field">
        <label>Nombre completo</label>
        <input type="text" id="newcli-name" placeholder="Ej: Carlos Mendoza" required />
      </div>
      <div class="modal-field">
        <label>Teléfono</label>
        <input type="tel" id="newcli-phone" placeholder="+58 412 123 4567" />
      </div>
      <div class="modal-field">
        <label>Email</label>
        <input type="email" id="newcli-email" placeholder="correo@ejemplo.com" />
      </div>
      <div class="modal-field">
        <label>Dirección</label>
        <input type="text" id="newcli-address" placeholder="Dirección" />
      </div>
      <button type="submit" class="btn btn-primary">Registrar Cliente</button>
    </form>
  `);
}

function submitNewClient(e) {
  e.preventDefault();
  const name = document.getElementById('newcli-name').value.trim();
  mockClients.unshift({ name, initial: name.charAt(0).toUpperCase(), phone: document.getElementById('newcli-phone').value || '—', orders: 0, lastOrder: '—', email: document.getElementById('newcli-email').value || '—', address: document.getElementById('newcli-address').value || '—' });
  renderClients();
  closeModal();
  openModal('✅ Cliente Registrado', `
    <p style="text-align:center;margin-bottom:16px;font-size:15px;color:#4f4632;">
      <strong>${name}</strong> se ha agregado como cliente exitosamente.
    </p>
    <button class="btn btn-primary" onclick="closeModal()">Listo</button>
  `);
}

// Editar Perfil
function openEditProfile() {
  openModal('Editar Perfil', `
    <form class="modal-form" onsubmit="submitEditProfile(event)">
      <div class="modal-field">
        <label>Nombre</label>
        <input type="text" id="edit-name" value="Capibara Sprinkle" />
      </div>
      <div class="modal-field">
        <label>Email</label>
        <input type="email" id="edit-email" value="hello@panqueo.com" />
      </div>
      <div class="modal-field">
        <label>Teléfono</label>
        <input type="tel" id="edit-phone" value="+34 600 000 000" />
      </div>
      <button type="submit" class="btn btn-primary">Guardar Cambios</button>
    </form>
  `);
}

function submitEditProfile(e) {
  e.preventDefault();
  closeModal();
  openModal('✅ Perfil Actualizado', `
    <p style="text-align:center;margin-bottom:16px;font-size:15px;color:#4f4632;">
      Tus datos se han actualizado correctamente.
    </p>
    <button class="btn btn-primary" onclick="closeModal()">Listo</button>
  `);
}

// Enter key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const auth = document.getElementById('auth-screen');
    if (!auth.classList.contains('hidden')) {
      if (!document.getElementById('login-form').classList.contains('hidden')) handleLogin();
      else if (!document.getElementById('register-form').classList.contains('hidden')) handleRegister();
      else handleReset();
    }
  }
});
