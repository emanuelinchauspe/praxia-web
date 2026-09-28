(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');
  var yearEl = document.getElementById('year');
  var recetaDateEl = document.getElementById('receta-date');

  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (recetaDateEl) {
    recetaDateEl.textContent = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Header sólido + blur recién después de scrollear un poco, no desde el pixel 0.
  function onScroll() {
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menú mobile.
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Reveal on scroll: sutil, una sola vez por elemento, respeta prefers-reduced-motion
  // (la transición ya queda anulada por CSS, acá solo evitamos animar si no hace falta).
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
    // Red de seguridad: si por lo que sea (pestaña en background, un
    // navegador raro, timing) el observer nunca llega a disparar para algún
    // elemento, no queremos contenido invisible para siempre — a los pocos
    // segundos se revela todo lo que quedó pendiente igual.
    setTimeout(function () {
      revealEls.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }, 2500);
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // Capturas todavía no generadas (o que fallen al cargar): mostramos el
  // placeholder con ícono en vez de un ícono de imagen rota del navegador.
  document.querySelectorAll('.shot').forEach(function (img) {
    function markMissing() {
      img.style.display = 'none';
      var wrap = img.closest('.shot-wrap, .screen-inner');
      if (wrap) wrap.classList.add('shot-missing');
    }
    if (img.complete && img.naturalWidth === 0) {
      markMissing();
    } else {
      img.addEventListener('error', markMissing);
    }
  });
})();
