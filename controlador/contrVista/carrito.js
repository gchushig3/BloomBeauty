import { getProducts, syncCartDB } from './data.js';

/* ============== LÓGICA DEL CARRITO (localStorage) ============== */

export const getCart = window.getCart = function() {
  return JSON.parse(localStorage.getItem("bb_cart") || "[]");
}

export const saveCart = window.saveCart = function(cart) {
  localStorage.setItem("bb_cart", JSON.stringify(cart));
  // Si tienes una función para actualizar el numerito del icono del carrito:
  if (typeof updateCartBadge === 'function') updateCartBadge();
  
  // Sincronizar con la base de datos si el usuario está logueado
  const user = JSON.parse(localStorage.getItem("bb_user") || "null");
  if (user && (user.username || user.ura_usuario)) {
    syncCartDB(user.username || user.ura_usuario, cart);
  }

  // Importante: Si estás en la página del carrito, deberías volver a renderizar
  if (typeof renderCart === 'function' && document.getElementById('cart-container')) {
    renderCart();
  }
}

/**
 * Calcula el total de forma asíncrona obteniendo los productos actualizados
 */
export const cartTotal = window.cartTotal = async function() {
  const PRODUCTS = await getProducts();
  const cart = getCart();
  return cart.reduce((sum, item) => {
    const p = PRODUCTS.find(x => String(x.id) === String(item.id));
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

/* ============== ACCIONES ============== */

export const addToCart = window.addToCart = function(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => String(i.id) === String(productId));
  
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  
  saveCart(cart);
  if (typeof showToast === 'function') showToast("✓ Producto añadido");
}

export const removeFromCart = window.removeFromCart = function(productId) {
  const newCart = getCart().filter(i => String(i.id) !== String(productId));
  saveCart(newCart);
  if (typeof showToast === 'function') showToast("Producto eliminado");
}

export const updateQty = window.updateQty = function(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => String(i.id) === String(productId));
  if (!item) return;

  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
}

/**
 * Actualiza visualmente la burbuja del carrito en el header
 */
export const updateCartBadge = window.updateCartBadge = async function() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  
  const cart = getCart();
  const products = await getProducts();
  const count = cart.reduce((s, item) => {
    const exists = products.some(p => String(p.id) === String(item.id));
    return s + (exists ? (Number(item.qty) || 0) : 0);
  }, 0);

  badge.textContent = count;

  if (count > 0) {
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/* ============== RENDERIZADO ============== */

async function renderCart() {
  const cart = getCart();
  const PRODUCTS = await getProducts();
  const container = document.getElementById('cart-container'); // Ajusta el ID
  
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p>El carrito está vacío</p>";
    return;
  }

  // Ejemplo de cómo podrías renderizarlo
  let html = '<ul>';
  for (const item of cart) {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (p) {
      html += `
        <li>
          ${p.name} - ${item.qty} x $${p.price}
          <button onclick="updateQty(${p.id}, 1)">+</button>
          <button onclick="updateQty(${p.id}, -1)">-</button>
          <button onclick="removeFromCart(${p.id})">Eliminar</button>
        </li>`;
    }
  }
  html += '</ul>';
  
  const total = await cartTotal();
  html += `<h3>Total: $${total.toFixed(2)}</h3>`;
  
  container.innerHTML = html;
}