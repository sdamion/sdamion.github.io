<?php
// security-headers.php

// Generate a secure nonce for inline scripts/styles
$nonce = base64_encode(random_bytes(16));

// Make the nonce available globally (for use in scripts/styles later)
$GLOBALS['csp_nonce'] = $nonce;

// Set security headers
header("Content-Security-Policy: 
    default-src 'self'; 
    script-src 'self' 'nonce-$nonce' 
        https://api.coingecko.com 
        https://js.cexplorer.io 
        https://api.starch.one 
        https://cdn.jsdelivr.net;
    style-src 'self' 'nonce-$nonce' 
        https://fonts.googleapis.com;
    connect-src 'self' 
        https://api.coingecko.com 
        https://js.cexplorer.io 
        https://api.starch.one 
        https://www.tdsp.online/api/resource/6738f8cddce9fe405732f092;
    img-src 'self' data: 
        https://* 
        https://cexplorer.io 
        https://js.cexplorer.io 
        https://api.starch.one;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self';
");

header("Cache-Control: max-age=120, must-revalidate");
?>