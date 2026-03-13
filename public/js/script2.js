// script2.js - Funcionalidad para páginas estáticas

document.addEventListener('DOMContentLoaded', function () {

    // 1. EFECTO DE SCROLL SUAVE EN LOS ENLACES DEL MENÚ
    document.querySelectorAll('header nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Si el enlace es a otra página, no hacer scroll suave
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });



    // 3. ANIMACIÓN DE APARICIÓN AL HACER SCROLL (solo para páginas como Funciones, Descarga, Nosotros)
    const animatedElements = document.querySelectorAll('h2, .card, .feature-card, .box, .mockup, .team-box, .contact-box');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    entry.target.style.transition = "opacity 0.6s ease, transform 0.6s ease";
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            el.style.opacity = "0";
            el.style.transform = "translateY(20px)";
            observer.observe(el);
        });
    }

    // 4. CONFIRMACIÓN AL SALIR DE LA PÁGINA DE "NOSOTROS" SI HAY FORMULARIO (opcional)
    // (No aplica aquí, pero dejamos espacio por si lo añades después)

    // 5. AÑADIR AÑO ACTUAL EN EL PIE DE PÁGINA AUTOMÁTICAMENTE
    const footer = document.querySelector('footer');
    if (footer && !footer.innerHTML.includes('©')) {
        const currentYear = new Date().getFullYear();
        const copyright = document.createElement('p');
        copyright.style.textAlign = 'center';
        copyright.style.fontSize = '0.9em';
        copyright.style.marginTop = '20px';
        copyright.innerHTML = `© ${currentYear} Auto-Record. Todos los derechos reservados.`;
        footer.prepend(copyright);
    }

    // 6. BOTÓN "IR ARRIBA" (opcional, pero útil en páginas largas como "Nosotros")
    if (document.body.scrollHeight > window.innerHeight * 1.5) {
        let backToTop = document.getElementById('back-to-top');
        if (!backToTop) {
            backToTop = document.createElement('button');
            backToTop.id = 'back-to-top';
            backToTop.innerHTML = '↑';
            backToTop.style.position = 'fixed';
            backToTop.style.bottom = '20px';
            backToTop.style.right = '20px';
            backToTop.style.padding = '10px 15px';
            backToTop.style.backgroundColor = '#3b82f6';
            backToTop.style.color = 'white';
            backToTop.style.border = 'none';
            backToTop.style.borderRadius = '50%';
            backToTop.style.cursor = 'pointer';
            backToTop.style.fontSize = '18px';
            backToTop.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            backToTop.style.zIndex = '1000';
            document.body.appendChild(backToTop);

            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            window.addEventListener('scroll', () => {
                backToTop.style.display = (window.scrollY > 300) ? 'block' : 'none';
            });
        }
    }

});