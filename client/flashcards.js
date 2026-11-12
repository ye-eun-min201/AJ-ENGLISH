(() => {
  'use strict';
  const STORAGE_KEY = 'jj-flashcard-study-v1';
  const COLLECTIONS = { words: '매일 영단어', speaking: '말하기 문장' };
  const collectionFor = card => card.kind === '단어' ? 'words' : 'speaking';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const normal = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const shuffled = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  };
  const hash = value => { let result = 2166136261; for (const char of value) { result ^= char.charCodeAt(0); result = Math.imul(result, 16777619); } return (result >>> 0).toString(36); };
  function cleanDecks(decks) {
    return (Array.isArray(decks) ? decks : []).filter(deck => deck && Array.isArray(deck.cards)).map(deck => ({
      id: String(deck.id || 'deck-' + hash(String(deck.title || ''))), title: String(deck.title || '단어 학습'), chapterId: deck.chapterId == null ? null : String(deck.chapterId),
      cards: deck.cards.filter(card => card && String(card.en || '').trim() && String(card.ko || '').trim()).map(card => ({
        id: String(card.id || 'card-' + hash(String(card.en) + '|' + String(card.ko))), en: String(card.en).trim(), ko: String(card.ko).trim(),
        note: String(card.note || ''), kind: String(card.kind || '표현'),
        studyDay: Number.isInteger(Number(card.studyDay ?? card.day ?? deck.studyDay)) && Number(card.studyDay ?? card.day ?? deck.studyDay) >= 1 && Number(card.studyDay ?? card.day ?? deck.studyDay) <= 7 ? Number(card.studyDay ?? card.day ?? deck.studyDay) : null,
        example: typeof card.example === 'object' && card.example ? String(card.example.en || '') + (card.example.ko ? ' · ' + card.example.ko : '') : String(card.example || '')
      }))
    }));
  }
  function readLocal(storageKey = STORAGE_KEY) {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
      const progress = {}, unsynced = {};
      for (const [id, item] of Object.entries(saved.progress || {})) if (item && typeof item === 'object') progress[id] = { known: item.known === true, starred: item.starred === true, attempts: Math.max(0, Number(item.attempts) || 0) };
      for (const [id, item] of Object.entries(saved.unsynced || {})) if (item && typeof item === 'object') unsynced[id] = { known: item.known === true, starred: item.starred === true, revision: Math.max(0, Number(item.revision) || 0) };
      return { progress, unsynced, deckId: String(saved.deckId || 'all'), starredOnly: saved.starredOnly === true, collection: saved.collection === 'speaking' ? 'speaking' : 'words', collectionSettings: saved.collectionSettings && typeof saved.collectionSettings === 'object' ? saved.collectionSettings : {}, storageOK: true };
    } catch (_) { return { progress: {}, unsynced: {}, deckId: 'all', starredOnly: false, collection: 'words', collectionSettings: {}, storageOK: false }; }
  }
  const uniqueCards = decks => [...new Map(decks.flatMap(deck => deck.cards).map(card => [card.id, card])).values()];
  let sharedDecks = [], active = null, sharedSummary = { total: 0, known: 0, again: 0, starred: 0, remaining: 0, source: 'local', loaded: false };
  function countSummary(decks, records, source = 'local') {
    const cards = uniqueCards(decks), entries = cards.map(card => records[card.id] || {});
    const known = entries.filter(entry => entry.known === true).length;
    const collections = {};
    for (const category of Object.keys(COLLECTIONS)) {
      const subset = cards.filter(card => collectionFor(card) === category), learned = subset.filter(card => records[card.id]?.known).length;
      collections[category] = { total: subset.length, known: learned, remaining: subset.length - learned, starred: subset.filter(card => records[card.id]?.starred).length };
    }
    return { total: cards.length, known, again: entries.filter(entry => entry.attempts > 0 && !entry.known).length, starred: entries.filter(entry => entry.starred).length, remaining: cards.length - known, collections, source, loaded: true };
  }

  function mount(container, options = {}) {
    if (!container || typeof container.replaceChildren !== 'function') throw new Error('FlashcardStudy requires a container.');
    if (active) active.destroy();
    sharedDecks = cleanDecks(options.decks || sharedDecks);
    const account = options.authenticated === true && String(options.userId || '').trim() !== '';
    const storageKey = account ? STORAGE_KEY + ':account:' + encodeURIComponent(String(options.userId)) : STORAGE_KEY;
    const saved = readLocal(storageKey);
    const unsynced = account ? saved.unsynced : {};
    let changeRevision = Math.max(0, ...Object.values(unsynced).map(item => item.revision));
    const collectionSettings = saved.collectionSettings;
    let collection = options.collection === 'words' || options.collection === 'speaking' ? options.collection : saved.collection;
    const initial = collectionSettings[collection] || (collection === 'words' ? { deckId: saved.deckId, starredOnly: saved.starredOnly } : {});
    let records = saved.progress, deckId = String(initial.deckId || 'all'), starredOnly = initial.starredOnly === true, query = String(initial.query || ''), mode = ['cards','learn','write','match'].includes(initial.mode) ? initial.mode : 'cards';
    let studyDay = /^[1-7]$/.test(String(initial.studyDay)) ? String(initial.studyDay) : 'all', reviewState = ['learning','known'].includes(initial.reviewState) ? initial.reviewState : 'all';
    let order = [], currentId = initial.currentId ? String(initial.currentId) : null, flipped = false, game = null, cardRun = null, timer = null, destroyed = false, source = 'local';
    let pending = Promise.resolve(), localOK = saved.storageOK, lastAward = '', popupTimer = null, retrying = false;
    const locallyChanged = new Set(Object.keys(unsynced));
    const root = document.createElement('section');
    root.className = 'flashcard-study';
    root.setAttribute('aria-label', '영어 단어장과 카드 학습');
    root.innerHTML = '<header class="fc-header"><div><p class="fc-eyebrow">WORD STUDY</p><h2 class="fc-title">매일 영단어</h2><p class="fc-subtitle">영단어·말하기 문장 별도 학습</p></div><span class="fc-total-badge"></span></header>' +
      '<div class="fc-collections" role="tablist" aria-label="학습 컬렉션">' + Object.entries(COLLECTIONS).map(([id,label]) => '<button type="button" role="tab" class="fc-collection" data-fc-action="collection" data-fc-collection="' + id + '" aria-selected="false"><span>' + label + '</span><b data-fc-count="' + id + '">0</b></button>').join('') + '</div>' +
      '<div class="fc-toolbar"><label class="fc-deck-label">단어장<select class="fc-deck" aria-label="학습할 단어장"></select></label><label class="fc-day-label">복습 일차<select class="fc-day" aria-label="복습 일차"></select></label><label class="fc-search-label"><span class="fc-sr-only">영어 또는 한국어로 찾기</span><input class="fc-search" type="search" placeholder="영어·한국어 검색" autocomplete="off"></label><button type="button" class="fc-button fc-star-filter" data-fc-action="star-filter" aria-pressed="false">☆ 별표만</button></div>' +
      '<div class="fc-status-filters" role="group" aria-label="암기 상태">' + [['all','전체'],['learning','배우는 중'],['known','암기 완료']].map(([id,label]) => '<button type="button" data-fc-action="status-filter" data-fc-status="' + id + '" aria-pressed="false">' + label + '</button>').join('') + '</div>' +
      '<div class="fc-modes" role="tablist" aria-label="학습 방법">' + [['cards','카드','▱'],['learn','학습','✦'],['write','쓰기','✎'],['match','맞추기','⌘']].map(([id,label,icon]) => '<button type="button" role="tab" class="fc-mode" data-fc-action="mode" data-fc-mode="' + id + '" aria-selected="false"><span aria-hidden="true">' + icon + '</span>' + label + '</button>').join('') + '</div>' +
      '<div class="fc-stat-strip"></div><div class="fc-body"></div><div class="fc-live" role="status" aria-live="polite" aria-atomic="true"></div><div class="fc-sync"><span class="fc-sync-text"></span> <button type="button" class="fc-button" data-fc-action="retry-save" hidden>저장 재시도</button></div>' +
      '<details class="fc-wordlist" open><summary><span class="fc-list-title">영단어 목록</span><span class="fc-list-count"></span></summary><div class="fc-table-wrap"><table class="fc-table"><thead><tr><th scope="col"><span class="fc-sr-only">별표</span>☆</th><th scope="col">영어</th><th scope="col">뜻</th><th scope="col">암기 상태</th><th scope="col"><span class="fc-sr-only">듣기</span>◖</th></tr></thead><tbody></tbody></table></div></details><div class="fc-reward-popup" role="status" aria-live="polite" hidden></div>';
    container.replaceChildren(root);
    const $ = selector => root.querySelector(selector);
    const body = $('.fc-body'), live = $('.fc-live'), sync = $('.fc-sync-text'), deckSelect = $('.fc-deck');
    function sayStatus(text, state = '') { live.textContent = text; live.dataset.state = state; }
    function stopVoice() { try { window.speechSynthesis?.cancel(); } catch (_) { /* Optional browser feature. */ } }
    function summary(decks) {
      const result = countSummary(decks ? cleanDecks(decks) : sharedDecks, records, source);
      if (!decks) sharedSummary = result;
      return { ...result };
    }
    function saveLocal() {
      collectionSettings[collection] = { deckId, starredOnly, query, mode, studyDay, reviewState, currentId };
      try { window.localStorage.setItem(storageKey, JSON.stringify({ progress: records, unsynced, deckId, starredOnly, collection, collectionSettings })); localOK = true; }
      catch (_) { localOK = false; }
      renderSync(); summary();
    }
    function renderSync() {
      const waiting = Object.keys(unsynced).length;
      sync.textContent = (!localOK ? '브라우저 저장 불가 · 미저장 상태 현재 화면에만 유지' : account && waiting ? '계정 미저장 ' + waiting + '개 · 이 브라우저 임시 보관 · 재시도는 암기·별표 상태만 저장, 학습 보상 재지급 없음' : source === 'server' ? '학습 상태 계정 저장 완료' : account ? '계정 기록 연결 확인 필요 · 이 브라우저 기록 표시' : '학습 상태: 이 브라우저 저장 · 기기별 기록 상이') + (lastAward ? ' ' + lastAward : '');
      const retry = $('[data-fc-action="retry-save"]');
      retry.hidden = !account || !waiting;
      retry.disabled = retrying || typeof options.api !== 'function';
      retry.textContent = retrying ? '저장 확인 중' : '저장 재시도';
    }
    function findCard(id) { return uniqueCards(sharedDecks).find(card => card.id === id); }
    function collectionCards(decks = sharedDecks) { return uniqueCards(decks).filter(card => collectionFor(card) === collection); }
    function selection() {
      const cards = collectionCards(deckId === 'all' ? sharedDecks : sharedDecks.filter(deck => deck.id === deckId));
      const term = query.trim().toLocaleLowerCase();
      return cards.filter(card => (studyDay === 'all' || card.studyDay === Number(studyDay)) && (reviewState === 'all' || (reviewState === 'known' ? records[card.id]?.known === true : records[card.id]?.known !== true)) && (!starredOnly || records[card.id]?.starred) && (!term || [card.en, card.ko, card.note].some(text => text.toLocaleLowerCase().includes(term))));
    }
    function ensureOrder() {
      const ids = selection().map(card => card.id), allowed = new Set(ids);
      order = [...order.filter(id => allowed.has(id)), ...ids.filter(id => !order.includes(id))];
      if (!order.includes(currentId)) currentId = order[0] || null;
    }
    function elapsed(startedAt) { return startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0; }
    function timeLabel(seconds) { return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
    function stopTimer() { if (timer !== null) clearInterval(timer); timer = null; }
    function beginTimer(target) {
      if (!target.startedAt) target.startedAt = Date.now();
      if (!target.startNotified && typeof options.onStart === 'function') {
        target.startNotified = true;
        const payload = { mode: mode === 'learn' || mode === 'cards' ? 'flashcards' : mode, cardIds: [...(mode === 'cards' ? order : target.queue)] };
        Promise.resolve().then(() => { if (!destroyed && (target === game || target === cardRun)) return options.onStart(payload); }).catch(() => { /* Optional server run must not block local practice. */ });
      }
      if (mode !== 'match' || timer !== null) return;
      timer = setInterval(() => { if (!destroyed && game === target && !game.completed) { const clock = $('[data-fc-timer]'); if (clock) clock.textContent = timeLabel(elapsed(target.startedAt)); } }, 1000);
    }
    function progressFor(id) { return records[id] || { known: false, starred: false, attempts: 0 }; }
    function currentProgress() {
      const total = mode === 'cards' ? cardRun?.queue.length || 0 : game?.queue.length || 0;
      const completed = mode === 'cards' ? cardRun?.reviewed.size || 0 : mode === 'match' ? game?.reviewed.size || 0 : mode === 'write' || game?.fallback ? game?.solvedIds.size || 0 : game?.firstAnswers.size || 0;
      return total ? Math.min(100, Math.round(completed / total * 100)) : 0;
    }
    function showReward(label, previousProgress = currentProgress(), points) {
      const progress = currentProgress(), deltaProgress = Math.max(0, progress - previousProgress);
      const payload = { anchor: $('.fc-body') || root, progress, deltaProgress, label };
      if (Number.isFinite(Number(points)) && Number(points) > 0) payload.points = Number(points);
      if (!payload.points && !deltaProgress) return;
      try { if (typeof window.AJRewards?.show === 'function') { window.AJRewards.show(payload); return; } } catch (_) { /* Learning remains available without the optional shared effect. */ }
      const popup = $('.fc-reward-popup');
      popup.textContent = payload.points ? label + ' · +' + payload.points + ' XP' : label + ' · +' + deltaProgress + '% 학습 진행';
      popup.hidden = false;
      if (typeof clearTimeout === 'function') clearTimeout(popupTimer);
      if (typeof setTimeout === 'function') popupTimer = setTimeout(() => { if (!destroyed) popup.hidden = true; }, 2200);
    }
    async function writeCard(id, snapshot, review) {
      if (destroyed) return;
      const result = await options.api('study/cards', { cardId: id, known: snapshot.known, starred: snapshot.starred, review });
      if (result?.authenticated === false || result?.saveFailed) throw new Error('Account save unavailable.');
      // A closed view leaves its durable pending state for a safe, review:false retry.
      if (destroyed) return;
      source = 'server';
      if (unsynced[id]?.revision === snapshot.revision) {
        delete unsynced[id];
        if (Number.isFinite(Number(result?.attempts))) records[id].attempts = Math.max(0, Number(result.attempts));
      }
      saveLocal();
      if (review && Number.isFinite(Number(result?.points)) && Number(result.points) > 0) {
        lastAward = '서버가 확인한 카드 학습 보상: +' + Number(result.points) + ' 포인트';
        sayStatus(lastAward, 'correct'); showReward('학습 포인트', currentProgress(), Number(result.points));
      } else sayStatus(review ? '학습 상태 계정 저장 완료' : '암기·별표 상태 계정 저장 완료');
      renderSync();
      if (typeof options.onSync === 'function') Promise.resolve().then(() => options.onSync(result)).catch(() => {});
    }
    function saveFailure() {
      if (destroyed) return;
      source = 'local';
      sayStatus(localOK ? '계정 저장 실패 · 이 브라우저 임시 보관 · 저장 재시도' : '계정·브라우저 저장 실패 · 현재 화면 상태만 유지', 'error');
      renderSync();
    }
    function record(id, change, review = false) {
      const old = progressFor(id);
      records[id] = { ...old, ...change, attempts: old.attempts + (review ? 1 : 0) };
      locallyChanged.add(id);
      if (account) unsynced[id] = { known: records[id].known, starred: records[id].starred, revision: ++changeRevision };
      saveLocal();
      if (!account) { sayStatus(localOK ? '학습 상태 이 기기 저장 완료' : '브라우저 저장 실패 · 현재 화면 상태만 유지', localOK ? '' : 'error'); return; }
      if (typeof options.api !== 'function') { saveFailure(); return; }
      const snapshot = { ...unsynced[id] };
      pending = pending.then(() => writeCard(id, snapshot, review)).catch(saveFailure);
    }
    function retrySaves() {
      if (!account || retrying || typeof options.api !== 'function' || !Object.keys(unsynced).length) return;
      retrying = true; renderSync();
      pending = pending.then(async () => {
        for (const id of Object.keys(unsynced)) {
          if (destroyed) break;
          const snapshot = { ...unsynced[id] };
          try { await writeCard(id, snapshot, false); }
          catch (_) { saveFailure(); }
        }
        if (!destroyed && !Object.keys(unsynced).length) sayStatus('암기·별표 상태 재저장 완료 · 학습 보상 재지급 없음');
      }).finally(() => { retrying = false; if (!destroyed) renderSync(); });
    }
    async function completeActivity(activityMode, ids, correct, startedAt, marker) {
      if (marker.sent || marker.saving) return;
      if (!marker.payload) marker.payload = Object.freeze({ mode: activityMode, cardIds: Object.freeze([...ids]), correct, total: ids.length, seconds: elapsed(startedAt) });
      const payload = marker.payload;
      marker.reward = '연습 완료 · 연습점수 ' + payload.correct + ' / ' + payload.total;
      if (typeof options.onActivity !== 'function') { marker.sent = true; render(); return; }
      marker.saving = true; marker.reward = '완료 기록 저장 중'; render();
      try {
        const result = await options.onActivity({ ...payload, cardIds: [...payload.cardIds] });
        if (destroyed) return;
        if (result?.saveFailed || result?.deferred || result?.rewardUnavailable) throw new Error('Completion save unavailable.');
        marker.sent = true; marker.saveFailed = false;
        marker.reward = result && Number.isFinite(Number(result.points)) && Number(result.points) > 0 && result.awarded !== false ? '서버 확인 완료 · +' + Number(result.points) + ' 포인트' : '연습 완료 · 연습점수 ' + payload.correct + ' / ' + payload.total;
        if (result?.awarded !== false && Number(result?.points) > 0) showReward('게임 포인트', currentProgress(), Number(result.points));
      } catch (_) { if (!destroyed) { marker.saveFailed = true; marker.reward = '완료 기록 저장 실패 · 저장 재시도 필요'; } }
      finally { marker.saving = false; if (!destroyed) render(); }
    }
    function completionRetry(marker) {
      return marker.saveFailed || marker.saving ? '<button type="button" class="fc-button fc-primary" data-fc-action="retry-completion" ' + (marker.saving ? 'disabled' : '') + '>' + (marker.saving ? '완료 기록 저장 중' : '완료 기록 저장 재시도') + '</button>' : '';
    }
    function initializeMode() {
      stopTimer(); stopVoice(); flipped = false;
      cardRun = { queue: [...order], reviewed: new Map(), startedAt: 0, sent: false, reward: '' };
      game = { queue: [...order], index: 0, score: 0, completed: false, sent: false, reward: '', startedAt: 0, answers: [], firstAnswers: new Map(), attempts: 0,
        answered: false, passed: false, firstResult: null, input: '', hint: false, feedback: '', choices: [], fallback: false,
        reviewed: new Set(), solvedIds: new Set(), missed: new Set(), roundIds: [], enOrder: [], koOrder: [], selectedEn: null, selectedKo: null, wrong: [], moves: 0, rounds: 0 };
      if (mode === 'match') prepareMatchRound();
      else if (mode === 'learn' || mode === 'write') prepareQuestion();
    }
    function prepareQuestion() {
      if (!game || !game.queue.length) return;
      const target = findCard(game.queue[game.index]);
      if (!target) return;
      game.answered = false; game.passed = false; game.firstResult = null; game.input = ''; game.hint = false; game.feedback = '';
      const distinct = [...new Map(selection().filter(card => card.ko !== target.ko).map(card => [card.ko, card])).values()];
      game.fallback = mode === 'learn' && distinct.length < 2;
      game.choices = shuffled([{ id: target.id, text: target.ko }, ...shuffled(distinct).slice(0, 3).map(card => ({ id: card.id, text: card.ko }))]);
    }
    function prepareMatchRound() {
      if (!game) return;
      const en = new Set(), ko = new Set();
      game.roundIds = [];
      for (const id of game.queue) {
        if (game.reviewed.has(id)) continue;
        const card = findCard(id); if (!card || en.has(normal(card.en)) || ko.has(card.ko)) continue;
        game.roundIds.push(id); en.add(normal(card.en)); ko.add(card.ko);
        if (game.roundIds.length === 6) break;
      }
      game.enOrder = shuffled(game.roundIds); game.koOrder = shuffled(game.roundIds);
      game.selectedEn = null; game.selectedKo = null; game.wrong = []; game.feedback = ''; game.rounds++;
    }
    function renderChrome() {
      summary();
      root.dataset.collection = collection;
      $('.fc-title').textContent = COLLECTIONS[collection];
      $('.fc-total-badge').textContent = '영단어 ' + sharedSummary.collections.words.total + ' · 문장 ' + sharedSummary.collections.speaking.total;
      root.querySelectorAll('.fc-collection').forEach(button => {
        const selected = button.dataset.fcCollection === collection;
        button.setAttribute('aria-selected', selected ? 'true' : 'false'); button.classList.toggle('is-active', selected);
        button.querySelector('b').textContent = sharedSummary.collections[button.dataset.fcCollection].total;
      });
      deckSelect.innerHTML = '<option value="all">전체 단어장 · ' + collectionCards().length + '개</option>' + sharedDecks.map(deck => '<option value="' + esc(deck.id) + '">' + esc(deck.title) + ' · ' + collectionCards([deck]).length + '개</option>').join('');
      deckSelect.value = deckId;
      const available = collectionCards(deckId === 'all' ? sharedDecks : sharedDecks.filter(deck => deck.id === deckId));
      $('.fc-day').innerHTML = '<option value="all">전체 일차</option>' + Array.from({length:7},(_,index) => '<option value="' + (index + 1) + '">Day ' + (index + 1) + ' · ' + available.filter(card => card.studyDay === index + 1).length + '개</option>').join('');
      $('.fc-day').value = studyDay;
      if ($('.fc-search').value !== query) $('.fc-search').value = query;
      root.querySelectorAll('[data-fc-status]').forEach(button => button.setAttribute('aria-pressed', button.dataset.fcStatus === reviewState ? 'true' : 'false'));
      $('.fc-star-filter').setAttribute('aria-pressed', starredOnly ? 'true' : 'false');
      $('.fc-star-filter').textContent = starredOnly ? '★ 별표 카드' : '☆ 별표만';
      root.querySelectorAll('.fc-mode').forEach(button => { const selected = button.dataset.fcMode === mode; button.setAttribute('aria-selected', selected ? 'true' : 'false'); button.classList.toggle('is-active', selected); });
      const selected = selection(), known = selected.filter(card => progressFor(card.id).known).length;
      $('.fc-stat-strip').innerHTML = '<span><b>' + selected.length + '</b> 선택한 카드</span><span><b>' + known + '</b> 암기 완료</span><span><b>' + (selected.length - known) + '</b> 배우는 중</span><button type="button" data-fc-action="shuffle" class="fc-text-button">⤨ 순서 섞기</button>';
      renderSync();
    }
    function renderList() {
      const cards = selection();
      $('.fc-list-title').textContent = collection === 'words' ? '영단어 목록' : '말하기 문장 목록';
      $('.fc-list-count').textContent = cards.length + '개 모두 보기';
      $('.fc-table tbody').innerHTML = cards.length ? cards.map(card => {
        const state = progressFor(card.id);
        return '<tr class="' + (card.id === currentId && mode === 'cards' ? 'is-current' : '') + '"><td><button type="button" class="fc-list-star' + (state.starred ? ' is-starred' : '') + '" data-fc-action="star" data-fc-id="' + esc(card.id) + '" aria-label="' + esc(card.en) + ' 별표 ' + (state.starred ? '해제' : '추가') + '" aria-pressed="' + (state.starred ? 'true' : 'false') + '">' + (state.starred ? '★' : '☆') + '</button></td><td><button type="button" class="fc-open-card" data-fc-action="open-card" data-fc-id="' + esc(card.id) + '" lang="en">' + esc(card.en) + '</button><small class="fc-card-kind">' + esc(card.kind) + '</small></td><td>' + esc(card.ko) + '</td><td><span class="fc-state-tag' + (state.known ? ' is-known' : '') + '">' + (state.known ? '암기 완료' : state.attempts ? '배우는 중' : '미학습') + '</span></td><td><button type="button" class="fc-icon-button" data-fc-action="listen" data-fc-id="' + esc(card.id) + '" aria-label="' + esc(card.en) + ' 듣기" ' + (typeof options.say === 'function' ? '' : 'disabled') + '>◖</button></td></tr>';
      }).join('') : '<tr><td colspan="5" class="fc-table-empty">검색 결과 없음 · 검색어·별표 필터 변경</td></tr>';
    }
    function emptyHTML() { return '<div class="fc-empty"><h3>' + COLLECTIONS[collection] + ' · 선택 카드 없음</h3><p>단어장·일차·검색어·별표 필터 확인</p></div>'; }
    function renderCards() {
      const card = findCard(currentId); if (!card) { body.innerHTML = emptyHTML(); return; }
      const state = progressFor(card.id), index = order.indexOf(card.id);
      const completedCount = cardRun.reviewed.size;
      body.innerHTML = '<div class="fc-card-topline"><span>카드 <b>' + (index + 1) + ' / ' + order.length + '</b></span><div><button type="button" class="fc-icon-button' + (state.starred ? ' is-starred' : '') + '" data-fc-action="star" data-fc-id="' + esc(card.id) + '" aria-label="별표 ' + (state.starred ? '해제' : '추가') + '" aria-pressed="' + (state.starred ? 'true' : 'false') + '">' + (state.starred ? '★' : '☆') + '</button><button type="button" class="fc-icon-button" data-fc-action="listen" data-fc-id="' + esc(card.id) + '" aria-label="영어 듣기" ' + (typeof options.say === 'function' ? '' : 'disabled') + '>◖</button></div></div>' +
        '<div class="fc-maincard' + (flipped ? ' is-flipped' : '') + '" role="button" tabindex="0" data-fc-action="flip" aria-label="' + esc((flipped ? card.ko + '. 다시 눌러 영어 보기' : card.en + '. 눌러 뜻 보기')) + '"><span class="fc-side-label">' + (flipped ? 'MEANING' : 'ENGLISH') + '</span><p class="fc-card-word" ' + (flipped ? '' : 'lang="en"') + '>' + esc(flipped ? card.ko : card.en) + '</p>' + (flipped && card.note ? '<p class="fc-card-note">' + esc(card.note) + '</p>' : '') + (flipped && card.example ? '<p class="fc-example">' + esc(card.example) + '</p>' : '') + '<span class="fc-flip-hint">↻ ' + (flipped ? '영어로 돌아가기' : '눌러서 뜻 보기') + '<small>Enter / Space</small></span></div>' +
        '<div class="fc-navigation"><button type="button" class="fc-button fc-secondary" data-fc-action="prev" aria-label="이전 카드">← 이전</button><span class="fc-key-hint">← → 키로 이동</span><button type="button" class="fc-button fc-secondary" data-fc-action="next-card" aria-label="다음 카드">다음 →</button></div>' +
        '<div class="fc-judgment"><button type="button" class="fc-button fc-again" data-fc-action="again">↺ 배우는 중</button><button type="button" class="fc-button fc-known" data-fc-action="known">✓ 암기 완료</button></div><div class="fc-run-progress"><span>이번 연습 ' + completedCount + ' / ' + cardRun.queue.length + '장 확인</span><progress max="' + cardRun.queue.length + '" value="' + completedCount + '" aria-label="이번 연습에서 확인한 카드"></progress></div>' +
        (cardRun.reward ? '<p class="fc-reward" role="status">' + esc(cardRun.reward) + '</p>' : '') + completionRetry(cardRun) + (cardRun.sent && [...cardRun.reviewed.values()].some(value => !value) ? '<div class="fc-relearn-row"><button type="button" class="fc-button fc-secondary" data-fc-action="retry-again">배우는 중 카드 다시 학습</button></div>' : '') + chapterButton();
    }
    function chapterButton() {
      const deck = sharedDecks.find(item => item.id === deckId);
      return deck?.chapterId && typeof options.onOpenChapter === 'function' ? '<button type="button" class="fc-chapter-link" data-fc-action="chapter">이 단원의 20분 수업 열기 ↗</button>' : '';
    }
    function renderWriting(target, fallback) {
      return (fallback ? '<p class="fc-fallback">서로 다른 뜻의 보기 3개 미만 · 쓰기 모드 적용</p>' : '') +
        '<p class="fc-question-label">한국어 뜻에 맞는 영어 입력</p><h3 class="fc-writing-prompt">' + esc(target.ko) + '</h3><label class="fc-answer-label">영어 답변<input class="fc-write-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="영어 입력" value="' + esc(game.input) + '" ' + (game.passed ? 'disabled' : '') + '></label><p class="fc-grading-note">대소문자·띄어쓰기·문장부호 채점 제외</p><div class="fc-write-actions"><button type="button" class="fc-button fc-secondary" data-fc-action="hint" ' + (game.passed ? 'disabled' : '') + '>첫 단어 힌트</button><button type="button" class="fc-button fc-primary" data-fc-action="check-write" ' + (game.passed ? 'disabled' : '') + '>' + (game.passed ? '✓ 정답 확인' : '답 확인하기') + '</button></div>' +
        (game.hint ? '<p class="fc-hint">첫 단어: <b lang="en">' + esc(target.en.split(/\s+/)[0]) + '</b> · 총 ' + target.en.split(/\s+/).length + '개 단어</p>' : '') +
        (game.passed ? '<div class="fc-answer-reveal"><b lang="en">' + esc(target.en) + '</b><p>' + esc(target.note) + '</p><button type="button" class="fc-text-button" data-fc-action="listen" data-fc-id="' + esc(target.id) + '" ' + (typeof options.say === 'function' ? '' : 'disabled') + '>◖ 정답 듣기</button></div>' : '');
    }
    function renderQuestion() {
      if (game.completed) { renderCompletion(); return; }
      const target = findCard(game.queue[game.index]); if (!target) { body.innerHTML = emptyHTML(); return; }
      const writing = mode === 'write' || game.fallback;
      body.innerHTML = '<div class="fc-game-topline"><span>' + (mode === 'write' ? '쓰기' : '학습') + ' · ' + (game.index + 1) + ' / ' + game.queue.length + '</span><span>연습점수 ' + game.score + ' / ' + game.queue.length + '</span></div><progress class="fc-game-progress" max="' + game.queue.length + '" value="' + game.index + '" aria-label="완료한 문제"></progress>' +
        (writing ? renderWriting(target, game.fallback) : '<p class="fc-question-label">알맞은 뜻 선택</p><h3 class="fc-learn-prompt" lang="en">' + esc(target.en) + '</h3><button type="button" class="fc-text-button fc-prompt-audio" data-fc-action="listen" data-fc-id="' + esc(target.id) + '" ' + (typeof options.say === 'function' ? '' : 'disabled') + '>◖ 영어 듣기</button><div class="fc-choice-grid">' + game.choices.map((choice, index) => '<button type="button" class="fc-choice' + (game.answered && choice.text === target.ko ? ' is-correct' : game.answered && game.chosen === index ? ' is-wrong' : '') + '" data-fc-action="learn-answer" data-fc-choice="' + index + '" ' + (game.answered ? 'disabled' : '') + '><span>' + ['A','B','C','D'][index] + '</span>' + esc(choice.text) + (game.answered && choice.text === target.ko ? '<b>✓</b>' : '') + '</button>').join('') + '</div>' + (game.answered ? '<div class="fc-answer-reveal"><b>' + esc(target.ko) + '</b><p>' + esc(target.note) + '</p></div>' : '')) +
        (game.feedback ? '<p class="fc-game-feedback' + ((writing ? game.passed : game.firstResult) ? ' is-correct' : '') + '" role="status">' + esc(game.feedback) + '</p>' : '') + '<div class="fc-game-footer"><p>최초 답변 기준 연습점수' + (writing ? ' · 오답 시 정답 입력 후 진행' : '') + '</p><button type="button" class="fc-button fc-primary" data-fc-action="next-question" ' + ((writing ? game.passed : game.answered) ? '' : 'disabled') + '>' + (game.index === game.queue.length - 1 ? '연습 결과 보기' : '다음 문제 →') + '</button></div>';
    }
    function renderMatch() {
      if (game.completed) { renderCompletion(); return; }
      if (!game.roundIds.length) { body.innerHTML = emptyHTML(); return; }
      const done = game.roundIds.every(id => game.reviewed.has(id));
      const column = (ids, side) => '<div class="fc-match-column" aria-label="' + (side === 'en' ? '영어 카드' : '한국어 뜻 카드') + '">' + ids.map(id => {
        const card = findCard(id), matched = game.reviewed.has(id), selected = game[side === 'en' ? 'selectedEn' : 'selectedKo'] === id;
        return '<button type="button" class="fc-match-tile' + (matched ? ' is-matched' : selected ? ' is-selected' : game.wrong.includes(id) ? ' is-mismatch' : '') + '" data-fc-action="match" data-fc-side="' + side + '" data-fc-id="' + esc(id) + '" ' + (side === 'en' ? 'lang="en" ' : '') + 'aria-pressed="' + (selected ? 'true' : 'false') + '" ' + (matched ? 'disabled' : '') + '>' + (matched ? '<span aria-hidden="true">✓ </span>' : '') + esc(card?.[side] || '') + '</button>';
      }).join('') + '</div>';
      body.innerHTML = '<div class="fc-game-topline"><span>맞추기 · ROUND ' + game.rounds + '</span><span class="fc-match-clock">◷ <b data-fc-timer>' + timeLabel(elapsed(game.startedAt)) + '</b></span></div><div class="fc-match-stats"><span><b>' + game.reviewed.size + ' / ' + game.queue.length + '</b>쌍 완성</span><span><b>' + game.moves + '</b>번 시도</span><span>실수 없이 <b>' + game.score + '</b>쌍</span></div><p class="fc-question-label">영어·한국어 카드의 짝 선택</p><div class="fc-match-board">' + column(game.enOrder, 'en') + column(game.koOrder, 'ko') + '</div><p class="fc-game-feedback' + (done ? ' is-correct' : '') + '" role="status">' + esc(game.feedback || '전체 정답 후 다음 묶음 진행 · 첫 카드 선택 시 타이머 시작') + '</p><div class="fc-game-footer"><p>같은 뜻의 카드는 다른 묶음으로 분리</p><button type="button" class="fc-button fc-primary" data-fc-action="next-match" ' + (done ? '' : 'disabled') + '>' + (game.reviewed.size === game.queue.length ? '연습 결과 보기' : '다음 묶음 →') + '</button></div>';
    }
    function renderCompletion() {
      const wrongCount = game.queue.filter(id => game.firstAnswers.get(id) !== true).length;
      body.innerHTML = '<div class="fc-completion"><p class="fc-eyebrow">학습 결과</p><h3>' + game.queue.length + '개 카드 학습 완료</h3><p class="fc-complete-score">연습점수 ' + game.score + ' / ' + game.queue.length + '</p><p>' + (mode === 'match' ? '첫 시도 정답 수 · ' + game.moves + '회 시도 · ' + timeLabel(game.finishedSeconds ?? elapsed(game.startedAt)) + ' 학습' : '최초 답변 정답 카드 수 · 오답 ' + wrongCount + '개') + '</p><p class="fc-reward" role="status">' + esc(game.reward || '연습점수·랭킹 포인트 별도 계산') + '</p><div class="fc-completion-actions">' + completionRetry(game) + (wrongCount ? '<button type="button" class="fc-button fc-primary" data-fc-action="retry-wrong">오답 ' + wrongCount + '개 다시 학습</button>' : '') + '<button type="button" class="fc-button fc-secondary" data-fc-action="restart">전체 다시 학습</button><button type="button" class="fc-button fc-secondary" data-fc-action="mode" data-fc-mode="cards">카드</button></div></div>';
    }
    function render() {
      if (destroyed) return;
      renderChrome();
      if (!order.length) body.innerHTML = emptyHTML();
      else if (mode === 'cards') renderCards();
      else if (mode === 'match') renderMatch();
      else renderQuestion();
      renderList();
    }
    function resetSelection(message) { ensureOrder(); initializeMode(); render(); if (message) sayStatus(message); saveLocal(); }
    function switchCollection(next) {
      if (!COLLECTIONS[next] || next === collection) return;
      saveLocal();
      collection = next;
      const preferences = collectionSettings[next] || {};
      deckId = String(preferences.deckId || 'all');
      if (deckId !== 'all' && !sharedDecks.some(deck => deck.id === deckId)) deckId = 'all';
      starredOnly = preferences.starredOnly === true; query = String(preferences.query || '');
      mode = ['cards','learn','write','match'].includes(preferences.mode) ? preferences.mode : 'cards';
      studyDay = /^[1-7]$/.test(String(preferences.studyDay)) ? String(preferences.studyDay) : 'all';
      reviewState = ['learning','known'].includes(preferences.reviewState) ? preferences.reviewState : 'all';
      currentId = preferences.currentId ? String(preferences.currentId) : null; order = [];
      resetSelection(COLLECTIONS[collection] + ' 선택');
    }
    function relearn(ids, nextMode = mode) {
      const allowed = new Set(order), queue = [...new Set(ids)].filter(id => allowed.has(id));
      if (!queue.length) return;
      mode = nextMode; initializeMode(); game.queue = queue; game.reviewOnly = true;
      if (mode === 'match') { game.rounds = 0; prepareMatchRound(); } else prepareQuestion();
      render(); sayStatus(queue.length + '개 카드 다시 학습'); saveLocal();
    }
    function moveCard(direction) {
      if (!order.length) return;
      stopVoice();
      const index = Math.max(0, order.indexOf(currentId)); currentId = order[(index + direction + order.length) % order.length]; flipped = false; render();
      sayStatus((order.indexOf(currentId) + 1) + '번째 카드'); saveLocal();
    }
    function markCard(known) {
      if (!currentId) return;
      const previousProgress = currentProgress();
      beginTimer(cardRun); const id = currentId;
      record(id, { known }, true); cardRun.reviewed.set(id, known);
      if (reviewState !== 'all') ensureOrder();
      const remaining = order.filter(cardId => !cardRun.reviewed.has(cardId));
      if (remaining.length) currentId = remaining[0];
      if (!cardRun.sent && cardRun.queue.every(cardId => cardRun.reviewed.has(cardId))) completeActivity('flashcards', cardRun.queue, [...cardRun.reviewed.values()].filter(Boolean).length, cardRun.startedAt, cardRun);
      flipped = false; render(); sayStatus(known ? '암기 완료로 표시' : '배우는 중으로 표시'); saveLocal();
      if (known) showReward('암기 완료', previousProgress);
    }
    function submitWrite() {
      if (!game || game.completed || game.passed) return;
      const target = findCard(game.queue[game.index]); if (!target) return;
      const text = $('.fc-write-input')?.value ?? game.input;
      game.input = text;
      if (!normal(text)) { sayStatus('영어 입력 필요'); return; }
      const previousProgress = currentProgress();
      beginTimer(game); game.attempts++;
      const correct = normal(text) === normal(target.en);
      if (game.firstResult === null) { game.firstResult = correct; game.firstAnswers.set(target.id, correct); if (correct) game.score++; }
      record(target.id, { known: correct }, true);
      game.passed = correct; game.answered = true;
      if (correct) game.solvedIds.add(target.id);
      game.feedback = correct ? '정답 · 확인 후 다음 카드 진행' : '오답 · 첫 단어 힌트 확인 후 재입력';
      render(); sayStatus(game.feedback, correct ? 'correct' : 'retry');
      if (correct) showReward('정답', previousProgress);
      if (!correct) $('.fc-write-input')?.focus();
    }
    function nextQuestion() {
      if (!game || game.completed) return;
      const writing = mode === 'write' || game.fallback;
      if (!(writing ? game.passed : game.answered)) return;
      stopVoice();
      game.answers.push(game.firstResult === true);
      if (game.index + 1 === game.queue.length) {
        game.completed = true; game.finishedSeconds = elapsed(game.startedAt); stopTimer(); render();
        completeActivity(mode === 'write' ? 'write' : 'flashcards', game.queue, game.score, game.startedAt, game);
      } else { game.index++; prepareQuestion(); render(); sayStatus('다음 카드'); if (mode === 'write' || game.fallback) $('.fc-write-input')?.focus(); }
    }
    function matchCard(id, side) {
      if (!game || game.completed || !game.roundIds.includes(id) || game.reviewed.has(id) || !['en','ko'].includes(side)) return;
      const previousProgress = currentProgress(); let correctMatch = false;
      beginTimer(game); game.wrong = [];
      const key = side === 'en' ? 'selectedEn' : 'selectedKo'; game[key] = game[key] === id ? null : id;
      if (game.selectedEn && game.selectedKo) {
        const left = game.selectedEn, right = game.selectedKo; game.moves++;
        if (left === right) {
          correctMatch = true;
          game.reviewed.add(left); game.firstAnswers.set(left, !game.missed.has(left)); if (!game.missed.has(left)) game.score++;
          record(left, { known: true }, true);
          game.feedback = game.roundIds.every(cardId => game.reviewed.has(cardId)) ? '묶음 전체 정답 · 다음 진행 가능' : '정답 · 다음 짝 선택';
        } else {
          game.missed.add(left); game.missed.add(right); game.wrong = [left, right];
          record(left, { known: false }, true); record(right, { known: false }, true);
          game.feedback = '오답 · 영어·한국어 뜻 확인 후 재선택';
        }
        game.selectedEn = null; game.selectedKo = null;
      }
      render(); sayStatus(game.feedback || '반대편 짝 선택');
      if (correctMatch) showReward('정답', previousProgress);
    }
    function handleClick(event) {
      const control = event.target.closest?.('[data-fc-action]');
      if (destroyed || !control || !root.contains(control) || control.disabled) return;
      const action = control.dataset.fcAction, id = control.dataset.fcId;
      if (action === 'retry-save') { retrySaves(); }
      else if (action === 'retry-completion') {
        const marker = mode === 'cards' ? cardRun : game;
        if (marker?.saveFailed && marker.payload) completeActivity(marker.payload.mode, marker.payload.cardIds, marker.payload.correct, 0, marker);
      }
      else if (action === 'collection') { switchCollection(control.dataset.fcCollection); }
      else if (action === 'status-filter') {
        if (!['all','learning','known'].includes(control.dataset.fcStatus)) return;
        reviewState = control.dataset.fcStatus; order = []; resetSelection('암기 상태 필터 변경');
      } else if (action === 'mode') {
        if (!['cards','learn','write','match'].includes(control.dataset.fcMode)) return;
        stopVoice(); mode = control.dataset.fcMode; initializeMode(); render(); sayStatus(control.textContent.trim() + ' 모드 선택'); saveLocal();
      } else if (action === 'flip') {
        beginTimer(cardRun); flipped = !flipped; renderCards(); sayStatus(flipped ? findCard(currentId)?.ko || '' : findCard(currentId)?.en || ''); $('.fc-maincard')?.focus();
      } else if (action === 'prev') moveCard(-1);
      else if (action === 'next-card') moveCard(1);
      else if (action === 'known') markCard(true);
      else if (action === 'again') markCard(false);
      else if (action === 'star' && order.includes(id)) {
        record(id, { starred: !progressFor(id).starred });
        if (starredOnly) resetSelection('별표 목록 갱신 완료'); else { render(); sayStatus(progressFor(id).starred ? '별표 추가' : '별표 해제'); }
      } else if (action === 'star-filter') { starredOnly = !starredOnly; order = []; resetSelection(starredOnly ? '별표 카드만 표시' : '전체 카드 표시'); }
      else if (action === 'shuffle') { order = shuffled(order); initializeMode(); render(); sayStatus('선택 카드 순서 변경'); }
      else if (action === 'open-card' && order.includes(id)) { mode = 'cards'; currentId = id; initializeMode(); render(); $('.fc-maincard')?.focus(); saveLocal(); }
      else if (action === 'listen' && order.includes(id) && typeof options.say === 'function') {
        stopVoice(); Promise.resolve().then(() => { if (!destroyed) return options.say(findCard(id)?.en || ''); }).then(ok => { if (!destroyed && ok === false) sayStatus('음성 재생 불가 · 듣기 설정·브라우저 확인'); }).catch(() => { if (!destroyed) sayStatus('음성 재생 실패 · 기기 음량·듣기 설정 확인'); });
      } else if (action === 'learn-answer' && mode === 'learn' && !game.fallback && !game.answered && !game.completed) {
        const index = Number(control.dataset.fcChoice), choice = game.choices[index], target = findCard(game.queue[game.index]); if (!choice || !target) return;
        const previousProgress = currentProgress();
        beginTimer(game); const correct = choice.text === target.ko;
        game.chosen = index; game.answered = true; game.firstResult = correct; game.firstAnswers.set(target.id, correct); if (correct) game.score++;
        record(target.id, { known: correct }, true); game.feedback = correct ? '정답 · 뜻·설명 확인' : '오답 · 정답 확인 · 최초 답변 기준 점수';
        render(); sayStatus(game.feedback, correct ? 'correct' : 'retry');
        if (correct) showReward('정답', previousProgress);
      } else if (action === 'hint' && game && !game.passed) { game.hint = true; render(); sayStatus('첫 단어 힌트 표시'); $('.fc-write-input')?.focus(); }
      else if (action === 'check-write') submitWrite();
      else if (action === 'next-question') nextQuestion();
      else if (action === 'match') matchCard(id, control.dataset.fcSide);
      else if (action === 'next-match' && game && game.roundIds.every(cardId => game.reviewed.has(cardId))) {
        if (game.reviewed.size === game.queue.length) { game.completed = true; game.finishedSeconds = elapsed(game.startedAt); stopTimer(); render(); completeActivity('match', game.queue, game.score, game.startedAt, game); }
        else { prepareMatchRound(); render(); sayStatus('다음 카드 묶음'); }
      } else if (action === 'restart') { initializeMode(); render(); sayStatus('동일 카드로 새 학습 시작'); }
      else if (action === 'retry-wrong' && game?.completed) { relearn(game.queue.filter(cardId => game.firstAnswers.get(cardId) !== true)); }
      else if (action === 'retry-again' && mode === 'cards') { relearn([...cardRun.reviewed].filter(([,known]) => !known).map(([cardId]) => cardId), 'learn'); }
      else if (action === 'chapter') { const deck = sharedDecks.find(item => item.id === deckId); if (deck?.chapterId && typeof options.onOpenChapter === 'function') options.onOpenChapter(deck.chapterId); }
    }
    function handleInput(event) {
      if (event.target.matches('.fc-search')) { query = event.target.value; order = []; resetSelection(); }
      else if (event.target.matches('.fc-write-input') && game) game.input = event.target.value;
    }
    function handleChange(event) {
      if (event.target === deckSelect) { deckId = deckSelect.value; order = []; resetSelection('단어장 변경'); }
      else if (event.target.matches('.fc-day')) { studyDay = event.target.value; order = []; resetSelection('복습 일차 변경'); }
    }
    function handleKey(event) {
      if (event.target.matches('.fc-write-input') && event.key === 'Enter') { event.preventDefault(); submitWrite(); return; }
      if (event.target.closest?.('.fc-maincard')) {
        if (['Enter',' ','Spacebar'].includes(event.key)) { event.preventDefault(); flipped = !flipped; beginTimer(cardRun); renderCards(); sayStatus(flipped ? findCard(currentId)?.ko || '' : findCard(currentId)?.en || ''); $('.fc-maincard')?.focus(); }
        else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveCard(event.key === 'ArrowRight' ? 1 : -1); $('.fc-maincard')?.focus(); }
      }
    }
    function update(nextDecks) {
      if (destroyed) return { added: 0, removed: 0, total: sharedSummary.total };
      const before = new Set(uniqueCards(sharedDecks).map(card => card.id)), previousId = currentId;
      const oldTarget = game?.queue[game.index];
      sharedDecks = cleanDecks(nextDecks);
      if (deckId !== 'all' && !sharedDecks.some(deck => deck.id === deckId)) deckId = 'all';
      ensureOrder();
      if (order.includes(previousId)) currentId = previousId;
      if (game) {
        const ids = new Set(order), oldQueue = game.queue, wasCompleted = game.completed;
        game.queue = [...oldQueue.filter(id => ids.has(id)), ...(game.reviewOnly ? [] : order.filter(id => !oldQueue.includes(id)))];
        game.index = oldTarget && game.queue.includes(oldTarget) ? game.queue.indexOf(oldTarget) : Math.min(game.index, Math.max(0, game.queue.length - 1));
        game.reviewed = new Set([...game.reviewed].filter(id => ids.has(id)));
        game.solvedIds = new Set([...game.solvedIds].filter(id => ids.has(id)));
        game.firstAnswers = new Map([...game.firstAnswers].filter(([id]) => ids.has(id)));
        game.score = [...game.firstAnswers.values()].filter(Boolean).length;
        const categoryIds = new Set(collectionCards().map(card => card.id));
        cardRun.queue = [...cardRun.queue.filter(id => categoryIds.has(id)), ...order.filter(id => !cardRun.queue.includes(id))];
        const runIds = new Set(cardRun.queue);
        cardRun.reviewed = new Map([...cardRun.reviewed].filter(([id]) => runIds.has(id)));
        if (wasCompleted && game.queue.length > oldQueue.length) {
          game.completed = false; game.sent = false; game.reward = ''; game.finishedSeconds = undefined;
          if (mode !== 'match') game.index = Math.min(oldQueue.length, game.queue.length - 1);
          if (mode === 'match') prepareMatchRound(); else if (mode !== 'cards') prepareQuestion();
        }
        if (mode === 'match' && game.roundIds.some(id => !ids.has(id))) prepareMatchRound();
        if ((mode === 'learn' || mode === 'write') && oldTarget !== game.queue[game.index]) prepareQuestion();
        else if (mode === 'learn' && !game.answered) {
          const target = findCard(game.queue[game.index]);
          if (target) { const distinct = [...new Map(selection().filter(card => card.ko !== target.ko).map(card => [card.ko, card])).values()]; game.fallback = distinct.length < 2; game.choices = shuffled([{ id: target.id, text: target.ko }, ...shuffled(distinct).slice(0, 3).map(card => ({ id: card.id, text: card.ko }))]); }
        }
      }
      const after = new Set(uniqueCards(sharedDecks).map(card => card.id)), added = [...after].filter(id => !before.has(id)).length, removed = [...before].filter(id => !after.has(id)).length;
      render(); if (added) sayStatus('새 표현 ' + added + '개 추가 · 현재 카드 위치 유지');
      return { added, removed, total: after.size };
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true; stopTimer(); stopVoice();
      if (typeof clearTimeout === 'function') clearTimeout(popupTimer);
      root.removeEventListener('click', handleClick); root.removeEventListener('input', handleInput); root.removeEventListener('change', handleChange); root.removeEventListener('keydown', handleKey);
      root.remove(); if (active?.destroy === destroy) active = null;
    }
    root.addEventListener('click', handleClick); root.addEventListener('input', handleInput); root.addEventListener('change', handleChange); root.addEventListener('keydown', handleKey);
    if (deckId !== 'all' && !sharedDecks.some(deck => deck.id === deckId)) deckId = 'all';
    ensureOrder(); initializeMode(); render();
    active = { update, destroy, getSummary: summary };
    if (account && typeof options.api === 'function') {
      Promise.resolve().then(() => options.api('study/cards')).then(result => {
        if (destroyed) return;
        const incoming = new Map((result?.cards || []).filter(entry => entry?.cardId).map(entry => [String(entry.cardId), entry]));
        // An authenticated account is authoritative; browser-only guest records must not be presented as account records.
        if (result?.authenticated !== false) for (const card of uniqueCards(sharedDecks)) {
          if (locallyChanged.has(card.id) || unsynced[card.id]) continue;
          const entry = incoming.get(card.id);
          records[card.id] = { known: entry?.known === true || entry?.known === 1, starred: entry?.starred === true || entry?.starred === 1, attempts: Math.max(0, Number(entry?.attempts) || 0) };
        }
        source = result?.authenticated === false ? 'local' : 'server';
        const previousOrder = order.join('\u0000');
        ensureOrder();
        if (previousOrder !== order.join('\u0000')) initializeMode();
        saveLocal(); render();
      }).catch(() => { if (!destroyed) { source = 'local'; sayStatus('계정 기록 연결 실패 · 이 브라우저 기록 표시', 'error'); renderSync(); } });
    }
    return { update, destroy, getSummary: summary };
  }
  window.FlashcardStudy = {
    mount,
    update(decks) {
      if (active) return active.update(decks);
      const before = new Set(uniqueCards(sharedDecks).map(card => card.id)); sharedDecks = cleanDecks(decks);
      const after = new Set(uniqueCards(sharedDecks).map(card => card.id)); sharedSummary = countSummary(sharedDecks, readLocal().progress);
      return { added: [...after].filter(id => !before.has(id)).length, removed: [...before].filter(id => !after.has(id)).length, total: after.size };
    },
    getSummary(decks) { if (active) return active.getSummary(decks); if (decks) return countSummary(cleanDecks(decks), readLocal().progress); return { ...sharedSummary }; },
    destroy() { if (active) active.destroy(); }
  };
})();
