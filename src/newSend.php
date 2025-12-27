<?php
/**
 * Phresh - Email Relay (Hardcoded version)
 * Works on Hostinger without .env
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS, GET");
header("Access-Control-Allow-Headers: content-type, x-api-key");
header("Content-Type: application/json; charset=UTF-8");

// ────────────────────────────────
// 🔹 Hardcoded credentials
// ────────────────────────────────
const SMTP_HOST   = 'smtp.hostinger.com';
const SMTP_PORT   = 465; // 465 (SSL) or 587 (TLS)
const SMTP_SECURE = 'ssl';
const SMTP_USER   = 'noreply@scentsnaura.pk';
const SMTP_PASS   = ']uF~SLj4Mb';
const FROM_NAME   = 'Phresh';
const API_KEY     = '98fe24b3-5f58-4e0c-8146-4000f04ba4ec';

// ────────────────────────────────
// 🔹 Method checks
// ────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  echo json_encode(["ok" => true, "status" => "alive"]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["error" => "Method not allowed"]);
  exit;
}

// ────────────────────────────────
// 🔹 API Key Verification
// ────────────────────────────────
$apiKeyHeader = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKeyHeader !== API_KEY) {
  http_response_code(401);
  echo json_encode(["error" => "Unauthorized"]);
  exit;
}

// ────────────────────────────────
// 🔹 Parse JSON Body
// ────────────────────────────────
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$to       = $data['to']       ?? '';
$subject  = $data['subject']  ?? '';
$html     = $data['html']     ?? '';
$replyTo  = $data['replyTo']  ?? '';

if (!$to || !$subject || !$html) {
  http_response_code(400);
  echo json_encode(["error" => "Missing required fields: to, subject, html"]);
  exit;
}

// ────────────────────────────────
// 🔹 Load PHPMailer (local only)
// ────────────────────────────────
require_once __DIR__ . '/_phpmailer/Exception.php';
require_once __DIR__ . '/_phpmailer/PHPMailer.php';
require_once __DIR__ . '/_phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ────────────────────────────────
// 🔹 Send Email
// ────────────────────────────────
try {
  $mail = new PHPMailer(true);
  $mail->isSMTP();
  $mail->Host       = SMTP_HOST;
  $mail->Port       = SMTP_PORT;
  $mail->SMTPAuth   = true;
  $mail->Username   = SMTP_USER;
  $mail->Password   = SMTP_PASS;
  $mail->SMTPSecure = SMTP_SECURE;
  $mail->CharSet    = 'UTF-8';

  $mail->setFrom(SMTP_USER, FROM_NAME);
  $mail->addAddress($to);
  if (!empty($replyTo)) {
    $mail->addReplyTo($replyTo);
  }

  $mail->isHTML(true);
  $mail->Subject = $subject;
  $mail->Body    = $html;
  $mail->AltBody = strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $html));

  $mail->send();

  echo json_encode(["ok" => true, "message" => "sent"]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(["error" => $mail->ErrorInfo ?: $e->getMessage()]);
}
