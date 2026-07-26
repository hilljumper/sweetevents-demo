<?php
/* ============================================================
   SWEET EVENTS — Chatbot IA (proxy a la API de Claude)
   ------------------------------------------------------------
   ACTIVACIÓN:
   1. Pon tu clave API de Anthropic en $API_KEY (o mejor, como
      variable de entorno ANTHROPIC_API_KEY en el hosting).
   2. Sube este archivo a /api/chat.php.
   3. En assets/js/config.js pon:  chatApi: "api/chat.php"
   Mientras chatApi esté vacío, la web usa el asistente guiado
   (sin coste) y todo deriva a WhatsApp.
   ============================================================ */

$API_KEY = getenv('ANTHROPIC_API_KEY') ?: ''; // ← o pega aquí la clave

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'method']);
  exit;
}
if (!$API_KEY) {
  echo json_encode(['reply' => 'El asistente IA aún no está activado. Escríbenos por WhatsApp y te atendemos al momento 😊']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$messages = [];
foreach (($body['messages'] ?? []) as $m) {
  if (!isset($m['role'], $m['content'])) continue;
  if (!in_array($m['role'], ['user', 'assistant'])) continue;
  $messages[] = ['role' => $m['role'], 'content' => mb_substr((string)$m['content'], 0, 2000)];
}
if (!$messages) { echo json_encode(['reply' => '¿En qué puedo ayudarte?']); exit; }

$system = <<<TXT
Eres Paula Cubo, la asistente comercial de Sweet Events (www.sweetevents.es), estudio de fotografía y vídeo con sedes en Manresa y Vilanova i la Geltrú (Cataluña), fundado por Mercè Rial en 1996. Equipo: Mercè Rial (dirección creativa), Jemi Paretas (fotógrafo, Penedès y Garraf), Ferran Cubo (estudio Manresa), César Carrasco (vídeo).
Servicios: fotografía y vídeo de bodas, fotomatón para bodas y eventos, sesiones de embarazo y newborn, fotografía corporativa y de producto, cobertura de eventos, dron y same day edit. Clientes de empresa: Tous, Charles Heidsieck, Macsa ID, Consergra, Campings Stel.
Objetivo: resolver dudas con calidez y brevedad (máx. 80 palabras) y SIEMPRE terminar invitando a seguir por WhatsApp (+34 650 968 800) o teléfono (938 738 476) para dar precio y disponibilidad. No inventes precios concretos. Responde en el idioma del usuario (castellano o catalán).
TXT;

$payload = json_encode([
  'model' => 'claude-haiku-4-5-20251001',
  'max_tokens' => 400,
  'system' => $system,
  'messages' => $messages,
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'x-api-key: ' . $API_KEY,
    'anthropic-version: 2023-06-01',
  ],
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200 || !$res) {
  echo json_encode(['reply' => 'Ahora mismo no puedo responder. Escríbenos por WhatsApp y te atendemos enseguida 😊']);
  exit;
}
$data = json_decode($res, true);
$reply = $data['content'][0]['text'] ?? 'Escríbenos por WhatsApp y te atendemos enseguida 😊';
echo json_encode(['reply' => $reply]);
