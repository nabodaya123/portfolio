// Backend: plain Node.js (no packages to install).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const PROJECTS_FILE = path.join(__dirname, 'data', 'projects.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 50000) { reject(new Error('Too large')); req.destroy(); }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// GET /api/projects -> list from data/projects.json
function getProjects(req, res) {
  try {
    sendJson(res, 200, JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8')));
  } catch (err) {
    sendJson(res, 500, { error: 'Could not read projects.' });
  }
}

// POST /api/contact -> validate and append to data/messages.json
async function postContact(req, res) {
  let data;
  try { data = JSON.parse(await readBody(req)); }
  catch (err) { return sendJson(res, 400, { error: 'Invalid request.' }); }

  const { name, email, subject, message } = data || {};
  if (!name || !email || !message) {
    return sendJson(res, 400, { error: 'Name, email and message are required.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return sendJson(res, 400, { error: 'Enter a valid email address.' });
  }

  let messages = [];
  try { messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')); } catch (e) {}
  messages.push({
    name: String(name).slice(0, 100),
    email: String(email).slice(0, 150),
    subject: String(subject || '').slice(0, 150),
    message: String(message).slice(0, 3000),
    receivedAt: new Date().toISOString()
  });
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  sendJson(res, 200, { ok: true });
}

// Serve files from /public
function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const rel = urlPath === '/' ? 'index.html' : urlPath;
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, content) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/projects') return getProjects(req, res);
  if (req.method === 'POST' && req.url === '/api/contact') return postContact(req, res);
  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(405); res.end('Method not allowed');
});

server.listen(PORT, () => console.log('Portfolio running at http://localhost:' + PORT));
