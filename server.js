// server.js - Full-Stack Local Server for Vyaaptam Website
// Serves static frontend and routes /api/* to Netlify serverless functions
try { require('dotenv').config(); } catch(e) {}

// Polyfill WebSocket for Node.js 18 (Hostinger / cPanel)
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const leadsHandler = require('./netlify/functions/leads').handler;
const adminLeadsHandler = require('./netlify/functions/admin-leads').handler;
const adminStatsHandler = require('./netlify/functions/admin-stats').handler;
const contentHandler = require('./netlify/functions/content').handler;
const uploadHandler = require('./netlify/functions/upload').handler;

const PORT = process.env.PORT || 3000;
const SITE_DIR = path.join(__dirname, 'site');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

async function handleApi(req, res, handler) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    const parsedUrl = url.parse(req.url, true);
    const event = {
      httpMethod: req.method,
      path: parsedUrl.pathname,
      headers: req.headers,
      queryStringParameters: parsedUrl.query || {},
      body: body
    };

    try {
      const result = await handler(event, {});
      const headers = result.headers || {};
      res.writeHead(result.statusCode || 200, headers);
      res.end(result.body || '');
    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // 1. API Route Handling
  if (pathname === '/api/leads' || pathname === '/.netlify/functions/leads') {
    return handleApi(req, res, leadsHandler);
  }
  if (pathname === '/api/admin-leads' || pathname === '/.netlify/functions/admin-leads') {
    return handleApi(req, res, adminLeadsHandler);
  }
  if (pathname === '/api/admin-stats' || pathname === '/.netlify/functions/admin-stats') {
    return handleApi(req, res, adminStatsHandler);
  }
  if (pathname === '/api/content' || pathname === '/.netlify/functions/content') {
    return handleApi(req, res, contentHandler);
  }
  if (pathname === '/api/upload' || pathname === '/.netlify/functions/upload') {
    return handleApi(req, res, uploadHandler);
  }

  // 1b. Intercept Netlify image transform requests and serve local WebP images
  if (pathname === '/.netlify/images') {
    const rawUrl = parsedUrl.query.url || '';
    if (rawUrl) {
      const cleanImg = rawUrl.split('?')[0];
      const webpTarget = path.join(SITE_DIR, cleanImg.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
      const directTarget = path.join(SITE_DIR, cleanImg);
      const target = fs.existsSync(webpTarget) ? webpTarget : directTarget;
      if (fs.existsSync(target)) {
        const ext = path.extname(target).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'image/webp',
          'Cache-Control': 'public, max-age=31536000'
        });
        return fs.createReadStream(target).pipe(res);
      }
    }
  }

  // 2. Static File Resolution with Clean URLs
  if (pathname === '/') {
    pathname = '/index.html';
  } else if (!path.extname(pathname)) {
    // Try file.html or file/index.html
    const directHtml = path.join(SITE_DIR, pathname + '.html');
    const indexHtml = path.join(SITE_DIR, pathname, 'index.html');
    if (fs.existsSync(directHtml)) {
      pathname = pathname + '.html';
    } else if (fs.existsSync(indexHtml)) {
      pathname = path.join(pathname, 'index.html');
    }
  }

  const filePath = path.join(SITE_DIR, pathname);

  // Security check: ensure path stays within SITE_DIR
  if (!filePath.startsWith(SITE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for any missing legacy JS module chunk
      if (pathname.startsWith('/assets/') && pathname.endsWith('.js')) {
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        return res.end('// Vyaaptam chunk fallback\nexport default {};\nexport const Route = () => null;\n');
      }

      // 404 Fallback
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404 Not Found</h1><p>The page requested was not found.</p><a href="/">Return Home</a>');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

const serverCallback = () => {
  console.log(`=======================================================`);
  console.log(`🚀 Vyaaptam Full-Stack Server Running Successfully!`);
  console.log(`📡 Local Website: http://localhost:${PORT}`);
  console.log(`💼 Admin Studio:  http://localhost:${PORT}/admin`);
  console.log(`🔗 API Endpoints: http://localhost:${PORT}/api/leads`);
  console.log(`=======================================================`);
};

if (process.env.PORT) {
  server.listen(PORT, serverCallback);
} else {
  server.listen(PORT, '0.0.0.0', serverCallback);
}
