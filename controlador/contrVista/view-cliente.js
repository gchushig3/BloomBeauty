/**
 * Controlador para la vista del perfil de cliente
 */
import { getClientProfile, getProducts, getUserOrders, getFavoritesDB, getReviewsByUser } from './data.js';
import { updateCartBadge } from './carrito.js';

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("bb_user") || "null");
  const authCheck = document.getElementById("auth-check");
  const clientContent = document.getElementById("client-content");

  // 1. Verificación de Seguridad
  if (!user) {
    if (authCheck) authCheck.classList.remove("hidden");
    if (clientContent) clientContent.classList.add("hidden");
    return;
  }

  // Initial profile data fetch for display and global realUsername
  const initialIdentifier = user.username || user.ura_usuario || user.email;
  const initialProfileData = initialIdentifier ? await getClientProfile(initialIdentifier) : null;
  const realUsername = initialProfileData?.ura_usuario || user.username || user.ura_usuario;

  // 3. Lógica de Pestañas (Tabs)
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      // Actualizar estado visual de los botones
      tabBtns.forEach(b => b.classList.remove("tab-active"));
      btn.classList.add("tab-active");

      // Intercambiar visibilidad de los paneles
      tabPanes.forEach(pane => {
        if (pane.id === `pane-${target}`) {
          pane.classList.remove("hidden");
          if (target === 'favoritos') window.renderFavorites();
          if (target === 'reseñas') window.renderUserReviews();
          if (target === 'pedidos') window.renderOrders();
        } else {
          pane.classList.add("hidden");
        }
      });
    });
  });

  // 4. Renderizado de Favoritos
  window.renderFavorites = async function() {
    const container = document.getElementById("favorites-grid");
    if (!container) return;

    container.innerHTML = '<div class="col-span-full text-center py-10 animate-pulse text-gray-400">Cargando tus favoritos...</div>';

    let favIds = JSON.parse(localStorage.getItem("bb_favorites") || "[]");
    
    // Siempre intentamos sincronizar con la DB si hay un usuario válido para evitar estados desactualizados
    if (realUsername) {
      const dbFavs = await getFavoritesDB(realUsername);
      favIds = (dbFavs && dbFavs.length > 0) ? dbFavs : favIds;
      localStorage.setItem("bb_favorites", JSON.stringify(favIds));
    }

    const allProducts = await getProducts();
    
    // Comparación robusta: asegurar que ambos sean strings y no tengan espacios
    const favProducts = allProducts.filter(p => 
      favIds.map(id => String(id).trim()).includes(String(p.id).trim())
    );

    if (favProducts.length === 0) {
      return renderEmptyFavorites(container);
    }

    container.innerHTML = favProducts.map(p => window.productCardHTML(p)).join("");
  };

  // 5. Historial de Pedidos
  window.renderOrders = async function() {
    const container = document.getElementById("order-list");
    if (!container) return;

    container.innerHTML = '<p class="text-center py-10 animate-pulse">Consultando tus pedidos...</p>';

    // Re-evaluate user and realUsername for freshness within the function
    const currentUser = JSON.parse(localStorage.getItem("bb_user") || "null");
    if (!currentUser) return;
    const identifier = currentUser.username || currentUser.ura_usuario || currentUser.email;
    const profileData = identifier ? await getClientProfile(identifier) : null;
    
    const clientCI = profileData?.cliente?.cli_ci_ruc;

    const orders = await getUserOrders(clientCI);

    if (orders.length === 0) {
      container.innerHTML = '<p class="text-center py-10 text-gray-500">No has realizado ningún pedido todavía.</p>';
      return;
    }

    container.innerHTML = orders.map(o => `
      <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Pedido #${o.ped_codigo}</p>
            <h4 class="font-bold text-lg text-brown mt-1">Total: $${o.ped_total.toFixed(2)}</h4>
            <p class="text-sm text-gray-500">${new Date(o.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div class="flex items-center">
            <span class="px-3 py-1 rounded-full text-xs font-bold ${o.estado_pedido?.est_descripcion === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-rose text-brown'}">
              ${o.estado_pedido?.est_descripcion || 'Pendiente'}
            </span>
          </div>
        </div>
      </div>
    `).join("");
  };

  // 6. Carga de datos de perfil en la UI (using initialProfileData)
  if (initialProfileData && initialProfileData.cliente) {
    const c = initialProfileData.cliente;
    const welcomeMsg = document.getElementById("user-welcome");
    if (welcomeMsg) welcomeMsg.textContent = `¡Hola, ${c.cli_nombre}!`;

    document.getElementById("p-name").textContent = `${c.cli_nombre} ${c.cli_apellido}`;
    document.getElementById("p-ci").textContent = c.cli_ci_ruc;
    document.getElementById("p-phone").textContent = c.cli_telefono || 'No registrado';
    document.getElementById("p-email").textContent = c.cli_correo;
  }

  // Renderizado inicial: si la pestaña activa al cargar es favoritos o pedidos, cargar sus datos automáticamente
  const activeTabBtn = document.querySelector(".tab-btn.tab-active");
  if (activeTabBtn) {
    const target = activeTabBtn.dataset.tab;
    if (target === 'favoritos') window.renderFavorites();
    if (target === 'reseñas') window.renderUserReviews();
    if (target === 'pedidos') window.renderOrders();
  }

  // Actualizar el indicador del carrito al cargar el perfil
  await updateCartBadge();

  // Manejo de Cerrar Sesión (Escritorio y Móvil)
  const logoutAction = () => {
    localStorage.removeItem("bb_user");
    localStorage.removeItem("bb_cart");
    localStorage.removeItem("bb_favorites");
    location.href = "../index.html";
  };

  const btnLogout = document.getElementById("btn-logout");
  const btnLogoutMobile = document.getElementById("btn-logout-mobile");
  if (btnLogout) btnLogout.addEventListener("click", logoutAction);
  if (btnLogoutMobile) btnLogoutMobile.addEventListener("click", logoutAction);
});

/**
 * Helper function to render the empty favorites message
 */
function renderEmptyFavorites(container) {
  container.innerHTML = `
    <div class="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
      <p class="text-gray-500 mb-4">Aún no tienes productos favoritos.</p>
      <a href="../index.html" class="text-coral font-bold hover:underline">Explorar la tienda</a>
    </div>`;
}

/**
 * Renderiza las reseñas escritas por el usuario
 */
window.renderUserReviews = async function() {
  const container = document.getElementById("user-reviews-list");
  if (!container) return;

  container.innerHTML = '<p class="text-center py-10 animate-pulse">Cargando tus reseñas...</p>';

  // Re-evaluate user and realUsername for freshness within the function
  const currentUser = JSON.parse(localStorage.getItem("bb_user") || "null");
  if (!currentUser) {
    container.innerHTML = `<p class="col-span-full text-center py-10 text-gray-500">Inicia sesión para ver tus reseñas.</p>`;
    return;
  }
  const identifier = currentUser.username || currentUser.ura_usuario || currentUser.email;
  const profileData = identifier ? await getClientProfile(identifier) : null;
  const currentRealUsername = profileData?.ura_usuario || currentUser.username || currentUser.ura_usuario;

  const reviews = await getReviewsByUser(currentRealUsername);

  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <p class="text-gray-500 mb-4">Aún no has escrito ninguna reseña.</p>
        <a href="../index.html" class="text-coral font-bold hover:underline">Explorar productos</a>
      </div>`;
    return;
  }

  container.innerHTML = reviews.map(r => `
    <article class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div class="flex justify-between items-center mb-2">
        <div class="flex flex-col">
          <strong class="text-gray-800">${r.productName}</strong>
          <span class="text-[10px] text-gray-400 font-bold uppercase">${r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
        </div>
        <span class="text-coral font-bold">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</span>
      </div>
      <p class="text-gray-600 text-sm italic">"${r.text}"</p>
      <p class="text-xs text-gray-400 mt-2">Ver producto: <a href="producto.html?id=${r.productId}" class="text-coral hover:underline">${r.productName}</a></p>
    </article>
  `).join("");
};