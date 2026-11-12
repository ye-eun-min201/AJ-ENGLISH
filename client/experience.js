(function () {
  'use strict';

  let activeDestroy = null;

  const heroCrate = '<svg class="hero-crate-svg" viewBox="0 0 600 540" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><linearGradient id="arcadeWood" x1="130" y1="250" x2="420" y2="460" gradientUnits="userSpaceOnUse"><stop stop-color="#F6B166"/><stop offset="1" stop-color="#AF552F"/></linearGradient><linearGradient id="arcadeOrange" x1="220" y1="150" x2="260" y2="280" gradientUnits="userSpaceOnUse"><stop stop-color="#FFB43C"/><stop offset="1" stop-color="#F76A24"/></linearGradient></defs>' +
    '<ellipse cx="309" cy="453" rx="215" ry="34" fill="#050607" opacity=".5"/><ellipse cx="300" cy="285" rx="254" ry="174" stroke="#53564F" stroke-dasharray="3 13"/><ellipse cx="300" cy="285" rx="216" ry="137" stroke="#343B32"/>' +
    '<path d="m122 294 203-68 180 97-200 76-183-105Z" fill="#E7B47E"/><path d="m122 294 183 105v106L122 396V294Z" fill="url(#arcadeWood)"/><path d="m305 399 200-76v108l-200 74V399Z" fill="#8C472A"/>' +
    '<path d="m136 315 169 96m-169-62 169 97m-169-62 169 98" stroke="#773B24" stroke-width="7"/><path d="m320 409 171-65m-171 99 171-65m-171 99 171-65" stroke="#5C2E20" stroke-width="7"/>' +
    '<path d="m144 310 15 8v100l-15-9V310Zm125 72 15 9v102l-15-9V382Z" fill="#F2C48B"/><path d="m330 401 14-5v99l-14 5V401Zm137-52 14-5v98l-14 5V349Z" fill="#C5804C"/>' +
    '<path d="m139 294 186-62 159 88-179 67-166-93Z" fill="#392F23"/><path d="m153 293 170-53 144 80-161 58-153-85Z" fill="#5A4228"/>' +
    '<g transform="rotate(-14 239 250)"><path d="M240 199c-9-28-1-49 26-49-4 26-11 43-26 49Z" fill="#B3D465"/><path d="M239 204c-5-12-9-19-15-24" stroke="#745C3D" stroke-width="7" stroke-linecap="round"/><circle cx="239" cy="264" r="65" fill="url(#arcadeOrange)"/><path d="M194 242c6-16 18-27 31-30" stroke="#FFD58D" stroke-width="7" stroke-linecap="round"/><path d="M219 265v7m37-7v7m-28 17c7 7 14 7 21-1" stroke="#7F431F" stroke-width="5" stroke-linecap="round"/></g>' +
    '<g transform="rotate(12 367 262)"><path d="M365 209c4-22 11-37 21-48" stroke="#78503A" stroke-width="8" stroke-linecap="round"/><path d="M369 200c24-29 48-20 53-11-15 21-34 25-53 11Z" fill="#B1CB67"/><path d="M365 220c-55-30-84 7-72 54 10 40 37 71 61 60 8-4 15-4 24 0 28 10 54-26 63-62 11-46-23-80-76-52Z" fill="#E66C61"/><path d="M313 249c3-13 11-21 23-21" stroke="#FFACA1" stroke-width="7" stroke-linecap="round"/><path d="M345 273v7m36-7v7m-28 17c8 7 14 6 21-2" stroke="#77362E" stroke-width="5" stroke-linecap="round"/></g>' +
    '<path d="m122 293 183 102 201-74v29l-201 74-183-103v-28Z" fill="#F1BC7D"/><path d="m122 313 183 104 201-75" stroke="#5F3522" stroke-width="3"/>' +
    '<g transform="rotate(29 205 412)"><rect x="158" y="388" width="99" height="37" rx="3" fill="#EFE6CE"/><text x="207" y="412" text-anchor="middle" fill="#66452F" font-size="11" font-family="monospace" font-weight="700">SPEAK & FILL</text></g>' +
    '<path d="m475 163 9 27 29 1-23 18 8 28-23-17-23 17 8-28-23-18 29-1 9-27Z" fill="#D6FF5F"/><path d="m107 166 5 15 15 1-12 9 4 15-12-9-12 9 4-15-12-9 15-1 5-15Z" fill="#FF6B35"/>' +
    '<circle cx="485" cy="412" r="24" fill="#D6FF5F"/><path d="m474 413 7 7 15-17" stroke="#24311B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  function mount(app, context) {
    if (activeDestroy) activeDestroy();
    const ctx = context || {};
    const state = ctx.state || {};
    const esc = ctx.esc || (s => String(s || ''));
    const avatar = ctx.avatar || (() => '');
    const days = typeof BUSINESS_DAYS !== 'undefined' ? BUSINESS_DAYS : [];
    const progress = state.progress || {};
    const completed = new Set(progress.completedDays || []);
    const day = days.find(d => !completed.has('business:' + d.id)) || days[0];
    const currentDay = day ? day.id : 1;
    const daysComplete = days.filter(d => completed.has('business:' + d.id)).length;
    const coins = state.user?.coins || 0;
    const totalXP = state.user?.totalPoints || 0;
    const level = state.user?.level || 1;
    const monthDays = progress.activeDays || 0;
    const sample = days[5]?.phrases || days[0]?.phrases || [];
    let destroyed = false, galleryData = null, galleryFilter = '전체', galleryBusy = false;

    function button(label, attributes, extraClass) {
      return '<button type="button" class="arcade-button ' + (extraClass || '') + '" ' + attributes + '>' + label + '</button>';
    }

    function attendance() {
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const start = new Date(today + 'T00:00:00Z');
      start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
      return Array.from({ length: 7 }, (_, n) => {
        const date = new Date(start); date.setUTCDate(start.getUTCDate() + n);
        const key = date.toISOString().slice(0, 10);
        const passed = (progress.activity || []).some(a => a.date === key && a.points > 0);
        return '<span class="attendance-day' + (passed ? ' done' : '') + (key === today ? ' today' : '') + '" aria-label="' + key + (passed ? ' 학습 완료' : '') + '"><small>' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'][n] + '</small><b>' + (passed ? '✓' : date.getUTCDate()) + '</b></span>';
      }).join('');
    }

    const spotlightPhrases = [
      sample[0], sample[1], sample[2], days[1]?.phrases?.[0], days[2]?.phrases?.[0], days[3]?.phrases?.[1], days[4]?.phrases?.[0], days[6]?.phrases?.[1]
    ].filter(Boolean);

    const rewards = [
      { number: '01', title: '1일 학습', en: 'STUDY DAY 1', emblem: '✳', unlocked: monthDays >= 1, condition: '이번 달 1일 학습', description: '이번 달 1일 학습 배지', action: '20분 학습', attrs: 'data-start="' + currentDay + '"' },
      { number: '02', title: '7일 학습', en: 'STUDY DAY 7', emblem: '↗', unlocked: monthDays >= 7, condition: '이번 달 7일 학습', description: '이번 달 7일 학습 배지', action: '학습 배지', attrs: 'data-go="profile"' },
      { number: '03', title: '왕관 소품', en: 'CROWN ACCESSORY', emblem: '♛', unlocked: (state.shop?.owned || []).includes(3), condition: '소품 상점 · 150 C', description: '코인으로 소품 교환 · 랭킹 포인트 차감 없음', action: '캐릭터 꾸미기', attrs: 'data-go="profile"' },
      { number: '04', title: '20일 학습', en: 'STUDY DAY 20', emblem: '✦', unlocked: monthDays >= 20, condition: '이번 달 20일 학습', description: '이번 달 20일 학습 배지', action: '월간 리그 보기', attrs: 'data-go="rankings"' }
    ];

    app.innerHTML = '<div class="arcade-experience">' +
      '<section class="arcade-hero arcade-section" id="arcade-home" aria-labelledby="arcade-hero-title">' +
        '<div class="hero-copy"><p class="hero-kicker"><span class="live-dot"></span> AJ ENGLISH / ENGLISH GAMES</p>' +
        '<h2 class="arcade-display" id="arcade-hero-title">영어 게임</h2>' +
        '<p class="hero-description">수업 표현 기반 말하기·문장 조립·듣기</p>' +
        '<div class="hero-actions">' + button('20분 학습 시작 <span>↗</span>', 'data-start="' + currentDay + '"', 'orange') + button('게임 선택 <span>↓</span>', 'data-scroll-to="speaking-stage"', 'outline') + '</div>' +
        '<div class="hero-bottomline"><span>일요일 16:00–17:00 수업</span><i>×</i><span>매일 20분 복습</span><a href="#chapter-map" data-scroll-to="chapter-map">게임 목록 ↓</a></div></div>' +
        '<div class="hero-object"><div class="hero-scene">' + heroCrate +
          '<div class="floating-phrase phrase-one" lang="en"><small>01 / COLLABORATION</small>Please keep me<br>in the loop.<span>↗</span></div>' +
          '<div class="floating-phrase phrase-two" lang="en"><small>02 / FOLLOW-UP</small>I’ll follow up<br>on the proposal.<span>✓</span></div>' +
          '<div class="hero-sticker"><span>EXPRESSION</span><strong>COLLECTION</strong><small>SPEAKING PRACTICE</small></div>' +
          '</div><div class="hero-object-caption"><span>BUSINESS ENGLISH GAMES</span><span>01 — 07</span></div></div>' +
      '</section>' +
      '<section class="arcade-marquee" aria-label="나의 학습 현황"><div class="marquee-track"><span><b>' + esc(state.user?.nickname || 'CHARACTER') + '</b> / LV.' + level + '</span><i>✳</i><span>이번 달 <b>' + (progress.points || 0) + ' XP</b></span><i>✳</i><span>보유 코인 <b>' + coins + ' C</b></span><i>✳</i><span>완료한 비즈니스 학습 <b>' + daysComplete + '/7</b></span><i>✳</i><span>연속 학습 <b>' + (progress.streak || 0) + '일</b></span></div></section>' +
      '<section class="spotlight-room" data-spotlight aria-labelledby="spotlight-title"><div class="arcade-section"><div class="section-number">01 / EXPRESSIONS</div><div class="spotlight-heading"><h2 id="spotlight-title">수업 표현</h2><p>표현 선택 시 음성 재생</p></div>' +
        '<div class="spotlight-grid">' + spotlightPhrases.map((p, n) => '<button class="spotlight-phrase" type="button" data-spotlight-phrase data-say="' + esc(p.en) + '" aria-label="' + esc(p.en + ' · ' + p.ko + ' · 듣기') + '"><span class="phrase-index">' + String(n + 1).padStart(2, '0') + '</span><span class="phrase-english" lang="en">' + esc(p.en) + '</span><span class="phrase-korean">' + esc(p.ko) + '</span><span class="phrase-listen">듣기 ↗</span></button>').join('') + '</div>' +
        '<div class="spotlight-footer"><span>MOVE TO REVEAL / TAP TO LISTEN</span><button class="text-btn" data-go="library">전체 단어장 ↗</button></div></div></section>' +
      '<section class="scroll-chapters arcade-section" id="chapter-map" data-depth-stage aria-labelledby="chapters-title"><div class="chapter-heading"><div><div class="section-number">02 / WEEKLY LESSONS</div><h2 id="chapters-title">주간 수업</h2></div><p>수업 선택 · 1일 20분 복습</p></div><div class="chapter-track">' + days.map((d, n) => '<article class="chapter-card ' + (completed.has('business:' + d.id) ? 'is-complete' : '') + '" data-depth-card style="--chapter:' + n + '"><span class="chapter-no">DAY ' + String(d.id).padStart(2, '0') + '</span><span class="chapter-symbol">' + ['↗', '◎', '✳', '◒', '↔', '☷', '✦'][n] + '</span><h3>' + esc(d.title) + '</h3><p>' + esc(d.subtitle) + '</p><div class="chapter-quote" lang="en">' + esc(d.phrases[0].en) + '</div><button type="button" class="chapter-enter" data-start="' + d.id + '"><span>' + (completed.has('business:' + d.id) ? '완료 · 다시 학습' : '20분 학습 시작') + '</span><b>↗</b></button></article>').join('') + '</div><div class="chapter-progress"><span>' + daysComplete + ' / 7 QUESTS COMPLETE</span><div class="chapter-progress-line"><i style="width:' + (daysComplete / 7 * 100) + '%"></i></div><button class="text-btn" data-go="quests">전체 수업 ↗</button></div></section>' +
      '<section class="arcade-stage" id="speaking-stage" aria-labelledby="stage-title"><div class="stage-inner arcade-section"><div class="stage-copy"><div class="section-number">03 / THE SPEAKING STAGE</div><h2 id="stage-title">말하기 학습</h2><p>표현 듣기 → 문장 전체 말하기 → 인식 확인<br>표현 1개당 과일 1개 · 3개 표현으로 상자 완성</p><ol class="stage-rules"><li><b>01</b><span>영어 음성 듣기</span></li><li><b>02</b><span>마이크로 문장 전체 말하기</span></li><li><b>03</b><span>인식 완료 표현만 수집</span></li></ol><div class="hero-actions">' + button('말하기 시작 ↗', 'data-business-demo', 'lime') + '</div><p class="stage-footnote">게스트 연습 가능 · 학습 포인트는 20분 학습에서 지급</p>' +
      '<div class="arcade-modes" aria-label="비즈니스 영어 게임 선택"><button type="button" data-business-demo><span>01 / SPEAK</span><strong>말하기 학습</strong><i>↗</i></button><button type="button" data-practice="arrange"><span>02 / BUILD</span><strong>문장 조립</strong><i>↗</i></button><button type="button" data-practice="listening"><span>03 / LISTEN</span><strong>듣기 퀴즈</strong><i>↗</i></button></div></div>' +
      '<button class="stage-preview" type="button" data-business-demo aria-label="비즈니스 영어 상자 채우기 게임 열기"><div class="stage-preview-top"><span>MIC CHECK / READY</span><i></i></div><p lang="en">Please keep me<br><em>in the loop.</em></p><div class="stage-wave" aria-hidden="true">' + Array.from({length:25}, (_,n) => '<i style="--wave:' + ((n * 7) % 13) + '"></i>').join('') + '</div><div class="stage-crate-art">' + heroCrate.replaceAll('arcadeWood','stageWood').replaceAll('arcadeOrange','stageOrange') + '</div><div class="stage-preview-bottom"><span>문장 인식 · 과일 수집</span><b>↗</b></div><span class="stage-preview-note">문장 인식 일치 기준 · 정밀 발음 채점 아님</span></button></div></section>' +
      '<section class="arcade-gallery arcade-section" id="showcase-gallery" aria-labelledby="showcase-title"><div class="showcase-head"><div><div class="section-number">04 / CLASS POSTS</div><h2 id="showcase-title">우리 반 문장</h2></div><div><p>업무 표현 공유 · 오늘의 응원 하트 5개</p>' + button('문장 등록 +', 'data-open-showcase', 'outline') + '</div></div>' +
      '<div class="showcase-toolbar"><div class="showcase-filters">' + ['전체', '자기소개', '회의·협업', '업무·목표'].map((tag, n) => '<button type="button" class="showcase-filter' + (n ? '' : ' active') + '" data-showcase-filter="' + tag + '">' + tag + '</button>').join('') + '</div><span class="showcase-hearts" id="showcase-hearts">오늘의 응원 하트 5개</span></div>' +
      '<form id="showcase-form" class="showcase-form" hidden><div class="showcase-form-heading"><h3>공유 문장</h3><button type="button" class="text-btn" data-close-showcase>닫기 ×</button></div><div class="showcase-form-grid"><label class="field">분류<select name="tag"><option>자기소개</option><option>회의·협업</option><option>업무·목표</option></select></label><label class="field">영어 문장<textarea name="sentence" required minlength="5" maxlength="300" placeholder="I’ll follow up on the proposal tomorrow."></textarea></label><label class="field">한국어 뜻 또는 나의 메모<textarea name="meaning" maxlength="300" placeholder="내일 제안서 진행 상황을 확인하겠습니다."></textarea></label></div><p>같은 반에 문장 공개 · 개인·회사 정보 입력 금지</p><div class="showcase-form-actions">' + button('문장 등록 ↗', 'data-submit-showcase', 'orange') + '<span id="showcase-form-status" role="status" aria-live="polite"></span></div></form>' +
      '<div class="showcase-grid" id="showcase-posts" aria-live="polite"></div><p class="showcase-note">오늘 보낸 하트 취소 시 반환 · 응원은 랭킹 점수에 미반영 · 월간 순위는 실제 학습 기록 기준</p></section>' +
      '<section class="reward-scroll" data-horizontal-scroll aria-labelledby="rewards-title"><div class="reward-pin"><div class="reward-heading arcade-section"><div><div class="section-number">05 / REWARDS</div><h2 id="rewards-title">학습 보상</h2></div><div><p>보상 카드 선택 시 조건 확인 · 코인으로 소품 교환</p><div class="reward-controls"><button type="button" data-reward-prev aria-label="이전 보상">←</button><button type="button" data-reward-next aria-label="다음 보상">→</button></div></div></div><div class="reward-track" data-horizontal-track>' + rewards.map(r => '<div class="reward-flip ' + (r.unlocked ? 'unlocked' : 'locked') + '" data-flip-card role="button" tabindex="0" aria-expanded="false" aria-label="' + esc(r.title) + ' 보상 카드 뒤집기"><div class="reward-front"><span class="reward-no">' + r.number + ' / COLLECTION</span><b class="reward-emblem">' + r.emblem + '</b><small>' + r.en + '</small><h3>' + r.title + '</h3><span class="reward-state">' + (r.unlocked ? '✓ ACHIEVED' : r.condition) + '</span><i>VIEW CONDITIONS ↗</i></div><div class="reward-back"><span class="reward-no">' + r.en + '</span><h3>' + r.title + '</h3><p>' + r.description + '</p><strong>' + r.condition + '</strong>' + button(r.action + ' ↗', r.attrs, 'outline') + '</div></div>').join('') + '</div></div></section>' +
      '<section class="playground arcade-section" aria-labelledby="playground-title"><div class="playground-heading"><div><div class="section-number">06 / WORD PRACTICE</div><h2 id="playground-title">표현 듣기</h2></div><div><p>선택: 음성 듣기 · 드래그·화살표: 이동</p><div class="physics-controls"><button type="button" data-physics-shake>흔들기 ↝</button><button type="button" data-physics-pause aria-pressed="false">움직임 정지 Ⅱ</button><button type="button" data-physics-reset>다시 모으기 ↻</button></div></div></div><div class="physics-board" data-physics-board aria-label="드래그해서 움직이고 눌러서 듣는 비즈니스 영어 놀이터">' + [
        ['keep me in the loop', '진행 상황을 공유해 주세요'], ['on the same page', '같은 내용을 이해하다'], ['follow up on', '후속 조치를 하다'], ['take into account', '고려하다'], ['be tied up', '매우 바쁘다'], ['get the ball rolling', '일을 시작하다'], ['find middle ground', '타협점을 찾다'], ['go the extra mile', '기대 이상으로 노력하다'], ['double down', '더욱 전념하다'], ['higher-end', '고급형의']
      ].map((p, n) => '<button type="button" class="physics-token token-' + n % 4 + '" data-physics-token data-say="' + esc(p[0]) + '" data-en="' + esc(p[0]) + '" data-ko="' + esc(p[1]) + '" aria-label="' + esc(p[0] + ' · ' + p[1] + ' · 눌러서 듣기, 끌어서 이동') + '"><strong lang="en">' + esc(p[0]) + '</strong><small>' + esc(p[1]) + '</small><span>↗</span></button>').join('') + '</div><p class="playground-note">이 영역은 포인트 미지급 · 표현 듣기·이동 연습</p></section>' +
      '<section class="arcade-end arcade-section"><div class="end-topline"><span>START LESSON</span><span>BUSINESS ENGLISH / EVERY DAY</span></div><h2>학습 시작</h2><div class="end-actions">' + button('20분 학습 ↗', 'data-start="' + currentDay + '"', 'orange') + button(state.room ? '우리 반 월간 리그 ↗' : '우리 반 만들기 / 참여하기 ↗', state.room ? 'data-go="rankings"' : 'data-room', 'outline') + '</div><div class="attendance-strip"><div><span>WEEKLY RECORD</span><strong>LV.' + level + ' · ' + totalXP + ' XP</strong></div><div class="attendance-days">' + attendance() + '</div><span class="attendance-caption">' + (progress.streak || 0) + '일 연속 · 이번 달 ' + monthDays + '일 학습</span></div></section>' +
    '</div>';

    const postsElement = app.querySelector('#showcase-posts');
    const form = app.querySelector('#showcase-form');
    const formStatus = app.querySelector('#showcase-form-status');

    function writeFormStatus(text, error) {
      formStatus.textContent = text;
      formStatus.classList.toggle('error', !!error);
    }

    function examples(message) {
      return '<div class="showcase-empty"><span>CLASS POSTS</span><p>' + message + '</p>' + (!state.authenticated ? '<a class="arcade-button outline" href="/login?return_to=%2F%23home" target="_top">로그인 ↗</a>' : button('반 연결 ↗', 'data-room', 'outline')) + '</div>' + sample.slice(0, 3).map((p, n) => '<article class="showcase-card example-card"><div class="showcase-card-top"><span>수업 예문 / 0' + (n + 1) + '</span><span>↗</span></div><p class="showcase-sentence" lang="en">' + esc(p.en) + '</p><p class="showcase-meaning">' + esc(p.ko) + '</p><div class="showcase-card-bottom"><span>수업 표현</span><button type="button" class="text-btn" data-say="' + esc(p.en) + '">소리 듣기 ↗</button></div></article>').join('');
    }

    function renderPosts() {
      if (destroyed) return;
      const posts = (galleryData?.posts || []).filter(post => galleryFilter === '전체' || post.tag === galleryFilter);
      if (!state.authenticated) {
        postsElement.innerHTML = examples('로그인·반 연결 후 문장 공유 및 응원 가능');
        return;
      }
      if (!state.room) {
        postsElement.innerHTML = examples('반 등록·참여 후 우리 반 문장 표시');
        return;
      }
      app.querySelector('#showcase-hearts').textContent = '오늘 남은 응원 ' + (galleryData?.likesRemaining ?? 5) + ' / 5';
      if (!posts.length) {
        postsElement.innerHTML = '<div class="showcase-empty"><span>' + esc(state.room.name) + '</span><p>' + (galleryFilter === '전체' ? '등록된 공유 문장 없음' : '해당 분류의 공유 문장 없음') + '</p>' + button('문장 등록 +', 'data-open-showcase', 'orange') + '</div>';
        return;
      }
      postsElement.innerHTML = posts.map(post => '<article class="showcase-card"><div class="showcase-card-top"><span>' + esc(post.tag) + '</span>' + (post.isMine ? '<button type="button" class="showcase-delete text-btn" data-delete-post="' + esc(post.id) + '" aria-label="내 문장 삭제">삭제 ×</button>' : '<span>↗</span>') + '</div><p class="showcase-sentence" lang="en">' + esc(post.sentence) + '</p><p class="showcase-meaning">' + esc(post.meaning || '') + '</p><div class="showcase-author"><span class="showcase-avatar">' + avatar(post.avatar) + '</span><div><strong>' + esc(post.nickname) + '</strong><small>' + (post.isMine ? 'MY WORDS' : 'CLASSMATE') + '</small></div></div><div class="showcase-card-bottom"><button type="button" class="text-btn" data-say="' + esc(post.sentence) + '">들어보기 ↗</button><button type="button" class="showcase-like' + (post.liked ? ' liked' : '') + '" data-like-post="' + esc(post.id) + '" data-liked="' + !!post.liked + '" aria-pressed="' + !!post.liked + '" ' + (post.isMine ? 'disabled title="본인 문장 응원 불가"' : '') + '><span>' + (post.liked ? '♥' : '♡') + '</span> ' + Number(post.likes || 0) + '</button></div></article>').join('');
    }

    async function loadPosts() {
      if (!state.authenticated || !state.room) { renderPosts(); return; }
      try {
        galleryData = await ctx.api('showcase');
        if (!destroyed) renderPosts();
      } catch (error) {
        if (!destroyed) postsElement.innerHTML = '<div class="showcase-empty"><p>' + esc(error.message || '공유 문장 불러오기 실패') + '</p>' + button('다시 불러오기 ↻', 'data-reload-showcase', 'outline') + '</div>';
      }
    }

    function openForm() {
      if (!state.authenticated) {
        app.querySelector('#showcase-hearts').textContent = '로그인·반 연결 후 문장 공유 가능';
        app.querySelector('#showcase-gallery').scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (!state.user || !state.room) {
        if (typeof ctx.roomModal === 'function') ctx.roomModal();
        return;
      }
      form.hidden = false;
      writeFormStatus('공유 한도: 하루 3문장');
      form.querySelector('[name="sentence"]').focus();
      form.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }

    async function submitPost() {
      if (galleryBusy || (typeof form.reportValidity === 'function' && !form.reportValidity())) return;
      const sentence = form.querySelector('[name="sentence"]').value.trim();
      const meaning = form.querySelector('[name="meaning"]').value.trim();
      const tag = form.querySelector('[name="tag"]').value;
      const submit = form.querySelector('[data-submit-showcase]');
      galleryBusy = true; submit.disabled = true;
      writeFormStatus('문장 등록 중');
      try {
        await ctx.api('showcase', { sentence, meaning, tag });
        if (destroyed) return;
        form.reset(); form.hidden = true; galleryFilter = '전체';
        app.querySelectorAll('[data-showcase-filter]').forEach(b => b.classList.toggle('active', b.dataset.showcaseFilter === '전체'));
        await loadPosts();
      } catch (error) {
        if (!destroyed) writeFormStatus(error.message || '문장 등록 실패', true);
      } finally {
        galleryBusy = false;
        if (submit.isConnected) submit.disabled = false;
      }
    }

    async function onClick(event) {
      const target = event.target.closest('button,a');
      if (!target || !app.contains(target)) return;
      if (target.hasAttribute('data-open-showcase')) { openForm(); return; }
      if (target.hasAttribute('data-close-showcase')) { form.hidden = true; return; }
      if (target.hasAttribute('data-submit-showcase')) { await submitPost(); return; }
      if (target.hasAttribute('data-reload-showcase')) { await loadPosts(); return; }
      if (target.dataset.showcaseFilter) {
        galleryFilter = target.dataset.showcaseFilter;
        app.querySelectorAll('[data-showcase-filter]').forEach(b => b.classList.toggle('active', b === target));
        renderPosts(); return;
      }
      if (target.dataset.likePost) {
        const wanted = target.dataset.liked !== 'true';
        target.disabled = true;
        try {
          const result = await ctx.api('showcase/like', { postId: target.dataset.likePost, liked: wanted });
          if (destroyed) return;
          const post = galleryData?.posts?.find(p => p.id === result.postId);
          if (post) { post.liked = result.liked; post.likes = result.likes; }
          galleryData.likesRemaining = result.likesRemaining;
          renderPosts();
        } catch (error) {
          if (destroyed) return;
          app.querySelector('#showcase-hearts').textContent = error.message || '응원 저장 실패';
          target.disabled = false;
        }
        return;
      }
      if (target.dataset.deletePost) {
        target.disabled = true;
        try {
          await ctx.api('showcase/delete', { postId: target.dataset.deletePost });
          if (!destroyed) await loadPosts();
        } catch (error) {
          if (!destroyed) { target.textContent = error.message || '삭제 실패'; target.disabled = false; }
        }
      }
    }

    function onSubmit(event) { if (event.target === form) { event.preventDefault(); submitPost(); } }
    app.addEventListener('click', onClick);
    app.addEventListener('submit', onSubmit);
    renderPosts();
    loadPosts();

    function destroy() {
      destroyed = true;
      app.removeEventListener('click', onClick);
      app.removeEventListener('submit', onSubmit);
      if (activeDestroy === destroy) activeDestroy = null;
    }
    activeDestroy = destroy;
    return { destroy };
  }

  window.ArcadeExperience = { mount, destroy() { if (activeDestroy) activeDestroy(); } };
})();
