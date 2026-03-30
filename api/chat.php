<?php
/**
 * Nova Chatbot Proxy — Neurodivergence Revived CIC
 * Place this file on your Namecheap server at: /public_html/api/chat.php
 *
 * HOW TO SET YOUR API KEY (two safe options):
 *
 * OPTION A — .env file (recommended, see .env.example):
 *   Create a file at /public_html/.env containing:
 *   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
 *
 * OPTION B — Hardcode directly in this file (simpler, still server-side safe):
 *   Replace the define line below:
 *   define('ANTHROPIC_API_KEY', 'sk-ant-your-actual-key-here');
 */

// ── Security headers ──────────────────────────────────────────────────────────
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// ── CORS — only allow requests from your own domain ──────────────────────────
$allowed_origins = [
    'https://neurodivergencerevived.org',
    'https://www.neurodivergencerevived.org',
];

// Allow localhost for local testing
if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) {
    $allowed_origins[] = 'http://localhost';
    $allowed_origins[] = 'http://127.0.0.1';
    // Also allow file:// by checking origin is empty or null
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} elseif (empty($origin)) {
    // Allow requests with no origin (e.g. direct file:// testing)
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Only accept POST ──────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Rate limiting (basic — per IP, uses session) ──────────────────────────────
session_start();
$now = time();
$window = 60;       // 60-second window
$max_requests = 20; // max 20 messages per minute per user

if (!isset($_SESSION['nr_chat_requests'])) {
    $_SESSION['nr_chat_requests'] = [];
}
// Remove timestamps older than window
$_SESSION['nr_chat_requests'] = array_filter(
    $_SESSION['nr_chat_requests'],
    fn($t) => $t > ($now - $window)
);
if (count($_SESSION['nr_chat_requests']) >= $max_requests) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please wait a moment.']);
    exit;
}
$_SESSION['nr_chat_requests'][] = $now;

// ── Load API key ──────────────────────────────────────────────────────────────
$api_key = '';

// Try loading from .env file first
$env_path = dirname(__DIR__) . '/.env';
if (file_exists($env_path)) {
    $lines = file($env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$key, $val] = explode('=', $line, 2);
            if (trim($key) === 'ANTHROPIC_API_KEY') {
                $api_key = trim($val);
                break;
            }
        }
    }
}

// Fallback: hardcode here (still server-side, not visible to browser)
if (empty($api_key)) {
    $api_key = 'YOUR_API_KEY_HERE'; // ← Replace with your actual key if not using .env
}

if (empty($api_key) || $api_key === 'YOUR_API_KEY_HERE') {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error. Please contact the site administrator.']);
    exit;
}

// ── Parse incoming request ────────────────────────────────────────────────────
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data || !isset($data['messages']) || !is_array($data['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body.']);
    exit;
}

// Sanitise messages — only allow role/content pairs, max 40 turns
$messages = [];
foreach (array_slice($data['messages'], -40) as $msg) {
    if (!isset($msg['role'], $msg['content'])) continue;
    if (!in_array($msg['role'], ['user', 'assistant'])) continue;
    $messages[] = [
        'role'    => $msg['role'],
        'content' => substr(strip_tags((string)$msg['content']), 0, 4000)
    ];
}

if (empty($messages)) {
    http_response_code(400);
    echo json_encode(['error' => 'No valid messages.']);
    exit;
}

// ── System prompt ─────────────────────────────────────────────────────────────
$system_prompt = "You are Nova, the warm and knowledgeable AI assistant for Neurodivergence Revived CIC — a UK-based community interest company (not-for-profit) that supports neurodivergent children, young adults, and their families.

ORGANISATION OVERVIEW:
- Founded by a parent of a son on the autism spectrum
- Focuses on autism, ADHD, and all forms of neurodivergence
- Driven by impact, not profit — a registered CIC in the UK

THREE CORE SERVICES:
1. Parent & Carer Support & Advocacy
   - Help with EHCP and special needs applications
   - Attending school, college, and multi-agency meetings
   - Navigating education, health, and social care systems
   - Supporting young adults in college and workplace settings

2. Buddy & Mentorship Programme
   - Ages 14–35, neurodivergent individuals paired with neurotypical peer mentors
   - Flexible: in person, online, or both
   - Builds confidence, independence, social skills, and career awareness
   - Register by emailing neurodivergencerevived@gmail.com or via the contact form

3. Creative & Skills Development Workshops
   - Fine Art, Music, ICT & Digital Skills, Graphic Design
   - Short, practical, accessible sessions tailored to the community
   - Safe spaces for expression, skill-building, and discovering talent

VOLUNTEERING:
- Volunteers aged 18+ welcome as mentor-buddies
- Training provided — no prior experience needed
- Flexible commitment (in person, online, or both)
- Apply via the contact form or by emailing neurodivergencerevived@gmail.com

CONTACT:
- Email: neurodivergencerevived@gmail.com
- Website: neurodivergencerevived.org

YOUR TONE:
- Warm, empathetic, encouraging, and clear
- Conversational and accessible — avoid jargon
- Keep responses concise: 2–4 sentences for simple questions; slightly more for complex ones
- If unsure about something not covered above, invite them to email or use the contact form
- Never fabricate specific dates, fees, staff names, or statistics
- Always end with a gentle invitation to take the next step if appropriate";

// ── Call Anthropic API ────────────────────────────────────────────────────────
$payload = json_encode([
    'model'      => 'claude-sonnet-4-20250514',
    'max_tokens' => 800,
    'system'     => $system_prompt,
    'messages'   => $messages,
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . $api_key,
        'anthropic-version: 2023-06-01',
    ],
]);

$result   = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_err  = curl_error($ch);
curl_close($ch);

if ($curl_err) {
    http_response_code(502);
    echo json_encode(['error' => 'Connection error. Please try again.']);
    exit;
}

// Pass the Anthropic response straight through to the browser
http_response_code($http_code);
echo $result;
?>
