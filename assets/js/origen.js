// Marca de origen: de qué anuncio o sitio llegó la visita.
//
// Guarda el primer origen conocido (parámetros utm_* del link del anuncio, o
// el sitio desde el que vino) durante 30 días. demo.js lo agrega al
// formulario y lead.php lo incluye en el email del pedido. No guarda datos
// personales. Si el navegador no deja usar localStorage, no pasa nada.
(function () {
  'use strict';

  var KEY = 'praxia_origen';
  var MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function read() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      if (saved && Date.now() - saved.ts < MAX_AGE_MS) return saved;
    } catch (e) {
      /* sin storage o dato corrupto: se trata como sin origen */
    }
    return null;
  }

  function save(origen) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(origen));
    } catch (e) {
      /* modo privado o storage bloqueado */
    }
  }

  var params = new URLSearchParams(window.location.search);
  var fromUrl = {};
  var hasUtm = false;
  UTM.forEach(function (name) {
    var value = params.get(name);
    if (value) {
      fromUrl[name] = value.slice(0, 100);
      hasUtm = true;
    }
  });

  var referrerHost = '';
  try {
    var ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.host !== window.location.host) referrerHost = ref.host;
  } catch (e) {
    referrerHost = '';
  }

  var current = read();
  // Un link con utm_* siempre gana (es un anuncio nuevo); si no, solo se
  // registra el sitio de origen cuando todavía no había nada guardado.
  if (hasUtm || (!current && referrerHost)) {
    fromUrl.referrer = referrerHost;
    fromUrl.landing = window.location.pathname.replace(/^\//, '') || 'index.html';
    fromUrl.ts = Date.now();
    save(fromUrl);
    current = fromUrl;
  }

  window.praxiaOrigen = current;
})();
