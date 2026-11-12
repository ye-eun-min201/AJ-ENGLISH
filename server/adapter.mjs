// Vercel 함수 하나가 받는 모든 요청(/api/*, /auth/*)의 입구.
// 1) 로그인 쿠키를 확인해 '누구인지'를 정하고  2) DB·파일 저장소를 연결한 뒤  3) 서버 로직(core)에 넘긴다.
import { handleCore } from './core.mjs';
import { getDatabase } from './db.mjs';
import { getBucket } from './storage.mjs';
import { currentUser, handleAuth, providerStatus } from './auth.mjs';

const USER_HEADER = 'x-aj-user-id';
const PART_LIMIT = 3.5 * 1024 * 1024, MAX_PDF = 20 * 1024 * 1024, MAX_PARTS = 8;
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const problem = (status, error, message) => json({ error, message }, status);

/** 브라우저가 실제로 접속한 주소(https://내도메인)를 구한다. 서버 로직의 '같은 사이트에서 온 요청인지' 검사에 쓰인다. */
function publicOrigin(request) {
  if (process.env.PUBLIC_ORIGIN) return process.env.PUBLIC_ORIGIN.replace(/\/+$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
  const proto = (request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '')).split(',')[0].trim();
  return proto + '://' + host.split(',')[0].trim();
}
/** vercel.json 의 rewrite를 거쳐도 원래 경로를 알아낸다. */
function originalPath(url) {
  const forwarded = url.searchParams.get('__path');
  if (forwarded !== null) {                       // rewrite가 덧붙인 값은 서버 로직에 넘기지 않는다
    url.searchParams.delete('__path');
    if (url.searchParams.get('path') === forwarded.replace(/^\/(api|auth)\/?/, '')) url.searchParams.delete('path');
  }
  const viaRewrite = url.pathname === '/api/index' || url.pathname === '/api';
  return viaRewrite && forwarded && /^\/(api|auth)(\/|$)/.test(forwarded) ? forwarded.replace(/\/+$/, '') || '/' : url.pathname;
}
const clientAddress = request => (request.headers.get('x-real-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown').trim();

async function readBody(request, limit) {
  if (Number(request.headers.get('content-length')) > limit) return null;
  const bytes = new Uint8Array(await request.arrayBuffer());
  return bytes.length > limit ? null : bytes;
}
const partKey = (uploadId, index) => 'tmp-upload/' + uploadId + '/' + index;
const validUpload = (uploadId, count) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uploadId || '') && Number.isInteger(count) && count >= 1 && count <= MAX_PARTS;

export async function handle(request) {
  try {
    const origin = publicOrigin(request);
    const incoming = new URL(request.url);
    const pathname = originalPath(incoming);
    const url = new URL(pathname + incoming.search, origin);

    const db = await getDatabase();
    if (!db) return pathname.startsWith('/auth/') ? new Response(null, { status: 302, headers: { location: '/login?error=not_ready' } }) : problem(503, 'database_unavailable', '학습 저장소를 준비하고 있습니다. 잠시 후 다시 시도해 주세요.');

    if (pathname.startsWith('/auth/')) return (await handleAuth(request, url, db, origin)) || new Response('Not found', { status: 404 });
    if (!pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });

    const user = await currentUser(request, db);
    if (pathname === '/api/auth/status' && request.method === 'GET') return json({ authenticated: !!user, provider: user ? user.provider : null, providers: providerStatus() });

    // 서버 로직에 넘길 요청: 누가 보냈는지는 여기서만 정한다 (브라우저가 보낸 식별 헤더는 버림)
    const headers = new Headers(request.headers);
    headers.delete(USER_HEADER); if (user) headers.set(USER_HEADER, user.id);
    headers.set('cf-connecting-ip', clientAddress(request));
    const env = { DB: db, BUCKET: getBucket(), ADMIN_PASSWORD: process.env.ADMIN_PASSWORD };
    const hasBody = !['GET', 'HEAD'].includes(request.method);
    let body = hasBody ? request.body : undefined;

    // 큰 PDF는 조각으로 나눠 받는다 (Vercel은 요청 하나에 4.5MB까지만 받기 때문)
    if (pathname === '/api/admin/pdf-part' && request.method === 'POST') {
      const from = request.headers.get('origin'); if (from && from !== origin) return problem(403, 'invalid_origin', '사이트 안에서 다시 시도해 주세요.');
      const admin = await handleCore(new Request(new URL('/api/admin/state', origin), { headers }), env);
      if (admin.status !== 200) return problem(401, 'admin_required', '관리자 로그인이 필요해요.');
      if (!env.BUCKET) return problem(503, 'storage_unavailable', 'PDF 저장소를 준비하고 있어요.');
      const uploadId = url.searchParams.get('uploadId'), index = Number(url.searchParams.get('index')), total = Number(url.searchParams.get('total'));
      if (!validUpload(uploadId, total) || !Number.isInteger(index) || index < 0 || index >= total) return problem(400, 'invalid_upload', '파일을 다시 선택해 주세요.');
      const bytes = await readBody(request, PART_LIMIT);
      if (!bytes || !bytes.length) return problem(413, 'body_too_large', '파일 조각이 허용 크기를 넘었어요.');
      await env.BUCKET.put(partKey(uploadId, index), bytes, { httpMetadata: { contentType: 'application/octet-stream' }, ttlDays: 1 });
      return json({ ok: true, index });
    }
    if (pathname === '/api/admin/pdf' && request.method === 'POST' && url.searchParams.has('uploadId')) {
      const uploadId = url.searchParams.get('uploadId'), total = Number(url.searchParams.get('parts'));
      if (!validUpload(uploadId, total)) return problem(400, 'invalid_upload', '파일을 다시 선택해 주세요.');
      const admin = await handleCore(new Request(new URL('/api/admin/state', origin), { headers }), env);
      if (admin.status !== 200) return problem(401, 'admin_required', '관리자 로그인이 필요해요.');
      if (!env.BUCKET) return problem(503, 'storage_unavailable', 'PDF 저장소를 준비하고 있어요.');
      const keys = Array.from({ length: total }, (_, index) => partKey(uploadId, index)), chunks = []; let size = 0;
      try {
        for (const key of keys) {
          const part = await env.BUCKET.get(key);
          if (!part) return problem(400, 'upload_incomplete', '파일 전송이 끝나지 않았어요. 다시 올려 주세요.');
          const bytes = new Uint8Array(await new Response(part.body).arrayBuffer()); size += bytes.length;
          if (size > MAX_PDF) return problem(413, 'body_too_large', '파일 또는 입력 내용이 허용 크기를 넘었어요.');
          chunks.push(bytes);
        }
      } finally { await Promise.all(keys.map(key => env.BUCKET.delete(key).catch(() => {}))); }
      const whole = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { whole.set(chunk, offset); offset += chunk.length; }
      url.searchParams.delete('uploadId'); url.searchParams.delete('parts');
      headers.set('content-length', String(size)); headers.set('content-type', 'application/pdf'); body = whole;
    }

    const forwarded = new Request(url, { method: request.method, headers, body, ...(body && !(body instanceof Uint8Array) ? { duplex: 'half' } : {}) });
    return await handleCore(forwarded, env);
  } catch (error) {
    console.error('request failed', error);
    return problem(500, 'server_error', '잠시 후 다시 시도해 주세요.');
  }
}
