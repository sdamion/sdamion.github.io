<?php
// security-headers.php

// Generate a secure nonce for inline scripts/styles
$nonce = base64_encode(random_bytes(16));

// Make the nonce available globally (for use in scripts/styles later)
$GLOBALS['csp_nonce'] = $nonce;

// Set security headers
header("Content-Security-Policy: 
    default-src 'self';
    base-uri 'self';
    object-src 'none'; 
    script-src 'self' 'nonce-$nonce' https://esm.sh;
    style-src 'self' 'nonce-$nonce' https://fonts.googleapis.com;
    connect-src 'self' https://api.coingecko.com https://api.geckoterminal.com https://api.starch.one https://tdsp.online/api https://www.tdsp.online/api https://api.tdsp.online https://api.koios.rest https://cardano-mainnet.blockfrost.io https://esm.sh https://ipfs.io;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self';
    form-action 'self';
    require-trusted-types-for 'script';
    frame-ancestors 'none';
");
header("X-Frame-Options: DENY"); // Prevent clickjacking
header("X-Content-Type-Options: nosniff"); // Prevent MIME sniffing
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()"); // Block unused APIs
header("Strict-Transport-Security: max-age=63072000; includeSubDomains; preload"); // HSTS
header("Cache-Control: max-age=120, must-revalidate");
?>
