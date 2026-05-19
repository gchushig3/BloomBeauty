/**
 * Controlador para la vista de Checkout (Pago)
 * Maneja el stepper, validación de pasos y proceso de pago.
 */
import { signIn, checkEmailExists, getCartDB, getFavoritesDB, addFavoriteDB, createOrderDB, getProducts, updateProductStock, getBranches, getClientProfile, updateClientProfile } from './data.js';
import { getCart, saveCart, cartTotal, updateCartBadge } from './carrito.js';
let currentStep = 1;

document.addEventListener("DOMContentLoaded", async () => {
  const totalEl = document.getElementById("total");
  if (totalEl) totalEl.textContent = "$ " + (await cartTotal()).toFixed(2);
  
  checkUserStatus();
  setupEventListeners();
  renderBranches();
});

function setupEventListeners() {
  // Botones de navegación del stepper
  document.querySelectorAll('[data-step-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-step-nav');
      if (action === 'next') nextStep();
      else if (action === 'prev') prevStep();
    });
  });

  // Botón login especial en checkout
  const btnLogin = document.getElementById("btn-login-checkout");
  if (btnLogin) btnLogin.addEventListener('click', handleLogin);

  // Botón continuar con sesión iniciada
  const btnContinueLogged = document.getElementById("btn-continue-logged");
  if (btnContinueLogged) btnContinueLogged.addEventListener('click', nextStep);

  // Botón cancelar en checkout
  const btnCancel = document.getElementById("btn-cancel-checkout");
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      location.href = "carrito.html";
    });
  }

  // Formateo de tarjeta
  const cardInput = document.getElementById('card');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      v = v.match(/.{1,4}/g)?.join(' ') || v;
      e.target.value = v.substring(0, 19);
    });
  }

  // Formateo de fecha de expiración
  const expInput = document.getElementById('exp');
  if (expInput) {
    expInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
      e.target.value = v;
    });
  }

  // Toggle de campos de autorización a terceros
  const autoriCheck = document.getElementById('autori');
  if (autoriCheck) {
    autoriCheck.addEventListener('change', (e) => {
      const details = document.getElementById('auth-details');
      details.classList.toggle('hidden', !e.target.checked);
      if (!e.target.checked) {
        setError("auth-name", "");
        setError("auth-id", "");
      }
    });
  }

  // Envío final del formulario
  const payForm = document.getElementById("pay-form");
  if (payForm) payForm.addEventListener("submit", processPayment);
}

function checkUserStatus() {
  const user = JSON.parse(localStorage.getItem("bb_user") || "null");
  const loggedDiv = document.getElementById("user-logged-in");
  const notLoggedDiv = document.getElementById("user-not-logged");

  if (user && (user.name || user.username)) {
    if (loggedDiv) loggedDiv.classList.remove("hidden");
    if (notLoggedDiv) notLoggedDiv.classList.add("hidden");
    const name = user.name || user.username;
    if (document.getElementById("logged-user-name")) document.getElementById("logged-user-name").textContent = name;
    if (document.getElementById("btn-user-name")) document.getElementById("btn-user-name").textContent = name;
  } else {
    if (loggedDiv) loggedDiv.classList.add("hidden");
    if (notLoggedDiv) notLoggedDiv.classList.remove("hidden");
  }
}

// Make handleLogin async
async function handleLogin() {
  const emailEl = document.getElementById("li-email");
  const passEl = document.getElementById("li-pass");
  const email = emailEl ? emailEl.value.trim() : "";
  const pass = passEl ? passEl.value.trim() : "";

  let ok = true;
  if (!email.includes("@")) {
    setError("li-email", "Ingresa un correo válido");
    ok = false;
  } else setError("li-email", "");
  if (pass === "") {
    setError("li-pass", "La contraseña es obligatoria");
    ok = false;
  } else setError("li-pass", "");
  
  if (!ok) return;
  
  // Perform actual sign-in using data.js
  const loginUser = (email.includes('@') ? email.split('@')[0] : email).trim().toUpperCase();
  const data = await signIn(loginUser, pass);

  if (!data) {
    setError("li-pass", "Usuario o contraseña incorrectos");
    if (email.includes('@') && typeof showToast === 'function') {
      const exists = await checkEmailExists(email);
      if (!exists) {
        showToast("El usuario no se encuentra registrado.");
      }
    }
    return;
  }

  localStorage.setItem("bb_user", JSON.stringify({ 
    username: data.ura_usuario, 
    name: data.cliente.cli_nombre, 
    email: data.cliente.cli_correo 
  }));

  // 2. Fusión (Merge) del carrito local con el de la base de datos
  const dbCart = await getCartDB(data.ura_usuario);
  const localCart = getCart();

  const mergedMap = new Map();
  // Cargamos lo que ya estaba en la cuenta (DB)
  dbCart.forEach(item => mergedMap.set(String(item.id), item.qty));
  // Sumamos o añadimos lo que el usuario eligió de forma anónima
  localCart.forEach(item => {
    const id = String(item.id);
    mergedMap.set(id, (mergedMap.get(id) || 0) + item.qty);
  });
  const finalCart = Array.from(mergedMap, ([id, qty]) => ({ id, qty }));
  saveCart(finalCart); // Actualiza LocalStorage y sincroniza de vuelta a Supabase

  // 3. Fusión (Merge) de Favoritos
  const dbFavs = await getFavoritesDB(data.ura_usuario);
  const localFavs = JSON.parse(localStorage.getItem("bb_favorites") || "[]");
  
  // Unimos ambas listas sin duplicados
  const mergedFavs = [...new Set([...dbFavs, ...localFavs.map(String)])];
  
  // Guardamos en la DB los que solo estaban en el LocalStorage
  for (const fId of localFavs) {
    if (!dbFavs.includes(String(fId))) {
      await addFavoriteDB(data.ura_usuario, fId);
    }
  }
  localStorage.setItem("bb_favorites", JSON.stringify(mergedFavs));
  checkUserStatus();
  nextStep();
}

/**
 * Carga y renderiza las sucursales desde la base de datos
 */
async function renderBranches() {
  const container = document.getElementById("branches-container");
  if (!container) return;

  const branches = await getBranches();

  if (branches.length === 0) {
    container.innerHTML = '<p class="text-center py-4 text-gray-500 text-sm italic">No hay puntos de retiro disponibles en este momento.</p>';
    return;
  }

  container.innerHTML = branches.map((b, index) => `
    <label class="flex items-center cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-coral has-[:checked]:border-coral has-[:checked]:bg-coral/5">
      <input type="radio" name="sucursal" value="${b.suc_nombre}" data-suc-code="${b.suc_codigo}" data-ciu-code="${b.ciu_codigo}" ${index === 0 ? 'checked' : ''} class="h-5 w-5 text-coral border-gray-300 focus:ring-coral">
      <div class="ml-4">
        <span class="block text-sm font-bold text-gray-900">${b.suc_nombre}</span>
        <span class="block text-xs text-gray-500">${b.suc_direccion}</span>
      </div>
    </label>
  `).join("");
}

function setError(id, msg) {
  const errEl = document.getElementById("err-" + id);
  const el = document.getElementById(id);
  if (errEl) errEl.textContent = msg;
  if (el) {
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) {
      el.classList.add("border-red-600", "bg-red-50");
    } else {
      el.classList.remove("border-red-600", "bg-red-50");
      el.classList.add("border-gray-300");
    }
  }
}

function nextStep() {
  if (currentStep === 1 && !localStorage.getItem("bb_user")) {
    showToast("Debes iniciar sesión para continuar");
    return;
  }
  if (currentStep === 2) {
    if (!validateStep2()) return;
  }
  if (currentStep < 3) {
    document.getElementById(`step-${currentStep}-content`).classList.add("hidden");
    currentStep++;
    document.getElementById(`step-${currentStep}-content`).classList.remove("hidden");
    updateStepperUI();
  }
}

function validateStep2() {
  let valid = true;
  const phoneEl = document.getElementById("phone");
  const phone = phoneEl ? phoneEl.value.trim() : "";

  if (phone === "" || !/^\d{10}$/.test(phone)) {
    setError("phone", "Ingresa un número válido de 10 dígitos.");
    valid = false;
  } else setError("phone", "");

  const autoriEl = document.getElementById("autori");
  if (autoriEl && autoriEl.checked) {
    const aNameEl = document.getElementById("auth-name");
    const aIdEl = document.getElementById("auth-id");
    const aName = aNameEl ? aNameEl.value.trim() : "";
    const aId = aIdEl ? aIdEl.value.trim() : "";

    if (aName.length < 3) { setError("auth-name", "Nombre inválido"); valid = false; } else setError("auth-name", "");
    if (!/^\d{10}$/.test(aId)) { setError("auth-id", "Cédula inválida"); valid = false; } else setError("auth-id", "");
  }
  return valid;
}

function prevStep() {
  if (currentStep > 1) {
    document.getElementById(`step-${currentStep}-content`).classList.add("hidden");
    currentStep--;
    document.getElementById(`step-${currentStep}-content`).classList.remove("hidden");
    updateStepperUI();
  }
}

function updateStepperUI() {
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById(`step-${i}-ind`);
    const line = document.getElementById(`line-${i-1}`);
    if (i <= currentStep) {
      ind.classList.replace("bg-gray-200", "bg-coral");
      ind.classList.replace("text-gray-400", "text-white");
      ind.nextElementSibling.classList.replace("text-gray-400", "text-coral");
      if (line) line.classList.replace("bg-gray-200", "bg-coral");
    } else {
      ind.classList.replace("bg-coral", "bg-gray-200");
      ind.classList.replace("text-white", "text-gray-400");
      ind.nextElementSibling.classList.replace("text-coral", "text-gray-400");
      if (line) line.classList.replace("bg-coral", "bg-gray-200");
    }
  }
}

/**
 * Bloquea todos los campos y botones de acción para evitar modificaciones 
 * después de procesar el pago, permitiendo solo el botón "Atrás".
 */
function lockFields() {
  const inputs = document.querySelectorAll('#pay-form input, #pay-form select, #pay-form textarea');
  inputs.forEach(el => {
    el.disabled = true;
    el.classList.add('bg-gray-50', 'cursor-not-allowed');
  });

  // Bloquear botones de acción (Pagar, Cancelar, Login) y navegación hacia adelante
  const actionButtons = document.querySelectorAll(
    'button[type="submit"], #btn-cancel-checkout, #btn-login-checkout, #btn-continue-logged, [data-step-nav="next"]'
  );
  actionButtons.forEach(btn => {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  });
}

async function processPayment(e) {
  e.preventDefault();

  const modal = document.getElementById("payment-modal");
  const card = document.getElementById("card").value.replace(/\s/g, '');
  const exp = document.getElementById("exp").value.trim();
  const cvv = document.getElementById("cvv").value.trim();
  const terms = document.getElementById("terms").checked;
  let ok = true;

  if (modal) modal.classList.add("hidden"); // Resetear estado por si acaso

  // Validaciones del paso 3: Datos de pago
  if (!/^\d{16}$/.test(card)) { setError("card", "Número de tarjeta inválido (16 dígitos)"); ok = false; } else setError("card", "");
  if (!/^\d{2}\/\d{2}$/.test(exp)) { setError("exp", "Formato inválido (MM/AA)"); ok = false; } else setError("exp", "");
  if (!/^\d{3,4}$/.test(cvv)) { setError("cvv", "CVV inválido (3-4 dígitos)"); ok = false; } else setError("cvv", "");

  // Validación obligatoria de aceptación de términos
  if (!terms) {
    setError("terms", "Debes aceptar los términos de facturación para poder pagar");
    ok = false;
  } else {
    setError("terms", "");
  }

  if (!ok) {
    if (typeof showToast === 'function') showToast("Por favor, completa correctamente los datos de pago");
    return;
  }

  // 1. Recopilar datos para registrar el pedido real en Supabase
  const user = JSON.parse(localStorage.getItem("bb_user") || "null");
  const cart = getCart();
  const products = await getProducts();
  const total = await cartTotal();

  // Obtener el perfil para extraer el cli_ci_ruc
  const identifier = user.username || user.ura_usuario || user.email;
  const profile = await getClientProfile(identifier);

  if (!profile || !profile.cliente) {
    if (typeof showToast === 'function') showToast("Error: No se pudo verificar la identidad del cliente.");
    return;
  }

  const phone = document.getElementById("phone")?.value.trim();

  // Obtener la sucursal seleccionada
  const selectedBranchInput = document.querySelector('input[name="sucursal"]:checked');
  const sucCodigo = selectedBranchInput ? parseInt(selectedBranchInput.dataset.sucCode) : null;

  // Preparar el objeto del pedido según la estructura de tu tabla
  const orderData = {
    cli_ci_ruc: profile.cliente.cli_ci_ruc,
    suc_codigo: sucCodigo,
    est_codigo: 1, 
    ped_total: total
  };

  // Recopilar datos de autorización si la opción de retiro a terceros está marcada
  const autoriEl = document.getElementById("autori");
  const authData = (autoriEl && autoriEl.checked) ? {
    aut_nombre: document.getElementById("auth-name").value.trim(),
    aut_cedula: document.getElementById("auth-id").value.trim()
  } : null;

  const items = cart.map(item => {
    const p = products.find(x => String(x.id) === String(item.id));
    return {
      id: item.id,
      qty: item.qty,
      price: p ? p.price : 0
    };
  });

  // Bloquear edición y cancelación antes de mostrar el proceso
  lockFields();

  // Mostrar modal de procesamiento
  if (modal) modal.classList.remove("hidden");

  const status = document.getElementById("status-msg");
  status.className = "text-center mt-2 text-brown font-semibold";
  status.textContent = "Procesando pedido...";

  try {
    // Actualizar el teléfono del cliente en la tabla 'cliente' de la base de datos
    if (phone) await updateClientProfile(profile.cliente.cli_ci_ruc, { cli_telefono: phone });

    // 2. Guardar el pedido en Supabase (esto registra pedidos, detalles, factura y autorización)
    await createOrderDB(orderData, items, authData);

    // 3. Actualizar el stock de los productos comprados
    for (const item of items) {
      await updateProductStock(item.id, item.qty);
    }

    status.className = "text-center mt-2 text-green-700 font-semibold";
    status.textContent = "✅ ¡Pago exitoso! Factura enviada al correo.";
    
    if (modal) {
      setTimeout(() => modal.classList.add("hidden"), 2000);
    }

    // Limpiar el carrito después de la compra exitosa
    localStorage.removeItem("bb_cart");
    if (typeof updateCartBadge === 'function') updateCartBadge();
    
    setTimeout(() => { location.href = "../index.html"; }, 3000);
  } catch (error) {
    console.error("Error al registrar el pedido:", error);
    status.className = "text-center mt-2 text-red-600 font-semibold";
    status.textContent = "❌ Error al registrar el pedido. Intente nuevamente.";
    // Opcionalmente podrías ocultar el modal para permitir al usuario corregir datos
  }
}