/**
 * Controlador para la vista de Recuperación de Contraseña
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('forgot-pass-form');
  const emailInput = document.getElementById('fg-email');
  const errorMsg = document.getElementById('err-fg-email');

  if (emailInput) {
    emailInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toLowerCase();
    });
  }

  // Quitar el rojo de error al hacer clic/foco en el input
  if (emailInput) {
    emailInput.addEventListener('focus', () => {
      errorMsg.textContent = "";
      emailInput.classList.remove("border-red-600", "bg-red-50");
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Limpiar errores previos
      errorMsg.textContent = "";
      emailInput.classList.remove("border-red-600", "bg-red-50");

      if (!email) {
        showError("*Campo obligatorio");
      } else if (!emailRegex.test(email)) {
        showError("El formato del correo no es válido.");
      } else {
        // Simulación de éxito - Pasamos el email para que resetPass.html sepa a quién actualizar
        if (typeof showToast === 'function') {
          showToast("✓ Enlace enviado a " + email);
          const urlParams = new URLSearchParams(location.search);
          const redirect = urlParams.get('redirect');
          let target = "resetPass.html?email=" + encodeURIComponent(email);
          if (redirect) target += "&redirect=" + redirect;
          setTimeout(() => { location.href = target; }, 2500);
        }
      }
    });
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    emailInput.classList.add("border-red-600", "bg-red-50");
  }
});