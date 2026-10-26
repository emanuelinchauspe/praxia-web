(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');
  var yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  // Las fichas muestran un recorte del detalle; el clic abre la pantalla
  // completa. <dialog> ya resuelve Esc y el foco; acá solo se agrega cerrar
  // con la X y con un clic fuera de la imagen.
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxClose = document.getElementById('lightbox-close');
  if (lightbox && typeof lightbox.showModal === 'function') {
    document.querySelectorAll('.shot-zoom').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lightboxImg.src = btn.getAttribute('data-full');
        lightboxImg.alt = btn.querySelector('.shot').alt;
        lightbox.showModal();
      });
    });
    lightboxClose.addEventListener('click', function () {
      lightbox.close();
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) lightbox.close();
    });
  }

  // Hero: loop de fichas en video. En celular cambia el póster al recorte
  // 4:5; con "reducir movimiento" no arranca solo y queda el póster. El
  // botón permite pausarlo siempre (WCAG 2.2.2, movimiento de más de 5 s).
  var heroVideo = document.querySelector('.hero-video');
  var heroPause = document.getElementById('hero-pause');
  if (heroVideo) {
    if (window.matchMedia('(max-width: 760px)').matches) {
      heroVideo.poster = 'assets/video/hero-mobile-poster.jpg';
    }
    var setPaused = function (paused) {
      if (!heroPause) return;
      heroPause.classList.toggle('is-paused', paused);
      heroPause.setAttribute('aria-label', paused ? 'Reproducir animación' : 'Pausar animación');
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
      setPaused(true);
    }
    if (heroPause) {
      heroPause.addEventListener('click', function () {
        if (heroVideo.paused) {
          heroVideo.play();
          setPaused(false);
        } else {
          heroVideo.pause();
          setPaused(true);
        }
      });
    }
  }

  // "Ver Praxia en 30 segundos": el video con sonido se carga recién al
  // abrir el diálogo y se frena al cerrarlo.
  var videoBox = document.getElementById('video-box');
  var videoFull = document.getElementById('video-full');
  var videoOpen = document.getElementById('video-open');
  if (videoBox && videoOpen && typeof videoBox.showModal === 'function') {
    videoOpen.addEventListener('click', function () {
      videoBox.showModal();
      videoFull.play();
      if (window.fbq) window.fbq('trackCustom', 'VerVideo');
    });
    document.getElementById('video-close').addEventListener('click', function () {
      videoBox.close();
    });
    videoBox.addEventListener('click', function (e) {
      if (e.target === videoBox) videoBox.close();
    });
    videoBox.addEventListener('close', function () {
      videoFull.pause();
    });
  } else if (videoOpen) {
    videoOpen.addEventListener('click', function () {
      window.location.href = 'assets/video/praxia-30s.mp4';
    });
  }

  // "Con la marca de tu clínica": cada muestra pinta el presupuesto de ejemplo.
  var brandDoc = document.getElementById('brand-doc');
  var swatches = document.querySelectorAll('.swatch');
  swatches.forEach(function (sw) {
    sw.addEventListener('click', function () {
      brandDoc.style.setProperty('--clinic', sw.getAttribute('data-color'));
      swatches.forEach(function (other) {
        other.setAttribute('aria-checked', String(other === sw));
      });
    });
  });

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
