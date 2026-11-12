const SESSION_TTL = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW = 15 * 60 * 1000;
const MAX_PDF = 20 * 1024 * 1024;
const COOKIE = 'teaching_admin';
const DEFAULT_HEADERS = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
class TeachingError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const fail = (status, code, message) => { throw new TeachingError(status, code, message); };
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { ...DEFAULT_HEADERS, 'content-type': 'application/json; charset=utf-8', ...headers } });
const localDate = now => new Date(now + 9 * 3600000).toISOString().slice(0, 10);
const first = (db, sql, ...args) => db.prepare(sql).bind(...args).first();
async function all(db, sql, ...args) { return (await db.prepare(sql).bind(...args).all()).results || []; }
async function hash(value) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function sameHash(a, b) { let difference = a.length ^ b.length; for (let i = 0; i < 64; i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return difference === 0; }
function token() { return [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join(''); }
function cookieValue(request) { return request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || ''; }
const setCookie = value => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL / 1000}`;
const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
async function adminSession(request, env, now) { const raw = cookieValue(request); if (!/^[a-f0-9]{64}$/.test(raw) || typeof env.ADMIN_PASSWORD !== 'string' || !env.ADMIN_PASSWORD) return null; const tokenHash = await hash(raw); const session = await first(env.DB, 'SELECT token_hash, secret_hash FROM teacher_admin_sessions WHERE token_hash = ? AND expires_at > ?', tokenHash, now); if (!session || !sameHash(session.secret_hash, await hash(env.ADMIN_PASSWORD))) return null; return { tokenHash }; }
function string(value, max, label, required = false) { if (value === undefined || value === null) value = ''; if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(400, 'invalid_input', `${label}을(를) ${required ? '1~' : ''}${max}자 이내로 입력해 주세요.`); return value.trim(); }
function identifier(value, label = '항목') { if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) fail(400, 'invalid_id', `${label}을(를) 다시 선택해 주세요.`); return value; }
function validDate(value) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(value + 'T00:00:00Z'); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
function schedule(value) { if (value === undefined || value === null || value === '') return null; if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) fail(400, 'invalid_schedule', '예약 일시를 다시 선택해 주세요.'); return Date.parse(value); }
function status(value) { if (!['draft', 'published'].includes(value)) fail(400, 'invalid_status', '초안 또는 공개 상태를 선택해 주세요.'); return value; }
function visibleChapter(chapter, now) { return chapter?.status === 'published' && chapter.week_start <= localDate(now) && (chapter.publish_at === null || chapter.publish_at <= now); }
function pdfView(row) { return row?.object_key ? { url: '/api/pdf/' + encodeURIComponent(row.id || row.chapter_id) + '?v=' + encodeURIComponent(row.object_key.split('/').at(-1)), name: row.pdf_name || row.name, size: row.pdf_size ?? row.size, pages: row.pdf_pages ?? row.pages ?? null } : null; }
function chapterView(row) { return { id: row.id, number: row.number, title: row.title, weekStart: row.week_start, body: row.body, status: row.status, publishAt: row.publish_at === null ? null : new Date(row.publish_at).toISOString(), createdAt: row.created_at, updatedAt: row.updated_at, pdf: pdfView(row) }; }
function expressionView(row) { return { id: row.id, chapterId: row.chapter_id, en: row.en, ko: row.ko, note: row.note, kind: row.kind, example: row.example, studyDay: row.study_day, status: row.status, publishAt: row.publish_at === null ? null : new Date(row.publish_at).toISOString(), createdAt: row.created_at, updatedAt: row.updated_at }; }
const CHAPTER_SELECT = 'SELECT c.*, p.object_key, p.name AS pdf_name, p.size AS pdf_size, p.pages AS pdf_pages FROM teacher_chapters c LEFT JOIN teacher_pdfs p ON p.chapter_id = c.id';
async function chapterRow(db, id) { return first(db, CHAPTER_SELECT + ' WHERE c.id = ?', id); }
async function revision(db) { return (await first(db, 'SELECT COALESCE(MAX(id),0) AS revision FROM teacher_revisions')).revision; }
const revisionStatement = (db, kind, now) => db.prepare('INSERT INTO teacher_revisions (kind, created_at) VALUES (?, ?)').bind(kind, now);
async function readLimited(request, max) { const declared = Number(request.headers.get('content-length')); if (declared > max) fail(413, 'body_too_large', '파일 또는 입력 내용이 허용 크기를 넘었어요.'); if (!request.body) return new Uint8Array(); const reader = request.body.getReader(); const chunks = []; let size = 0; try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > max) { await reader.cancel(); fail(413, 'body_too_large', '파일 또는 입력 내용이 허용 크기를 넘었어요.'); } chunks.push(part.value); } } finally { reader.releaseLock(); } const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; } return bytes; }
function validatePDFEnvelope(bytes) {
  // Basic truncation protection only; PDF.js performs the full document validation.
  const whitespace = value => value === 0 || value === 9 || value === 10 || value === 12 || value === 13 || value === 32;
  const invalid = () => fail(400, 'invalid_pdf_structure', 'PDF 파일이 완전하지 않아요. 원본 PDF를 다시 선택해 주세요.');
  let end = bytes.length;
  while (end > 0 && whitespace(bytes[end - 1])) end--;
  if (end < 5 || String.fromCharCode(...bytes.subarray(end - 5, end)) !== '%%EOF') invalid();
  const eof = end - 5;
  let numberEnd = eof;
  while (numberEnd > 0 && whitespace(bytes[numberEnd - 1])) numberEnd--;
  let numberStart = numberEnd;
  while (numberStart > 0 && bytes[numberStart - 1] >= 48 && bytes[numberStart - 1] <= 57) numberStart--;
  if (numberStart === numberEnd) invalid();
  const digitStart = numberStart;
  if (numberStart > 0 && bytes[numberStart - 1] === 43) numberStart--;
  let keywordEnd = numberStart;
  while (keywordEnd > 0 && whitespace(bytes[keywordEnd - 1])) keywordEnd--;
  const keywordStart = keywordEnd - 9;
  if (keywordEnd === numberStart || keywordStart < 0 || String.fromCharCode(...bytes.subarray(keywordStart, keywordEnd)) !== 'startxref') invalid();
  let offset = 0;
  for (let index = digitStart; index < numberEnd; index++) {
    offset = offset * 10 + bytes[index] - 48;
    if (!Number.isSafeInteger(offset) || offset >= keywordStart) invalid();
  }
}
async function jsonBody(request) { if (!request.headers.get('content-type')?.includes('application/json')) fail(415, 'json_required', 'JSON 형식으로 요청해 주세요.'); const bytes = await readLimited(request, 512 * 1024); let value; try { value = JSON.parse(new TextDecoder().decode(bytes)); } catch { fail(400, 'invalid_json', '입력 내용을 다시 확인해 주세요.'); } if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'invalid_json', '입력 내용을 다시 확인해 주세요.'); return value; }
function originCheck(request) { const origin = request.headers.get('origin'); if (origin && origin !== new URL(request.url).origin) fail(403, 'invalid_origin', '사이트 안에서 다시 시도해 주세요.'); }
function normalizedStrokes(value) { if (!Array.isArray(value) || value.length > 1000) fail(400, 'invalid_strokes', '필기는 1,000개 선까지 저장할 수 있어요.'); let total = 0; return value.map(stroke => { if (!stroke || !['pen', 'highlighter', 'eraser'].includes(stroke.tool) || typeof stroke.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(stroke.color) || typeof stroke.width !== 'number' || !Number.isFinite(stroke.width) || stroke.width <= 0 || stroke.width > 1 || !Array.isArray(stroke.points) || !stroke.points.length) fail(400, 'invalid_strokes', '필기 형식을 다시 확인해 주세요.'); total += stroke.points.length; if (total > 5000) fail(400, 'invalid_strokes', '한 페이지의 필기가 너무 많아요. 일부 선을 지운 뒤 다시 저장해 주세요.'); const points = stroke.points.map(point => { if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) fail(400, 'invalid_strokes', '필기의 위치를 다시 확인해 주세요.'); return { x: point.x, y: point.y }; }); return { tool: stroke.tool, color: stroke.color.toLowerCase(), width: stroke.width, points }; }); }
function noteView(row, chapterId, page, requiresLogin = false) { let strokes = []; try { strokes = JSON.parse(row?.strokes_json || '[]'); } catch { /* Stored notes remain readable if a historical drawing is malformed. */ } return { chapterId, page, text: row?.text || '', strokes, updatedAt: row?.updated_at || null, requiresLogin }; }
function makeDays(pool, activeChapter, baseDays) { pool = pool.filter(expression => expression.kind === '표현'); if (!pool.length) return activeChapter ? (baseDays || []).map(day => ({ ...day, chapterId: activeChapter.id || day.chapterId || null })) : baseDays || []; const baseMeanings = (baseDays || []).flatMap(day => (day.phrases || []).map(p => p.ko)).filter(Boolean); return Array.from({ length: 7 }, (_, index) => { const day = index + 1; const assigned = pool.filter(expression => expression.studyDay === day); const rotated = [...pool.slice((index * 3) % pool.length), ...pool.slice(0, (index * 3) % pool.length)]; const selected = assigned.slice(0, 3); for (const expression of rotated) if (selected.length < 3 && !selected.some(p => p.id === expression.id)) selected.push(expression); while (selected.length < 3) selected.push(pool[selected.length % pool.length]); const repeatedPractice = new Set(selected.map(p => p.id)).size < 3; const phrases = selected.map(expression => ({ id: expression.id, chapterId: expression.chapterId, en: expression.en, ko: expression.ko, note: expression.note, kind: expression.kind, example: expression.example })); const quiz = selected.map((expression, qIndex) => { const wrong = [...new Set([...pool.map(p => p.ko), ...baseMeanings, '이 표현과 관련 없는 내용입니다.', '문장의 의미와 반대되는 내용입니다.', '다른 업무 상황을 설명하는 표현입니다.', '뜻이 일치하지 않는 선택지입니다.'])].filter(meaning => meaning !== expression.ko).slice(0, 2); const answer = (index + qIndex) % 3; const options = [...wrong]; options.splice(answer, 0, expression.ko); return { q: `“${expression.en}”의 뜻으로 알맞은 것은?`, options, answer, explanation: `${expression.en} → ${expression.ko}${expression.note ? ' · ' + expression.note : ''}` }; }); return { id: day, chapterId: activeChapter?.id || null, title: `오늘의 수업 표현 ${day}`, subtitle: activeChapter ? `${activeChapter.number}챕터 · ${activeChapter.title}` : '선생님이 등록한 표현으로 연습해요', icon: ['👋', '💼', '🎯', '💬', '🤝', '📊', '🏆'][index], phrases, dialogue: [{ speaker: 'A', en: 'Which expression would you use at work?', ko: '업무에서 어떤 표현을 써 볼까요?' }, { speaker: 'B', en: phrases[0].en, ko: phrases[0].ko }, { speaker: 'A', en: 'Can you give me an example?', ko: '예문을 말해 주실 수 있나요?' }, { speaker: 'B', en: phrases[0].example || phrases[1].en, ko: phrases[0].example ? '배운 표현을 내 업무 상황에 맞게 바꾸어 말해 보세요.' : phrases[1].ko }], prompt: `“${phrases[0].en}”를 내 업무 상황에 맞게 소리 내어 말해 보세요.`, example: phrases[0].example || phrases[0].en, quiz, repeatedPractice, note: repeatedPractice ? '등록된 표현이 3개 미만이라 같은 수업 표현을 반복 연습해요.' : assigned.length < 3 ? '다른 날에 등록된 수업 표현도 함께 복습해요.' : '' }; }); }

async function adminLearnerReport(env, url, now) {
  const month = url.searchParams.has('month') ? url.searchParams.get('month') : localDate(now).slice(0, 7);
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) fail(400, 'invalid_month', '조회 월 확인');
  const roomValue = url.searchParams.get('roomId');
  const roomId = roomValue ? identifier(roomValue, '반') : null;
  const rooms = await all(env.DB, 'SELECT r.id, r.name, r.code, COUNT(m.user_id) AS memberCount FROM rooms r LEFT JOIN room_members m ON m.room_id = r.id GROUP BY r.id ORDER BY r.name, r.id');
  if (roomId && !rooms.some(room => room.id === roomId)) fail(404, 'room_not_found', '등록된 반 없음');
  const [year, monthNumber] = month.split('-').map(Number);
  const start = Date.UTC(year, monthNumber - 1, 1) - 9 * 3600000;
  const end = Date.UTC(year, monthNumber, 1) - 9 * 3600000;
  const selected = `SELECT p.* FROM profiles p WHERE (? IS NULL OR EXISTS (SELECT 1 FROM room_members m WHERE m.user_id = p.user_id AND m.room_id = ?))`;
  const sql = `WITH selected AS (${selected}),
    quest AS (
      SELECT r.user_id, SUM(r.seconds) AS studySeconds, SUM(r.points) AS questPoints
      FROM learning_rewards r JOIN selected p ON p.user_id = r.user_id WHERE r.month = ? GROUP BY r.user_id
    ),
    lessons AS (
      SELECT s.user_id, COUNT(*) AS completedLessons,
        COUNT(DISTINCT s.course || CHAR(31) || COALESCE(s.chapter_id,'') || CHAR(31) || CAST(s.day AS TEXT)) AS completedUniqueLessons
      FROM learning_sessions s JOIN selected p ON p.user_id = s.user_id
      WHERE s.finished_at >= ? AND s.finished_at < ? GROUP BY s.user_id
    ),
    games AS (
      SELECT r.user_id, COUNT(*) AS gameCount FROM activity_runs r JOIN selected p ON p.user_id = r.user_id
      WHERE r.finished_at >= ? AND r.finished_at < ? GROUP BY r.user_id
    ),
    quizzes AS (
      SELECT s.user_id, COUNT(*) AS quizAnswered, SUM(q.correct) AS quizCorrect
      FROM quiz_answers q JOIN learning_sessions s ON s.id = q.session_id JOIN selected p ON p.user_id = s.user_id
      WHERE q.answered_at >= ? AND q.answered_at < ? GROUP BY s.user_id
    ),
    answers AS (
      SELECT r.user_id, COUNT(*) AS gameQuestions, SUM(a.correct) AS gameCorrect
      FROM activity_answers a JOIN activity_runs r ON r.id = a.run_id JOIN selected p ON p.user_id = r.user_id
      WHERE a.answered_at >= ? AND a.answered_at < ? GROUP BY r.user_id
    ),
    awards AS (
      SELECT a.user_id, SUM(CASE WHEN a.category = 'study' THEN a.points ELSE 0 END) AS cardPoints,
        SUM(CASE WHEN a.category = 'game' THEN a.points ELSE 0 END) AS gamePoints
      FROM activity_awards a JOIN selected p ON p.user_id = a.user_id
      WHERE a.month = ? AND a.applied = 1 GROUP BY a.user_id
    ),
    cards AS (
      SELECT c.user_id, SUM(CASE WHEN c.known = 1 THEN 1 ELSE 0 END) AS flashcardKnown,
        SUM(c.attempts) AS reviewedCards, SUM(CASE WHEN c.attempts > 0 THEN 1 ELSE 0 END) AS reviewedCardCount
      FROM study_cards c JOIN selected p ON p.user_id = c.user_id GROUP BY c.user_id
    ),
    events AS (
      SELECT s.user_id, s.finished_at AS at FROM learning_sessions s JOIN selected p ON p.user_id = s.user_id WHERE s.finished_at IS NOT NULL
      UNION ALL SELECT s.user_id, q.answered_at FROM quiz_answers q JOIN learning_sessions s ON s.id = q.session_id JOIN selected p ON p.user_id = s.user_id
      UNION ALL SELECT r.user_id, r.finished_at FROM activity_runs r JOIN selected p ON p.user_id = r.user_id WHERE r.finished_at IS NOT NULL
      UNION ALL SELECT r.user_id, a.answered_at FROM activity_answers a JOIN activity_runs r ON r.id = a.run_id JOIN selected p ON p.user_id = r.user_id
      UNION ALL SELECT a.user_id, a.created_at FROM activity_awards a JOIN selected p ON p.user_id = a.user_id WHERE a.applied = 1
    ),
    activity AS (
      SELECT user_id, MAX(at) AS lastStudiedAt,
        MAX(CASE WHEN at >= ? AND at < ? THEN at ELSE NULL END) AS lastStudiedInMonthAt,
        COUNT(DISTINCT CASE WHEN at >= ? AND at < ? THEN STRFTIME('%Y-%m-%d', at / 1000, 'unixepoch', '+9 hours') ELSE NULL END) AS activeDays
      FROM events GROUP BY user_id
    )
    SELECT p.public_id AS id, p.nickname, p.avatar,
      COALESCE(q.studySeconds,0) AS studySeconds, COALESCE(l.completedLessons,0) AS completedLessons,
      COALESCE(l.completedUniqueLessons,0) AS completedUniqueLessons, COALESCE(g.gameCount,0) AS gameCount,
      COALESCE(z.quizAnswered,0) AS quizAnswered, COALESCE(z.quizCorrect,0) AS quizCorrect,
      COALESCE(a.gameQuestions,0) AS gameQuestions, COALESCE(a.gameCorrect,0) AS gameCorrect,
      COALESCE(q.questPoints,0) + COALESCE(w.cardPoints,0) AS studyPoints, COALESCE(w.gamePoints,0) AS gamePoints,
      COALESCE(q.questPoints,0) + COALESCE(w.cardPoints,0) + COALESCE(w.gamePoints,0) AS points,
      COALESCE(t.activeDays,0) AS activeDays, t.lastStudiedAt, t.lastStudiedInMonthAt,
      COALESCE(c.flashcardKnown,0) AS flashcardKnown, COALESCE(c.reviewedCards,0) AS reviewedCards,
      COALESCE(c.reviewedCardCount,0) AS reviewedCardCount
    FROM selected p LEFT JOIN quest q ON q.user_id = p.user_id LEFT JOIN lessons l ON l.user_id = p.user_id
      LEFT JOIN games g ON g.user_id = p.user_id LEFT JOIN quizzes z ON z.user_id = p.user_id
      LEFT JOIN answers a ON a.user_id = p.user_id LEFT JOIN awards w ON w.user_id = p.user_id
      LEFT JOIN cards c ON c.user_id = p.user_id LEFT JOIN activity t ON t.user_id = p.user_id
    ORDER BY studySeconds DESC, points DESC, p.nickname, p.public_id`;
  const [rows, memberships, passes] = await Promise.all([
    all(env.DB, sql, roomId, roomId, month, start, end, start, end, start, end, start, end, month, start, end, start, end),
    all(env.DB, `WITH selected AS (${selected}) SELECT p.public_id AS learnerId, r.id, r.name, r.code,
      CASE WHEN p.current_room_id = r.id THEN 1 ELSE 0 END AS isCurrent
      FROM selected p JOIN room_members m ON m.user_id = p.user_id JOIN rooms r ON r.id = m.room_id
      ORDER BY p.public_id, isCurrent DESC, r.name`, roomId, roomId),
    all(env.DB, `WITH selected AS (${selected})
      SELECT p.public_id AS learnerId, MAX(v.passed_at) AS lastStudiedAt,
        MAX(CASE WHEN v.passed_at >= ? AND v.passed_at < ? THEN v.passed_at ELSE NULL END) AS lastStudiedInMonthAt
      FROM daily_rail_passes v JOIN activity_runs r ON r.id = v.run_id
        JOIN selected p ON p.user_id = r.user_id GROUP BY p.public_id`, roomId, roomId, start, end)
  ]);
  // Daily corrections share the first attempt's KST date, already counted in activeDays.
  const latestPass = new Map(passes.map(pass => [pass.learnerId, pass]));
  for (const row of rows) {
    const pass = latestPass.get(row.id);
    if (!pass) continue;
    row.lastStudiedAt = Math.max(Number(row.lastStudiedAt || 0), Number(pass.lastStudiedAt || 0)) || null;
    row.lastStudiedInMonthAt = Math.max(Number(row.lastStudiedInMonthAt || 0), Number(pass.lastStudiedInMonthAt || 0)) || null;
  }
  const byLearner = new Map();
  for (const { learnerId, isCurrent, ...room } of memberships) { if (!byLearner.has(learnerId)) byLearner.set(learnerId, []); byLearner.get(learnerId).push({ ...room, isCurrent: !!isCurrent }); }
  const learners = rows.map(row => { const avatar = { species: 0 }; try { const parsed = JSON.parse(row.avatar || '{}'); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) for (const [key, limit] of Object.entries({ species: 12, skin: 5, hair: 5, eyes: 3, outfit: 5, accessory: 5, color: 7 })) if (Number.isInteger(parsed[key]) && parsed[key] >= 0 && parsed[key] <= limit) avatar[key] = parsed[key]; } catch { /* Old malformed avatars use the UI fallback. */ } return { ...row, avatar, rooms: byLearner.get(row.id) || [] }; });
  const metrics = ['studySeconds','completedLessons','completedUniqueLessons','gameCount','quizAnswered','quizCorrect','gameQuestions','gameCorrect','studyPoints','gamePoints','points','activeDays','flashcardKnown','reviewedCards','reviewedCardCount'];
  const summary = { learnerCount: learners.length, activeLearners: learners.filter(learner => learner.activeDays > 0).length };
  for (const key of metrics) summary[key] = learners.reduce((sum, learner) => sum + Number(learner[key] || 0), 0);
  return { month, roomId, rooms, summary, learners, tracking: {
    time: '학습 시간: 퀘스트 보상 기록 기준 · 카드·게임 시간 제외',
    lessons: '완료 퀘스트: 재학습 포함 · 고유 레슨: 코스·챕터·일차 중복 제외',
    cards: '암기 카드·복습 횟수·복습 카드: 누적 기록 · 카드 학습 시간·복습 시각 미측정',
    activity: '최근 학습: 퀴즈·게임 답변·완료·학습 보상 시각 · 별표·프로필 변경 제외',
    scope: '반 필터: 소속 학생 기준 · 학습 지표: 사이트 전체 기록'
  } };
}

export async function getTeachingContent(env, baseCourses = {}, now = Date.now()) {
  let rows = [], expressionRows = [], databaseRevision = 0;
  if (env.DB) { [rows, expressionRows, databaseRevision] = await Promise.all([all(env.DB, CHAPTER_SELECT + ' ORDER BY c.week_start, c.number, c.created_at'), all(env.DB, 'SELECT * FROM teacher_expressions WHERE deleted_at IS NULL ORDER BY study_day, created_at, id'), revision(env.DB)]); }
  const chapters = rows.filter(row => visibleChapter(row, now)).map(chapterView);
  const visibleIds = new Set(chapters.map(chapter => chapter.id));
  const expressions = expressionRows.filter(row => row.status === 'published' && (row.publish_at === null || row.publish_at <= now) && (!row.chapter_id || visibleIds.has(row.chapter_id))).map(expressionView);
  const activeChapter = chapters.at(-1) || null;
  const pool = expressions.filter(expression => !expression.chapterId || expression.chapterId === activeChapter?.id);
  const days = makeDays(pool, activeChapter, baseCourses.business || []);
  const cardView = ({ id, en, ko, note, kind, example, studyDay, chapterId }) => ({ id, en, ko, note, kind, example, studyDay, chapterId });
  const decks = chapters.map(chapter => ({ id: chapter.id, title: `${chapter.number}챕터 · ${chapter.title}`, chapterId: chapter.id, cards: expressions.filter(expression => expression.chapterId === chapter.id).map(cardView) })).filter(deck => deck.cards.length);
  const unassigned = expressions.filter(expression => !expression.chapterId);
  if (unassigned.length) decks.push({ id: 'daily-expressions', title: '오늘의 표현', chapterId: null, cards: unassigned.map(cardView) });
  for (const deck of decks) { const kinds = [...new Set(deck.cards.map(card => card.kind))]; deck.kind = kinds.length === 1 ? kinds[0] : 'mixed'; deck.categories = { words: deck.cards.filter(card => card.kind === '단어').map(card => card.id), speaking: deck.cards.filter(card => card.kind === '표현').map(card => card.id) }; }
  const dailyWords = expressions.filter(expression => expression.kind === '단어');
  const speakingExpressions = expressions.filter(expression => expression.kind === '표현');
  const contentRevision = rows.length || expressionRows.length || databaseRevision ? Number.parseInt((await hash(JSON.stringify({ databaseRevision, chapters, expressions }))).slice(0, 12), 16) : 0;
  return { content: { revision: contentRevision, activeChapter, chapters, expressions, days, decks, dailyWords, speakingExpressions, usingFallback: !pool.some(expression => expression.kind === '표현') }, courses: { ...baseCourses, business: days } };
}

export async function handleTeaching(request, env, now = Date.now(), baseCourses = {}) {
  const url = new URL(request.url), path = url.pathname;
  if (!(path.startsWith('/api/admin/') || path === '/api/content' || path === '/api/notes' || path.startsWith('/api/pdf/'))) return null;
  try {
    if (!env.DB) fail(503, 'database_unavailable', '수업 저장소를 준비하고 있어요. 잠시 후 다시 시도해 주세요.');
    if (!['GET', 'POST', 'HEAD'].includes(request.method)) fail(405, 'method_not_allowed', '지원하지 않는 요청입니다.');
    if (request.method === 'POST') originCheck(request);
    if (path === '/api/content' && request.method === 'GET') return json((await getTeachingContent(env, baseCourses, now)).content);
    if (path === '/api/admin/login' && request.method === 'POST') {
      if (typeof env.ADMIN_PASSWORD !== 'string' || !env.ADMIN_PASSWORD) fail(503, 'admin_unconfigured', '관리자 비밀번호 설정을 확인해 주세요.');
      const body = await jsonBody(request);
      if (typeof body.password !== 'string' || body.password.length > 256) fail(400, 'password_required', '관리자 비밀번호를 입력해 주세요.');
      const ipHash = await hash(request.headers.get('cf-connecting-ip') || 'unknown');
      const failures = await first(env.DB, 'SELECT COUNT(*) AS n FROM teacher_login_attempts WHERE ip_hash = ? AND created_at > ?', ipHash, now - LOGIN_WINDOW);
      if (failures.n >= 5) fail(429, 'login_throttled', '로그인 시도가 많아요. 15분 뒤 다시 시도해 주세요.');
      const secretHash = await hash(env.ADMIN_PASSWORD);
      if (!sameHash(await hash(body.password), secretHash)) {
        const attemptId = crypto.randomUUID();
        await env.DB.prepare('INSERT INTO teacher_login_attempts (id, ip_hash, created_at) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM teacher_login_attempts WHERE ip_hash = ? AND created_at > ?) < 5').bind(attemptId, ipHash, now, ipHash, now - LOGIN_WINDOW).run();
        if (!await first(env.DB, 'SELECT id FROM teacher_login_attempts WHERE id = ?', attemptId)) fail(429, 'login_throttled', '로그인 시도가 많아요. 15분 뒤 다시 시도해 주세요.');
        fail(401, 'invalid_password', '비밀번호가 맞지 않아요.');
      }
      const rawToken = token();
      await env.DB.batch([env.DB.prepare('INSERT INTO teacher_admin_sessions (token_hash, secret_hash, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(await hash(rawToken), secretHash, now, now + SESSION_TTL), env.DB.prepare('DELETE FROM teacher_login_attempts WHERE ip_hash = ? OR created_at <= ?').bind(ipHash, now - LOGIN_WINDOW), env.DB.prepare('DELETE FROM teacher_admin_sessions WHERE expires_at <= ?').bind(now)]);
      return json({ authenticated: true, expiresAt: now + SESSION_TTL }, 200, { 'set-cookie': setCookie(rawToken) });
    }
    if (path === '/api/admin/logout' && request.method === 'POST') { await jsonBody(request); const raw = cookieValue(request); if (raw) await env.DB.prepare('DELETE FROM teacher_admin_sessions WHERE token_hash = ?').bind(await hash(raw)).run(); return json({ authenticated: false }, 200, { 'set-cookie': clearCookie() }); }
    if (path.startsWith('/api/admin/')) {
      if (!await adminSession(request, env, now)) return json({ authenticated: false, error: 'admin_auth_required', message: '관리자 로그인이 필요해요.' }, 401);
      if (['/api/admin/learners', '/api/admin/students'].includes(path) && request.method === 'GET') return json(await adminLearnerReport(env, url, now));
      if (path === '/api/admin/state' && request.method === 'GET') { const [chapters, expressions, rev] = await Promise.all([all(env.DB, CHAPTER_SELECT + ' ORDER BY c.week_start DESC, c.number DESC'), all(env.DB, 'SELECT * FROM teacher_expressions WHERE deleted_at IS NULL ORDER BY updated_at DESC'), revision(env.DB)]); return json({ authenticated: true, revision: rev, chapters: chapters.map(chapterView), expressions: expressions.map(expressionView) }); }
      if (path === '/api/admin/chapter' && request.method === 'POST') {
        const body = await jsonBody(request), id = body.id ? identifier(body.id, '챕터') : crypto.randomUUID();
        if (body.id && !await chapterRow(env.DB, id)) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.');
        if (!Number.isInteger(body.number) || body.number < 1 || body.number > 999) fail(400, 'invalid_number', '챕터 번호는 1~999로 입력해 주세요.');
        if (!validDate(body.weekStart)) fail(400, 'invalid_week', '수업 시작 날짜를 다시 선택해 주세요.');
        const title = string(body.title, 120, '챕터 제목', true), text = string(body.body, 50000, '수업 내용'), state = status(body.status), publishAt = schedule(body.publishAt);
        await env.DB.batch([env.DB.prepare('INSERT INTO teacher_chapters (id, number, title, week_start, body, status, publish_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET number = excluded.number, title = excluded.title, week_start = excluded.week_start, body = excluded.body, status = excluded.status, publish_at = excluded.publish_at, updated_at = excluded.updated_at').bind(id, body.number, title, body.weekStart, text, state, publishAt, now, now), revisionStatement(env.DB, 'chapter', now)]);
        return json({ chapter: chapterView(await chapterRow(env.DB, id)), revision: await revision(env.DB) });
      }
      if (path === '/api/admin/chapter/delete' && request.method === 'POST') { const body = await jsonBody(request), id = identifier(body.id, '챕터'); if (!await chapterRow(env.DB, id)) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.'); await env.DB.batch([env.DB.prepare("UPDATE teacher_chapters SET status = 'draft', updated_at = ? WHERE id = ?").bind(now, id), revisionStatement(env.DB, 'unpublish-chapter', now)]); return json({ unpublished: true, id, revision: await revision(env.DB) }); }
      if (path === '/api/admin/expression' && request.method === 'POST') {
        const body = await jsonBody(request), id = body.id ? identifier(body.id, '표현') : crypto.randomUUID();
        if (body.id && !await first(env.DB, 'SELECT id FROM teacher_expressions WHERE id = ? AND deleted_at IS NULL', id)) fail(404, 'expression_not_found', '표현을 찾을 수 없어요.');
        const chapterId = body.chapterId ? identifier(body.chapterId, '챕터') : null;
        if (chapterId && !await chapterRow(env.DB, chapterId)) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.');
        const en = string(body.en, 500, '영어 표현', true), ko = string(body.ko, 1000, '우리말 뜻', true), note = string(body.note, 2000, '표현 설명'), example = string(body.example, 2000, '예문'), state = status(body.status), publishAt = schedule(body.publishAt);
        if (!/[a-z]/i.test(en)) fail(400, 'invalid_english', '영어 표현을 입력해 주세요.');
        if (!['표현', '단어'].includes(body.kind)) fail(400, 'invalid_kind', '표현 또는 단어를 선택해 주세요.');
        if (!Number.isInteger(body.studyDay) || body.studyDay < 1 || body.studyDay > 7) fail(400, 'invalid_day', '복습 날짜는 Day 1~7로 선택해 주세요.');
        await env.DB.batch([env.DB.prepare('INSERT INTO teacher_expressions (id, chapter_id, en, ko, note, kind, example, study_day, status, publish_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET chapter_id = excluded.chapter_id, en = excluded.en, ko = excluded.ko, note = excluded.note, kind = excluded.kind, example = excluded.example, study_day = excluded.study_day, status = excluded.status, publish_at = excluded.publish_at, updated_at = excluded.updated_at').bind(id, chapterId, en, ko, note, body.kind, example, body.studyDay, state, publishAt, now, now), revisionStatement(env.DB, 'expression', now)]);
        return json({ expression: expressionView(await first(env.DB, 'SELECT * FROM teacher_expressions WHERE id = ?', id)), revision: await revision(env.DB) });
      }
      if (path === '/api/admin/expression/delete' && request.method === 'POST') { const body = await jsonBody(request), id = identifier(body.id, '표현'); if (!await first(env.DB, 'SELECT id FROM teacher_expressions WHERE id = ? AND deleted_at IS NULL', id)) fail(404, 'expression_not_found', '표현을 찾을 수 없어요.'); await env.DB.batch([env.DB.prepare('UPDATE teacher_expressions SET deleted_at = ?, updated_at = ? WHERE id = ?').bind(now, now, id), revisionStatement(env.DB, 'delete-expression', now)]); return json({ deleted: true, id, revision: await revision(env.DB) }); }
      if (path === '/api/admin/pdf' && request.method === 'POST') {
        if (!env.BUCKET) fail(503, 'storage_unavailable', 'PDF 저장소를 준비하고 있어요.');
        const chapterId = identifier(url.searchParams.get('chapterId'), '챕터');
        if (!await chapterRow(env.DB, chapterId)) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.');
        if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/pdf')) fail(415, 'pdf_required', 'PDF 파일을 선택해 주세요.');
        const bytes = await readLimited(request, MAX_PDF);
        if (bytes.length < 5 || new TextDecoder('ascii').decode(bytes.slice(0, 5)) !== '%PDF-') fail(400, 'invalid_pdf', '올바른 PDF 파일을 선택해 주세요.');
        validatePDFEnvelope(bytes);
        let name; try { name = decodeURIComponent(request.headers.get('x-file-name') || 'lesson.pdf'); } catch { fail(400, 'invalid_filename', '파일 이름을 다시 확인해 주세요.'); }
        name = name.split(/[\\/]/).at(-1).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200) || 'lesson.pdf';
        const pageHeader = request.headers.get('x-pdf-pages');
        const pages = pageHeader ? Number(pageHeader) : null;
        if (pages !== null && (!Number.isInteger(pages) || pages < 1 || pages > 2000)) fail(400, 'invalid_pages', 'PDF 페이지 수를 확인해 주세요.');
        const previous = await first(env.DB, 'SELECT object_key FROM teacher_pdfs WHERE chapter_id = ?', chapterId);
        const key = 'teacher-pdf/' + crypto.randomUUID() + '.pdf';
        await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { chapterId } });
        try { await env.DB.batch([env.DB.prepare('INSERT INTO teacher_pdfs (chapter_id, object_key, name, size, pages, uploaded_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(chapter_id) DO UPDATE SET object_key = excluded.object_key, name = excluded.name, size = excluded.size, pages = excluded.pages, uploaded_at = excluded.uploaded_at').bind(chapterId, key, name, bytes.length, pages, now), env.DB.prepare('UPDATE teacher_chapters SET updated_at = ? WHERE id = ?').bind(now, chapterId), revisionStatement(env.DB, 'pdf', now)]); } catch (error) {
          // A rejected D1 response can still follow a committed write. Only a
          // confirmed non-reference permits cleanup; unreadable state keeps bytes safe.
          let unreferenced = false;
          try { const current = await first(env.DB, 'SELECT object_key FROM teacher_pdfs WHERE chapter_id = ?', chapterId); unreferenced = current === null || (typeof current?.object_key === 'string' && current.object_key !== key); }
          catch { console.error('Teaching PDF cleanup deferred: metadata state unknown'); }
          if (unreferenced) try { await env.BUCKET.delete(key); } catch { console.error('Teaching PDF cleanup deferred: object delete failed'); }
          throw error;
        }
        if (previous?.object_key) try { await env.BUCKET.delete(previous.object_key); } catch { console.error('Previous teaching PDF cleanup deferred'); }
        return json({ chapterId, pdf: pdfView(await chapterRow(env.DB, chapterId)), revision: await revision(env.DB) });
      }
      fail(404, 'not_found', '요청한 관리자 기능을 찾을 수 없어요.');
    }
    if (path.startsWith('/api/pdf/') && ['GET', 'HEAD'].includes(request.method)) {
      let id; try { id = decodeURIComponent(path.slice('/api/pdf/'.length)); } catch { fail(400, 'invalid_id', 'PDF를 다시 선택해 주세요.'); }
      identifier(id, '챕터'); const chapter = await chapterRow(env.DB, id);
      if (!chapter || !chapter.object_key || (!visibleChapter(chapter, now) && !await adminSession(request, env, now))) fail(404, 'pdf_not_found', '공개된 수업 PDF를 찾을 수 없어요.');
      if (!env.BUCKET) fail(503, 'storage_unavailable', 'PDF 저장소를 준비하고 있어요.');
      const object = await env.BUCKET.get(chapter.object_key);
      if (!object) fail(404, 'pdf_not_found', 'PDF 파일을 찾을 수 없어요.');
      return new Response(request.method === 'HEAD' ? null : object.body, { headers: { ...DEFAULT_HEADERS, 'content-type': 'application/pdf', 'content-length': String(chapter.pdf_size), 'content-disposition': `inline; filename="lesson.pdf"; filename*=UTF-8''${encodeURIComponent(chapter.pdf_name)}`, 'accept-ranges': 'none' } });
    }
    if (path === '/api/notes' && ['GET', 'POST'].includes(request.method)) {
      const body = request.method === 'POST' ? await jsonBody(request) : { chapterId: url.searchParams.get('chapterId'), page: Number(url.searchParams.get('page')) };
      const chapterId = identifier(body.chapterId, '챕터'), page = body.page;
      if (!Number.isInteger(page) || page < 1 || page > 2000) fail(400, 'invalid_page', 'PDF 페이지를 다시 선택해 주세요.');
      const userId = request.headers.get('x-aj-user-id');
      if (!userId) { if (request.method === 'GET') return json(noteView(null, chapterId, page, true)); fail(401, 'sign_in_required', '필기를 계정에 저장하려면 로그인해 주세요.'); }
      const chapter = await chapterRow(env.DB, chapterId);
      if (!chapter || (!visibleChapter(chapter, now) && !await adminSession(request, env, now))) fail(404, 'chapter_not_found', '공개된 수업 챕터를 찾을 수 없어요.');
      if (request.method === 'POST') { if (typeof body.text !== 'string' || body.text.length > 10000) fail(400, 'invalid_note', '필기 내용은 10,000자까지 저장할 수 있어요.'); const strokes = normalizedStrokes(body.strokes); await env.DB.prepare('INSERT INTO teacher_notes (user_id, chapter_id, page, text, strokes_json, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, chapter_id, page) DO UPDATE SET text = excluded.text, strokes_json = excluded.strokes_json, updated_at = excluded.updated_at').bind(userId, chapterId, page, body.text, JSON.stringify(strokes), now).run(); }
      return json(noteView(await first(env.DB, 'SELECT text, strokes_json, updated_at FROM teacher_notes WHERE user_id = ? AND chapter_id = ? AND page = ?', userId, chapterId, page), chapterId, page));
    }
    fail(404, 'not_found', '요청한 수업 기능을 찾을 수 없어요.');
  } catch (error) { if (error instanceof TeachingError) return json({ error: error.code, message: error.message }, error.status); console.error('Teaching API failed:', error?.name || 'Error', String(error?.cause?.message || error?.message || '').slice(0, 240)); return json({ error: 'teaching_request_failed', message: '수업 내용을 저장하거나 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500); }
}
