const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
    try {
        const requestUrl = new URL(req.url || '/', `http://${host}:${port}`);

        if (requestUrl.pathname === '/__koios_proxy__') {
            await proxyKoiosRequest(requestUrl, res);
            return;
        }

        serveStaticFile(requestUrl.pathname, res);
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server error');
    }
});

server.listen(port, host, () => {
    console.log(`http://${host}:${port}`);
});

function serveStaticFile(requestPath, res) {
    const safePath = requestPath === '/' ? '/index.html' : requestPath;
    const filePath = path.join(root, safePath.replace(/^\/+/, ''));

    if (!filePath.startsWith(root)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        const finalPath = !statError && stats.isDirectory()
            ? path.join(filePath, 'index.html')
            : filePath;

        fs.readFile(finalPath, (readError, data) => {
            if (readError) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not found');
                return;
            }

            const ext = path.extname(finalPath).toLowerCase();
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            res.end(data);
        });
    });
}

async function proxyKoiosRequest(requestUrl, res) {
    const target = requestUrl.searchParams.get('url');

    if (!target) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Missing url parameter' }));
        return;
    }

    let parsedTarget;
    try {
        parsedTarget = new URL(target);
    } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid url parameter' }));
        return;
    }

    if (parsedTarget.origin !== 'https://api.koios.rest') {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Only api.koios.rest is allowed' }));
        return;
    }

    https.get(parsedTarget, upstream => {
        const chunks = [];

        upstream.on('data', chunk => chunks.push(chunk));
        upstream.on('end', () => {
            const body = Buffer.concat(chunks);
            res.writeHead(upstream.statusCode || 502, {
                'Content-Type': upstream.headers['content-type'] || 'application/json; charset=utf-8',
                'Cache-Control': 'no-store'
            });
            res.end(body);
        });
    }).on('error', () => {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Upstream request failed' }));
    });
}
