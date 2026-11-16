// 학생 화면 '오늘의 리딩': 주 → 요일을 눌러 그날의 글과 단어를 본다. 색칠된 단어를 누르면 뜻이 나온다.
(function () {
  'use strict';
  const KEY = 'ajenglish-reading-done-v1';
  const doneMap = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { return {}; } };
  const isDone = date => doneMap()[date] === true;
  const remember = dates => { const map = doneMap(); dates.forEach(date => { map[date] = true; }); try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (_) { /* 저장을 못 해도 읽기는 된다 */ } };
  const kstToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  let current = null;

  function mount(container, options = {}) {
    destroy();
    const D = window.AJDaily, esc = D.esc, bodies = new Map();
    let content = options.content || {}, destroyed = false, date = null, loadVersion = 0, bodyState = { status: 'idle' };
    const root = document.createElement('section'); root.className = 'rd'; root.setAttribute('aria-label', '오늘의 리딩'); container.replaceChildren(root);
    const list = () => Array.isArray(content.readings) ? content.readings : [];
    const reading = () => list().find(item => item.date === date) || null;
    const words = () => { const item = reading(); return item ? (content.expressions || []).filter(word => word.readingId === item.id) : []; };
    const weeks = () => [...new Set(list().map(item => D.mondayOf(item.date)))].sort();

    async function load() {
      const item = reading(), version = ++loadVersion;
      if (!item || !item.hasBody) { bodyState = { status: 'none' }; return render(); }
      if (bodies.has(item.date)) { bodyState = { status: 'ready', data: bodies.get(item.date) }; return render(); }
      bodyState = { status: 'loading' }; render();
      try { const data = await options.api('reading?date=' + item.date); if (destroyed || version !== loadVersion) return; bodies.set(item.date, data); bodyState = { status: 'ready', data }; }
      catch (error) { if (destroyed || version !== loadVersion) return; bodyState = { status: error.status === 401 ? 'login' : 'error', message: error.message }; }
      render();
    }
    function select(next) { if (!next || next === date) return; date = next; closePop(); load(); }
    function closePop() { root.querySelector('.rd-pop')?.remove(); root.querySelectorAll('.rd-w.is-open').forEach(node => node.classList.remove('is-open')); }
    function openPop(button) {
      const word = words()[Number(button.dataset.rdWord)]; if (!word) return; closePop(); button.classList.add('is-open');
      const pop = document.createElement('div'); pop.className = 'rd-pop'; pop.setAttribute('role', 'status');
      pop.innerHTML = '<strong lang="en">' + esc(word.en) + '</strong><p>' + esc(word.ko) + '</p>' + (word.example ? '<p class="rd-pop-ex" lang="en">' + esc(word.example.split('\n')[0]) + '</p>' : '') + '<div class="rd-pop-actions"><button type="button" data-rd-say="' + esc(word.en) + '">듣기</button><button type="button" data-rd-pop-close>닫기</button></div>';
      root.append(pop);
    }
    function render() {
      if (destroyed) return;
      const items = list();
      if (!items.length) { root.innerHTML = '<div class="rd-empty"><h2>아직 올라온 리딩이 없어요</h2><p>선생님이 글을 올리면 여기에 날짜별로 쌓여요.</p></div>'; return; }
      const item = reading(), monday = D.mondayOf(date), all = weeks(), at = all.indexOf(monday), today = kstToday(), dayWords = words();
      const lesson = (content.chapters || []).filter(chapter => chapter.weekStart && D.mondayOf(chapter.weekStart) === monday).at(-1);
      const days = Array.from({ length: 7 }, (_, index) => { const day = D.addDays(monday, index), has = items.some(entry => entry.date === day); return '<button type="button" class="rd-day' + (has ? ' has' : '') + (day === date ? ' is-on' : '') + (day === today ? ' is-today' : '') + '" ' + (has ? 'data-rd-date="' + day + '"' : 'disabled') + ' aria-label="' + esc(D.dateLabel(day)) + (has ? '' : ' · 리딩 없음') + '"' + (day === date ? ' aria-current="date"' : '') + '><span>' + D.DAYS[index] + '</span><b>' + Number(day.slice(8)) + '</b><i></i></button>'; }).join('');
      let body = '';
      if (bodyState.status === 'loading') body = '<p class="rd-tip">글을 불러오는 중이에요…</p>';
      else if (bodyState.status === 'login') body = '<div class="rd-empty"><h2>글은 로그인하면 볼 수 있어요</h2><p>아래 단어는 지금도 볼 수 있어요.</p><a class="rd-btn is-main" href="/login?return_to=' + encodeURIComponent('/#reading') + '">카카오로 로그인</a></div>';
      else if (bodyState.status === 'error') body = '<div class="rd-empty"><h2>글을 불러오지 못했어요</h2><p>' + esc(bodyState.message || '') + '</p><button type="button" class="rd-btn" data-rd-retry>다시 불러오기</button></div>';
      else if (bodyState.status === 'ready') body = (dayWords.length ? '<p class="rd-tip">색칠된 단어를 누르면 뜻이 나와요.</p>' : '') + '<div class="rd-body" lang="en">' + D.paragraphs(bodyState.data.body).map(paragraph => '<p>' + D.markHTML(paragraph, dayWords, 'button') + '</p>').join('') + '</div><div class="rd-done"><button type="button" class="rd-btn ' + (isDone(date) ? 'is-done' : 'is-main') + '" data-rd-done>' + (isDone(date) ? '다 읽었어요 ✓' : '다 읽었어요') + '</button></div>';
      root.innerHTML = '<div class="rd-week"><div class="rd-week-head"><div><strong>' + esc(D.weekLabel(date)) + '</strong>' + (lesson ? '<small>이 주 수업 · ' + esc(lesson.title) + '</small>' : '') + '</div><div class="rd-nav"><button type="button" data-rd-week="-1" aria-label="이전 주" ' + (at > 0 ? '' : 'disabled') + '>‹</button><button type="button" data-rd-week="1" aria-label="다음 주" ' + (at < all.length - 1 ? '' : 'disabled') + '>›</button></div></div><div class="rd-days">' + days + '</div></div>' +
        (item ? '<article class="rd-paper"><p class="rd-kicker">' + esc(D.dateLabel(date)) + (date === today ? ' · 오늘' : '') + '</p><h1>' + esc(item.title || '오늘의 리딩') + '</h1>' + (body || '<p class="rd-tip">이 날은 단어만 올라왔어요.</p>') + '</article>' : '') +
        (dayWords.length ? '<div class="rd-words-head"><h2>' + (date === today ? '오늘의 단어' : '이 날의 단어') + '</h2><span>' + dayWords.length + '개</span></div><ol class="rd-words">' + dayWords.map((word, index) => '<li class="rd-word" id="rd-word-' + index + '"><b>' + (index + 1) + '</b><div><h3 lang="en">' + esc(word.en) + '</h3><p class="rd-ko">' + esc(word.ko) + '</p>' + (word.example ? word.example.split('\n').map((line, n) => '<p class="rd-example" lang="en">' + D.markHTML(line, [word]) + '</p>' + ((word.exampleKo || '').split('\n')[n] ? '<p class="rd-example-ko">' + esc(word.exampleKo.split('\n')[n]) + '</p>' : '')).join('') : '') + (word.note ? '<p class="rd-note">참고 · ' + esc(word.note) + '</p>' : '') + '</div><button type="button" class="rd-say" data-rd-say="' + esc(word.en) + '" aria-label="' + esc(word.en) + ' 듣기">♪</button></li>').join('') + '</ol><div class="rd-done"><button type="button" class="rd-btn is-main" data-rd-go="words">단어 카드로 외우기</button><button type="button" class="rd-btn" data-rd-go="rail">문제로 풀어 보기</button></div>' : '');
    }
    function onClick(event) {
      const button = event.target.closest('button'); if (!button || !root.contains(button)) { if (!event.target.closest('.rd-pop')) closePop(); return; }
      const data = button.dataset;
      if (data.rdDate) select(data.rdDate);
      else if (data.rdWeek) { const all = weeks(), next = all[all.indexOf(D.mondayOf(date)) + Number(data.rdWeek)]; if (next) select(list().filter(item => D.mondayOf(item.date) === next)[0]?.date); }
      else if (data.rdWord !== undefined) openPop(button);
      else if ('rdPopClose' in data) closePop();
      else if (data.rdSay) options.say?.(data.rdSay);
      else if ('rdRetry' in data) load();
      else if ('rdDone' in data) { remember([date]); render(); Promise.resolve(options.api('reading/read', { date })).catch(() => { /* 로그인 전이면 이 기기에만 남는다 */ }); }
      else if (data.rdGo === 'words') options.onWords?.();
      else if (data.rdGo === 'rail') options.onRail?.();
    }
    root.addEventListener('click', onClick);
    // 계정에 남은 읽음 기록을 가져와 다른 기기에서 읽은 날도 표시한다
    Promise.resolve(options.api('reading/reads')).then(data => { if (!destroyed && Array.isArray(data?.dates) && data.dates.length) { remember(data.dates); render(); } }).catch(() => {});
    date = list()[0]?.date || null; if (date) load(); else render();
    current = {
      update(next) { if (destroyed) return; content = next || {}; if (!reading()) date = list()[0]?.date || null; if (bodyState.status === 'ready' || !date) render(); else load(); },
      destroy() { destroyed = true; loadVersion++; root.removeEventListener('click', onClick); current = null; }
    };
    return current;
  }
  function destroy() { current?.destroy(); }
  window.DailyReading = { mount, destroy, isDone, update: content => current?.update(content) };
})();
