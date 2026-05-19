import { getProducts } from './data.js';

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const queryParam = params.get("q") || "";

  // 1. Obtener productos (si hay búsqueda, se filtra desde la base de datos)
  const PRODUCTS = await getProducts(queryParam);
  
  const titleEl = document.getElementById("page-title");

  // Lógica del Drawer de Filtros
  const btnOpen = document.getElementById('btn-open-filters');
  const btnClose = document.getElementById('btn-close-filters');
  const sidebar = document.getElementById('filter-sidebar');
  const overlay = document.getElementById('filter-overlay');

  const toggleFilters = (show) => {
    if (!sidebar || !overlay) return;
    sidebar.classList.toggle('-translate-x-full', !show);
    overlay.classList.toggle('hidden', !show);
    document.body.style.overflow = show ? 'hidden' : '';
  };

  if (btnOpen) btnOpen.onclick = () => toggleFilters(true);
  if (btnClose) btnClose.onclick = () => toggleFilters(false);
  if (overlay) overlay.onclick = () => toggleFilters(false);

  // Función auxiliar para normalizar strings (quitar espacios, minúsculas, guiones)
  // Esto ayuda a comparar "Protector solar" con "protector-solar"
  const slugify = (text) => {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  // 2. Función de filtrado principal (ahora usa los PRODUCTS cargados arriba)
  function applyFilters() {
    const cat = params.get("cat");
    const marcaParam = params.get("marca");
    const prob = params.get("prob");
    const q = (params.get("q") || "").toLowerCase();
    
    const checkedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value);
    const checkedSkins = Array.from(document.querySelectorAll('input[name="skin"]:checked')).map(cb => cb.value);
    
    const fmin = parseFloat(document.getElementById("f-min")?.value) || 0;
    const fmax = parseFloat(document.getElementById("f-max")?.value) || Infinity;

    // Lógica de chips de filtros activos
    const chipsContainer = document.getElementById('active-filters');
    const chipsWrapper = document.getElementById('chips-container');
    if (chipsWrapper) chipsWrapper.innerHTML = '';

    const hasActiveFilters = checkedBrands.length > 0 || checkedSkins.length > 0 || 
                             (document.getElementById("f-min")?.value !== "") || 
                             (document.getElementById("f-max")?.value !== "");

    if (hasActiveFilters && chipsContainer) {
      chipsContainer.classList.remove('hidden');
      
      const createChip = (text, onRemove) => {
        const chip = document.createElement('span');
        chip.className = 'flex items-center gap-1 bg-rose/30 text-brown px-3 py-1 rounded-full text-[11px] font-bold border border-rose/50 shadow-sm transition hover:bg-rose/50';
        chip.innerHTML = `${text} <button class="hover:text-coral transition-colors p-0.5"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>`;
        chip.querySelector('button').onclick = onRemove;
        chipsWrapper.appendChild(chip);
      };

      checkedBrands.forEach(brand => createChip(brand, () => {
        document.querySelector(`input[name="brand"][value="${brand}"]`).checked = false;
        applyFilters();
      }));

      checkedSkins.forEach(skin => createChip(`Piel: ${skin}`, () => {
        document.querySelector(`input[name="skin"][value="${skin}"]`).checked = false;
        applyFilters();
      }));

      // Chip de precio
      const minVal = document.getElementById("f-min")?.value;
      const maxVal = document.getElementById("f-max")?.value;
      if (minVal || maxVal) {
        createChip(`Precio: ${minVal || 0} - ${maxVal || '∞'}`, () => {
          document.getElementById('f-min').value = "";
          document.getElementById('f-max').value = "";
          applyFilters();
        });
      }
    } else if (chipsContainer) {
      chipsContainer.classList.add('hidden');
    }

    // Actualizar Título
    if (titleEl) {
      if (checkedBrands.length === 1) titleEl.textContent = checkedBrands[0].toUpperCase();
      else if (cat) titleEl.textContent = cat.replace("-", " ").toUpperCase();
      else if (prob) titleEl.textContent = prob === "arrugas" ? "ARRUGAS / ANTI-EDAD" : (prob === "acne" ? "ACNÉ" : prob.toUpperCase());
      else if (q) titleEl.textContent = `RESULTADOS: "${q}"`;
      else titleEl.textContent = "PRODUCTOS";
    }

    // 3. Filtrado de la lista
    let list = PRODUCTS.filter(p => {
      if (cat === "ofertas") {
        const allowedBrands = ["LRP01", "NIV01", "CER01"];
        const isAllowedBrand = allowedBrands.includes(p.brandCode);
        if (!p.onSale || !isAllowedBrand) return false;
      }

      // Lógica para Kits basándose en unm_codigo (kit, set, pack2)
      if (cat === "kits") {
        const kitCodes = ["kit", "set", "pack2"];
        const code = (p.unitCode || "").toLowerCase().trim();
        if (!kitCodes.includes(code)) return false;
      } else if (cat === "cremas") {
        const cremaCodes = ["HIDR", "CREM"];
        const code = (p.catCode || "").toUpperCase().trim();
        if (!cremaCodes.includes(code)) return false;
      } else if (cat && cat !== "ofertas" && slugify(p.category) !== slugify(cat)) {
        return false;
      }
      
      if (checkedBrands.length > 0 && !checkedBrands.includes(p.brand)) return false;
      
      // Comparación flexible de problema (si existe en la data)
      if (prob === "acne") {
        if ((p.catCode || "").toUpperCase().trim() !== "ACNE") return false;
      } else if (prob === "arrugas") {
        if ((p.catCode || "").toUpperCase().trim() !== "ANTI") return false;
      } else if (prob === "manchas") {
        if ((p.catCode || "").toUpperCase().trim() !== "MANC") return false;
      } else if (prob === "sensibilidad") {
        if ((p.catCode || "").toUpperCase().trim() !== "SENS") return false;
      } else if (prob && p.problem !== "general" && slugify(p.problem) !== slugify(prob)) {
        return false;
      }
      
      if (q) {
        // Búsqueda Avanzada: El producto debe contener todas las palabras de la búsqueda
        // Buscamos en Nombre, Marca y Categoría simultáneamente
        const searchStr = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
        const searchTerms = q.split(/\s+/); // Divide por espacios
        
        const matchesAll = searchTerms.every(term => searchStr.includes(term));
        if (!matchesAll) return false;
      }

      if (checkedSkins.length > 0 && p.skinType !== "todos" && !checkedSkins.includes(p.skinType)) return false;
      if (p.price < fmin || p.price > fmax) return false;
      return true;
    });

    // 4. Renderizado
    const grid = document.getElementById("products-grid");
    if (grid) {
      grid.innerHTML = list.length
        ? list.map(window.productCardHTML).join("") 
        : '<p class="col-span-full text-center text-gray-500 py-10">No se encontraron productos.</p>';
    }
  }

  // Listeners para inputs
  document.querySelectorAll("aside input").forEach(el => {
    el.addEventListener("input", applyFilters);
  });

  // Botón limpiar
  const btnClearTop = document.getElementById('btn-clear-top');
  if (btnClearTop) {
    btnClearTop.onclick = () => {
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      document.getElementById('f-min').value = "";
      document.getElementById('f-max').value = "";
      applyFilters();
    };
  }

  // Inicialización: Marcar checkbox si viene por URL de marca
  const m = params.get("marca");
  if (m) {
    const cb = Array.from(document.querySelectorAll('input[name="brand"]'))
      .find(c => slugify(c.value) === m);
    if (cb) cb.checked = true;
  }

  // Ejecutar filtro inicial con los productos ya cargados
  applyFilters();
});