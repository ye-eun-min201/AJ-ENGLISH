// 선생님 자료를 사이트가 알아듣게 나누는 도구 모음 (관리자·학생 화면이 같이 쓴다).
// AI를 쓰지 않는다. '줄이 바뀌면 새 문단', 'Example 뒤는 예문' 같은 정해진 규칙으로만 나눈다.
(function (root) {
  'use strict';
  const HANGUL = /[가-힣]/, LATIN = /[A-Za-z]/;
  const clean = value => String(value ?? '').replace(/\r\n?/g, '\n').replace(/[ ​]/g, ' ');
  const tidy = value => String(value ?? '').replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 날짜 ---------- */
  const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
  function mondayOf(date) { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); }
  function addDays(date, n) { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function dayIndex(date) { return (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7; }
  function dateLabel(date, withDay = true) { const d = new Date(date + 'T00:00:00Z'); return (d.getUTCMonth() + 1) + '월 ' + d.getUTCDate() + '일' + (withDay ? ' ' + DAYS[dayIndex(date)] + '요일' : ''); }
  function weekLabel(date) { return dateLabel(mondayOf(date), false) + ' 주'; }

  /* ---------- 본문: 줄이 바뀌면 새 문단 ---------- */
  function paragraphs(text) { return clean(text).split(/\n+/).map(line => line.trim()).filter(Boolean); }

  /* ---------- 단어 묶음: 단어 / 뜻 / 예문 / 해석 / 참고 ---------- */
  const LABELS = [
    ['ko', /^(?:뜻|의미|meaning)\s*[:：\-–)\]]?\s*(.*)$/i],
    ['example', /^(?:예문|예시|examples?(?:\s*sentences?)?|ex)\s*\d*\s*[.:：\-–)\]]?\s*(.*)$/i],
    ['exampleKo', /^(?:해석|번역|translation)\s*\d*\s*[.:：\-–)\]]?\s*(.*)$/i],
    ['note', /^(?:참고|메모|note|tip|유의어|동의어|반의어|synonyms?|antonyms?)\s*[:：\-–)\]]?\s*(.*)$/i]
  ];
  const BULLET = /^[•●○▪■□◆◇▶▷►\-–—*·✓✔☑]+\s*/;
  const sentenceLike = line => /[.?!]["')]?$/.test(line) || line.split(/\s+/).length > 7;
  function label(line) {
    for (const [field, pattern] of LABELS) {
      const match = line.match(pattern); if (!match) continue;
      // 영어 이름표(Example, Note…)는 뒤에 ':' 같은 표시가 있거나 그 말만 있을 때만 이름표로 본다 — 'Example of …' 같은 문장과 헷갈리지 않게.
      const head = line.slice(0, line.length - match[1].length);
      if (LATIN.test(head) && match[1] && !/[.:：\-–)\]\d]\s*$/.test(head)) continue;
      return { field, rest: match[1].trim() };
    }
    return null;
  }
  const NUMBERED = /^(\d{1,2})\s*[.)\]]\s*(.+)$/, NUMBERED_LOOSE = /^(\d{1,2})\s+([A-Za-z].*)$/;
  function headword(line, hasCurrent, field, previousBlank, numberedOnly) {
    const numbered = line.match(NUMBERED) || line.match(NUMBERED_LOOSE);
    if (!numbered && numberedOnly) return null;
    const rest = numbered ? numbered[2].trim() : line;
    if (!LATIN.test(rest) || !/^[A-Za-z(]/.test(rest)) return null;
    let cut = rest.search(HANGUL); if (cut > 0) { const open = rest.lastIndexOf('(', cut); if (open >= 0 && !rest.slice(open, cut).includes(')')) cut = open; }
    const en = (cut >= 0 ? rest.slice(0, cut) : rest).replace(/[\s:：\-–=]+$/, '').trim(), ko = cut >= 0 ? rest.slice(cut).trim() : '';
    if (!en || en.split(/\s+/).length > 7) return null;
    if (numbered) { if (field === 'example' && sentenceLike(en) && !ko) return null; return { en, ko }; }
    if (sentenceLike(en)) return null;
    if (ko) return hasCurrent && !previousBlank ? null : { en, ko };
    return !hasCurrent || previousBlank ? { en, ko: '' } : null;
  }
  function parseWords(text) {
    const lines = clean(text).split('\n'), items = []; let current = null, field = null, previousBlank = true;
    const numberedOnly = lines.filter(raw => { const line = tidy(raw); const m = line.match(NUMBERED) || line.match(NUMBERED_LOOSE); return m && /^[A-Za-z(]/.test(m[2]) && !sentenceLike(m[2].split(HANGUL)[0].trim()); }).length >= 2;
    const push = (key, value) => { if (!value) return; current[key] = current[key] ? current[key] + (key === 'ko' ? ', ' : '\n') + value : value; };
    for (const raw of lines) {
      const line = tidy(raw.replace(BULLET, ''));
      if (!line) { previousBlank = true; continue; }
      const tagged = label(line);
      if (tagged && current) { field = tagged.field; push(field, tagged.rest.replace(BULLET, '')); previousBlank = false; continue; }
      const head = headword(line, !!current, field, previousBlank, numberedOnly);
      if (head && !(current && !current.ko && !previousBlank && !/^\d/.test(line))) {
        current = { en: head.en, ko: head.ko, example: '', exampleKo: '', note: '' }; items.push(current); field = head.ko ? 'ko' : null; previousBlank = false; continue;
      }
      previousBlank = false;
      if (!current) continue; // 첫 단어가 나오기 전의 제목 줄(예: Today's Vocabulary)은 버린다
      const korean = HANGUL.test(line), english = (line.match(/[A-Za-z]{2,}/g) || []).length >= 3;
      if (field === 'note') push('note', line);
      else if (field === 'exampleKo') push(korean ? 'exampleKo' : 'example', line);
      else if (field === 'example') push(korean && !english ? 'exampleKo' : 'example', line);
      else if (korean && !english && !current.example) { push('ko', line); field = 'ko'; }
      else if (english) { push('example', line); field = 'example'; }
      else if (korean) push(current.example ? 'exampleKo' : 'ko', line);
      else push('note', line);
    }
    return items.map(item => ({ ...item, en: item.en.replace(/\s+/g, ' '), problems: [!item.ko && '뜻이 비었어요', item.en.length > 80 && '단어가 너무 길어요'].filter(Boolean) }));
  }

  /* ---------- 본문에서 단어 찾기 (cede → ceding, shore up → shoring up) ---------- */
  const rx = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const IRREGULAR = { lose: 'lost', take: 'took|taken', go: 'went|gone', make: 'made', give: 'gave|given', come: 'came', get: 'got|gotten', keep: 'kept', hold: 'held', run: 'ran', break: 'broke|broken', bring: 'brought', buy: 'bought', sell: 'sold', pay: 'paid', fall: 'fell|fallen', rise: 'rose|risen', lead: 'led', leave: 'left', lay: 'laid', bear: 'bore|borne', draw: 'drew|drawn', throw: 'threw|thrown', stand: 'stood', see: 'saw|seen', do: 'did|done|does', have: 'had|has', find: 'found', feel: 'felt', tell: 'told', say: 'said', know: 'knew|known', grow: 'grew|grown', build: 'built', send: 'sent', spend: 'spent', meet: 'met', win: 'won', write: 'wrote|written', speak: 'spoke|spoken', choose: 'chose|chosen', drive: 'drove|driven', begin: 'began|begun', think: 'thought', catch: 'caught', teach: 'taught', seek: 'sought', strike: 'struck', stick: 'stuck', shrink: 'shrank|shrunk', sink: 'sank|sunk', wear: 'wore|worn', tear: 'tore|torn', bind: 'bound', wind: 'wound', deal: 'dealt', mean: 'meant', lend: 'lent', bend: 'bent', swing: 'swung', hang: 'hung', dig: 'dug', sit: 'sat', be: 'is|are|was|were|been|being|am' };
  function inflect(token) {
    const base = rx(token), parts = [base + "(?:s|es|d|ed|ing|'s)?"];
    if (/e$/.test(token)) parts.push(rx(token.slice(0, -1)) + '(?:ed|ing|es)');
    if (/y$/.test(token)) parts.push(rx(token.slice(0, -1)) + '(?:ies|ied)');
    if (/[^aeiou][aeiou][bdgmnprt]$/.test(token)) parts.push(base + rx(token.slice(-1)) + '(?:ed|ing)');
    if (IRREGULAR[token]) parts.push(IRREGULAR[token]);
    return '(?:' + parts.join('|') + ')';
  }
  function forms(en) {
    const options = tidy(en).toLowerCase().replace(/\([^)]*\)/g, ' ').split('/').map(part => part.trim()).filter(part => /[a-z]/.test(part));
    const patterns = options.map(option => {
      const tokens = option.split(/\s+/).filter(Boolean);
      return tokens.map((token, index) => /^(?:one's|someone's|sb's)$/.test(token) ? "(?:my|your|his|her|its|our|their|one's)" : /^(?:sb|sth|someone|something)$/.test(token) ? '\\S+' : index === 0 || tokens.length === 1 ? inflect(token) : rx(token) + (index === tokens.length - 1 ? '(?:s|es)?' : '')).join('[\\s-]+');
    });
    return patterns.length ? new RegExp("(?<![A-Za-z'])(?:" + patterns.join('|') + ")(?![A-Za-z])", 'gi') : null;
  }
  /** 글에서 단어들을 찾아 [{text} | {text, word: 번호}] 조각으로 돌려준다. */
  function pieces(text, words) {
    const source = String(text ?? '').replace(/[’‘]/g, "'"), hits = [];
    (words || []).forEach((word, index) => { const pattern = forms(word.en || word); if (!pattern) return; for (const match of source.matchAll(pattern)) hits.push({ start: match.index, end: match.index + match[0].length, word: index }); });
    hits.sort((a, b) => a.start - b.start || b.end - a.end);
    const out = []; let at = 0;
    for (const hit of hits) { if (hit.start < at) continue; if (hit.start > at) out.push({ text: source.slice(at, hit.start) }); out.push({ text: source.slice(hit.start, hit.end), word: hit.word }); at = hit.end; }
    if (at < source.length) out.push({ text: source.slice(at) });
    return out;
  }
  function markHTML(text, words, tag = 'mark') { return pieces(text, words).map(piece => piece.word === undefined ? esc(piece.text) : tag === 'button' ? '<button type="button" class="rd-w" data-rd-word="' + piece.word + '">' + esc(piece.text) + '</button>' : '<mark>' + esc(piece.text) + '</mark>').join(''); }

  /* ---------- 녹음 글 (클로바노트 텍스트): '참석자 1 00:07' 다음 줄들이 그 사람의 말 ---------- */
  function parseTranscript(text) {
    const lines = clean(text).split('\n'), turns = []; let current = null, previousBlank = true;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { previousBlank = true; continue; }
      const head = previousBlank && line.match(/^(.{1,40}?)\s+((?:\d{1,2}:)?\d{1,2}:\d{2})$/);
      if (head) { current = { speaker: head[1].trim(), time: head[2], text: '' }; turns.push(current); }
      else { if (!current) { current = { speaker: '', time: '', text: '' }; turns.push(current); } current.text += (current.text ? '\n' : '') + line; }
      previousBlank = false;
    }
    const timed = turns.filter(turn => turn.time).length;
    return { turns: turns.filter(turn => turn.text), timed, speakers: [...new Set(turns.map(turn => turn.speaker).filter(Boolean))] };
  }

  /* ---------- 파일 읽기 ---------- */
  function decodeText(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (_) { return new TextDecoder('euc-kr').decode(bytes); }
  }
  const entities = value => value.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (all, name) => ({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }[name.toLowerCase()] ?? String.fromCodePoint(name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1)))));
  /** 한글(.hwpx) 파일에서 글만 꺼낸다. hwpx 는 zip 이고, 글은 Contents/section*.xml 의 <hp:t> 안에 있다. */
  async function hwpxText(buffer) {
    const bytes = new Uint8Array(buffer), view = new DataView(buffer);
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error(bytes[0] === 0xd0 && bytes[1] === 0xcf ? '옛 한글 파일(.hwp)은 읽지 못해요. 한글에서 ‘다른 이름으로 저장 → hwpx’로 바꾸거나, 글을 복사해 붙여 주세요.' : '한글 파일(.hwpx)이 아니에요.');
    let end = bytes.length - 22; while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
    if (end < 0) throw new Error('파일이 깨진 것 같아요. 글을 복사해 붙여 주세요.');
    const count = view.getUint16(end + 10, true); let at = view.getUint32(end + 16, true); const sections = [];
    for (let i = 0; i < count && view.getUint32(at, true) === 0x02014b50; i++) {
      const method = view.getUint16(at + 10, true), size = view.getUint32(at + 20, true), nameLength = view.getUint16(at + 28, true), extra = view.getUint16(at + 30, true), comment = view.getUint16(at + 32, true), local = view.getUint32(at + 42, true);
      const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
      if (/^Contents\/section\d+\.xml$/i.test(name)) sections.push({ name, method, size, local });
      at += 46 + nameLength + extra + comment;
    }
    if (!sections.length) throw new Error('이 파일에서 글을 찾지 못했어요. 글을 복사해 붙여 주세요.');
    sections.sort((a, b) => Number(a.name.match(/\d+/)[0]) - Number(b.name.match(/\d+/)[0]));
    const out = [];
    for (const section of sections) {
      const start = section.local + 30 + view.getUint16(section.local + 26, true) + view.getUint16(section.local + 28, true), data = bytes.subarray(start, start + section.size);
      let xml;
      if (section.method === 0) xml = new TextDecoder().decode(data);
      else if (section.method === 8) xml = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
      else throw new Error('이 파일의 압축 방식을 읽지 못해요. 글을 복사해 붙여 주세요.');
      for (const paragraph of xml.match(/<hp:p\b[\s\S]*?<\/hp:p>/g) || []) {
        const line = entities((paragraph.match(/<hp:t\b[^>]*>[\s\S]*?<\/hp:t>/g) || []).map(part => part.replace(/<[^>]+>/g, '')).join('')).trim();
        if (line) out.push(line);
      }
    }
    return out.join('\n\n');
  }

  root.AJDaily = { paragraphs, parseWords, forms, pieces, markHTML, parseTranscript, decodeText, hwpxText, mondayOf, addDays, dayIndex, dateLabel, weekLabel, DAYS, esc };
})(typeof window !== 'undefined' ? window : globalThis);
