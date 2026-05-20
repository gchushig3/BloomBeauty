/**
 * Controlador para la vista de Login y Registro
 */
import { signIn, signUp, checkEmailExists, getCartDB, getFavoritesDB } from './data.js';
import { saveCart, getCart } from './carrito.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginCont = document.getElementById("login-container");
  const signupCont = document.getElementById("signup-container");
  const loginForm = document.getElementById("login");
  const signupForm = document.getElementById("signup");

  // Verificar si venimos desde el checkout para registrarse directamente
  const params = new URLSearchParams(window.location.search);
  
  // Determinar la redirección tras éxito (si viene del checkout, vuelve al checkout)
  const redirect = params.get('redirect');
  const successTarget = redirect === 'checkout' ? 'checkout.html' : '../index.html';

  if (params.get('mode') === 'signup' && loginCont && signupCont) {
    loginCont.hidden = true;
    signupCont.hidden = false;
  }

  // Alternar entre Login y Registro
  const linkToSignup = document.getElementById("go-to-signup");
  const linkToLogin = document.getElementById("go-to-login");

  if (linkToSignup) {
    linkToSignup.addEventListener("click", (e) => {
      e.preventDefault();
      loginCont.hidden = true;
      signupCont.hidden = false;
      clearAllErrors();
    });
  }

  if (linkToLogin) {
    linkToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      signupCont.hidden = true;
      loginCont.hidden = false;
      clearAllErrors();
    });
  }

  // Manejo de Inicios de Sesión
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;

      const email = document.getElementById("li-email").value.trim();
      const pass = document.getElementById("li-pass").value;

      if (!email) { setErr("li-email", "Ingresa tu email o usuario"); ok = false; } else setErr("li-email", "");
      if (pass.length < 1) { setErr("li-pass", "Ingresa tu contraseña"); ok = false; } else setErr("li-pass", "");

      if (!ok) return;

      // Normalizamos el identificador: si ingresan el correo, tomamos solo la parte antes del @
      const loginUser = (email.includes('@') ? email.split('@')[0] : email).trim().toUpperCase();

      const data = await signIn(loginUser, pass);

      if (!data) {
        setErr("li-pass", "Usuario o contraseña incorrectos");
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

      // 2. REGLA DE ORO: Fusión (Merge) del carrito local con el de la base de datos
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

      // 3. Sincronizar Favoritos desde la DB al LocalStorage
      const dbFavs = await getFavoritesDB(data.ura_usuario);
      localStorage.setItem("bb_favorites", JSON.stringify(dbFavs));

      // Redirección especial: el administrador siempre es dirigido a su panel de control
      const destination = data.cliente.cli_correo === 'admin@gloriachushig.com' ? 'admin.html' : successTarget;

      if (typeof showToast === 'function') showToast("✓ Sesión iniciada");
      setTimeout(() => location.href = destination, 1500);
    });
  }

  // Manejo de Registros
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;

      const name = document.getElementById("su-name").value.trim();
      const apellido = document.getElementById("su-apellido").value.trim();
      const cedula = document.getElementById("su-cedula").value.trim();
      const email = document.getElementById("su-email-reg").value.trim();
      const p1 = document.getElementById("su-pass").value;
      const p2 = document.getElementById("su-pass2").value;
      const promo = document.getElementById("su-promo").checked;

      if (name.length < 2) { setErr("su-name", "Nombre muy corto"); ok = false; } else setErr("su-name", "");
      if (apellido.length < 2) { setErr("su-apellido", "Apellido muy corto"); ok = false; } else setErr("su-apellido", "");
      if (!/^\d{10}$/.test(cedula)) { setErr("su-cedula", "La cédula debe tener 10 dígitos"); ok = false; } else setErr("su-cedula", "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("su-email-reg", "Email inválido"); ok = false; } else setErr("su-email-reg", "");
      if (p1.length < 6) { setErr("su-pass", "Mínimo 6 caracteres"); ok = false; } else setErr("su-pass", "");
      if (p1 !== p2) { setErr("su-pass2", "Las contraseñas no coinciden"); ok = false; } else setErr("su-pass2", "");
      
      // 2. Validación secundaria de campos del formulario
      if (!ok) {
        if (typeof showToast === 'function') showToast("Revisa los errores en el formulario");
        return;
      }

      try {
        const clientData = {
          cli_ci_ruc: cedula,
          emp_ruc: "1790012345001",
          cli_nombre: name,
          cli_apellido: apellido,
          cli_correo: email
        };

        const usernamePrefix = email.split('@')[0].trim().toUpperCase();

        const userData = {
          ura_usuario: usernamePrefix, 
          cli_ci_ruc: cedula,
          ura_clave: p1
        };

        await signUp(clientData, userData);

        localStorage.setItem("bb_user", JSON.stringify({ username: usernamePrefix, name, email, promoConsent: promo }));
        localStorage.setItem("bb_favorites", JSON.stringify([])); // Usuario nuevo inicia sin favoritos
        
        // Sincronizar el carrito anónimo al nuevo perfil creado
        saveCart(getCart());

        if (typeof showToast === 'function') showToast("✓ Cuenta creada e iniciada con éxito");
        setTimeout(() => location.href = successTarget, 1500);

      } catch (error) {
        console.error(error);
        if (typeof showToast === 'function') {
          let userMsg = "No se pudo completar el registro: " + (error.message || "Problema de conexión");
          
          if (error.code === '23505') {
            if (error.message.includes('pk_cliente') || error.message.includes('cli_ci_ruc')) {
              userMsg = "La cédula ya se encuentra registrada.";
              setErr("su-cedula", "Esta cédula ya tiene una cuenta");
            } else if (error.message.includes('cli_correo')) {
              userMsg = "El correo ya se encuentra registrado.";
              setErr("su-email-reg", "Este correo ya tiene una cuenta");
            }
          }
          showToast(userMsg);
        }
      }
    });
  }

  /**
   * Helper para mostrar/ocultar errores visuales y de accesibilidad
   */
  function setErr(id, msg) {
    const errEl = document.getElementById("err-" + id);
    const inputEl = document.getElementById(id);
    
    if (errEl) errEl.textContent = msg;
    
    if (inputEl) {
      inputEl.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg) {
        inputEl.classList.add("border-red-600", "bg-red-50");
      } else {
        inputEl.classList.remove("border-red-600", "bg-red-50");
        inputEl.classList.add("border-gray-300");
      }
    }
  }

  /**
   * Limpia todos los mensajes de error al cambiar entre formularios
   */
  function clearAllErrors() {
    const errorMsgs = document.querySelectorAll('p[id^="err-"]');
    errorMsgs.forEach(p => {
      const inputId = p.id.replace('err-', '');
      setErr(inputId, "");
    });
  }
});