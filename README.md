# Sitio de marketing de Praxia

Landing estática (HTML + CSS + JS sin build, sin framework) para presentar Praxia
puertas afuera — no confundir con la app real (el producto que se vende acá), que
vive en otro repo (`praxia-app`). Este repo es independiente y no comparte deploy
ni pipeline con la app.

## Identidad de marca

Colores, tipografías (Outfit + IBM Plex Mono) e isotipo son los mismos que usa la
app real, copiados 1:1 de `src/index.css` y `public/brand/` del repo `praxia-app`
— ver el bloque de tokens al principio de `assets/css/style.css`. Si el manual de
marca cambia, actualizar acá y, por separado, en `praxia-app` (son dos repos sin
build compartido).

El único color que no está en la app: `--color-spark` (`#2e8ea8`), el celeste del
isotipo (el cuarto brazo de la cruz). En la app no es un token propio; acá se usa
puntual, para detalles (subrayados, eyebrows, un gradiente muy sutil).

## Ver el sitio en local

No requiere `npm install` ni build — es HTML servido tal cual:

```bash
python3 -m http.server 8080
# o: npx serve .
```

Y abrir `http://localhost:8080`.

## Estructura

```
index.html
assets/
  css/style.css
  js/main.js          # reveal on scroll, menú mobile, header al hacer scroll
  img/
    praxia-icon.svg, praxia-icon-blanco.svg, favicon.svg
    screenshots/       # capturas reales de la app (ver abajo)
```

Si falta una captura (o el archivo todavía no existe), `main.js` la reemplaza por
un placeholder con ícono en vez de mostrar el ícono de imagen rota del navegador
— el sitio nunca se rompe visualmente por una captura ausente.

## Capturas de pantalla

Son capturas de la app real con **datos demo ficticios** — nunca datos de una
clínica real. Se generaron con un harness aislado que vive en el repo `praxia-app`
(`scripts/marketing-screenshots/`); para regenerarlas o agregar una nueva pantalla,
ver el README de esa carpeta ahí.

## Deploy

Todavía no está conectado a ningún hosting. Al ser 100% estático, sirve cualquier
opción simple: cPanel (subdominio o `/`), Netlify, Vercel o GitHub Pages apuntando
a la raíz de este repo. Se dejó así a propósito para no decidir dominio/subdominio
final de antemano.

## Píxel de Meta y API de conversiones

- `assets/js/pixel.js`: el píxel (PageView en todas las páginas y "Contact" al
  tocar un link de WhatsApp). Con `PIXEL_ID` vacío no carga nada.
- `gracias.html` dispara `Lead` y, si el pedido va a demo 1:1, `LeadCalificado`.
- `lead.php` manda esos mismos eventos desde el servidor (API de conversiones),
  con el mismo `event_id`, así Meta los deduplica. Solo si existe
  `praxia-lead-config.php` en el servidor (copia de
  `praxia-lead-config.example.php` con el ID y el token). Ese archivo no va al
  repo: se sube a mano a Ferozo, una carpeta arriba de la pública si se puede.
- Datos personales: viajan a Meta hasheados (SHA-256), como pide la API. En la
  URL de `gracias.html` solo van el camino, la especialidad y el id del evento.
