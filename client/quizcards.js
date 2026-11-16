// 단어장: 카드 한 장이 화면 가운데 서 있고, 누르면 뒤집히고, 옆으로 밀면 넘어간다.
// 오른쪽으로 밀면 '알아요', 왼쪽으로 밀면 '아직'. 화면은 위아래로 움직이지 않는다.
// 묶음은 두 가지: 우리 반 단어(오늘의 단어·주차 단어)와 토익 노랭이(Day 1~30).
(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(key, fallback) { try { const value = localStorage.getItem(key); return value === null ? fallback : value; } catch (_) { return fallback; } }, set(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* 저장을 못 해도 공부는 된다 */ } } };
  let current = null;

  function mount(container, options = {}) {
    destroy();
    const root = document.createElement('section'); root.className = 'qc'; root.setAttribute('aria-label', '단어장'); container.replaceChildren(root);
    document.documentElement.classList.add('qc-open');
    const siteDecks = (options.decks || []).map(deck => ({ id: String(deck.id), title: deck.title, cards: (deck.cards || []).filter(card => card.kind !== '표현') })).filter(deck => deck.cards.length);
    let destroyed = false, book = store.get('ajenglish-cards-book', 'class') === 'toeic' ? 'toeic' : 'class';
    if (options.book === 'toeic' || options.book === 'class') book = options.book;
    let deckId = options.deckId && siteDecks.some(deck => deck.id === String(options.deckId)) ? String(options.deckId) : siteDecks[0]?.id || null;
    let toeicDays = [], toeicDay = Math.max(1, Number(store.get('ajenglish-toeic-day', '1')) || 1), toeicCards = new Map(), loading = false, message = '';
    let sound = store.get('ajenglish-cards-sound', 'on') !== 'off', shuffle = false, onlyUnknown = false;
    let queue = [], index = 0, flipped = false, known = new Map(), history = [], sessionKnown = 0, sessionLearning = 0;

    const cardsNow = () => book === 'toeic' ? toeicCards.get(toeicDay) || [] : siteDecks.find(deck => deck.id === deckId)?.cards || [];
    const titleNow = () => book === 'toeic' ? '토익 노랭이 · Day ' + toeicDay : siteDecks.find(deck => deck.id === deckId)?.title || '단어장';
    const speak = text => { if (sound && text) options.say?.(text); };

    function start(keepFilter) {
      if (!keepFilter) onlyUnknown = false;
      let list = cardsNow().slice(); if (onlyUnknown) list = list.filter(card => known.get(card.id) !== true);
      if (shuffle) for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
      queue = list; index = 0; flipped = false; history = []; sessionKnown = 0; sessionLearning = 0; render(); if (queue[0]) speak(queue[0].en);
    }
    async function loadProgress() {
      try { const data = await options.api('study/cards'); if (destroyed) return; (data.cards || []).forEach(row => known.set(String(row.cardId), row.known === 1 || row.known === true)); render(); } catch (_) { /* 기록 없이도 카드는 넘길 수 있다 */ }
    }
    async function loadToeic() {
      loading = true; message = ''; render();
      try {
        if (!toeicDays.length) toeicDays = (await options.api('wordbook?book=toeic')).days || [];
        if (!toeicDays.some(item => item.day === toeicDay)) toeicDay = toeicDays[0]?.day || 1;
        if (!toeicCards.has(toeicDay)) toeicCards.set(toeicDay, (await options.api('wordbook?book=toeic&day=' + toeicDay)).cards || []);
      } catch (error) { message = error.message || '단어장을 불러오지 못했어요.'; }
      if (destroyed) return; loading = false; start();
    }
    function choose(next) { book = next; store.set('ajenglish-cards-book', book); if (book === 'toeic') loadToeic(); else start(); }

    function mark(isKnown) {
      const card = queue[index]; if (!card) return;
      history.push({ index, id: card.id, before: known.get(card.id), isKnown });
      known.set(card.id, isKnown); if (isKnown) sessionKnown++; else sessionLearning++;
      Promise.resolve(options.api('study/cards', { cardId: card.id, known: isKnown, review: true })).then(result => { if (!destroyed && result?.points > 0) options.onPoints?.(result.points); }).catch(() => { /* 다음 카드로는 넘어간다 */ });
      index++; flipped = false; render(); if (queue[index]) speak(queue[index].en);
    }
    function undo() {
      const last = history.pop(); if (!last) return;
      if (last.before === undefined) known.delete(last.id); else known.set(last.id, last.before);
      if (last.isKnown) sessionKnown--; else sessionLearning--;
      index = last.index; flipped = false; render();
    }
    function flip() { if (!queue[index]) return; flipped = !flipped; root.querySelector('.qc-card')?.classList.toggle('is-flipped', flipped); }

    function render() {
      if (destroyed) return;
      const all = cardsNow(), card = queue[index], done = !loading && !card, knownCount = all.filter(item => known.get(item.id) === true).length;
      const picker = book === 'toeic'
        ? '<select class="qc-pick" data-qc-day aria-label="토익 노랭이 날짜">' + toeicDays.map(item => '<option value="' + item.day + '"' + (item.day === toeicDay ? ' selected' : '') + '>Day ' + item.day + ' · ' + item.count + '개</option>').join('') + '</select>'
        : '<select class="qc-pick" data-qc-deck aria-label="단어 묶음">' + siteDecks.map(deck => '<option value="' + esc(deck.id) + '"' + (deck.id === deckId ? ' selected' : '') + '>' + esc(deck.title) + ' · ' + deck.cards.length + '개</option>').join('') + '</select>';
      let body;
      if (loading) body = '<div class="qc-note">단어를 불러오는 중이에요…</div>';
      else if (message) body = '<div class="qc-note">' + esc(message) + '<button type="button" class="qc-btn" data-qc-retry>다시 불러오기</button></div>';
      else if (!all.length) body = '<div class="qc-note">이 묶음에는 아직 단어가 없어요.</div>';
      else if (done) body = '<div class="qc-done"><p class="qc-done-kicker">' + esc(titleNow()) + '</p><h2>' + (sessionLearning ? '한 바퀴 돌았어요' : '모두 알아요!') + '</h2><div class="qc-done-score"><span class="is-known"><b>' + sessionKnown + '</b>알아요</span><span class="is-learning"><b>' + sessionLearning + '</b>아직</span></div>' +
        (sessionLearning ? '<button type="button" class="qc-btn is-main" data-qc-again="unknown">아직인 단어 ' + all.filter(item => known.get(item.id) !== true).length + '개만 다시</button>' : '') + '<button type="button" class="qc-btn" data-qc-again="all">처음부터 다시</button>' +
        (book === 'toeic' && toeicDays.some(item => item.day === toeicDay + 1) ? '<button type="button" class="qc-btn" data-qc-next-day>Day ' + (toeicDay + 1) + '로 넘어가기</button>' : '') + '</div>';
      else body = '<div class="qc-stage"><div class="qc-edge is-left" aria-hidden="true">아직</div><div class="qc-edge is-right" aria-hidden="true">알아요</div>' +
        '<div class="qc-card' + (flipped ? ' is-flipped' : '') + '" data-qc-card tabindex="0" role="button" aria-label="카드 뒤집기: ' + esc(card.en) + '"><div class="qc-face qc-front"><button type="button" class="qc-say" data-qc-say aria-label="발음 듣기">♪</button><strong lang="en">' + esc(card.en) + '</strong><small>누르면 뜻이 보여요</small></div>' +
        '<div class="qc-face qc-back"><strong>' + esc(card.ko) + '</strong>' + (card.example ? '<p lang="en">' + esc(String(card.example).split('\n')[0]) + '</p>' : '') + (card.exampleKo ? '<p class="qc-ex-ko">' + esc(String(card.exampleKo).split('\n')[0]) + '</p>' : '') + '</div></div></div>';
      root.innerHTML = '<header class="qc-top"><button type="button" class="qc-icon" data-qc-exit aria-label="나가기">✕</button><div class="qc-tabs" role="tablist" aria-label="단어장 고르기"><button type="button" role="tab" aria-selected="' + (book === 'class') + '" data-qc-book="class">우리 반 단어</button><button type="button" role="tab" aria-selected="' + (book === 'toeic') + '" data-qc-book="toeic">토익 노랭이</button></div><button type="button" class="qc-icon" data-qc-sound aria-pressed="' + sound + '" aria-label="' + (sound ? '소리 끄기' : '소리 켜기') + '">' + (sound ? '🔊' : '🔇') + '</button></header>' +
        '<div class="qc-sub">' + picker + '<span class="qc-total">외운 단어 ' + knownCount + ' / ' + all.length + '</span></div>' +
        '<div class="qc-progress"><span style="width:' + (queue.length ? Math.round(Math.min(index, queue.length) / queue.length * 100) : 0) + '%"></span></div>' +
        '<div class="qc-count"><span class="is-learning"><b>' + sessionLearning + '</b> 아직</span><span class="qc-pos">' + (queue.length ? Math.min(index + 1, queue.length) + ' / ' + queue.length : '') + '</span><span class="is-known">알아요 <b>' + sessionKnown + '</b></span></div>' + body +
        (card && !loading ? '<footer class="qc-foot"><button type="button" class="qc-round" data-qc-undo aria-label="되돌리기"' + (history.length ? '' : ' disabled') + '>↩</button><button type="button" class="qc-big is-learning" data-qc-mark="0" aria-label="아직 몰라요">✕</button><button type="button" class="qc-big is-known" data-qc-mark="1" aria-label="알아요">✓</button><button type="button" class="qc-round" data-qc-shuffle aria-pressed="' + shuffle + '" aria-label="섞기">⤮</button></footer><p class="qc-hint">오른쪽으로 밀면 알아요 · 왼쪽으로 밀면 아직</p>' : '');
    }

    /* ---------- 밀기(스와이프)와 누르기 ---------- */
    let drag = null;
    function onDown(event) {
      const card = event.target.closest('[data-qc-card]'); if (!card || event.target.closest('[data-qc-say]')) return;
      drag = { card, x: event.clientX, y: event.clientY, dx: 0, moved: false, id: event.pointerId }; card.setPointerCapture?.(event.pointerId); card.classList.add('is-dragging');
    }
    function onMove(event) {
      if (!drag || event.pointerId !== drag.id) return;
      drag.dx = event.clientX - drag.x; if (Math.abs(drag.dx) > 8 || Math.abs(event.clientY - drag.y) > 8) drag.moved = true;
      drag.card.style.transform = 'translateX(' + drag.dx + 'px) rotate(' + drag.dx / 22 + 'deg)' + (flipped ? ' rotateY(180deg)' : '');
      root.querySelector('.qc-stage')?.setAttribute('data-lean', drag.dx > 40 ? 'right' : drag.dx < -40 ? 'left' : '');
    }
    function onUp(event) {
      if (!drag || event.pointerId !== drag.id) return;
      const { card, dx, moved } = drag; drag = null; card.classList.remove('is-dragging'); root.querySelector('.qc-stage')?.removeAttribute('data-lean');
      if (Math.abs(dx) > 90) { card.classList.add(dx > 0 ? 'fly-right' : 'fly-left'); card.style.transform = ''; setTimeout(() => { if (!destroyed) mark(dx > 0); }, 160); }
      else { card.style.transform = ''; if (!moved) flip(); }
    }
    function onClick(event) {
      const button = event.target.closest('button'); if (!button) return; const data = button.dataset;
      if ('qcExit' in data) options.onExit?.();
      else if (data.qcBook) choose(data.qcBook);
      else if ('qcSound' in data) { sound = !sound; store.set('ajenglish-cards-sound', sound ? 'on' : 'off'); render(); if (sound && queue[index]) speak(queue[index].en); }
      else if ('qcSay' in data) { event.stopPropagation(); if (queue[index]) options.say?.(queue[index].en); }
      else if (data.qcMark) mark(data.qcMark === '1');
      else if ('qcUndo' in data) undo();
      else if ('qcShuffle' in data) { shuffle = !shuffle; start(true); }
      else if (data.qcAgain) { onlyUnknown = data.qcAgain === 'unknown'; start(true); }
      else if ('qcNextDay' in data) { toeicDay++; store.set('ajenglish-toeic-day', String(toeicDay)); loadToeic(); }
      else if ('qcRetry' in data) loadToeic();
    }
    function onChange(event) {
      if (event.target.matches('[data-qc-deck]')) { deckId = event.target.value; start(); }
      else if (event.target.matches('[data-qc-day]')) { toeicDay = Number(event.target.value); store.set('ajenglish-toeic-day', String(toeicDay)); loadToeic(); }
    }
    function onKey(event) {
      if (destroyed || event.target.matches('select, input, textarea') || !queue[index]) return;
      if (event.key === ' ' || event.key === 'Enter') { if (event.target.closest('button') && !event.target.matches('[data-qc-card]')) return; event.preventDefault(); flip(); }
      else if (event.key === 'ArrowRight') mark(true); else if (event.key === 'ArrowLeft') mark(false);
    }
    root.addEventListener('pointerdown', onDown); root.addEventListener('pointermove', onMove); root.addEventListener('pointerup', onUp); root.addEventListener('pointercancel', onUp);
    root.addEventListener('click', onClick); root.addEventListener('change', onChange); document.addEventListener('keydown', onKey);
    current = { destroy() { destroyed = true; document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('qc-open'); current = null; } };
    loadProgress(); if (book === 'toeic' || !siteDecks.length) { book = 'toeic'; loadToeic(); } else start();
    return current;
  }
  function destroy() { current?.destroy(); }
  window.QuizCards = { mount, destroy };
})();
