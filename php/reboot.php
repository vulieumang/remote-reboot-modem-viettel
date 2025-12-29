<?php
error_reporting(0); // Suppress warnings for json output
header('Content-Type: application/json');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$modemUrl = rtrim($input['url'], '/');
$username = $input['username'];
$password = $input['password'];

$loginUrl = $modemUrl . '/cgi-bin/login.asp';
$rebootUrl = $modemUrl . '/cgi-bin/reboot.asp';
$loginData = "Username=" . urlencode($username) . "&Password=" . urlencode($password);

// Helper helper to make requests and return headers + body
function request_manual($url, $postData = null, $cookie = null)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true); // Include headers in output
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Do NOT follow redirects automatically
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    // Mimic the working JS script's logic exactly
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    if ($cookie) {
        $headers[] = "Cookie: $cookie";
    }

    if ($postData) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    $error = curl_error($ch);

    if ($error)
        return ['error' => $error];

    // Split headers and body
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header_text = substr($response, 0, $header_size);
    $body = substr($response, $header_size);

    curl_close($ch);

    return ['headers' => $header_text, 'body' => $body];
}

// 1. Login
$dummyCookie = 'SESSIONID=';
$loginRes = request_manual($loginUrl, $loginData, $dummyCookie);

if (isset($loginRes['error'])) {
    echo json_encode(['success' => false, 'message' => 'Login Error: ' . $loginRes['error']]);
    exit;
}

// Extract Set-Cookie from Login Response
preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $loginRes['headers'], $cookies);
$sessionCookie = '';
foreach ($cookies[1] as $c) {
    if (stripos($c, 'SESSIONID') !== false) {
        $sessionCookie = trim($c);
        break;
    }
}

// Fallback to dummy if no new cookie
if (empty($sessionCookie)) {
    $sessionCookie = $dummyCookie;
}

// 2. Get Token (using Session Cookie)
$pageRes = request_manual($rebootUrl, null, $sessionCookie);

// Parse Token - Using case-insensitive regex to handle modem's uppercase HTML
if (!preg_match('/NAME=["\']TokenString["\']\s+VALUE=["\']([^"\']+)["\']/i', $pageRes['body'], $matches)) {
    // Try reverse order (value then name)
    if (!preg_match('/VALUE=["\']([^"\']+)["\']\s+NAME=["\']TokenString["\']/i', $pageRes['body'], $matches)) {

        file_put_contents('debug_page.html', $pageRes['body']);
        preg_match('/<title>(.*?)<\/title>/i', $pageRes['body'], $titleMatches);
        $title = $titleMatches[1] ?? 'Unknown';

        echo json_encode([
            'success' => false,
            'message' => "Token Not Found (Auto-Dumped). Page: $title. Check debug_page.html"
        ]);
        exit;
    }
}
$token = $matches[1];

// 3. Reboot
$rebootData = "TokenString=" . urlencode($token) . "&testFlag=3&rebootFlag=1";
$rebootRes = request_manual($rebootUrl, $rebootData, $sessionCookie);

if (isset($rebootRes['error'])) {
    if (stripos($rebootRes['error'], 'timeout') !== false || stripos($rebootRes['error'], 'Operation timed out') !== false) {
        echo json_encode(['success' => true, 'message' => 'Modem is rebooting! Connection lost as expected. Please wait ~5 minutes for internet to return.']);
        exit;
    }
    echo json_encode(['success' => false, 'message' => 'Reboot command error: ' . $rebootRes['error']]);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Reboot command sent successfully! Please wait ~5 minutes for internet to return.']);
?>