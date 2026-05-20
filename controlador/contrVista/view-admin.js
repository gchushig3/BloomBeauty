import { getProducts, getAllOrders, increaseProductStock, updateOrderStatus } from './data.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Verificación de Seguridad: Solo el administrador específico puede acceder
  const user = JSON.parse(localStorage.getItem("bb_user") || "null");
  if (!user || user.email !== 'admin@gloriachushig.com') {
    window.location.href = '../index.html';
    return;
  }
  // Si es el admin, mostramos el contenido
  document.getElementById("admin-content")?.classList.remove("hidden");

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const searchInput = document.getElementById("search-stock");
  const stockList = document.getElementById("stock-list");
  const ordersList = document.getElementById("orders-list");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove("tab-active"));
      btn.classList.add("tab-active");

      tabPanes.forEach(pane => {
        pane.classList.toggle("hidden", pane.id !== `pane-${target}`);
      });
      
      if (target === 'stock') loadStock();
      if (target === 'pedidos') loadOrders();
    });
  });

  // Delegación de eventos para actualización de Stock
  if (stockList) {
    stockList.addEventListener("click", async (e) => {
      const btn = e.target.closest('button[data-action="update-stock"]');
      if (!btn) return;

      const id = btn.dataset.id;
      const input = document.getElementById(`add-${id}`);
      const amount = input ? parseInt(input.value) : 0;

      if (isNaN(amount) || amount <= 0) {
        if (typeof showToast === 'function') showToast("⚠️ Ingresa una cantidad válida");
        return;
      }

      const ok = await increaseProductStock(id, amount);
      if (ok) {
        if (typeof showToast === 'function') showToast(`✓ Stock incrementado en ${amount}`);
        loadStock(searchInput?.value || "");
      }
    });
  }

  // Delegación de eventos para cambio de Estado de Pedidos
  if (ordersList) {
    ordersList.addEventListener("change", async (e) => {
      const select = e.target.closest('select[data-action="update-status"]');
      if (!select) return;

      const id = select.dataset.id;
      const statusId = select.value;

      const ok = await updateOrderStatus(id, statusId);
      if (ok && typeof showToast === 'function') {
        showToast(`✓ Estado del pedido #${id} actualizado`);
        loadOrders();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => loadStock(e.target.value));
  }

  // Carga inicial
  loadStock();
});

async function loadStock(filter = "") {
  const products = await getProducts();
  const list = document.getElementById("stock-list");
  if (!list) return;

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.brand.toLowerCase().includes(filter.toLowerCase())
  );

  list.innerHTML = filtered.map(p => `
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="p-4 flex items-center gap-3">
        <img src="${p.img}" class="w-10 h-10 object-contain rounded-lg border border-gray-100 shadow-sm" />
        <div class="flex flex-col">
          <span class="font-bold text-sm text-gray-800">${p.name}</span>
          <span class="text-[10px] text-gray-400">ID: ${p.id}</span>
        </div>
      </td>
      <td class="p-4 text-xs font-bold text-coral uppercase tracking-tighter">${p.brand}</td>
      <td class="p-4 font-black text-brown text-lg">${p.stock || 0}</td>
      <td class="p-4">
        <input type="number" id="add-${p.id}" value="10" min="1" 
               class="w-20 px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-coral/20 outline-none text-sm font-bold">
      </td>
      <td class="p-4 text-center">
        <button data-id="${p.id}" data-action="update-stock"
                class="bg-coral text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brown transition shadow-sm active:scale-95">
          Aumentar
        </button>
      </td>
    </tr>
  `).join("");
}

async function loadOrders() {
  const orders = await getAllOrders();
  const list = document.getElementById("orders-list");
  if (!list) return;

  list.innerHTML = orders.map(o => `
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="p-4 font-black text-sm text-brown">#${o.ped_codigo}</td>
      <td class="p-4 text-xs font-medium text-gray-600">${o.cli_ci_ruc}</td>
      <td class="p-4 text-xs text-gray-400">${new Date(o.created_at).toLocaleDateString()}</td>
      <td class="p-4 font-bold text-gray-800">$${o.ped_total.toFixed(2)}</td>
      <td class="p-4 italic text-sm text-coral font-medium">${o.estado_pedido.est_descripcion}</td>
      <td class="p-4 text-center">
        <select data-id="${o.ped_codigo}" data-action="update-status"
                class="text-xs font-bold border-2 border-gray-100 rounded-xl px-3 py-2 focus:ring-2 focus:ring-coral/20 outline-none bg-white cursor-pointer">
           <option value="" disabled selected>Cambiar estado...</option>
           <option value="1">Pagado</option>
           <option value="2">Enviado</option>
           <option value="3">Entregado</option>
           <option value="4">Cancelado</option>
        </select>
      </td>
    </tr>
  `).join("");
}