<?php
// Recibe el formulario de demo.html y lo manda por email a soporte.
//
// Responde JSON cuando lo pide el fetch de demo.js (Accept: application/json);
// si llega por POST común (navegador sin JS) redirige a gracias.html.
// El "camino" (demo 1:1 o prueba guiada) se decide acá, no en el navegador.
//
// Si existe praxia-lead-config.php (fuera del repo, ver README) también manda
// el lead a la API de conversiones de Meta, con el mismo eventID que dispara
// el píxel en gracias.html para que Meta no lo cuente dos veces.

declare(strict_types=1);

const LEAD_TO = 'soporte@manuchoit.com.ar';
const LEAD_FROM = 'soporte@manuchoit.com.ar';
const MAX_PER_HOUR = 5;

date_default_timezone_set('America/Argentina/Buenos_Aires');

$wantsJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $ruta = '', string $esp = '', string $error = '', int $status = 200, string $eventId = ''): void
{
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'ruta' => $ruta, 'error' => $error, 'eid' => $eventId]);
    } elseif ($ok) {
        header('Location: gracias.html?ruta=' . rawurlencode($ruta) . '&esp=' . rawurlencode($esp)
            . ($eventId !== '' ? '&eid=' . rawurlencode($eventId) : ''), true, 303);
    } else {
        http_response_code($status);
        header('Content-Type: text/plain; charset=utf-8');
        echo "No pudimos enviar el formulario. Escribinos a " . LEAD_TO . " o por WhatsApp.";
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: demo.html', true, 303);
    exit;
}

// Una sola línea, sin saltos (evita inyección de cabeceras) y con largo máximo.
function field(string $name, int $max): string
{
    $value = trim((string) ($_POST[$name] ?? ''));
    $value = preg_replace('/[\r\n\t]+/', ' ', $value) ?? '';
    return mb_substr($value, 0, $max);
}

function choice(string $name, array $allowed): string
{
    $value = (string) ($_POST[$name] ?? '');
    return array_key_exists($value, $allowed) ? $value : '';
}

$especialidades = ['odontologia' => 'Odontología', 'kinesiologia' => 'Kinesiología', 'otra' => 'Otra'];
$profesionales = ['1' => 'Solo 1', '2-4' => 'De 2 a 4', '5-8' => 'De 5 a 8', '9+' => '9 o más'];
$hoy = ['papel' => 'Papel', 'planilla' => 'Excel / Google Sheets', 'whatsapp' => 'WhatsApp y memoria', 'sistema' => 'Otro sistema'];
$cuando = ['ya' => 'Lo antes posible', 'mes' => 'Este mes', 'meses' => 'Próximos meses', 'mirando' => 'Solo mirando'];

$data = [
    'especialidad' => choice('especialidad', $especialidades),
    'especialidad_otra' => field('especialidad_otra', 60),
    'profesionales' => choice('profesionales', $profesionales),
    'hoy' => choice('hoy', $hoy),
    'cuando' => choice('cuando', $cuando),
    'nombre' => field('nombre', 80),
    'consultorio' => field('consultorio', 80),
    'ciudad' => field('ciudad', 60),
    'whatsapp' => field('whatsapp', 30),
    'email' => field('email', 120),
];

// Mismo criterio que demo.js: más de un profesional y con intención de empezar
// pasa a demo 1:1; el resto va directo a la prueba de 30 días guiada.
$ruta = ($data['profesionales'] !== '' && $data['profesionales'] !== '1' && $data['cuando'] !== 'mirando')
    ? 'demo'
    : 'prueba';

// Bot que completó el campo trampa: le decimos que salió bien y no mandamos nada.
if (field('website', 200) !== '') {
    respond(true, $ruta, $data['especialidad']);
}

$missing = $data['especialidad'] === '' || $data['profesionales'] === '' || $data['hoy'] === ''
    || $data['cuando'] === '' || $data['nombre'] === '' || $data['consultorio'] === ''
    || $data['ciudad'] === '' || strlen(preg_replace('/\D/', '', $data['whatsapp']) ?? '') < 8;
if ($missing) {
    respond(false, '', '', 'Faltan datos', 422);
}
if ($data['email'] !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    respond(false, '', '', 'Email inválido', 422);
}

// Límite simple por IP para que nadie llene la casilla de soporte.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/praxia-lead-' . hash('sha256', $ip);
$now = time();
$hits = array_filter(
    array_map('intval', is_file($rateFile) ? (file($rateFile, FILE_IGNORE_NEW_LINES) ?: []) : []),
    fn (int $t) => $t > $now - 3600
);
if (count($hits) >= MAX_PER_HOUR) {
    respond(false, '', '', 'Demasiados envíos', 429);
}
$hits[] = $now;
@file_put_contents($rateFile, implode("\n", $hits));

$espLabel = $especialidades[$data['especialidad']];
if ($data['especialidad'] === 'otra' && $data['especialidad_otra'] !== '') {
    $espLabel = 'Otra: ' . $data['especialidad_otra'];
}
$rutaLabel = $ruta === 'demo' ? 'DEMO 1:1' : 'PRUEBA GUIADA';

$subject = "[Praxia] {$rutaLabel} · {$espLabel} · {$profesionales[$data['profesionales']]} prof. · {$data['consultorio']}";

$body = implode("\n", [
    "Nuevo pedido de demo desde la web ({$rutaLabel}).",
    '',
    "Nombre:         {$data['nombre']}",
    "Consultorio:    {$data['consultorio']}",
    "Ciudad:         {$data['ciudad']}",
    "WhatsApp:       {$data['whatsapp']}",
    'Email:          ' . ($data['email'] !== '' ? $data['email'] : '(no dejó)'),
    '',
    "Especialidad:   {$espLabel}",
    "Profesionales:  {$profesionales[$data['profesionales']]}",
    "Hoy usan:       {$hoy[$data['hoy']]}",
    "Quiere empezar: {$cuando[$data['cuando']]}",
    '',
    'Enviado: ' . date('d/m/Y H:i'),
]);

$headers = [
    'From: Praxia web <' . LEAD_FROM . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
if ($data['email'] !== '') {
    $headers[] = 'Reply-To: ' . $data['email'];
}

$sent = mail(
    LEAD_TO,
    mb_encode_mimeheader($subject, 'UTF-8'),
    $body,
    implode("\r\n", $headers),
    '-f' . LEAD_FROM
);

if (!$sent) {
    respond(false, '', '', 'No se pudo enviar', 500);
}

$eventId = bin2hex(random_bytes(8));
send_meta_lead($eventId, $ruta, $data);

respond(true, $ruta, $data['especialidad'], '', 200, $eventId);

/** Config de Meta: fuera de la carpeta pública si se puede, y nunca en git. */
function meta_config(): ?array
{
    foreach ([dirname(__DIR__) . '/praxia-lead-config.php', __DIR__ . '/praxia-lead-config.php'] as $path) {
        if (is_file($path)) {
            $config = require $path;
            if (is_array($config) && !empty($config['meta_pixel_id']) && !empty($config['meta_access_token'])) {
                return $config;
            }
        }
    }
    return null;
}

/** Normalizado y hasheado como pide Meta (SHA-256 en minúsculas, sin espacios). */
function meta_hash(string $value): string
{
    return hash('sha256', mb_strtolower(trim($value)));
}

/** Teléfono en formato internacional sin "+": 54 + número sin el 0 inicial. */
function meta_phone(string $raw): string
{
    $digits = preg_replace('/\D/', '', $raw) ?? '';
    if (strpos($digits, '54') === 0) {
        return $digits;
    }
    return '54' . ltrim($digits, '0');
}

/**
 * Lead (y LeadCalificado si va a demo 1:1) por la API de conversiones.
 * Nunca frena el formulario: si Meta no responde, el lead ya llegó por email.
 */
function send_meta_lead(string $eventId, string $ruta, array $data): void
{
    $config = meta_config();
    if ($config === null || !function_exists('curl_init')) {
        return;
    }

    $nameParts = preg_split('/\s+/', $data['nombre'], 2) ?: [];
    $userData = array_filter([
        'em' => $data['email'] !== '' ? [meta_hash($data['email'])] : null,
        'ph' => [hash('sha256', meta_phone($data['whatsapp']))],
        'fn' => isset($nameParts[0]) ? [meta_hash($nameParts[0])] : null,
        'ln' => isset($nameParts[1]) ? [meta_hash($nameParts[1])] : null,
        'ct' => [meta_hash(str_replace(' ', '', $data['ciudad']))],
        'country' => [meta_hash('ar')],
        'client_ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'client_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        'fbp' => $_COOKIE['_fbp'] ?? null,
        'fbc' => $_COOKIE['_fbc'] ?? null,
    ]);

    $base = [
        'event_time' => time(),
        'action_source' => 'website',
        'event_source_url' => $_SERVER['HTTP_REFERER'] ?? 'https://praxiaweb.manuchoit.com.ar/demo.html',
        'user_data' => $userData,
        'custom_data' => [
            'content_category' => $ruta,
            'especialidad' => $data['especialidad'],
            'profesionales' => $data['profesionales'],
        ],
    ];
    $events = [$base + ['event_name' => 'Lead', 'event_id' => $eventId]];
    if ($ruta === 'demo') {
        $events[] = $base + ['event_name' => 'LeadCalificado', 'event_id' => $eventId . '-q'];
    }

    $payload = ['data' => $events, 'access_token' => $config['meta_access_token']];
    if (!empty($config['meta_test_event_code'])) {
        $payload['test_event_code'] = $config['meta_test_event_code'];
    }

    $version = $config['meta_graph_version'] ?? 'v26.0';
    $ch = curl_init("https://graph.facebook.com/{$version}/{$config['meta_pixel_id']}/events");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 4,
    ]);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status !== 200) {
        error_log('Praxia lead: la API de conversiones respondió ' . $status . ': ' . substr((string) $response, 0, 300));
    }
}
