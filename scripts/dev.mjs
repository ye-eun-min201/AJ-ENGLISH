// 내 컴퓨터에서 Vercel과 같은 구조로 실행해 보는 서버.   실행: npm run dev  → http://localhost:3000
// · DB는 .local/dev.db 파일, PDF는 .local/blob 폴더에 저장된다 (.env.local 에 실제 값을 넣으면 그 값을 쓴다).
// · 카카오·구글 키가 없으면 '연습용 로그인' 화면이 대신 나온다. 이 파일은 배포되지 않는다.
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..'), at = p => path.join(root, p);
for (const name of ['.env.local', '.env']) {
  if (!existsSync(at(name))) continue;
  for (const line of readFileSync(at(name), 'utf8').split(/\r?\n/)) { const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (!match || process.env[match[1]] !== undefined) continue; const value = match[2].replace(/^(['"])(.*)\1$/, '$2'); if (value) process.env[match[1]] = value; }
}
const port = Number(process.env.PORT || 3000), origin = 'http://localhost:' + port;
await mkdir(at('.local'), { recursive: true });
process.env.TURSO_DATABASE_URL ||= 'file:' + at('.local/dev.db');
if (!process.env.BLOB_READ_WRITE_TOKEN) process.env.AJ_LOCAL_BLOB_DIR ||= at('.local/blob');
process.env.ADMIN_PASSWORD ||= 'admin-dev-1234';
process.env.PUBLIC_ORIGIN ||= origin;

// 실제 키가 없는 로그인은 연습용 로그인 서버로 연결한다
const practice = {};
for (const [name, key] of [['kakao', 'KAKAO_REST_API_KEY'], ['google', 'GOOGLE_CLIENT_ID']]) {
  if (process.env[key]) continue;
  practice[name] = true; process.env.AJ_DEV = '1'; process.env[key] = 'practice-' + name;
  if (name === 'google') process.env.GOOGLE_CLIENT_SECRET = 'practice-secret';
  const upper = name.toUpperCase();
  process.env['AJ_' + upper + '_AUTHORIZE_URL'] = origin + '/__practice/' + name + '/authorize';
  process.env['AJ_' + upper + '_TOKEN_URL'] = origin + '/__practice/' + name + '/token';
  process.env['AJ_' + upper + '_PROFILE_URL'] = origin + '/__practice/' + name + '/me';
}
const codes = new Map(), tokens = new Map();
const page = body => new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>연습용 로그인</title><body style="font-family:system-ui;background:#05070c;color:#f4f2ec;display:grid;place-items:center;min-height:100vh;margin:0"><main style="max-width:360px;padding:24px">' + body + '</main>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
async function practiceLogin(request, url) {
  const [, , name, action] = url.pathname.split('/');
  if (!practice[name]) return new Response('Not found', { status: 404 });
  if (action === 'authorize') {
    const who = url.searchParams.get('as'), back = url.searchParams.get('redirect_uri'), state = url.searchParams.get('state') || '';
    if (!back || !back.startsWith(origin + '/auth/')) return new Response('bad redirect', { status: 400 });
    if (!who) return page('<h1 style="font-size:22px">연습용 ' + (name === 'kakao' ? '카카오' : '구글') + ' 로그인</h1><p style="color:#9aa3b5;line-height:1.7">실제 키가 없어서 보이는 화면입니다. 아무 이름이나 넣으면 그 학생으로 로그인돼요.</p><form><input type="hidden" name="redirect_uri" value="' + back.replace(/[^\w:/.\-]/g, '') + '"><input type="hidden" name="state" value="' + state.replace(/[^a-f0-9]/g, '') + '"><input name="as" value="student1" style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #333;background:#10141d;color:#fff;font-size:16px"><button style="margin-top:12px;width:100%;padding:13px;border:0;border-radius:10px;background:#ffd25f;font-weight:800;font-size:16px">로그인</button></form>');
    const code = crypto.randomUUID(); codes.set(code, who.slice(0, 40));
    return Response.redirect(back + '?code=' + code + '&state=' + encodeURIComponent(state), 302);
  }
  if (action === 'token' && request.method === 'POST') {
    const form = new URLSearchParams(await request.text()), who = codes.get(form.get('code')); codes.delete(form.get('code'));
    if (!who) return Response.json({ error: 'invalid_grant' }, { status: 400 });
    const token = crypto.randomUUID(); tokens.set(token, who);
    return Response.json({ token_type: 'bearer', access_token: token, expires_in: 60 });
  }
  if (action === 'me') {
    const who = tokens.get((request.headers.get('authorization') || '').replace(/^Bearer /i, ''));
    if (!who) return Response.json({ error: 'invalid_token' }, { status: 401 });
    return Response.json(name === 'kakao' ? { id: who } : { sub: who });
  }
  return new Response('Not found', { status: 404 });
}

const config = JSON.parse(await readFile(at('vercel.json'), 'utf8'));
const commonHeaders = Object.fromEntries((config.headers.find(item => item.source === '/(.*)')?.headers || []).map(item => [item.key.toLowerCase(), item.value]));
const pages = Object.fromEntries(config.rewrites.filter(item => item.destination.endsWith('.html')).map(item => [item.source, item.destination]));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const { default: api } = await import('../api/index.js');

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin);
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const headers = new Headers(); for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value);
    const request = new Request(url, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    let response;
    if (url.pathname.startsWith('/__practice/')) response = await practiceLogin(request, url);
    else if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
      if (chunks.reduce((sum, chunk) => sum + chunk.length, 0) > 4.5 * 1024 * 1024) response = new Response('FUNCTION_PAYLOAD_TOO_LARGE', { status: 413 });   // Vercel과 같은 제한
      else response = await api.fetch(request);
    } else {
      const pathname = url.pathname === '/' ? '/index.html' : pages[url.pathname] || decodeURIComponent(url.pathname);
      const file = path.join(root, 'client', pathname);
      if (!file.startsWith(at('client') + path.sep)) response = new Response('Forbidden', { status: 403 });
      else try { response = new Response(await readFile(file), { headers: { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store', ...commonHeaders } }); } catch { response = new Response('Not found', { status: 404 }); }
    }
    const out = {}; response.headers.forEach((value, key) => { if (key !== 'set-cookie') out[key] = value; });
    const cookies = response.headers.getSetCookie?.(); if (cookies?.length) out['set-cookie'] = cookies;
    res.writeHead(response.status, out); res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error(error); res.writeHead(500).end('dev server error'); }
}).listen(port, () => console.log('AJ ENGLISH 로컬 서버: ' + origin + '   (관리자: ' + origin + '/admin · 비밀번호 ' + (process.env.ADMIN_PASSWORD === 'admin-dev-1234' ? 'admin-dev-1234' : '.env.local 값') + ')' + (Object.keys(practice).length ? '\n연습용 로그인 사용 중: ' + Object.keys(practice).join(', ') : '')));
