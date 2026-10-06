// Píxel de Meta: PageView en cada página y "Contact" al tocar un link de
// WhatsApp. El "Lead" lo dispara gracias.html con el mismo eventID que manda
// lead.php por la API de conversiones, así Meta lo cuenta una sola vez.
//
// Sin PIXEL_ID no carga nada: el sitio funciona igual, solo sin medición.
(function () {
  'use strict';

  var PIXEL_ID = '1618660373269000';
  if (!PIXEL_ID) return;

  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (link) window.fbq('track', 'Contact');
  });
})();
