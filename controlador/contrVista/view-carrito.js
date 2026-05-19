/**
 * Controlador de la vista del Carrito
 * Maneja el renderizado y la interacción del usuario en carrito.html
 */
import { getProducts } from './data.js';
import { getCart, updateQty, removeFromCart, cartTotal } from './carrito.js';

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
      <div class="text-center py-12">
        <div class="bg-rose/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart-icon lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
        <p class="text-gray-500 mb-6">Tu carrito está vacío.</p>
        <a href="../index.html"
           class="inline-block bg-coral text-white font-semibold px-6 py-3 rounded hover:bg-brown transition shadow-md">
          Ver productos
        </a>
      </div>`;
    return;
  }

  const itemsHTML = validItems.map(item => {
    const p = PRODUCTS.find(x => String(x.id) === String(item.id));
    
    return `
      <div class="flex gap-4 bg-white border border-gray-200 rounded-lg p-3 sm:p-4 items-start sm:items-center shadow-sm">
        <img src="${p.img}" alt="${p.name}" class="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-gray-50 rounded shrink-0" />
        <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 class="font-semibold text-sm sm:text-base leading-tight">${p.name}</h4>
            <p class="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">${p.brand}</p>
            <p class="text-brown font-bold mt-1">$ ${(p.price * item.qty).toFixed(2)}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 border-t sm:border-t-0 pt-2 sm:pt-0">
            <div class="flex items-center gap-2">
              <button data-id="${p.id}" data-action="decrease" aria-label="Disminuir cantidad"
                      class="w-8 h-8 bg-rose rounded-full font-bold hover:bg-coral hover:text-white transition text-xs sm:text-sm">−</button>
              <span class="w-6 text-center font-semibold text-sm">${item.qty}</span>
              <button data-id="${p.id}" data-action="increase" aria-label="Aumentar cantidad"
                      class="w-8 h-8 bg-rose rounded-full font-bold hover:bg-coral hover:text-white transition text-xs sm:text-sm">+</button>
            </div>
            <button data-id="${p.id}" data-action="remove"
                    class="text-red-600 text-xs font-bold hover:underline transition-colors hover:text-brown">Eliminar</button>
          </div>
        </div>
      </div>`;
  }).join("");

  container.innerHTML = `
    <div class="space-y-4 mb-8">${itemsHTML}</div>
    <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-end">
          <span class="text-gray-600 font-medium">Resumen del pedido</span>
          <p class="text-3xl font-black text-brown tracking-tight">
            <span class="text-lg font-normal mr-1">$</span>${(await cartTotal()).toFixed(2)}
          </p>
        </div>
        <a href="checkout.html" class="w-full block text-center bg-coral text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brown hover:-translate-y-0.5 transition-all active:scale-95">
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

    renderCart(); // Refrescar la vista
  });

  renderCart();
});