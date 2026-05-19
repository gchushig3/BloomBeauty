document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.getElementById('carousel-inner');
    if (!carousel) return;

    const slides = Array.from(carousel.children);
    
    // 1. Clonamos la primera diapositiva y la añadimos al final
    const firstClone = slides[0].cloneNode(true);
    carousel.appendChild(firstClone);

    let currentIndex = 0;
    const intervalTime = 4000; 
    let isTransitioning = false;

    function nextSlide() {
        if (isTransitioning) return;
        
        currentIndex++;
        carousel.style.transition = "transform 0.5s ease-in-out";
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;

        isTransitioning = true;
    }

    // 2. Escuchamos cuando la transición termina
    carousel.addEventListener('transitionend', () => {
        isTransitioning = false;
        
        // Si estamos en el clon (el final), saltamos al inicio real sin animación
        if (currentIndex === slides.length) {
            carousel.style.transition = "none"; // Quitamos la animación
            currentIndex = 0;
            carousel.style.transform = `translateX(0)`;
        }
    });

    // Iniciar autoplay
    let slideInterval = setInterval(nextSlide, intervalTime);

    // Pausar al entrar con el ratón
    carousel.addEventListener('mouseenter', () => clearInterval(slideInterval));
    carousel.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, intervalTime);
    });
});