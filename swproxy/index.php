<?php
/**
 * Synergy Wholesale SOAP Proxy
 * --------------------------------------------------------------
 * Deploy this single file to your Synergy-hosted cPanel webspace
 * (e.g. https://swproxy.yourdomain.com/). Because the request to
 * Synergy Wholesale originates from THIS server's static IP, your
 * Railway-hosted Next.js app can call this proxy and SW will see
 * a whitelisted source IP.
 *
 * Requirements: PHP >= 7.4, ext-soap enabled (standard in cPanel).
 *
 * Configure the constants below, or set them as environment vars
 * in cPanel (Software > Manage Environment Variables on newer
 * cPanel) and read with getenv().
 */

// ---- CONFIG --------------------------------------------------
// Generate with: openssl rand -hex 32
// MUST match SYNERGY_PROXY_KEY in your Railway environment.
const PROXY_SHARED_KEY = 'CHANGE-ME-LONG-RANDOM-STRING';

// From SW: Your Account > API Information
const SW_API_ID  = 'YOUR_API_ID';
const SW_API_KEY = 'YOUR_API_KEY';

const SW_WSDL = 'https://api.synergywholesale.com/?wsdl';

// Optional: lock to a known Railway egress range or your domain.
// Leave empty to allow any caller that knows PROXY_SHARED_KEY.
const ALLOWED_ORIGINS = []; // e.g. ['https://yourapp.up.railway.app']
// --------------------------------------------------------------

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

function fail(int $code, string $msg, array $extra = []): void {
    http_response_code($code);
    echo json_encode(array_merge(['ok' => false, 'error' => $msg], $extra));
    exit;
}

// 1. Method check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'POST required');
}

// 2. Origin allowlist (optional)
if (!empty(ALLOWED_ORIGINS)) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!in_array($origin, ALLOWED_ORIGINS, true)) {
        fail(403, 'Origin not allowed');
    }
}

// 3. Shared-key auth (constant-time compare)
$presented = $_SERVER['HTTP_X_PROXY_KEY'] ?? '';
if (!hash_equals(PROXY_SHARED_KEY, $presented)) {
    fail(401, 'Bad proxy key');
}

// 4. Parse body
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body) || empty($body['method'])) {
    fail(400, 'Body must be JSON: { "method": "...", "params": {...} }');
}

$method = (string)$body['method'];
$params = isset($body['params']) && is_array($body['params']) ? $body['params'] : [];

// 5. Whitelist of SW methods we expose. Add as needed.
$ALLOWED_METHODS = [
    // Account
    'balanceQuery',
    // Domains
    'domainInfo', 'listDomains', 'domainRenew', 'domainTransfer',
    'checkDomain', 'domainRegister', 'updateNameServers',
    'updateContact', 'lockDomain', 'unlockDomain',
    // DNS
    'listDNSZone', 'addDNSRecord', 'updateDNSRecord', 'deleteDNSRecord',
    // Hosting / cPanel
    'listHostingServices', 'getHostingService',
    'suspendHostingService', 'unsuspendHostingService',
    'terminateHostingService',
];
if (!in_array($method, $ALLOWED_METHODS, true)) {
    fail(400, "Method not allowed: $method");
}

// 6. Inject credentials (caller never sends them)
$data = array_merge([
    'resellerID' => SW_API_ID,
    'apiKey'     => SW_API_KEY,
], $params);

// 7. SOAP call
try {
    $client = new SoapClient(null, [
        'location'           => SW_WSDL,
        'uri'                => '',
        'trace'              => false,
        'exceptions'         => true,
        'connection_timeout' => 30,
    ]);

    $output = $client->$method($data);

    // Convert stdClass tree to array for clean JSON
    $clean = json_decode(json_encode($output), true);

    echo json_encode([
        'ok'     => true,
        'method' => $method,
        'data'   => $clean,
    ]);
} catch (SoapFault $f) {
    fail(502, 'SOAP fault', [
        'faultcode'   => $f->faultcode ?? null,
        'faultstring' => $f->faultstring ?? $f->getMessage(),
    ]);
} catch (Throwable $e) {
    fail(500, 'Proxy error', ['detail' => $e->getMessage()]);
}
