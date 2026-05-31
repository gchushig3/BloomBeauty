import { getProducts, getBrands, addFavoriteDB, removeFavoriteDB } from './data.js';

document.addEventListener("DOMContentLoaded", async () => {
  // 1. CARGA DE DATOS (Una sola vez para toda la página)
  const PRODUCTS = await getProducts();

  /* ============== LÓGICA DEL CARRUSEL ============== */
  const bestGrid = document.getElementById("bestsellers-grid");
  const btnPrev = document.getElementById("prev-best");
  const btnNext = document.getElementById("next-best");

  if (bestGrid && btnPrev && btnNext) {
    // Renderizar solo los primeros 5 productos (Lo más vendido)
    bestGrid.innerHTML = PRODUCTS.slice(0, 5).map(p => `
      <div class="w-[clamp(220px,25vw,280px)] shrink-0 snap-start">
        ${productCardHTML(p)}
      </div>
    `).join("");

    const container = bestGrid.parentElement;

    const updateNav = () => {
      if (!container) return;
      const max = container.scrollWidth - container.clientWidth;
      btnPrev.disabled = container.scrollLeft <= 5;
      btnNext.disabled = container.scrollLeft >= max - 5;
    };

    btnNext.onclick = () => {
      const step = (bestGrid.firstElementChild?.offsetWidth || 280) + 24;
      container.scrollBy({ left: step, behavior: 'smooth' });
    };

    btnPrev.onclick = () => {
      const step = (bestGrid.firstElementChild?.offsetWidth || 280) + 24;
      container.scrollBy({ left: -step, behavior: 'smooth' });
    };

    container.addEventListener('scroll', updateNav);
    updateNav();

    window.addEventListener('resize', () => { 
      container.scrollLeft = 0;
      updateNav(); 
    });
  }

  /* ============== RENDERIZADO DE MARCAS (DINÁMICO) ============== */
  const brandsGrid = document.getElementById("brands-grid");
  if (brandsGrid) {
    const brands = await getBrands();
    const inVista = location.pathname.toLowerCase().includes('/vista/');
    const baseUrl = inVista ? '' : 'vista/';

    if (brands.length > 0) {
      brandsGrid.innerHTML = brands.map(b => {
        // Generar slug para la URL (ej: "La Roche-Posay" -> "la-roche-posay")
        const slug = b.mar_nombre.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        
        return `
          <a href="${baseUrl}categoria.html?marca=${slug}" 
             class="group w-full flex justify-center items-center p-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 ease-out"
             aria-label="Ver productos de ${b.mar_nombre}">
            <img src="${b.mar_url}" alt="Logo oficial de la marca ${b.mar_nombre}" 
                 srcset="${b.mar_url} 1x, ${b.mar_url} 2x"
                 sizes="(max-width: 640px) 50vw, 20vw"
                 loading="lazy" decoding="async" width="200" height="112"
                 class="h-16 md:h-24 lg:h-28 w-auto object-contain transition-transform duration-500 group-hover:scale-110" />
          </a>
        `;
      }).join("");
    }
  }

  /* ============== TOUR DE BIENVENIDA ============== */
  if (!localStorage.getItem("bb_tour_seen")) {
    const tour = document.getElementById("welcome-tour");
    if (tour) tour.classList.remove('hidden');
  }

  const tourStartButton = document.getElementById("tour-start-button");
  if (tourStartButton) {
    tourStartButton.addEventListener('click', closeTour);
  }

  /* ============== LÓGICA DE AUTOCOMPLETADO (SEARCH) ============== */
  const initAutocomplete = (inputId, suggestionsId) => {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    if (!input || !suggestions) return;

    let selectedIndex = -1;

    const updateHighlight = (btns) => {
      btns.forEach((btn, i) => {
        if (i === selectedIndex) {
          btn.classList.add('bg-rose/20');
          btn.scrollIntoView({ block: 'nearest' });
        } else {
          btn.classList.remove('bg-rose/20');
        }
      });
    };

    const handleAutocomplete = () => {
      const q = input.value.toLowerCase().trim();
      selectedIndex = -1;

      // Generar sugerencias únicas basadas en Marcas, Categorías y Nombres de productos existentes
      const suggestionsSet = new Set();
      
      if (q.length === 0) {
        // Si está vacío, sugerimos categorías y marcas principales para incentivar la navegación
        PRODUCTS.forEach(p => {
          suggestionsSet.add(p.category);
          suggestionsSet.add(p.brand);
        });
      } else {
        PRODUCTS.forEach(p => {
          if (p.brand.toLowerCase().includes(q)) suggestionsSet.add(p.brand);
          if (p.category.toLowerCase().includes(q)) suggestionsSet.add(p.category);
          if (p.name.toLowerCase().includes(q)) suggestionsSet.add(p.name);
        });
      }

      const matches = Array.from(suggestionsSet).slice(0, 8);

      if (matches.length > 0) {
        suggestions.innerHTML = matches.map(text => `
          <button type="button" class="w-full text-left p-3 hover:bg-rose/10 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3 group"
                  onclick="searchProducts('${text.replace(/'/g, "\\'")}')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-gray-500 group-hover:text-coral transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="text-sm text-gray-700 font-medium">${text}</span>
          </button>
        `).join("");
        suggestions.classList.remove("hidden");
      } else if (q.length > 0) {
        suggestions.innerHTML = `<p class="p-4 text-xs text-gray-500 text-center italic">No hay resultados para "${q}"</p>`;
        suggestions.classList.remove("hidden");
      } else {
        suggestions.classList.add("hidden");
      }
    };

    input.addEventListener("input", handleAutocomplete);
    input.addEventListener("focus", handleAutocomplete);

    input.addEventListener("keydown", (e) => {
      const btns = suggestions.querySelectorAll('button');
      if (suggestions.classList.contains('hidden') || btns.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % btns.length;
        updateHighlight(btns);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + btns.length) % btns.length;
        updateHighlight(btns);
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        btns[selectedIndex].click();
      } else if (e.key === "Escape") {
        suggestions.classList.add("hidden");
      }
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.classList.add("hidden");
      }
    });
  };

  initAutocomplete("search-input", "search-suggestions");
  initAutocomplete("mobile-search-input", "mobile-search-suggestions");

  /* ============== LÓGICA DE BÚSQUEDA (HEADER) ============== */
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-button");

  if (searchInput) {
    // Mantiene el texto buscado en el input al cambiar de página
    const params = new URLSearchParams(location.search);
    if (params.has('q')) searchInput.value = params.get('q');

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") window.searchProducts(searchInput.value);
    });
  }
  if (searchBtn && searchInput) {
    searchBtn.onclick = () => window.searchProducts(searchInput.value);
  }

  /* ============== LÓGICA DE TARJETAS DE OFERTA CLICKEABLES ============== */
  document.querySelectorAll('.offer-card').forEach(card => {
    card.addEventListener('click', (event) => {
      // Si el clic fue en el botón "Comprar aquí" o cualquier elemento interactivo dentro de la tarjeta,
      // dejamos que su acción predeterminada ocurra.
      if (event.target.closest('a, button, input, select, textarea')) {
        return;
      }
      // Si el clic fue en cualquier otra parte de la tarjeta, navegamos a la URL definida en data-href.
      const href = card.dataset.href;
      if (href) {
        window.location.href = href;
      }
    });
  });

  // Actualizar el badge del carrito al cargar
  await updateCartBadge();
});

/* ============== FUNCIONES GLOBALES ============== */

window.toggleFavorite = async function(id, btn, e) {
  if (e) e.preventDefault();
  const user = JSON.parse(localStorage.getItem("bb_user") || "null");

  if (!user) {
    if (typeof window.showToast === 'function') window.showToast("Inicia sesión para guardar favoritos 🌸");
    return;
  }

  let favs = JSON.parse(localStorage.getItem("bb_favorites") || "[]");
  const sId = String(id);
  const index = favs.indexOf(sId);
  const svg = btn.querySelector('svg');
  
  // Asegurar consistencia: Usar el username guardado o extraerlo del email siempre en MAYÚSCULAS
  const rawUser = user.username || user.ura_usuario || (user.email ? user.email.split('@')[0] : null);
  const username = rawUser ? rawUser.trim().toUpperCase() : null;

  if (!username) {
    if (typeof window.showToast === 'function') window.showToast("No se pudo identificar al usuario para guardar favoritos.");
    return;
  }

  let dbOperationSuccessful = false;

  if (index === -1) {
    // Agregar a favoritos
    dbOperationSuccessful = await addFavoriteDB(username, id);
    if (dbOperationSuccessful) {
      favs.push(sId); // Solo actualiza el estado local si la operación de DB fue exitosa
      btn.classList.replace('text-gray-400', 'text-coral');
      svg.classList.add('fill-coral');
      svg.setAttribute('fill', 'currentColor');
      if (typeof window.showToast === 'function') window.showToast("Producto añadido a favoritos ❤️");
    } else {
      if (typeof window.showToast === 'function') window.showToast("Error al añadir a favoritos.");
    }
  } else {
    // Quitar de favoritos
    dbOperationSuccessful = await removeFavoriteDB(username, id);
    if (dbOperationSuccessful) {
      favs.splice(index, 1); // Solo actualiza el estado local si la operación de DB fue exitosa
      btn.classList.replace('text-coral', 'text-gray-400');
      svg.classList.remove('fill-coral');
      svg.setAttribute('fill', 'none');
      if (typeof window.showToast === 'function') window.showToast("Producto eliminado de favoritos 💔");
    } else {
      if (typeof window.showToast === 'function') window.showToast("Error al eliminar de favoritos.");
    }
  }
  localStorage.setItem("bb_favorites", JSON.stringify(favs));
  if (typeof window.renderFavorites === 'function') window.renderFavorites();
};

window.productCardHTML = function(p) {
  const inVista = location.pathname.toLowerCase().includes('/vista/');
  const productHref = (inVista ? '' : 'vista/') + 'producto.html?id=' + p.id;
  const out = p.stock === 0;

  // Solo se visualizan como favoritos si el usuario ha iniciado sesión
  const user = localStorage.getItem("bb_user");
  const favs = user ? JSON.parse(localStorage.getItem("bb_favorites") || "[]") : [];
  const isFav = user && favs.includes(String(p.id));
  
  return `
    <article class="relative h-full w-full bg-white rounded-2xl shadow-soft overflow-hidden flex flex-col hover:shadow-card transition border border-gray-50">
      <!-- Botón Me Gusta -->
      <button class="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm ${isFav ? 'text-coral' : 'text-gray-400'} hover:text-coral transition-all z-10 shadow-sm" 
              onclick="window.toggleFavorite('${p.id}', this, event)">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${isFav ? 'fill-coral' : ''}" fill="${isFav ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <a href="${productHref}" class="block w-full aspect-square md:aspect-[4/3] bg-gray-50 overflow-hidden">
        <img src="${p.img}" alt="Imagen de producto: ${p.name}" 
             srcset="${p.img} 1x, ${p.img} 2x"
             sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
             loading="lazy" decoding="async" width="300" height="300" class="w-full h-full object-contain p-4 transition-transform hover:scale-105" />
      </a>
      <div class="p-6 flex flex-col gap-3 flex-1">
        <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold">${p.brand}</p>
        <h3 class="font-semibold text-sm md:text-base line-clamp-2 leading-snug">
          <a href="${productHref}" class="hover:text-brown">${p.name}</a>
        </h3>
        <div class="mt-auto">
          <p class="text-lg font-bold text-brown">
            $ ${p.price.toFixed(2)}${p.oldPrice ? ` <span class="text-xs text-gray-400 line-through ml-1 font-normal">$${p.oldPrice.toFixed(2)}</span>` : ''}${p.includesIVA ? ` <span class="text-xs text-gray-500 ml-1 font-normal italic whitespace-nowrap">Incluye IVA</span>` : ''}
          </p>
          ${out
            ? `<button disabled class="mt-2 w-full bg-gray-200 text-gray-500 font-semibold py-2 rounded cursor-not-allowed">Agotado</button>`
            : `<button onclick="addToCart('${p.id}')"
                       class="mt-2 w-full bg-coral text-white font-semibold py-2 rounded hover:bg-brown transition">
                 Añadir al Carrito
               </button>`
          }
        </div>
      </div>
    </article>
  `;
}

/* ============== UTILIDADES DE UI GLOBAL ============== */
let toastTimer;
window.showToast = function(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.remove("opacity-0", "pointer-events-none");
  t.classList.add("opacity-100");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.add("opacity-0", "pointer-events-none");
    t.classList.remove("opacity-100");
  }, 2500);
}

window.updateCartBadge = async function() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  
  // getCart() viene definido en carrito.js
  const cart = typeof getCart === 'function' ? getCart() : [];
  
  // Validamos contra los productos reales para evitar que aparezcan "1" por IDs viejos o de prueba
  const products = await getProducts();
  const count = cart.reduce((s, item) => {
    const exists = products.some(p => String(p.id) === String(item.id));
    return s + (exists ? (Number(item.qty) || 0) : 0);
  }, 0);

  badge.textContent = count;

  // Solo mostramos la burbuja si el contador es realmente mayor a 0
  if (count > 0) {
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

window.searchProducts = function(q) {
  const query = (q || "").trim();
  const inVista = location.pathname.toLowerCase().includes('/vista/');
  const target = (inVista ? '' : 'vista/') + 'categoria.html?q=' + encodeURIComponent(query);
  location.href = target;
}

/* ============== TUTORIAL NUEVOS USUARIOS ============== */
window.closeTour = function() {
  const t = document.getElementById("welcome-tour");
  if (t) t.classList.add('hidden'); // Usa la clase 'hidden' de Tailwind
  localStorage.setItem("bb_tour_seen", "1");
}
