<?php
// Copiá este archivo como praxia-lead-config.php en el servidor, idealmente
// una carpeta arriba de la pública (lead.php lo busca ahí primero y después
// al lado suyo). Nunca lo subas a git: tiene el token de Meta.
return [
    // Mismo ID que PIXEL_ID en assets/js/pixel.js.
    'meta_pixel_id' => '',
    // Administrador de eventos → el píxel → Configuración → API de conversiones → Generar token de acceso.
    'meta_access_token' => '',
    // Solo para probar: el código de "Probar eventos". Dejalo vacío en producción.
    'meta_test_event_code' => '',
    'meta_graph_version' => 'v26.0',
];
