<?php
/**
 * Single-file SMTP relay for shared hosting (Hostinger).
 * - Put this file in public_html as send.php
 * - First run will auto-download PHPMailer (v6.9.1) into /_phpmailer
 * - Call with POST JSON: { to, subject, html, replyTo? } + header x-api-key
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS, GET");
header("Access-Control-Allow-Headers: content-type, x-api-key");
header("Content-Type: application/json; charset=UTF-8");

// ---------- 🔧 EDIT THESE: your SMTP + API key ----------
const SMTP_HOST   = 'smtp.hostinger.com';
const SMTP_PORT   = 465;                           // 465 (SSL) or 587 (TLS)
const SMTP_SECURE = 'ssl';                         // 'ssl' or 'tls'
const SMTP_USER   = 'noreply@scentsnaura.pk';      // your mailbox
const SMTP_PASS   = ']uF~SLj4Mb';          // mailbox password
const FROM_NAME   = 'Phresh';               // display name
const API_KEY     = '98fe24b3-5f58-4e0c-8146-4000f04ba4ec'; // used in header: x-api-key
// --------------------------------------------------------

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  echo json_encode(["ok"=>true, "status"=>"alive"]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["error"=>"Method not allowed"]);
  exit;
}

// --- Security ---
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== API_KEY) {
  http_response_code(401);
  echo json_encode(["error"=>"Unauthorized"]);
  exit;
}

// --- Input ---
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
$to       = $data['to']       ?? null;
$subject  = $data['subject']  ?? null;
$html     = $data['html']     ?? null;
$replyTo  = $data['replyTo']  ?? null;

if (!$to || !$subject || !$html) {
  http_response_code(400);
  echo json_encode(["error"=>"Missing fields: to, subject, html"]);
  exit;
}

// --- Minimal PHPMailer bootstrap (auto-download if missing) ---
function ensure_phpmailer() {
  $base = __DIR__ . '/_phpmailer';
  if (!is_dir($base)) mkdir($base, 0755, true);

  $files = [
    'PHPMailer.php' => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/v6.9.1/src/PHPMailer.php',
    'SMTP.php'      => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/v6.9.1/src/SMTP.php',
    'Exception.php' => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/v6.9.1/src/Exception.php',
  ];

  foreach ($files as $name => $url) {
    $path = $base . '/' . $name;
    if (!file_exists($path)) {
      $data = @file_get_contents($url);
      if ($data === false) {
        // fallback to cURL if allow_url_fopen is disabled
        $ch = curl_init($url);
        curl_setopt_array($ch, [
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_FOLLOWLOCATION => true,
          CURLOPT_CONNECTTIMEOUT => 10,
          CURLOPT_TIMEOUT => 20,
          CURLOPT_USERAGENT => 'PHPMailer-downloader'
        ]);
        $data = curl_exec($ch);
        curl_close($ch);
      }
      if ($data === false) {
        throw new Exception("Unable to fetch PHPMailer: $name");
      }
      file_put_contents($path, $data);
    }
  }

  require_once $base . '/Exception.php';
  require_once $base . '/PHPMailer.php';
  require_once $base . '/SMTP.php';
}

try {
  ensure_phpmailer();

  // Namespaced classes
  $PHPMailer = 'PHPMailer\\PHPMailer\\PHPMailer';
  $Exception = 'PHPMailer\\PHPMailer\\Exception';

  $mail = new $PHPMailer(true);
  try {
    // SMTP config
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->Port       = SMTP_PORT;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = SMTP_SECURE; // 'ssl' or 'tls'
    $mail->CharSet    = 'UTF-8';

    // From / To
    $mail->setFrom(SMTP_USER, FROM_NAME);
    $mail->addAddress($to);
    if (!empty($replyTo)) $mail->addReplyTo($replyTo);

    // Content
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $html;
    $mail->AltBody = strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $html));

    // Send
    $mail->send();
    echo json_encode(["ok"=>true, "message"=>"sent"]);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error"=>$mail->ErrorInfo ?: $e->getMessage()]);
  }
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(["error"=>$e->getMessage()]);
}
