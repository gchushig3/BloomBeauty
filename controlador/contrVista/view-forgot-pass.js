/**
 * Controlador para la vista de Recuperación de Contraseña
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('forgot-pass-form');
  const emailInput = document.getElementById('fg-email');
  const errorMsg = document.getElementById('err-fg-email');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Limpiar errores previos
      errorMsg.textContent = "";
      emailInput.classList.remove("border-red-600", "bg-red-50");

      if (!email) {
        showError("Por favor, ingresa tu correo electrónico.");
      } else if (!emailRegex.test(email)) {
        showError("El formato del correo no es válido.");
      } else {
        // Simulación de éxito - Pasamos el email para que resetPass.html sepa a quién actualizar
        if (typeof showToast === 'function') {
          showToast("✓ Enlace enviado a " + email);
          setTimeout(() => { location.href = "resetPass.html?email=" + encodeURIComponent(email); }, 2500);
        }
      }
    });
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    emailInput.classList.add("border-red-600", "bg-red-50");
  }
});