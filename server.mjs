#!/usr/bin/env node
/**
 * Seu Carlos Barbearia · entry point (Option B)
 *
 *   /        static scroll-craft landing (this folder)
 *   /app     React admin SPA (frontend/dist; in --dev, proxied to Vite :5173)
 *   /api     proxied to the Fastify gateway (:3000)
 *
 * Usage: node server.mjs [--port 8080] [--dev] [--gateway http://localhost:3000]
 */
import http from 'node:http';
import https from 'node:https';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const LANDING = join(ROOT, 'scrollcraft', 'builds', 'barbershop-mvp');
const REACT = join(ROOT, 'frontend', 'dist');

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const PORT = Number(arg('--port', process.env.PORT || 8080));
const DEV = args.includes('--dev');
const GATEWAY = new URL(arg('--gateway', process.env.GATEWAY_URL || 'http://localhost:3000'));
const VITE = new URL(arg('--vite', process.env.VITE_DEV_URL || 'http://localhost:5173'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8'
};

function proxy(req, res, target) {
  const url = new URL(req.url, target);
  const client = url.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: url.host };
  delete headers.connection;

  const upstream = client.request(
    { protocol: url.protocol, hostname: url.hostname, port: url.port, method: req.method, path: url.pathname + url.search, headers },
    (up) => {
      const out = { ...up.headers };
      delete out.connection;
      delete out['keep-alive'];
      delete out['transfer-encoding'];
      res.writeHead(up.statusCode || 502, out);
      up.pipe(res);
    }
  );
  upstream.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'GatewayUnavailable', message: err.message }));
  });
  req.pipe(upstream);
}

function serveFile(res, file, status = 200) {
  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  const stat = statSync(file);
  res.writeHead(status, { 'content-type': type, 'content-length': stat.size, 'cache-control': 'no-cache' });
  createReadStream(file).pipe(res);
}

function safeJoin(base, pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(base, rel);
  return file.startsWith(base) ? file : null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // API gateway
  if (pathname === '/api' || pathname.startsWith('/api/')) return proxy(req, res, GATEWAY);

  // React admin under /app
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    if (DEV) return proxy(req, res, VITE);
    let rest = pathname.slice('/app'.length) || '/';
    if (rest.startsWith('/')) rest = rest.slice(1);
    const file = safeJoin(REACT, '/' + rest);
    if (file && rest && existsSync(file) && statSync(file).isFile()) return serveFile(res, file);
    const index = join(REACT, 'index.html');
    if (existsSync(index)) return serveFile(res, index);
    res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('Build do painel ausente. Rode: pnpm --filter @barbershop/frontend build');
  }

  // Scroll-craft landing at /
  let rest = pathname === '/' ? '/index.html' : pathname;
  const file = safeJoin(LANDING, rest);
  if (file && existsSync(file) && statSync(file).isFile()) return serveFile(res, file);

  // Friendly fallback for anchors
  const index = join(LANDING, 'index.html');
  if (existsSync(index) && !extname(pathname)) return serveFile(res, index);

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n  Seu Carlos Barbearia`);
  console.log(`  landing   http://localhost:${PORT}/`);
  console.log(`  painel    http://localhost:${PORT}/app  ${DEV ? '(proxy Vite :5173)' : '(frontend/dist)'}`);
  console.log(`  api       /api -> ${GATEWAY.origin}\n`);
});
