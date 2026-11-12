const AVATAR_LIMITS = { species: 12, skin: 5, hair: 5, eyes: 3, outfit: 5, accessory: 5, color: 7 };
const DEFAULT_AVATAR = { species: 0, skin: 1, hair: 0, eyes: 0, outfit: 0, accessory: 0, color: 0 };
const PRICES = { 3: 150, 4: 250, 5: 400 };
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHOWCASE_TAGS = ['자기소개', '회의·협업', '업무·목표'];
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
function fail(status, code, message) { throw new ApiError(status, code, message); }
function localDate(ms) { return new Date(ms + 9 * 3600000).toISOString().slice(0, 10); }
function decodeAvatar(value) { try { return JSON.parse(value); } catch { return DEFAULT_AVATAR; } }
function cleanText(value, max, label) { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, 'invalid_input', `${label}을(를) 1~${max}자로 입력해 주세요.`); return value.trim(); }
async function first(db, sql, ...args) { return db.prepare(sql).bind(...args).first(); }
async function all(db, sql, ...args) { const result = await db.prepare(sql).bind(...args).all(); return result.results || []; }
async function owned(db, userId) { const rows = await all(db, 'SELECT item_id FROM owned_items WHERE user_id = ? AND charged = 1', userId); return [0, 1, 2, ...rows.map(r => Number(r.item_id))]; }
async function likesRemaining(db, userId, day) { if (!userId) return 5; const row = await first(db, 'SELECT COUNT(*) AS n FROM showcase_likes WHERE user_id = ? AND local_date = ?', userId, day); return Math.max(0, 5 - row.n); }
async function showcasePost(db, id, roomId, userId) { const row = await first(db, 'SELECT s.id, s.user_id, s.sentence, s.meaning, s.tag, s.created_at AS createdAt, p.nickname, p.avatar, (SELECT COUNT(*) FROM showcase_likes l WHERE l.post_id = s.id) AS likes, EXISTS (SELECT 1 FROM showcase_likes l WHERE l.post_id = s.id AND l.user_id = ?) AS liked FROM showcase_posts s JOIN profiles p ON p.user_id = s.user_id WHERE s.id = ? AND s.room_id = ? AND s.deleted_at IS NULL', userId, id, roomId); if (!row) return null; const { user_id, ...post } = row; return { ...post, avatar: decodeAvatar(row.avatar), liked: !!post.liked, isMine: user_id === userId }; }
function userView(profile) { return { id: profile.public_id, nickname: profile.nickname, avatar: decodeAvatar(profile.avatar), totalPoints: profile.total_points, coins: profile.coins, level: 1 + Math.floor(profile.total_points / 250) }; }
function getLesson(courses, course, day) { const days = courses[course]; if (!Array.isArray(days) || !Number.isInteger(day) || day < 1 || day > 7) fail(400, 'invalid_lesson', '올바른 학습 미션을 선택해 주세요.'); const lesson = days.find(d => d.id === day) || days[day - 1]; if (!lesson || !Array.isArray(lesson.quiz) || !lesson.quiz.length) fail(400, 'invalid_lesson', '아직 준비되지 않은 미션입니다.'); return lesson; }
async function activeRoom(db, userId, profile) { if (!profile?.current_room_id) return null; return first(db, 'SELECT r.id, r.name, r.code, (SELECT COUNT(*) FROM room_members m WHERE m.room_id = r.id) AS memberCount FROM rooms r JOIN room_members m ON m.room_id = r.id AND m.user_id = ? WHERE r.id = ?', userId, profile.current_room_id); }
async function readSession(db, userId, id) { if (typeof id !== 'string' || id.length > 100) fail(400, 'invalid_session', '학습 세션을 확인해 주세요.'); const session = await first(db, 'SELECT * FROM learning_sessions WHERE id = ? AND user_id = ?', id, userId); if (!session) fail(404, 'session_not_found', '이 계정의 학습 세션을 찾을 수 없습니다.'); return session; }
function speechPasses(value) { try { const passed = JSON.parse(value || '[]'); return Array.isArray(passed) ? passed.filter(Number.isInteger).sort((a,b) => a-b) : []; } catch { return []; } }
const CONTRACTIONS = { "i'm":'i am', "you're":'you are', "we're":'we are', "they're":'they are', "he's":'he is', "she's":'she is', "it's":'it is', "that's":'that is', "what's":'what is', "there's":'there is', "don't":'do not', "doesn't":'does not', "didn't":'did not', "can't":'cannot', "couldn't":'could not', "won't":'will not', "wouldn't":'would not', "shouldn't":'should not', "isn't":'is not', "aren't":'are not', "wasn't":'was not', "weren't":'were not', "i've":'i have', "you've":'you have', "we've":'we have', "they've":'they have', "i'll":'i will', "you'll":'you will', "we'll":'we will', "they'll":'they will', "i'd":'i would', "you'd":'you would', "we'd":'we would', "they'd":'they would', "let's":'let us' };
export function normalizeSpeech(value) { return value.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\b[a-z]+'[a-z]+\b/g, word => CONTRACTIONS[word] || word).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
export function compareSpeech(expected, actual) { const a = normalizeSpeech(expected).split(' ').filter(Boolean), b = normalizeSpeech(actual).split(' ').filter(Boolean); const passed = a.length > 0 && a.length === b.length && a.every((word,i) => word === b[i]); const dp = Array(b.length + 1).fill(0); for (const word of a) { let previous = 0; for (let j = 1; j <= b.length; j++) { const old = dp[j]; dp[j] = word === b[j-1] ? previous + 1 : Math.max(dp[j], dp[j-1]); previous = old; } } return { passed, match: passed ? 100 : Math.min(99, Math.round(100 * dp[b.length] / Math.max(a.length, b.length, 1))) }; }
function lessonForSession(session,courses){try{const stored=JSON.parse(session.lesson_json||'{}');if(Array.isArray(stored.phrases)&&Array.isArray(stored.quiz)&&stored.phrases.length&&stored.quiz.length)return stored;}catch{}return getLesson(courses,session.course,session.day);}
async function sessionView(db, session, courses, now) { if (!session) return null; const lesson = lessonForSession(session,courses); const answers = await all(db, 'SELECT question_index AS questionIndex, answer_index AS answerIndex, correct FROM quiz_answers WHERE session_id = ? ORDER BY question_index', session.id); return { id: session.id, day: session.day, course: session.course, startedAt: session.started_at, finishedAt: session.finished_at, elapsedSeconds: session.finished_at ? session.elapsed_seconds : Math.min(1800, Math.max(0, Math.floor((now - session.started_at) / 1000))), questions: lesson.quiz.map(q => ({ q: q.q, options: q.options })), answers, speechPassed: speechPasses(session.speech_json),lesson,chapterId:session.chapter_id||null }; }

/** x-aj-user-id 헤더는 server/adapter.mjs가 로그인 쿠키를 확인한 뒤에만 넣는다. 브라우저가 보낸 값은 어댑터에서 지운다. */
export async function handleApi(request, env, courses, now = Date.now()) {
  try {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return null;
    const userId = request.headers.get('x-aj-user-id');
    if (!env.DB) return json({ error: 'database_unavailable', message: '학습 저장소를 준비하고 있습니다. 잠시 후 다시 시도해 주세요.' }, 503);
    if (!['GET', 'POST'].includes(request.method)) fail(405, 'method_not_allowed', '지원하지 않는 요청입니다.');
    let body = {};
    if (request.method === 'POST') {
      if (!userId) fail(401, 'sign_in_required', '캐릭터와 학습 기록을 저장하려면 로그인해 주세요.');
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) fail(403, 'invalid_origin', '사이트 안에서 다시 시도해 주세요.');
      if (!request.headers.get('content-type')?.includes('application/json')) fail(415, 'json_required', 'JSON 요청이 필요합니다.');
      const raw = await request.text();
      if (raw.length > 12000) fail(413, 'body_too_large', '입력 내용이 너무 깁니다.');
      try { body = JSON.parse(raw); } catch { fail(400, 'invalid_json', '입력 형식을 확인해 주세요.'); }
      if (!body || Array.isArray(body) || typeof body !== 'object') fail(400, 'invalid_json', '입력 형식을 확인해 주세요.');
    }
    const db = env.DB;
    const today = localDate(now), month = today.slice(0, 7);
    let profile = userId ? await first(db, 'SELECT * FROM profiles WHERE user_id = ?', userId) : null;

    if (request.method === 'GET' && url.pathname === '/api/state') {
      if (!userId || !profile) return json({ authenticated: !!userId, user: null, room: null, progress: { month, points: 0, activeDays: 0, totalSeconds: 0, questSeconds: 0, gameSeconds: 0, completedDays: [], todayCompleted: false, streak: 0, activity: [] }, sessions: [], activeSession: null, shop: { owned: [0, 1, 2], prices: PRICES } });
      const room = await activeRoom(db, userId, profile);
      const stats = await first(db, 'SELECT COALESCE(SUM(points),0) AS points, COUNT(CASE WHEN points > 0 THEN 1 END) AS activeDays, COALESCE(SUM(seconds),0) AS totalSeconds FROM learning_rewards WHERE user_id = ? AND month = ?', userId, month);
      const completed = await all(db, 'SELECT DISTINCT course, day, chapter_id FROM learning_sessions WHERE user_id = ? AND finished_at IS NOT NULL', userId);
      const activities = await all(db, "SELECT local_date AS date,SUM(points) AS points,SUM(seconds) AS seconds,SUM(questSeconds) AS questSeconds,SUM(gameSeconds) AS gameSeconds FROM (SELECT local_date,points,seconds,seconds AS questSeconds,0 AS gameSeconds FROM learning_rewards WHERE user_id=? UNION ALL SELECT local_date,points,seconds,0 AS questSeconds,CASE WHEN category='game' THEN seconds ELSE 0 END AS gameSeconds FROM activity_awards WHERE user_id=? AND applied=1) GROUP BY local_date ORDER BY local_date DESC LIMIT 120", userId,userId);
      const todayReward = activities.find(a => a.date === today);
      const todayQuest=await first(db,'SELECT id FROM learning_rewards WHERE user_id=? AND local_date=?',userId,today);
      const extra=await first(db,"SELECT COALESCE(SUM(CASE WHEN category='study' THEN points ELSE 0 END),0) AS studyPoints,COALESCE(SUM(CASE WHEN category='game' THEN points ELSE 0 END),0) AS gamePoints,COALESCE(SUM(seconds),0) AS seconds,COALESCE(SUM(CASE WHEN category='game' THEN seconds ELSE 0 END),0) AS gameSeconds FROM activity_awards WHERE user_id=? AND month=? AND applied=1",userId,month);
      const originalPoints=stats.points;stats.questSeconds=stats.totalSeconds;stats.gameSeconds=extra.gameSeconds;stats.points+=extra.studyPoints+extra.gamePoints;stats.totalSeconds+=extra.seconds;stats.activeDays=activities.filter(a=>a.date.startsWith(month)&&a.points>0).length;stats.studyPoints=originalPoints+extra.studyPoints;stats.gamePoints=extra.gamePoints;
      let streak = 0, cursor = todayReward?.points > 0 ? today : localDate(now - 86400000);
      for (const row of activities.filter(a => a.points > 0)) { if (row.date !== cursor) break; streak++; cursor = localDate(Date.parse(`${cursor}T00:00:00Z`) - 86400000 - 9 * 3600000); }
      const sessions = await all(db, 'SELECT s.id, s.course, s.day, s.local_date AS date, s.elapsed_seconds AS seconds, s.finished_at AS finishedAt, COALESCE(r.points,0) AS points FROM learning_sessions s LEFT JOIN learning_rewards r ON r.id = s.id WHERE s.user_id = ? AND s.finished_at IS NOT NULL ORDER BY s.finished_at DESC LIMIT 20', userId);
      const open = await first(db, 'SELECT * FROM learning_sessions WHERE user_id = ? AND local_date = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', userId, today);
      return json({ authenticated: true, user: userView(profile), room, progress: { month, ...stats, completedDays: completed.map(d => d.chapter_id?`${d.course}:${d.chapter_id}:${d.day}`:`${d.course}:${d.day}`), todayCompleted: !!todayQuest, streak, activity: activities }, sessions, activeSession: await sessionView(db, open, courses, now), shop: { owned: await owned(db, userId), prices: PRICES } });
    }

    if (request.method === 'GET' && url.pathname === '/api/showcase') {
      const room = userId && profile ? await activeRoom(db, userId, profile) : null;
      const remaining = await likesRemaining(db, userId, today);
      if (!room) return json({ authenticated: !!userId, room: null, posts: [], likesRemaining: remaining, day: today });
      const rows = await all(db, 'SELECT s.id, s.sentence, s.meaning, s.tag, p.nickname, p.avatar, s.created_at AS createdAt, (SELECT COUNT(*) FROM showcase_likes l WHERE l.post_id = s.id) AS likes, EXISTS (SELECT 1 FROM showcase_likes l WHERE l.post_id = s.id AND l.user_id = ?) AS liked, CASE WHEN s.user_id = ? THEN 1 ELSE 0 END AS isMine FROM showcase_posts s JOIN profiles p ON p.user_id = s.user_id WHERE s.room_id = ? AND s.deleted_at IS NULL ORDER BY s.created_at DESC, s.id DESC LIMIT 100', userId, userId, room.id);
      return json({ authenticated: true, room, posts: rows.map(post => ({ ...post, avatar: decodeAvatar(post.avatar), liked: !!post.liked, isMine: !!post.isMine })), likesRemaining: remaining, day: today });
    }

    if (request.method === 'POST' && url.pathname === '/api/profile') {
      const nickname = cleanText(body.nickname, 16, '별명');
      const avatar = body.avatar && {species:0,...body.avatar};
      if (!avatar || Object.keys(AVATAR_LIMITS).some(key => !Number.isInteger(avatar[key]) || avatar[key] < 0 || avatar[key] > AVATAR_LIMITS[key])) fail(400, 'invalid_avatar', '캐릭터 항목을 다시 선택해 주세요.');
      if (!(await owned(db, userId)).includes(avatar.accessory)) fail(403, 'item_not_owned', '이 소품은 포인트 상점에서 먼저 구입해 주세요.');
      const normalized = Object.fromEntries(Object.keys(AVATAR_LIMITS).map(key => [key, avatar[key]]));
      await db.prepare('INSERT INTO profiles (user_id, public_id, nickname, avatar, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET nickname = excluded.nickname, avatar = excluded.avatar').bind(userId, crypto.randomUUID(), nickname, JSON.stringify(normalized), now).run();
      profile = await first(db, 'SELECT * FROM profiles WHERE user_id = ?', userId);
      return json({ user: userView(profile) });
    }

    if (request.method === 'GET' && url.pathname === '/api/leaderboard') {
      if (!userId) fail(401, 'sign_in_required', '우리 반 순위를 보려면 로그인해 주세요.');
      const room = await activeRoom(db, userId, profile);
      if (!room) return json({ month, room: null, rows: [], myRank: null });
      const requestedMonth = url.searchParams.get('month') || month;
      if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(requestedMonth)) fail(400, 'invalid_month', '월을 다시 선택해 주세요.');
      const rows = await all(db, 'SELECT p.public_id AS id, p.nickname, p.avatar, COALESCE(SUM(r.points),0) AS points, COUNT(CASE WHEN r.points > 0 THEN 1 END) AS activeDays, COALESCE(SUM(r.seconds),0) AS seconds FROM room_members m JOIN profiles p ON p.user_id = m.user_id LEFT JOIN learning_rewards r ON r.user_id = m.user_id AND r.room_id = m.room_id AND r.month = ? WHERE m.room_id = ? GROUP BY p.user_id ORDER BY points DESC, activeDays DESC, p.nickname ASC', requestedMonth, room.id);
      let rank = 0, previous = null;
      const result = rows.map((row, index) => { const key = `${row.points}:${row.activeDays}`; if (key !== previous) rank = index + 1; previous = key; return { ...row, avatar: decodeAvatar(row.avatar), rank, isMe: row.id === profile.public_id }; });
      return json({ month: requestedMonth, room, rows: result, myRank: result.find(r => r.isMe)?.rank || null, rules: '한국 시간 매월 1일 새로 시작합니다. 월 포인트, 학습일 수 순이며 두 값이 같으면 공동 순위입니다. 반에 가입한 뒤 얻은 포인트만 반 순위에 반영됩니다.' });
    }

    if (!userId) fail(401, 'sign_in_required', '로그인 후 이용해 주세요.');
    if (!profile) fail(409, 'profile_required', '먼저 나만의 캐릭터와 별명을 만들어 주세요.');

    if (request.method === 'POST' && ['/api/showcase', '/api/showcase/like', '/api/showcase/delete'].includes(url.pathname)) {
      const room = await activeRoom(db, userId, profile);
      if (!room) fail(409, 'room_required', '반을 만들거나 반 코드로 참여하면 작품을 함께 나눌 수 있어요.');
      if (url.pathname === '/api/showcase') {
        const sentence = cleanText(body.sentence, 300, '영어 문장');
        if (sentence.length < 5 || !/[a-z]/i.test(sentence)) fail(400, 'invalid_sentence', '영어 문장을 5~300자로 적어 주세요.');
        if (body.meaning !== undefined && typeof body.meaning !== 'string') fail(400, 'invalid_meaning', '우리말 뜻을 글자로 입력해 주세요.');
        const meaning = (body.meaning || '').trim();
        if (meaning.length > 300) fail(400, 'invalid_meaning', '우리말 뜻은 300자까지 적을 수 있어요.');
        if (!SHOWCASE_TAGS.includes(body.tag)) fail(400, 'invalid_tag', '자기소개, 회의·협업, 업무·목표 중 주제를 골라 주세요.');
        const id = crypto.randomUUID();
        // A single conditional insert enforces the daily limit under concurrent requests.
        // Deleted content still counts toward the three daily publication slots.
        await db.prepare('INSERT INTO showcase_posts (id, user_id, room_id, sentence, meaning, tag, local_date, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM showcase_posts WHERE user_id = ? AND local_date = ?) < 3').bind(id, userId, room.id, sentence, meaning, body.tag, today, now, userId, today).run();
        const post = await showcasePost(db, id, room.id, userId);
        if (!post) fail(429, 'post_limit', '작품은 하루 3개까지 나눌 수 있어요. 내일 또 새로운 문장을 들려주세요.');
        return json({ post, likesRemaining: await likesRemaining(db, userId, today), day: today }, 201);
      }
      if (typeof body.postId !== 'string' || body.postId.length > 100) fail(400, 'invalid_post', '작품을 다시 선택해 주세요.');
      const post = await showcasePost(db, body.postId, room.id, userId);
      if (!post) fail(404, 'post_not_found', '우리 반의 작품을 찾을 수 없어요.');
      if (url.pathname === '/api/showcase/delete') {
        if (!post.isMine) fail(403, 'not_post_owner', '내가 올린 작품만 삭제할 수 있어요.');
        await db.batch([
          db.prepare('DELETE FROM showcase_likes WHERE post_id = ? AND EXISTS (SELECT 1 FROM showcase_posts WHERE id = ? AND user_id = ? AND deleted_at IS NULL)').bind(post.id, post.id, userId),
          db.prepare("UPDATE showcase_posts SET sentence = '', meaning = '', deleted_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL").bind(now, post.id, userId)
        ]);
        return json({ deleted: true, postId: post.id, likesRemaining: await likesRemaining(db, userId, today) });
      }
      if (typeof body.liked !== 'boolean') fail(400, 'invalid_like', '응원 상태를 다시 선택해 주세요.');
      if (body.liked && post.isMine) fail(403, 'self_like', '다른 모험가의 문장에 응원을 보내 주세요.');
      if (body.liked) {
        // The cap applies across classes. Cancelling a heart dated today returns its slot.
        await db.prepare('INSERT OR IGNORE INTO showcase_likes (post_id, user_id, local_date, created_at) SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM showcase_likes WHERE user_id = ? AND local_date = ?) < 5 AND EXISTS (SELECT 1 FROM showcase_posts WHERE id = ? AND room_id = ? AND user_id <> ? AND deleted_at IS NULL)').bind(post.id, userId, today, now, userId, today, post.id, room.id, userId).run();
      } else {
        await db.prepare('DELETE FROM showcase_likes WHERE post_id = ? AND user_id = ?').bind(post.id, userId).run();
      }
      const updated = await showcasePost(db, post.id, room.id, userId);
      if (!updated) fail(404, 'post_not_found', '이 작품은 삭제되었어요.');
      if (body.liked && !updated.liked) fail(429, 'like_limit', '오늘의 응원 하트 5개를 모두 보냈어요. 오늘 보낸 응원을 취소하면 다시 사용할 수 있어요.');
      return json({ postId: post.id, liked: updated.liked, likes: updated.likes, likesRemaining: await likesRemaining(db, userId, today) });
    }

    if (request.method === 'POST' && url.pathname === '/api/room') {
      if (body.action === 'create') {
        const name = cleanText(body.name, 30, '반 이름');
        const id = crypto.randomUUID();
        let code = '';
        const random = crypto.getRandomValues(new Uint8Array(6));
        for (const n of random) code += CODE_ALPHABET[n % CODE_ALPHABET.length];
        // Codes are allocated by a UNIQUE constraint. A very rare collision is safely retriable.
        await db.batch([
          db.prepare('INSERT INTO rooms (id, code, name, owner_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, code, name, userId, now),
          db.prepare('INSERT INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').bind(id, userId, now),
          db.prepare('UPDATE profiles SET current_room_id = ? WHERE user_id = ?').bind(id, userId)
        ]);
      } else if (body.action === 'join') {
        if (typeof body.code !== 'string' || !/^[A-HJ-NP-Z2-9]{6}$/.test(body.code.trim().toUpperCase())) fail(400, 'invalid_code', '6자리 반 코드를 확인해 주세요.');
        const room = await first(db, 'SELECT id FROM rooms WHERE code = ?', body.code.trim().toUpperCase());
        if (!room) fail(404, 'room_not_found', '해당 코드를 가진 반이 없습니다.');
        await db.batch([
          db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').bind(room.id, userId, now),
          db.prepare('UPDATE profiles SET current_room_id = ? WHERE user_id = ?').bind(room.id, userId)
        ]);
      } else fail(400, 'invalid_action', '반 만들기 또는 참여하기를 선택해 주세요.');
      profile = await first(db, 'SELECT * FROM profiles WHERE user_id = ?', userId);
      return json({ room: await activeRoom(db, userId, profile) });
    }

    if (request.method === 'POST' && url.pathname === '/api/shop') {
      const accessory = body.accessory;
      const cost = PRICES[accessory];
      if (!Number.isInteger(accessory) || !cost) fail(400, 'invalid_item', '구입할 소품을 다시 선택해 주세요.');
      if ((await owned(db, userId)).includes(accessory)) return json({ alreadyOwned: true, coins: profile.coins, owned: await owned(db, userId) });
      if (profile.coins < cost) fail(409, 'insufficient_coins', '코인이 조금 더 필요해요. 오늘의 미션에 도전해 보세요.');
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO owned_items (user_id, item_id, purchased_at, charged) SELECT ?, ?, ?, 0 WHERE (SELECT coins FROM profiles WHERE user_id = ?) >= ?').bind(userId, String(accessory), now, userId, cost),
        db.prepare('UPDATE profiles SET coins = coins - ? WHERE user_id = ? AND EXISTS (SELECT 1 FROM owned_items WHERE user_id = ? AND item_id = ? AND charged = 0)').bind(cost, userId, userId, String(accessory)),
        db.prepare('UPDATE owned_items SET charged = 1 WHERE user_id = ? AND item_id = ? AND charged = 0').bind(userId, String(accessory))
      ]);
      const next = await first(db, 'SELECT coins FROM profiles WHERE user_id = ?', userId);
      const items = await owned(db, userId);
      if (!items.includes(accessory)) fail(409, 'insufficient_coins', '다른 구입으로 코인 잔액이 바뀌었어요. 다시 확인해 주세요.');
      return json({ coins: next.coins, owned: items, accessory });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/start') {
      getLesson(courses, body.course, body.day);
      let existing = await first(db, 'SELECT * FROM learning_sessions WHERE user_id = ? AND local_date = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', userId, today);
      if (body.replaceLegacyFruit === true && body.course === 'business' && existing?.course === 'fruit') {
        // Explicit replacement retires only this user's unfinished obsolete draft.
        // Rewarded or completed history is never changed, including a concurrent finish.
        await db.batch([
          db.prepare("DELETE FROM quiz_answers WHERE session_id = ? AND EXISTS (SELECT 1 FROM learning_sessions s WHERE s.id = ? AND s.user_id = ? AND s.course = 'fruit' AND s.finished_at IS NULL AND NOT EXISTS (SELECT 1 FROM learning_rewards r WHERE r.id = s.id))").bind(existing.id, existing.id, userId),
          db.prepare("DELETE FROM learning_sessions WHERE id = ? AND user_id = ? AND course = 'fruit' AND finished_at IS NULL AND NOT EXISTS (SELECT 1 FROM learning_rewards r WHERE r.id = learning_sessions.id)").bind(existing.id, userId)
        ]);
        existing = await first(db, 'SELECT * FROM learning_sessions WHERE user_id = ? AND local_date = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', userId, today);
      }
      if (existing) return json({ session: await sessionView(db, existing, courses, now), resumed: true });
      const room = await activeRoom(db, userId, profile);
      const id = crypto.randomUUID();
      await db.prepare('INSERT OR IGNORE INTO learning_sessions (id, user_id, room_id, course, day, local_date, started_at,lesson_json,chapter_id) VALUES (?, ?, ?, ?, ?, ?, ?,?,?)').bind(id, userId, room?.id || null, body.course, body.day, today, now,JSON.stringify(getLesson(courses,body.course,body.day)),getLesson(courses,body.course,body.day).chapterId||null).run();
      const created = await first(db, 'SELECT * FROM learning_sessions WHERE user_id = ? AND local_date = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', userId, today);
      return json({ session: await sessionView(db, created, courses, now), resumed: created?.id !== id });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/quiz') {
      const session = await readSession(db, userId, body.sessionId);
      if (session.finished_at) fail(409, 'session_finished', '이미 마친 미션입니다.');
      const lesson = lessonForSession(session,courses);
      if (!Number.isInteger(body.index) || body.index < 0 || body.index >= lesson.quiz.length) fail(400, 'invalid_question', '문항을 다시 선택해 주세요.');
      const question = lesson.quiz[body.index];
      if (!Number.isInteger(body.answer) || body.answer < 0 || body.answer >= question.options.length) fail(400, 'invalid_answer', '선택지를 다시 골라 주세요.');
      const correct = Number(body.answer === question.answer);
      await db.prepare('INSERT OR IGNORE INTO quiz_answers (session_id, question_index, answer_index, correct, answered_at) VALUES (?, ?, ?, ?, ?)').bind(session.id, body.index, body.answer, correct, now).run();
      const saved = await first(db, 'SELECT answer_index AS answer, correct FROM quiz_answers WHERE session_id = ? AND question_index = ?', session.id, body.index);
      return json({ index: body.index, answer: saved.answer, correct: !!saved.correct, correctAnswer: question.answer, explanation: question.explanation });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/speech') {
      const session = await readSession(db, userId, body.sessionId);
      if (session.finished_at) fail(409, 'session_finished', '이미 마친 미션입니다.');
      const lesson = lessonForSession(session,courses);
      if (!Number.isInteger(body.index) || body.index < 0 || body.index >= (lesson.phrases?.length || 0)) fail(400, 'invalid_phrase', '말하기 문장을 다시 선택해 주세요.');
      if (typeof body.transcript !== 'string' || !body.transcript.trim() || body.transcript.length > 1000) fail(400, 'invalid_transcript', '인식된 영어 문장을 확인한 뒤 다시 말해 주세요.');
      const expected = lesson.phrases[body.index].en;
      const transcript = body.transcript.trim();
      const result = compareSpeech(expected, transcript);
      if (result.passed) await db.prepare("UPDATE learning_sessions SET speech_json = CASE WHEN EXISTS (SELECT value FROM json_each(speech_json) WHERE value = ?) THEN speech_json ELSE json_insert(speech_json, '$[#]', ?) END WHERE id = ? AND user_id = ? AND finished_at IS NULL").bind(body.index, body.index, session.id, userId).run();
      const updated = await readSession(db, userId, session.id);
      return json({ ...result, expected, transcript, speechPassed: speechPasses(updated.speech_json) });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/finish') {
      const session = await readSession(db, userId, body.sessionId);
      const lesson = lessonForSession(session,courses);
      const passedSpeech = speechPasses(session.speech_json);
      if (!(lesson.phrases?.length) || lesson.phrases.some((phrase,index) => !passedSpeech.includes(index))) fail(409, 'speech_incomplete', '말하기 3문장의 영어 인식 결과가 모두 일치해야 미션을 마칠 수 있어요.');
      const answerStats = await first(db, 'SELECT COUNT(*) AS total, COALESCE(SUM(correct),0) AS correct FROM quiz_answers WHERE session_id = ?', session.id);
      if (answerStats.total !== lesson.quiz.length) fail(409, 'quiz_incomplete', '퀴즈를 모두 풀면 미션을 마칠 수 있어요.');
      const reflection = typeof body.reflection === 'string' ? body.reflection.trim().slice(0, 500) : '';
      const seconds = session.finished_at ? session.elapsed_seconds : Math.min(1800, Math.max(0, Math.floor((now - session.started_at) / 1000)));
      const ratio = Math.min(1, seconds / 1200);
      const rewardRoom = await activeRoom(db, userId, profile);
      const points = Math.floor((80 + 20 * answerStats.correct / lesson.quiz.length) * ratio);
      // Reward date is the completion date; one reward per account per Korean calendar day.
      // These statements run atomically. The applied flag also makes replay/concurrent calls idempotent.
      await db.batch([
        db.prepare('UPDATE learning_sessions SET finished_at = ?, elapsed_seconds = ?, reflection = ?, room_id = ? WHERE id = ? AND user_id = ? AND finished_at IS NULL').bind(now, seconds, reflection, rewardRoom?.id || null, session.id, userId),
        db.prepare('INSERT OR IGNORE INTO learning_rewards (id, user_id, room_id, local_date, month, points, seconds, correct_answers, question_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(session.id, userId, rewardRoom?.id || null, today, month, points, Math.min(1200, seconds), answerStats.correct, lesson.quiz.length, now),
        db.prepare('UPDATE profiles SET total_points = total_points + (SELECT points FROM learning_rewards WHERE id = ? AND applied = 0), coins = coins + (SELECT CAST(points / 5 AS INTEGER) FROM learning_rewards WHERE id = ? AND applied = 0) WHERE user_id = ? AND EXISTS (SELECT 1 FROM learning_rewards WHERE id = ? AND applied = 0)').bind(session.id, session.id, userId, session.id),
        db.prepare('UPDATE learning_rewards SET applied = 1 WHERE id = ? AND applied = 0').bind(session.id)
      ]);
      const reward = await first(db, 'SELECT id, points, seconds, local_date AS date FROM learning_rewards WHERE user_id = ? AND local_date = ?', userId, today);
      profile = await first(db, 'SELECT * FROM profiles WHERE user_id = ?', userId);
      return json({ sessionId: session.id, points: reward?.id === session.id ? reward.points : 0, coins: reward?.id === session.id ? Math.floor(reward.points / 5) : 0, dailyPoints: reward?.points || 0, seconds, alreadyFinished: !!session.finished_at, dailyLimitReached: !!reward && reward.id !== session.id, user: userView(profile), rules: '하루 한 번 보상됩니다. 20분 학습과 퀴즈 정답 비율로 최대 100포인트·20코인을 받습니다. 학습 시간은 서버에서 시작부터 완료까지 측정하며 말하기 내용 자체를 평가하지 않습니다.' });
    }
    fail(404, 'not_found', '요청한 기능을 찾을 수 없습니다.');
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.code, message: error.message }, error.status);
    console.error('Learning API failed:', error?.name || 'Error');
    return json({ error: 'request_failed', message: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500);
  }
}
