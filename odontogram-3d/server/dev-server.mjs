/**
 * Dev server. Serves the app and a writable mock of the chart endpoint, so the
 * read path, the write path and the polling path can all be exercised without
 * standing anything else up.
 *
 *   node server/dev-server.mjs
 *   open http://localhost:5173/?source=http&url=/api/chart&poll=2000
 *
 * Endpoints:
 *   GET   /api/chart         → { patientId, updatedAt, numbering, teeth }
 *   PATCH /api/chart         → merge { teeth: { "3": "unhealthy" } }
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT ?? 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ktx2': 'image/ktx2',
  '.svg': 'image/svg+xml',
};

const VALID_STATES = new Set(['healthy', 'unhealthy', 'very-unhealthy', 'missing']);

const chart = {
  patientId: 'demo-0042',
  updatedAt: new Date().toISOString(),
  numbering: 'universal',
  teeth: Object.fromEntries(
    Array.from({ length: 32 }, (_, i) => [String(i + 1), 'healthy']),
  ),
};
Object.assign(chart.teeth, {
  3: 'unhealthy', 4: 'missing', 6: 'very-unhealthy', 14: 'very-unhealthy',
  17: 'missing', 19: 'very-unhealthy', 28: 'unhealthy', 32: 'missing',
});

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
};

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/chart') {
    if (req.method === 'GET') return json(res, 200, chart);

    if (req.method === 'PATCH') {
      try {
        const body = await readBody(req);
        const updates = body.teeth ?? {};
        const rejected = [];
        for (const [id, state] of Object.entries(updates)) {
          if (!VALID_STATES.has(state)) { rejected.push({ id, state, reason: 'unknown state' }); continue; }
          if (!chart.teeth[id]) { rejected.push({ id, state, reason: 'unknown tooth' }); continue; }
          chart.teeth[id] = state;
        }
        chart.updatedAt = new Date().toISOString();
        console.log(`PATCH ${JSON.stringify(updates)}${rejected.length ? ` (rejected ${rejected.length})` : ''}`);
        return json(res, rejected.length ? 207 : 200, { ...chart, rejected });
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }
    return json(res, 405, { error: 'Use GET or PATCH.' });
  }

  // Static files.
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const path = join(ROOT, normalize(requested).replace(/^(\.\.[/\\])+/, ''));
  if (!path.startsWith(ROOT)) return json(res, 403, { error: 'Outside the project root.' });

  try {
    const file = await readFile(path);
    res.writeHead(200, {
      'Content-Type': MIME[extname(path)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Odontogram dev server → http://localhost:${PORT}`);
  console.log(`Live backend demo    → http://localhost:${PORT}/?source=http&url=/api/chart&poll=2000`);
});
