/* Inyecta el HEADER + NAV en cualquier página.
   Detecta si estamos en /Vista/ o en la raíz para resolver rutas. */
(function () {
  const inVista = location.pathname.toLowerCase().includes('/vista/');
  const root    = inVista ? '../' : '';
  const pg      = inVista ? '' : 'vista/';

  const user = JSON.parse(localStorage.getItem("bb_user") || "null");

  const headerHTML = `
  <header class="sticky top-0 z-50 bg-white shadow-soft" role="banner">
    <!-- Overlay para el Menú Móvil -->
    <div id="mobile-menu-overlay" class="hidden fixed inset-0 z-[95] bg-black/40"></div>

    <!-- Menú Móvil / Búsqueda Avanzada (Panel Lateral) -->
    <div id="mobile-menu" class="hidden fixed inset-y-0 left-0 z-[100] w-[85%] max-w-[320px] bg-white p-8 flex flex-col overflow-y-auto shadow-2xl">
      <div class="flex justify-between items-center mb-6">
        <span class="text-2xl font-bold text-brown">Explora 🌸<br>Bloom Beauty</span>
        <button id="close-mobile-menu" class="text-gray-500 p-1" aria-label="Cerrar menú">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="relative mb-8">
        <form class="flex bg-white rounded-xl overflow-hidden border-2 border-rose/30 focus-within:border-coral focus-within:ring-4 focus-within:ring-coral/10 transition-all shadow-md"
              onsubmit="event.preventDefault(); searchProducts(this.q.value)">
          <label for="mobile-search-input" class="sr-only">Buscar productos</label>
          <input id="mobile-search-input" name="q" type="search" autocomplete="off" placeholder="Buscar mi producto..." class="flex-1 bg-transparent px-2 py-3 outline-none text-gray-800 text-base placeholder:text-gray-400" />
          <button type="submit" class="px-1 bg-coral text-white transition-colors hover:bg-brown flex items-center justify-center shrink-0" aria-label="Realizar búsqueda">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 25 25" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </form>
        <div id="mobile-search-suggestions" class="absolute top-full left-0 right-0 bg-white shadow-card rounded-b-lg mt-1 hidden z-[110] max-h-60 overflow-y-auto border border-gray-100"></div>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Acordeón: Productos -->
        <div class="border-b border-gray-100 pb-4">
          <button class="mobile-accordion-header flex items-center justify-between w-full py-2 text-left">
            <span class="font-bold text-brown uppercase text-base tracking-widest">Productos</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-coral transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div class="mobile-accordion-content hidden flex flex-col gap-1 mt-2 pl-2">
            <a href="${pg}categoria.html?cat=limpiadores" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Limpiadores</a>
            <a href="${pg}categoria.html?cat=serums" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Sérums</a>
            <a href="${pg}categoria.html?cat=cremas" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Cremas / Hidratantes</a>
            <a href="${pg}categoria.html?cat=protector-solar" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Protector solar</a>
          </div>
        </div>

        <!-- Acordeón: Lo que tu piel necesita -->
        <div class="border-b border-gray-100 pb-4">
          <button class="mobile-accordion-header flex items-center justify-between w-full py-2 text-left">
            <span class="font-bold text-brown uppercase text-base tracking-widest">Lo que tu piel necesita</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-coral transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div class="mobile-accordion-content hidden flex flex-col gap-1 mt-2 pl-2">
            <a href="${pg}categoria.html?prob=acne" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Acné</a>
            <a href="${pg}categoria.html?prob=arrugas" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Antiedad</a>
            <a href="${pg}categoria.html?prob=manchas" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Manchas</a>
            <a href="${pg}categoria.html?prob=sensibilidad" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Sensibilidad</a>
          </div>
        </div>

        <!-- Acordeón: Marcas -->
        <div class="border-b border-gray-100 pb-4">
          <button class="mobile-accordion-header flex items-center justify-between w-full py-2 text-left">
            <span class="font-bold text-brown uppercase text-base tracking-widest">Nuestras Marcas</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-coral transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div class="mobile-accordion-content hidden flex flex-col gap-1 mt-2 pl-2">
            <a href="${pg}categoria.html?marca=la-roche-posay" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">La Roche-Posay</a>
            <a href="${pg}categoria.html?marca=nivea" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Nivea</a>
            <a href="${pg}categoria.html?marca=cerave" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">CeraVe</a>
            <a href="${pg}categoria.html?marca=eucerin" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Eucerin</a>
            <a href="${pg}categoria.html?marca=bioderma" class="py-3 px-4 rounded-xl text-base font-medium text-gray-600 hover:bg-rose/10 transition">Bioderma</a>
          </div>
        </div>

        <div class="flex flex-col gap-4 mt-4">
          <a href="${pg}categoria.html?cat=kits" class="border-2 border-rose p-4 rounded-xl text-sm font-bold text-brown text-center hover:bg-rose/10">
            Kit cuida tu piel
          </a>
          <a href="${pg}categoria.html?cat=ofertas" class="bg-coral p-4 rounded-xl text-sm font-bold text-white text-center hover:bg-brown transition-colors">
            Ofertas Especiales
          </a>
        </div>
      </div>
    </div>

    <div class="max-w-[1400px] mx-auto flex items-center justify-between lg:justify-center gap-4 md:gap-8 px-4 md:px-6 py-3">
      <div class="flex items-center gap-2">
        <!-- Botón Hamburguesa (Móvil) -->
        <button id="mobile-menu-btn" class="md:hidden p-2 -ml-2 text-brown" aria-label="Abrir menú de navegación">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <a href="${root}index.html" class="flex items-center gap-2 shrink-0 group" aria-label="Bloom Beauty - Inicio">
          <img src="${root}logo/logo.png" alt="Logo Bloom Beauty" class="h-10 w-auto object-contain" />
          <span class="text-[clamp(1.25rem,5vw,1.5rem)] font-bold tracking-tight text-gray-800 group-hover:text-brown transition-colors leading-none">
            Bloom <span class="text-coral">Beauty</span>
          </span>
        </a>
      </div>

      <div class="hidden md:flex flex-1 max-w-[500px] relative">
        <form class="flex w-full bg-gray-100 rounded-lg overflow-hidden"
              role="search"
              onsubmit="event.preventDefault(); searchProducts(this.q.value)">
          <label for="search-input" class="sr-only">Buscar productos</label>
          <input id="search-input" name="q" type="search" autocomplete="off"
                placeholder="Buscar mi producto..."
                aria-label="Buscar productos"
                class="flex-1 bg-transparent px-4 py-2 outline-none text-gray-700" />
          
          <button id="search-button" type="submit" aria-label="Buscar"
                  class="px-4 bg-coral text-white hover:bg-brown transition flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </form>
        <div id="search-suggestions" class="absolute top-full left-0 right-0 bg-white shadow-card rounded-b-lg mt-1 hidden z-[60] max-h-60 overflow-y-auto border border-gray-100"></div>
      </div>

      <div class="flex items-center gap-3 sm:gap-6 md:gap-10 text-base shrink-0">
        <!-- Enlace de Usuario / Login -->
        <a href="${pg}${user ? 'cliente.html' : 'login.html'}" class="flex items-center gap-2 hover:text-brown transition-colors shrink-0"
          aria-label="Iniciar sesión o registrarse">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-icon lucide-user-round shrink-0"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
          <span class="leading-tight font-medium hidden md:inline-block">${user ? user.name : 'Inicia sesión'}</span>
        </a>

        <!-- Enlace de Carrito -->
        <a href="${pg}carrito.html" class="relative flex items-center hover:text-brown transition-colors shrink-0"
          aria-label="Ver carrito de compras">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart-icon lucide-shopping-cart shrink-0"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <span id="cart-count" aria-live="polite"
                class="hidden absolute -top-1 -right-2 bg-coral text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
            0
          </span>
        </a>
      </div>
    </div>

    <nav class="hidden md:block bg-rose/60" aria-label="Navegación principal">
      <ul class="max-w-[1400px] mx-auto flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-base font-medium">
        <li class="relative group">
          <button aria-haspopup="true" aria-expanded="false"
                  class="px-4 py-2 rounded hover:bg-white/70">Productos ▾</button>
          <ul class="absolute left-0 top-full hidden group-hover:block group-focus-within:block bg-white shadow-card rounded min-w-[200px] py-2 z-50">
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?cat=limpiadores">Limpiadores</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?cat=serums">Sérums</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?cat=cremas">Cremas / Hidratantes</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?cat=protector-solar">Protector solar</a></li>
          </ul>
        </li>
        <li class="relative group">
          <button aria-haspopup="true" aria-expanded="false"
                  class="px-4 py-2 rounded hover:bg-white/70">Lo que tu piel necesita ▾</button>
          <ul class="absolute left-0 top-full hidden group-hover:block group-focus-within:block bg-white shadow-card rounded min-w-[200px] py-2 z-50">
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?prob=acne">Acné</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?prob=arrugas">Arrugas / Anti-edad</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?prob=manchas">Manchas</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?prob=sensibilidad">Sensibilidad</a></li>
          </ul>
        </li>
        <li><a class="px-4 py-2 rounded hover:bg-white/70 inline-block" href="${pg}categoria.html?cat=kits">Kit cuida tu piel</a></li>
        <li><a class="px-4 py-2 rounded hover:bg-white/70 inline-block" href="${pg}categoria.html?cat=ofertas">Ofertas</a></li>
        <li class="relative group">
          <button aria-haspopup="true" aria-expanded="false"
                  class="px-4 py-2 rounded hover:bg-white/70">Marcas ▾</button>
          <ul class="absolute left-0 top-full hidden group-hover:block group-focus-within:block bg-white shadow-card rounded min-w-[200px] py-2 z-50">
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?marca=la-roche-posay">La Roche-Posay</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?marca=nivea">Nivea</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?marca=cerave">CeraVe</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?marca=eucerin">Eucerin</a></li>
            <li><a class="block px-4 py-2 hover:bg-rose" href="${pg}categoria.html?marca=bioderma">Bioderma</a></li>
          </ul>
        </li>
      </ul>
    </nav>
  </header>`;

  // Footer + Toast comunes
  const footerHTML = `
    <footer class="bg-brown text-white text-center py-6 mt-12" role="contentinfo">
      <p>©2026 Todos los derechos reservados. Bloom Beauty Ecuador</p>
    </footer>
    <div id="toast" role="status" aria-live="polite"
         class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-brown text-white px-4 py-2 md:px-5 md:py-3 rounded-lg shadow-card opacity-0 pointer-events-none transition-opacity duration-300 z-50 whitespace-nowrap text-sm md:text-base max-w-[90vw]"></div>`;

  document.addEventListener('DOMContentLoaded', () => {
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');
    if (headerSlot) {
      headerSlot.outerHTML = headerHTML;
      
      // Lógica de toggle para menú móvil
      const menuBtn = document.getElementById('mobile-menu-btn');
      const closeBtn = document.getElementById('close-mobile-menu');
      const menu = document.getElementById('mobile-menu');
      const overlay = document.getElementById('mobile-menu-overlay');
      
      if (menuBtn && menu) {
        menuBtn.addEventListener('click', () => {
          menu.classList.remove('hidden');
          if (overlay) overlay.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
          const qInput = document.getElementById('mobile-search-input');
          if (qInput) setTimeout(() => qInput.focus(), 150);
        });

        // Lógica de acordeones dentro del menú móvil
        const accordions = menu.querySelectorAll('.mobile-accordion-header');
        accordions.forEach(header => {
          header.onclick = () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('svg');
            content.classList.toggle('hidden');
            if (icon) icon.classList.toggle('rotate-180');
          };
        });
      }

      if (closeBtn && menu) closeBtn.onclick = () => {
        menu.classList.add('hidden');
        if (overlay) overlay.classList.add('hidden');
        document.body.style.overflow = '';
      };

      if (overlay && menu) overlay.onclick = () => {
        menu.classList.add('hidden');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
      };
    }

    if (footerSlot) footerSlot.outerHTML = footerHTML;
    if (typeof updateCartBadge === 'function') updateCartBadge();
  });
})();
