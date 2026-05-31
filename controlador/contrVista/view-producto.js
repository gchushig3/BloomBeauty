import { getProducts, getProductById, getReviews, saveReview } from './data.js';
import { addToCart } from './carrito.js';

/**
 * Controlador para la vista de detalle de producto
 */
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(location.search);
  const productId = urlParams.get("id");
  const detailContainer = document.getElementById("product-detail");
  
  let currentQty = 1;

  // 1. Recuperar datos dinámicos
  // Ahora usamos getProductById que es más rápido que cargar toda la lista
  const product = await getProductById(productId);

  // 2. Validación de existencia
  if (!product) {
    detailContainer.innerHTML = `
      <div class="text-center py-20">
        <p class="text-gray-500 mb-4">Producto no encontrado.</p>
        <a href="../index.html" class="text-coral font-bold hover:underline">Volver a la tienda</a>
      </div>`;
    return;
  }

  // 3. Ejecutar renderizado y eventos
  renderProduct(product);
  await renderReviews(productId);
  renderRelatedProducts(product);
  setupProductEvents(product);
  setupReviewForm(productId);

  // --- FUNCIONES DE APOYO ---

  function renderProduct(p) {
    const breadcrumbCurrent = document.getElementById("breadcrumb-current");
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = p.name;

    const isOutOfStock = p.stock === 0;

    // Solo se visualizan como favoritos si el usuario ha iniciado sesión
    const user = localStorage.getItem("bb_user");
    const favs = user ? JSON.parse(localStorage.getItem("bb_favorites") || "[]") : [];
    const isFav = user && favs.includes(String(p.id));

    detailContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-xl shadow-soft p-6">
        <div class="w-full overflow-hidden rounded-lg bg-gray-50">
          <img src="${p.img}" alt="Detalle del producto ${p.name}" 
               srcset="${p.img} 1x, ${p.img} 2x"
               sizes="(max-width: 768px) 100vw, 50vw"
               loading="eager" decoding="async" width="600" height="600" class="w-full h-auto aspect-square object-contain p-6 transition-transform hover:scale-105" />
        </div>
        <div class="flex flex-col">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <p class="text-xs uppercase tracking-wide text-gray-500 font-bold">${p.brand}</p>
              <h1 class="text-3xl font-bold mt-2 text-gray-800">${p.name}</h1>
            </div>
            <!-- Botón Me Gusta (Favoritos) -->
            <button class="shrink-0 p-3 rounded-2xl bg-rose/10 ${isFav ? 'text-coral border-coral/30' : 'text-gray-400 border-rose/20'} hover:text-coral transition-all shadow-sm border group" 
                    onclick="window.toggleFavorite('${p.id}', this, event)"
                    title="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 ${isFav ? 'fill-coral' : 'group-hover:scale-110 transition-transform'}" fill="${isFav ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          <p class="text-3xl font-bold text-brown mt-3">
            $ ${p.price.toFixed(2)}${p.oldPrice ? ` <small class="text-base text-gray-400 line-through ml-2 font-normal">$${p.oldPrice.toFixed(2)}</small>` : ''}${p.includesIVA ? ` <span class="text-xs text-gray-500 ml-1 font-normal italic whitespace-nowrap">Incluye IVA</span>` : ''}
          </p>

          <!-- Enlace llamativo a reseñas -->
          <a href="#r-title" class="inline-flex items-center gap-1.5 text-coral font-bold text-sm mt-3 hover:text-brown transition-colors group/reviews">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 fill-coral group-hover/reviews:fill-brown transition-colors" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span class="border-b-2 border-coral/30 group-hover/reviews:border-brown transition-colors">Ver reseñas de clientes</span>
          </a>

          <div class="bg-gray-50 p-4 rounded-lg mt-6">
            <p class="text-gray-700 text-sm leading-relaxed">${p.description}</p>
          </div>
          
          ${isOutOfStock ? '' : `
            <div class="flex items-center gap-4 my-6">
              <button id="qty-minus" aria-label="Disminuir cantidad"
                      class="w-10 h-10 rounded-full bg-rose font-bold hover:bg-coral hover:text-white transition shadow-sm text-lg">−</button>
              <span id="prod-qty" class="font-bold text-xl min-w-[30px] text-center" aria-live="polite">1</span>
              <button id="qty-plus" aria-label="Aumentar cantidad"
                      class="w-10 h-10 rounded-full bg-rose font-bold hover:bg-coral hover:text-white transition shadow-sm text-lg">+</button>
            </div>
          `}
          
          <button id="add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''}
                  class="w-full ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-coral text-white hover:bg-brown shadow-lg active:scale-95'}
                         font-bold py-4 rounded-xl transition-all mt-auto text-lg">
            ${isOutOfStock ? 'Agotado' : 'Añadir al Carrito'}
          </button>
        </div>
      </div>
    `;
  }

  function setupProductEvents(p) {
    const btnPlus = document.getElementById("qty-plus");
    const btnMinus = document.getElementById("qty-minus");
    const qtyDisplay = document.getElementById("prod-qty");
    const btnAdd = document.getElementById("add-to-cart-btn");

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        if (currentQty < p.stock) {
          currentQty++;
          qtyDisplay.textContent = currentQty;
        }
      });
    }

    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        if (currentQty > 1) {
          currentQty--;
          qtyDisplay.textContent = currentQty;
        }
      });
    }

    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        addToCart(p.id, currentQty);
        if (typeof showToast === 'function') showToast(`Agregado: ${currentQty} ${p.name}`);
      });
    }
  }

  async function renderRelatedProducts(current) {
    const container = document.getElementById("related-products");
    if (!container) return;

    const all = await getProducts();

    // Filtrar productos de la misma categoría, excluyendo el actual
    const related = all
      .filter(p => p.catCode === current.catCode && p.id !== current.id)
      .slice(0, 4);

    container.innerHTML = related.length
      ? related.map(window.productCardHTML).join("")
      : '<p class="col-span-full text-gray-400 italic text-sm text-center">No hay productos similares por ahora.</p>';
  }

  async function renderReviews(id) {
    const list = document.getElementById("review-list");
    const reviews = await getReviews(id);
    list.innerHTML = reviews.length
      ? reviews.map(r => `
        <article class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div class="flex justify-between items-center mb-2">
            <strong class="text-gray-800">${r.name}</strong>
            <span class="text-coral font-bold">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</span>
          </div>
          <p class="text-gray-600 text-sm italic">"${r.text}"</p>
        </article>`).join("")
      : '<div class="text-center py-8 bg-gray-50 rounded-xl text-gray-500">Aún no hay reseñas. ¡Sé el primero en compartir tu experiencia!</div>';
  }

  function setupReviewForm(id) {
    const form = document.getElementById("review-form");
    if (!form) return;

    const user = JSON.parse(localStorage.getItem("bb_user") || "null");

    // Si no hay usuario iniciado, mostramos invitación al login
    if (!user) {
      form.innerHTML = `
        <div class="text-center py-4">
          <p class="text-brown font-bold text-sm mb-4">Inicia sesión para compartir tu experiencia con este producto.</p>
          <a href="login.html" class="inline-block bg-coral text-white font-bold px-8 py-3 rounded-xl hover:bg-brown transition shadow-md active:scale-95">
            Iniciar Sesión
          </a>
        </div>
      `;
      return;
    }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const username = user.username; // Usamos el identificador ura_usuario
      const stars = parseInt(document.getElementById("r-stars").value, 10);
      const text = document.getElementById("r-text").value.trim();

      if (!text) {
        if (typeof showToast === 'function') showToast("*Campo obligatorio");
        return;
      }

      const ok = await saveReview(id, username, stars, text);
      
      if (ok) {
        form.reset();
        await renderReviews(id);
        if (typeof showToast === 'function') showToast("✓ Reseña publicada con éxito");
      }
    });
  }
});
