/**
 * Controlador para la vista de Cambio de Contraseña
 */
import { updatePasswordByEmail } from './data.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('reset-pass-form');
  const params = new URLSearchParams(location.search);
  const email = params.get('email');

  // Quitar el estado de error al hacer clic o foco en un input
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => {
      if (input.classList.contains('border-red-600')) {
        setErr(input.id, "");
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let ok = true;
      const toast = typeof showToast === 'function';

      const p1 = document.getElementById('new-pass').value;
      const p2 = document.getElementById('confirm-pass').value;

      // Validación de estándar (mín 6 caracteres, letras y números)
      if (!p1) {
        setErr("new-pass", "*Campo obligatorio");
        ok = false;
      } else if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(p1)) {
        setErr("new-pass", "Mínimo 6 caracteres, incluyendo letras y números");
        ok = false;
      } else {
        setErr("new-pass", "");
      }

      // Validación de coincidencia
      if (!p2) {
        setErr("confirm-pass", "*Campo obligatorio");
        ok = false;
      } else if (p1 !== p2) {
        setErr("confirm-pass", "Las contraseñas no coinciden");
        ok = false;
      } else {
        setErr("confirm-pass", "");
      }

      if (!ok) return;

      if (!email) {
        if (toast) showToast("Error: No se encontró el correo de recuperación");
        return;
      }

      try {
        await updatePasswordByEmail(email, p1);
        if (toast) showToast("✓ Contraseña actualizada con éxito");

        const redirect = params.get('redirect');
        let target = "login.html";

        if (redirect === 'checkout') {
          target = "checkout.html";
        } else if (redirect) {
          // Si venía de otra página (ej: producto.html), lo pasamos al login para el redireccionamiento final
          target = `login.html?redirect=${encodeURIComponent(redirect)}`;
        }

        setTimeout(() => { location.href = target; }, 2000);
      } catch (error) {
        console.error(error);
        if (toast) showToast("No se pudo actualizar la contraseña. Reintenta.");
      }
    });
  }

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
});