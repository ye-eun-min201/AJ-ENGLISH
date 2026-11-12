(function () {
  'use strict';
  let activeDestroy = null;
  const fallbackEsc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateKey = value => {
    if (!value) return '';
    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  };
  const todayKey = () => dateKey(Date.now());
  const cardHash = value => { let hash = 2166136261; for (const c of value) {hash ^= c.charCodeAt(0);hash = Math.imul(hash,16777619);} return (hash >>> 0).toString(36); };
  function icon(name) {
    const paths = {
      arrow:'M5 12h14m-5-5 5 5-5 5',book:'M12 6C8 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2Zm0 0v15',
      sound:'m11 5-6 4H2v6h3l6 4Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',check:'m5 12 4 4 10-10',star:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
      clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',play:'m8 5 11 7-11 7Z',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
      trophy:'M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8',mic:'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0Zm-3 7a6 6 0 0 0 12 0m-6 6v5m-4 0h8'
    };
    return '<svg class="ds-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (paths[name] || paths.spark) + '"/></svg>';
  }
  const leafArt = '<svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="70" fill="#e7ead4"/><path d="M45 98c-4-31 9-56 37-57 32 1 42 26 35 56-4 19-19 31-36 31-19 0-33-12-36-30Z" fill="#d8e6aa" stroke="#617a49" stroke-width="2.5"/><path d="M81 43c-4-19 6-27 21-26-1 15-7 25-21 26Z" fill="#8bb86a" stroke="#617a49" stroke-width="2"/><path d="M65 81v6m32-6v6m-25 14c6 6 14 6 20 0" fill="none" stroke="#617a49" stroke-width="3" stroke-linecap="round"/><circle cx="56" cy="96" r="6" fill="#e6b89d"/><circle cx="107" cy="96" r="6" fill="#e6b89d"/><path d="m33 68 6-2m85 45 6 3m-90 4-3 5" stroke="#aab998" stroke-width="3" stroke-linecap="round"/></svg>';

  function mount(app, ctx = {}) {
    if (!app) throw new Error('StudentDashboard requires a container.');
    if (activeDestroy) activeDestroy();
    const esc = ctx.esc || fallbackEsc;
    let state = ctx.state || {}, content = ctx.content || {}, destroyed = false, mvpTab = 'overall', mvpData = null;
    const today = todayKey(), month = today.slice(0, 7);
    let cardRequest = 0, mvpRequest = 0;
    function avatar(data, cls) { return typeof ctx.avatar === 'function' ? ctx.avatar(data, cls || '') : leafArt; }
    function prettyDate(value) { const key = dateKey(value); return key ? String(Number(key.slice(5,7))) + '.' + String(Number(key.slice(8,10))) : ''; }
    function expressionTime(e){return Math.max(0,...[e.publishAt,e.publishedAt,e.published_at,e.postedDate,e.publishDate,e.updatedAt,e.createdAt,e.created_at].map(value=>value?new Date(value).getTime():0).filter(Number.isFinite));}
    function expressionDate(e){return dateKey(expressionTime(e));}
    function dailyExpressions() {
      const all = Array.isArray(content.expressions) ? content.expressions.filter(e => e && e.en) : [];
      const current = all.filter(e => expressionDate(e) === today);
      if (current.length) return {items:current.sort((a,b)=>expressionTime(b)-expressionTime(a)).slice(0,3), fresh:true};
      const available = all.filter(e => !expressionDate(e) || expressionDate(e) <= today);
      const weekStart = dateKey(content.activeChapter?.weekStart);
      const dayOffset = weekStart ? Math.max(0, Math.floor((Date.parse(today + 'T00:00:00Z') - Date.parse(weekStart + 'T00:00:00Z')) / 86400000)) % 7 + 1 : (new Date(today + 'T00:00:00Z').getUTCDay() + 6) % 7 + 1;
      const recommended = available.filter(e => Number(e.studyDay) === dayOffset && (!content.activeChapter?.id || !e.chapterId || e.chapterId === content.activeChapter.id));
      return {items:(recommended.length ? recommended : available.sort((a,b)=>expressionTime(b)-expressionTime(a))).slice(0,3), fresh:false};
    }
    function allCards() {
      const cards = [], ids = new Set();
      (Array.isArray(content.decks) ? content.decks : []).forEach(deck => (Array.isArray(deck.cards) ? deck.cards : []).filter(card => card && String(card.en || '').trim() && String(card.ko || '').trim()).forEach(card => {
        const id = String(card.id || 'card-' + cardHash(String(card.en) + '|' + String(card.ko)));
        if (!ids.has(id)) { ids.add(id); cards.push({...card, cardId:id}); }
      }));
      return cards;
    }
    function nextLesson() {
      const days = Array.isArray(content.days) && content.days.length ? content.days : (window.BUSINESS_DAYS || []);
      const completed = new Set(state.progress?.completedDays || []);
      return days.find(day => !completed.has(day.chapterId ? 'business:' + day.chapterId + ':' + day.id : 'business:' + day.id)) || days[0] || {id:1,title:'말하기 학습'};
    }
    function calendar() {
      const base = new Date(today + 'T00:00:00Z');
      base.setUTCDate(base.getUTCDate() - (base.getUTCDay() + 6) % 7);
      const activities = state.progress?.activity || [];
      return Array.from({length:7}, (_, i) => {
        const d = new Date(base);d.setUTCDate(base.getUTCDate() + i);
        const key = d.toISOString().slice(0,10), done = activities.some(a => a.date === key && Number(a.seconds || a.points) > 0);
        return '<span class="ds-calendar-day' + (done?' done':'') + (key===today?' today':'') + '" aria-label="' + key + (done?' 학습 기록 있음':'') + '"><small>' + ['월','화','수','목','금','토','일'][i] + '</small><b>' + (done?'✓':d.getUTCDate()) + '</b></span>';
      }).join('');
    }
    function render() {
      const progress = state.progress || {}, user = state.user, chapter = content.activeChapter || null;
      const nickname = user?.nickname || '학습자', current = nextLesson(), daily = dailyExpressions();
      const todayRecord = (progress.activity || []).find(a => a.date === today), hasQuestTime = typeof todayRecord?.questSeconds === 'number' && Number.isFinite(todayRecord.questSeconds), unknownQuestTime = !!todayRecord && !hasQuestTime, seconds = hasQuestTime ? Math.max(0,todayRecord.questSeconds) : 0;
      const percent = Math.min(100,Math.round(seconds/1200*100)), studyXP = Number(progress.studyPoints ?? progress.points ?? 0), gameXP = Number(progress.gamePoints || 0);
      const chapters = (Array.isArray(content.chapters)?content.chapters:[]).slice().sort((a,b)=>Number(b.number||0)-Number(a.number||0)).slice(0,3);
      const bulletin = chapter?.body || chapter?.description || '';
      app.innerHTML = '<div class="student-dashboard">' +
        '<div class="ds-welcome"><div><p class="ds-eyebrow">LEARNING DASHBOARD</p><h2>' + esc(nickname) + '님의 학습 대시보드</h2><p>수업·표현·학습 기록</p></div><span class="ds-date-chip">' + esc(new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'long'}).format(new Date())) + '</span></div>' +
        (!state.authenticated?'<div class="ds-login-note"><span>' + icon('spark') + '수업·게임 바로 이용 가능 · 로그인 시 학습 기록 계정 저장</span><a href="/login?return_to=%2F" target="_top">로그인 ↗</a></div>':'') +
        '<section class="ds-week-banner"><div class="ds-banner-copy"><span class="ds-banner-label">' + (chapter?'CHAPTER ' + String(chapter.number || 1).padStart(2,'0'):'THIS WEEK’S CLASS') + '</span><h2>' + esc(chapter?.title || '이번 주 수업') + '</h2><p>' + (chapter?.weekStart?esc(prettyDate(chapter.weekStart)) + ' 시작 · ':'') + '주 1시간 수업 · 매일 20분 복습</p><div class="ds-banner-actions"><button class="ds-button navy" ' + (chapter?.id ? 'data-open-chapter="' + esc(chapter.id) + '"' : 'data-go="slides"') + '>이번 주 수업 자료 ' + icon('arrow') + '</button><button class="ds-text-link" data-go="quests">주간 수업 보기 ↗</button></div></div><div class="ds-banner-mascot">' + leafArt + '<span>WEEKLY<br><b>CLASS</b></span></div></section>' +
        '<div class="ds-stat-row"><article class="ds-stat"><span class="ds-stat-icon lavender">' + icon('book') + '</span><div><span>이번 달 학습 포인트</span><strong>' + studyXP + '<small> XP</small></strong></div></article><article class="ds-stat"><span class="ds-stat-icon peach">' + icon('play') + '</span><div><span>이번 달 게임 포인트</span><strong>' + gameXP + '<small> XP</small></strong></div></article><article class="ds-stat"><span class="ds-stat-icon mint">' + icon('clock') + '</span><div><span>연속 학습</span><strong>' + Number(progress.streak || 0) + '<small> 일</small></strong></div><span class="ds-stat-note">이번 달 ' + Number(progress.activeDays || 0) + '일 참여</span></article></div>' +
        '<div class="ds-layout"><div class="ds-main-column"><section class="ds-panel ds-expressions"><div class="ds-section-head"><div><p class="ds-eyebrow">TODAY’S EXPRESSIONS</p><h2>오늘의 표현</h2></div><span class="ds-badge' + (daily.fresh?' fresh':'') + '">' + (daily.fresh?'오늘 새로 등록':'수업 표현 복습') + '</span></div><div class="ds-expression-list">' + (daily.items.length?daily.items.map((e,i)=>'<article class="ds-expression"><span class="ds-expression-number">0' + (i+1) + '</span><div><h3 lang="en">' + esc(e.en) + '</h3><p>' + esc(e.ko || e.meaning || '') + '</p><small>' + (expressionDate(e)?esc(prettyDate(expressionDate(e))) + ' 등록 · ':'') + esc(e.category || e.cat || '비즈니스 영어') + '</small></div><button class="ds-listen" data-say="' + esc(e.en) + '" aria-label="' + esc(e.en) + ' 듣기">' + icon('sound') + '</button></article>').join(''):'<div class="ds-empty"><p>등록된 표현 없음</p><button class="ds-text-link" data-go="library">단어장 확인 ↗</button></div>') + '</div><button class="ds-bottom-link" data-go="library">단어장 ' + icon('arrow') + '</button></section>' +
          '<section class="ds-panel"><div class="ds-section-head"><div><p class="ds-eyebrow">ENGLISH GAMES</p><h2>영어 게임</h2></div><button class="ds-text-link" data-go="arcade">전체 게임 ↗</button></div><div class="ds-game-grid"><button class="ds-game game-purple" data-practice="arrange"><span class="ds-game-art">' + icon('book') + '<i>Aa</i></span><strong>문장 조립</strong><small>단어 순서 배열</small><span class="ds-game-arrow">↗</span></button><button class="ds-game game-peach" data-practice="listening"><span class="ds-game-art">' + icon('sound') + '<i>♪</i></span><strong>듣기 퀴즈</strong><small>음성 듣기 · 뜻 선택</small><span class="ds-game-arrow">↗</span></button><button class="ds-game game-mint" data-business-demo><span class="ds-game-art">' + icon('mic') + '<i>✦</i></span><strong>말하기 학습</strong><small>문장 인식 · 과일 수집</small><span class="ds-game-arrow">↗</span></button></div></section>' +
          '<section class="ds-panel ds-chapters"><div class="ds-section-head"><div><p class="ds-eyebrow">WEEKLY CLASSROOM</p><h2>수업 자료</h2></div><button class="ds-text-link" data-go="slides">수업 자료 ↗</button></div>' + (chapters.length?'<div class="ds-chapter-list">' + chapters.map(c=>'<button class="ds-chapter-row' + (c.id===chapter?.id?' active':'') + '" data-open-chapter="' + esc(c.id) + '"><span class="ds-chapter-number">' + String(c.number || '').padStart(2,'0') + '</span><span><strong>' + esc(c.title || '영어 수업') + '</strong><small>' + esc(c.weekStart?prettyDate(c.weekStart) + ' 시작':'주간 수업') + (c.pdf?.name?' · PDF 자료':'') + '</small></span><span class="ds-chapter-arrow">↗</span></button>').join('') + '</div>':'<div class="ds-empty"><p>등록된 주간 수업 없음</p></div>') + '</section></div>' +
          '<aside class="ds-side-column"><section class="ds-panel ds-daily-quest"><div class="ds-section-head"><div><p class="ds-eyebrow">DAILY LESSON</p><h2>20분 학습</h2></div><span class="ds-quest-symbol">' + icon('spark') + '</span></div><h3>' + esc(current.title || '말하기 학습') + '</h3><div class="ds-quest-progress"><span>오늘 기록된 학습</span><strong>' + (unknownQuestTime ? '수업 시간 집계 확인' : Math.floor(seconds/60) + ' / 20분') + '</strong></div><div class="ds-progress-track" role="progressbar" aria-label="오늘의 20분 학습 목표" aria-valuenow="' + Math.min(20,Math.floor(seconds/60)) + '" aria-valuemin="0" aria-valuemax="20"><span style="width:' + percent + '%"></span></div><p class="ds-quest-help">듣기 5분 · 말하기 5분 · 대화 7분 · 퀴즈 3분</p><button class="ds-button navy full" data-start="' + esc(current.id) + '">' + (state.activeSession?'학습 이어하기':'20분 학습 시작') + icon('arrow') + '</button><span class="ds-small-note">' + (unknownQuestTime ? '수업 시간 미제공 · 게임 시간은 목표에 미포함' : '수업 퀘스트 시간만 기록 · 하루 첫 완료 보상') + '</span></section>' +
            '<section class="ds-panel ds-review-panel"><span class="ds-review-icon">' + icon('book') + '</span><div><p class="ds-eyebrow">WORD STUDY</p><h2>단어 복습</h2><p id="ds-card-summary">전체 ' + allCards().length + '개의 수업 카드</p></div><button class="ds-button pale full" data-go="library">단어장 ' + icon('arrow') + '</button></section>' +
            '<section class="ds-panel ds-character-panel"><div class="ds-section-head"><h2>캐릭터</h2><span class="ds-badge">Lv. ' + Number(user?.level || 1) + '</span></div><div class="ds-character-stage">' + avatar(user?.avatar) + '<span class="ds-character-spark one">✦</span><span class="ds-character-spark two">✧</span></div><div class="ds-character-caption"><strong>' + esc(user?.nickname || '캐릭터 설정') + '</strong><span>' + Number(user?.coins || 0) + ' C 보유</span></div><button class="ds-button pale full" data-go="profile">캐릭터 꾸미기 ↗</button></section>' +
          '</aside></div>' +
        '<div class="ds-lower-layout"><section class="ds-panel ds-mvp-panel"><div class="ds-section-head"><div><p class="ds-eyebrow">MONTHLY MVP</p><h2>' + Number(month.slice(5)) + '월 우리 반 MVP</h2></div><button class="ds-text-link" data-go="rankings">전체 리그 ↗</button></div><div class="ds-mvp-tabs" role="tablist" aria-label="MVP 부문"><button data-dash-mvp="overall" role="tab" aria-selected="true" class="active">종합 MVP</button><button data-dash-mvp="study" role="tab" aria-selected="false">학습 MVP</button><button data-dash-mvp="game" role="tab" aria-selected="false">게임 MVP</button></div><div id="ds-mvp-rows" aria-live="polite"><p class="ds-muted">우리 반 기록 불러오는 중</p></div></section><section class="ds-panel ds-calendar-panel"><div class="ds-section-head"><div><p class="ds-eyebrow">AJ ENGLISH · LEARNING RECORD</p><h2>학습 기록</h2></div><span class="ds-calendar-flower">✳</span></div><div class="ds-calendar">' + calendar() + '</div><div class="ds-calendar-caption"><span>이번 달 <b>' + Number(progress.activeDays || 0) + '일</b> 학습</span><span>연속 <b>' + Number(progress.streak || 0) + '일</b></span></div><div class="ds-class-note"><span class="ds-note-dot"></span><div><strong>이번 주 수업 알림</strong><p>' + esc(bulletin ? String(bulletin).slice(0,190) + (String(bulletin).length>190?'…':'') : '등록된 수업 알림 없음') + '</p>' + (chapter?'<button class="ds-text-link" data-open-chapter="' + esc(chapter.id) + '">알림·자료 ↗</button>':'<button class="ds-text-link" data-go="slides">수업 자료 ↗</button>') + '</div></div></section></div>' +
        '<p class="ds-dashboard-footnote">수업·표현 자동 반영</p>' +
      '</div>';
      renderMvp();
      refreshCards();
    }
    function renderMvp() {
      const target = app.querySelector('#ds-mvp-rows'); if (!target || destroyed) return;
      if (!state.authenticated || !state.room) {
        target.innerHTML = '<div class="ds-mvp-empty"><span>' + icon('trophy') + '</span><p>반 연결 후 학습·게임·종합 MVP 확인 가능</p><button class="ds-button pale" data-room>우리 반 만들기 / 참여하기 ↗</button></div>';
        return;
      }
      if (!mvpData) { target.innerHTML = '<p class="ds-muted">우리 반 기록 불러오는 중</p>'; return; }
      if (mvpData.error) { target.innerHTML = '<div class="ds-empty"><p>' + esc(mvpData.error) + '</p><button class="ds-text-link" data-dash-retry>다시 불러오기 ↻</button></div>'; return; }
      const pointsFor = row => Number(row.categoryPoints ?? row.score ?? (mvpTab==='study'?row.studyPoints:mvpTab==='game'?row.gamePoints:row.points) ?? 0);
      const rows = (mvpData.categories?.[mvpTab] || []).filter(row => pointsFor(row) > 0).slice(0,3);
      target.innerHTML = rows.length ? '<div class="ds-mvp-list">' + rows.map((row,i)=>'<div class="ds-mvp-row"><span class="ds-rank rank-' + (i+1) + '">' + (row.rank || i+1) + '</span><span class="ds-mvp-avatar">' + avatar(row.avatar) + '</span><div><strong>' + esc(row.nickname || '학습자') + (row.isMe?'<small>나</small>':'') + '</strong><span>' + Number(row.activeDays || row.studyDays || 0) + '일 학습</span></div><b>' + Number(row.categoryPoints ?? row.score ?? (mvpTab==='study'?row.studyPoints:mvpTab==='game'?row.gamePoints:row.points) ?? 0) + '<small> XP</small></b></div>').join('') + '</div>' : '<div class="ds-empty"><p>이번 달 MVP 기록 없음 · 학습·게임 완료 시 반영</p></div>';
    }
    async function loadMvp() {
      const request = ++mvpRequest;
      if (!state.authenticated || !state.room || typeof ctx.api !== 'function') { renderMvp(); return; }
      try { const result = await ctx.api('mvp?month=' + month); if (destroyed || request !== mvpRequest) return; mvpData = result || {categories:{}}; renderMvp(); }
      catch(error) { if (!destroyed && request === mvpRequest) { mvpData = {error:error.message || '우리 반 기록 불러오기 실패'}; renderMvp(); } }
    }
    async function refreshCards() {
      const request = ++cardRequest, cards = allCards(), target = app.querySelector('#ds-card-summary');
      if (!target) return;
      const local = window.FlashcardStudy?.getSummary?.(content.decks || []);
      if (local?.loaded) target.textContent = '미학습 카드 ' + Number(local.remaining || 0) + '개' + (local.source==='local'?' · 이 기기 기준':'');
      if (!state.authenticated || typeof ctx.api !== 'function') return;
      try {
        const result = await ctx.api('study/cards');
        if (destroyed || request !== cardRequest || result.authenticated === false) return;
        const ids = new Set(cards.map(c=>String(c.cardId))), known = new Set((result.cards || []).filter(c=>c.known && ids.has(String(c.cardId))).map(c=>String(c.cardId)));
        const current = app.querySelector('#ds-card-summary'); if (current) current.textContent = '미학습 카드 ' + Math.max(0,cards.length-known.size) + '개 · 계정에 저장됨';
      } catch (_) { /* Keep the honest local/content count when account sync is unavailable. */ }
    }
    function handleClick(event) {
      const button = event.target.closest('button,a'); if (!button || !app.contains(button)) return;
      if (button.dataset.dashMvp) {
        event.stopPropagation();mvpTab=button.dataset.dashMvp;
        app.querySelectorAll('[data-dash-mvp]').forEach(tab=>{const selected=tab.dataset.dashMvp===mvpTab;tab.classList.toggle('active',selected);tab.setAttribute('aria-selected',String(selected));});renderMvp();return;
      }
      if (button.hasAttribute('data-dash-retry')) {event.stopPropagation();mvpData=null;renderMvp();loadMvp();return;}
      if (button.dataset.go && typeof ctx.navigate==='function') {event.stopPropagation();ctx.navigate(button.dataset.go);return;}
      if (button.dataset.start && typeof ctx.startLesson==='function') {event.stopPropagation();Promise.resolve(ctx.startLesson(Number(button.dataset.start))).catch(()=>{});return;}
      if (button.dataset.say && typeof ctx.say==='function') {event.stopPropagation();ctx.say(button.dataset.say);return;}
      if (button.hasAttribute('data-business-demo') && typeof ctx.businessDemo==='function') {event.stopPropagation();ctx.businessDemo();}
    }
    app.addEventListener('click',handleClick);
    function destroy() { if (destroyed) return;destroyed=true;cardRequest++;mvpRequest++;app.removeEventListener('click',handleClick);if(activeDestroy===destroy)activeDestroy=null; }
    activeDestroy=destroy;
    render();loadMvp();
    return {destroy, update(nextState,nextContent){if(destroyed)return;state=nextState||state;content=nextContent||content;render();loadMvp();}};
  }
  window.StudentDashboard={mount,destroy(){if(activeDestroy)activeDestroy();}};
})();
