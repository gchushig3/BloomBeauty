/**
 * Controlador de la vista del Carrito
 * Maneja el renderizado y la interacción del usuario en carrito.html
 */
import { getProducts } from './data.js';
import { getCart, saveCart, updateQty, removeFromCart, cartTotal } from './carrito.js';

async function renderCart() {
  const container = document.getElementById("cart-content");
  if (!container) return;

  const cart = getCart();
  const PRODUCTS = await getProducts();

  // Filtrar solo los elementos del carrito que existen en la lista de productos
  // y asegurar la comparación de IDs como strings.
  const validItems = cart.filter(item => PRODUCTS.some(p => String(p.id) === String(item.id)));

  if (validItems.length === 0) {
    container.innerHTML = `
      <div class="text-center py-20 px-6">
        <div class="bg-rose/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-brown">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-brown mb-2">Tu carrito está vacío</h2>
        <p class="text-gray-500 mb-8 max-w-xs mx-auto">Parece que aún no has añadido nada a tu bolsa de belleza.</p>
        <a href="../index.html"
           class="inline-block bg-coral text-white font-bold px-8 py-4 rounded-xl hover:bg-brown transition-all shadow-lg active:scale-95">
          Explorar Productos
        </a>
      </div>`;
    return;
  }

  const itemsHTML = validItems.map(item => {
    const p = PRODUCTS.find(x => String(x.id) === String(item.id));
    
    return `
      <div class="flex gap-4 md:gap-6 bg-white border border-gray-100 rounded-2xl p-4 md:p-6 items-start shadow-soft transition-hover hover:shadow-card">
        <a href="producto.html?id=${p.id}" class="shrink-0">
          <img src="${p.img}" alt="${p.name}" class="w-20 h-20 md:w-28 md:h-28 object-contain bg-gray-50 rounded-xl" />
        </a>
        <div class="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p class="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">${p.brand}</p>
            <h4 class="font-bold text-base md:text-lg text-gray-800 leading-tight mb-2 hover:text-coral transition-colors">
              <a href="producto.html?id=${p.id}">${p.name}</a>
            </h4>
            <p class="text-brown font-black text-lg">$ ${(p.price * item.qty).toFixed(2)}</p>
          </div>
          <div class="flex items-center justify-between lg:justify-end gap-6 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-gray-50 lg:border-t-0">
            <div class="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
              <button data-id="${p.id}" data-action="decrease" aria-label="Disminuir cantidad"
                      class="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-brown hover:bg-coral hover:text-white transition shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
              </button>
              <span class="w-10 text-center font-bold text-gray-800 text-base">${item.qty}</span>
              <button data-id="${p.id}" data-action="increase" aria-label="Aumentar cantidad"
                      class="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-brown hover:bg-coral hover:text-white transition shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
            <button data-id="${p.id}" data-action="remove"
                    class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" aria-label="Eliminar producto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join("");

  // Botón para vaciar el carrito si hay más de un producto
  let clearAllHTML = "";
  if (validItems.length > 1) {
    clearAllHTML = `
      <div class="flex justify-end mb-6">
        <button data-action="clear-cart" class="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-2 transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 group-hover:scale-110 transition-transform">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Borrar Productos
        </button>
      </div>`;
  }

  container.innerHTML = `
    ${clearAllHTML}
    <div class="space-y-6 mb-10">${itemsHTML}</div>
    <div class="bg-white rounded-3xl p-6 md:p-8 border border-rose/30 shadow-card">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p class="text-gray-500 font-bold uppercase text-xs tracking-widest mb-1">Total del Carrito</p>
          <p class="text-4xl font-black text-brown flex items-baseline gap-1">
            <span class="text-xl font-medium">$</span>${(await cartTotal()).toFixed(2)}
          </p>
          <p class="text-gray-400 text-xs mt-1 italic">*Incluye IVA del 15%</p>
        </div>
        <a href="checkout.html" class="flex-1 md:max-w-xs flex items-center justify-center gap-3 bg-coral text-white font-black py-5 px-8 rounded-2xl shadow-lg shadow-coral/20 hover:bg-brown hover:-translate-y-1 transition-all active:scale-95 text-lg uppercase tracking-wide">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          Finalizar Compra
        </a>
      </div>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("cart-content");

  // Delegación de eventos: un solo listener para todos los botones del carrito
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'increase') updateQty(id, 1);
    else if (action === 'decrease') updateQty(id, -1);
    else if (action === 'remove') removeFromCart(id);
    else if (action === 'clear-cart') {
      if (confirm('¿Estás seguro de que deseas eliminar todos los productos del carrito?')) {
        saveCart([]); // Vacía el carrito y sincroniza con DB
        if (typeof window.updateCartBadge === 'function') window.updateCartBadge();
      }
    }

    renderCart(); // Refrescar la vista
  });

  renderCart();
});