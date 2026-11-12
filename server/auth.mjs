// 학생 로그인: 카카오·구글 로그인(OAuth 인가 코드 방식)과 로그인 유지(쿠키).
// 저장하는 것은 '어느 서비스의 몇 번 회원인지'뿐이다. 이름·이메일·프로필 사진은 요청하지도 저장하지도 않는다.
const SESSION_COOKIE = 'aj_session', STATE_COOKIE = 'aj_oauth';
const SESSION_DAYS = 30, STATE_SECONDS = 600;

const dev = process.env.AJ_DEV === '1';   // 내 컴퓨터 시험용: 가짜 로그인 서버 주소로 바꿔 끼울 수 있다
const PROVIDERS = {
  kakao: {
    label: '카카오',
    get clientId() { return process.env.KAKAO_REST_API_KEY || ''; },
    get clientSecret() { return process.env.KAKAO_CLIENT_SECRET || ''; },
    authorize: (dev && process.env.AJ_KAKAO_AUTHORIZE_URL) || 'https://kauth.kakao.com/oauth/authorize',
    token: (dev && process.env.AJ_KAKAO_TOKEN_URL) || 'https://kauth.kakao.com/oauth/token',
    profile: (dev && process.env.AJ_KAKAO_PROFILE_URL) || 'https://kapi.kakao.com/v2/user/me',
    scope: '',
    subject: body => body && (typeof body.id === 'number' || typeof body.id === 'string') ? String(body.id) : ''
  },
  google: {
    label: '구글',
    get clientId() { return process.env.GOOGLE_CLIENT_ID || ''; },
    get clientSecret() { return process.env.GOOGLE_CLIENT_SECRET || ''; },
    authorize: (dev && process.env.AJ_GOOGLE_AUTHORIZE_URL) || 'https://accounts.google.com/o/oauth2/v2/auth',
    token: (dev && process.env.AJ_GOOGLE_TOKEN_URL) || 'https://oauth2.googleapis.com/token',
    profile: (dev && process.env.AJ_GOOGLE_PROFILE_URL) || 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid',
    subject: body => body && typeof body.sub === 'string' ? body.sub : ''
  }
};
const configured = provider => !!provider.clientId && (provider === PROVIDERS.kakao || !!provider.clientSecret);
export const providerStatus = () => ({ kakao: configured(PROVIDERS.kakao), google: configured(PROVIDERS.google) });

const hex = bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const sha256 = async text => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
function sameText(a, b) { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
function readCookie(request, name) { const part = (request.headers.get('cookie') || '').split(';').map(item => item.trim()).find(item => item.startsWith(name + '=')); return part ? part.slice(name.length + 1) : ''; }
function cookie(name, value, { maxAge, path = '/', secure }) { return `${name}=${value}; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`; }
/** 로그인 뒤 돌아갈 곳은 우리 사이트 안의 경로만 허용한다. */
export function safeReturn(value) { return typeof value === 'string' && /^\/(?![\/\\])[\w\-./?=&%#~+]{0,180}$/.test(value) ? value : '/'; }
const redirect = (location, cookies = []) => { const headers = new Headers({ location, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' }); for (const item of cookies) headers.append('set-cookie', item); return new Response(null, { status: 302, headers }); };
const loginError = (code, cookies = []) => redirect('/login?error=' + code, cookies);

/** 쿠키로 로그인한 학생을 찾는다. 없으면 null. */
export async function currentUser(request, db, now = Date.now()) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await db.prepare('SELECT user_id, provider FROM auth_sessions WHERE token_hash = ? AND expires_at > ?').bind(await sha256(token), now).first();
  return row ? { id: row.user_id, provider: row.provider } : null;
}

/** /auth/* 경로를 처리한다. 해당 없으면 null. */
export async function handleAuth(request, url, db, origin) {
  const secure = origin.startsWith('https://');
  const parts = url.pathname.split('/').filter(Boolean);   // ['auth', 'kakao', 'callback']
  if (parts[0] !== 'auth') return null;
  const now = Date.now();

  if (parts[1] === 'logout' && parts.length === 2) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const from = request.headers.get('origin');
    if (from && from !== origin) return new Response('Forbidden', { status: 403 });
    const token = readCookie(request, SESSION_COOKIE);
    if (/^[a-f0-9]{64}$/.test(token)) await db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return new Response(null, { status: 204, headers: { 'set-cookie': cookie(SESSION_COOKIE, '', { maxAge: 0, secure }), 'cache-control': 'no-store' } });
  }

  const provider = PROVIDERS[parts[1]];
  if (!provider || request.method !== 'GET') return new Response('Not found', { status: 404 });
  const callback = origin + '/auth/' + parts[1] + '/callback';

  if (parts.length === 2) {                                  // 로그인 시작 → 카카오·구글 화면으로 보냄
    if (!configured(provider)) return loginError('not_configured');
    const state = randomToken(), back = safeReturn(url.searchParams.get('return_to'));
    const target = new URL(provider.authorize);
    target.searchParams.set('client_id', provider.clientId); target.searchParams.set('redirect_uri', callback);
    target.searchParams.set('response_type', 'code'); target.searchParams.set('state', state);
    if (provider.scope) target.searchParams.set('scope', provider.scope);
    return redirect(target.href, [cookie(STATE_COOKIE, state + '.' + encodeURIComponent(back), { maxAge: STATE_SECONDS, path: '/auth', secure })]);
  }

  if (parts.length === 3 && parts[2] === 'callback') {       // 카카오·구글에서 돌아옴
    const clearState = cookie(STATE_COOKIE, '', { maxAge: 0, path: '/auth', secure });
    const saved = readCookie(request, STATE_COOKIE), dot = saved.indexOf('.');
    const expected = dot > 0 ? saved.slice(0, dot) : '';
    let back = '/'; try { back = safeReturn(decodeURIComponent(saved.slice(dot + 1))); } catch { back = '/'; }
    if (url.searchParams.get('error')) return loginError('cancelled', [clearState]);
    const code = url.searchParams.get('code') || '';
    if (!expected || !sameText(expected, url.searchParams.get('state') || '') || !code || code.length > 2000) return loginError('expired', [clearState]);
    if (!configured(provider)) return loginError('not_configured', [clearState]);
    let subject = '';
    try {
      const form = new URLSearchParams({ grant_type: 'authorization_code', client_id: provider.clientId, redirect_uri: callback, code });
      if (provider.clientSecret) form.set('client_secret', provider.clientSecret);
      const tokenResponse = await fetch(provider.token, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8', accept: 'application/json' }, body: form, signal: AbortSignal.timeout(10000) });
      const tokens = await tokenResponse.json().catch(() => null);
      if (!tokenResponse.ok || !tokens || typeof tokens.access_token !== 'string') { console.error('login token exchange failed', parts[1], tokenResponse.status, tokens && (tokens.error_code || tokens.error)); return loginError('provider', [clearState]); }
      const profileResponse = await fetch(provider.profile, { headers: { authorization: 'Bearer ' + tokens.access_token, accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
      subject = profileResponse.ok ? provider.subject(await profileResponse.json().catch(() => null)) : '';
    } catch (error) { console.error('login provider request failed', parts[1], error?.name); return loginError('provider', [clearState]); }
    if (!subject || subject.length > 120) return loginError('provider', [clearState]);
    const token = randomToken();
    await db.batch([
      db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(now),
      db.prepare('INSERT INTO auth_sessions (token_hash, user_id, provider, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').bind(await sha256(token), parts[1] + ':' + subject, parts[1], now, now + SESSION_DAYS * 864e5)
    ]);
    return redirect(back, [clearState, cookie(SESSION_COOKIE, token, { maxAge: SESSION_DAYS * 86400, secure })]);
  }
  return new Response('Not found', { status: 404 });
}
