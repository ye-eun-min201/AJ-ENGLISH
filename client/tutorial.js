/* tutorial.js — 처음 온 학생을 위한 게임식 튜토리얼 (두고 앱의 스테이지 튜토리얼과 같은 짜임)
   STAGE 1 카드 뒤집기 → STAGE 2 정답 고르고 기차 출발 → STAGE 3 수업 자료에 별 붙이기
   · 위: 스테이지 번호 · 코인(미션을 깰 때마다 +100) · 건너뛰기
   · 스테이지 지도: 캐릭터가 다음 칸으로 폴짝
   · 각 스테이지는 직접 눌러 보는 작은 미션. 안 해도 "다음"으로 넘어갈 수 있다.
   · 좌우로 밀기 · ← → 키 · Esc(건너뛰기). 마지막에 STAGE CLEAR + 꽃가루
   학습 기록·포인트와는 상관없는 연습 화면 — 닫으면 끝. */
(function () {
  'use strict';
  const COIN = 100, SWIPE = 44, CLEAR_MS = 1700;
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STAGES = [
    { key: 'flip', tag: '단어·문장 학습', title: '카드를 눌러 뜻을 확인해요', desc: '영어를 보고 뜻을 떠올린 다음, 카드를 뒤집어 맞았는지 봐요. 매일 새 단어와 문장이 올라와요.', mission: '카드를 눌러 보세요', done: '뒤집기 성공', say: '눌러 봐요' },
    { key: 'rail', tag: '레일 퀘스트', title: '정답을 고르면 기차가 출발해요', desc: '하루 10문제. 맞힐 때마다 기차가 다음 역으로 가고, 경험치가 쌓여요.', mission: '알맞은 영어를 골라 보세요', done: '출발', say: '어느 쪽일까요' },
    { key: 'note', tag: '수업 자료', title: '수업 PDF에 바로 필기해요', desc: '일요일 수업 자료는 지난 것까지 계속 열어 볼 수 있어요. 중요한 곳에 표시를 남겨 두세요.', mission: '중요한 줄을 눌러 별을 붙여 보세요', done: '필기 완료', say: '여기가 중요해요' }
  ];
  const NODE_X = [16, 50, 84];
  const NODE_ICON = [
    '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Zm0 13a3 3 0 0 1 3-3h11"/>',
    '<path d="M6 4h12a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Zm-2 6h16M8 21l2-3m6 3-2-3M8.5 14.5h.01M15.5 14.5h.01"/>',
    '<path d="M6 3h9l4 4v14H6ZM14 3v5h5M9 13h7M9 17h5"/>'
  ];
  const CHECK = '<path d="m5 12.5 4.5 4.5L19 7.5"/>';
  const icon = body => '<svg viewBox="0 0 24 24" aria-hidden="true">' + body + '</svg>';
  const guide = () => { try { return window.CuteCharacters.render({ species: 0, outfit: 3, color: 3 }, 'tut-guide'); } catch (_) { return ''; } };

  let root = null, i = 0, cleared = [false, false, false], finished = false, startX = null, timer = null, onClose = null, lastFocus = null;

  /* ---------- 꽃가루 (라이브러리 없이) ---------- */
  function burst(x, y, count, spread) {
    if (reduce()) return;
    const colors = ['#4f46e5', '#818cf8', '#c7d2fe', '#f5b301', '#ff8fb1', '#0aae6e'];
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6100;overflow:hidden';
    document.body.appendChild(layer);
    let longest = 0;
    for (let n = 0; n < count; n++) {
      const piece = document.createElement('span'), size = 6 + Math.random() * 7, round = Math.random() > .5;
      piece.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + (round ? size : size * .45) + 'px;background:' + colors[n % colors.length] + ';border-radius:' + (round ? '50%' : '2px');
      layer.appendChild(piece);
      const angle = Math.random() * Math.PI * 2, dist = spread * (.45 + Math.random() * .75);
      const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist - spread * .35, fall = spread * (.5 + Math.random() * .6), rot = (Math.random() - .5) * 720, duration = 750 + Math.random() * 550;
      longest = Math.max(longest, duration);
      piece.animate([
        { transform: 'translate(-50%,-50%) scale(.6) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + dy + 'px)) scale(1) rotate(' + rot / 2 + 'deg)', opacity: 1, offset: .55 },
        { transform: 'translate(calc(-50% + ' + dx * 1.15 + 'px),calc(-50% + ' + (dy + fall) + 'px)) scale(.8) rotate(' + rot + 'deg)', opacity: 0 }
      ], { duration, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    }
    setTimeout(() => layer.remove(), longest + 80);
  }
  const burstFrom = (el, count, spread) => { if (!el) return; const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, count, spread); };

  /* ---------- 장면 ---------- */
  const scenes = {
    flip: () => '<button type="button" class="tut-card" data-tut-act="flip" aria-label="단어 카드 뒤집기">' +
      '<span class="tut-card-face tut-card-front"><small>ENGLISH</small><b>deadline</b><i>눌러서 뒤집기</i></span>' +
      '<span class="tut-card-face tut-card-back"><small>뜻</small><b>마감일</b><i>The deadline is Friday.</i></span></button>' +
      '<span class="tut-spark" style="left:16%;top:18%"></span><span class="tut-spark" style="left:82%;top:26%;animation-delay:.5s"></span><span class="tut-spark" style="left:76%;top:80%;animation-delay:.9s"></span>',
    rail: () => '<div class="tut-rail"><span class="tut-sun"></span><span class="tut-cloud" style="left:12%;top:16%"></span><span class="tut-cloud tut-cloud-sm" style="left:58%;top:8%"></span>' +
      '<span class="tut-track-line"></span><span class="tut-stop tut-stop-a"></span><span class="tut-stop tut-stop-b"><em>NEXT</em></span>' +
      '<span class="tut-train"><svg viewBox="0 0 92 56" aria-hidden="true"><rect x="4" y="12" width="66" height="32" rx="10" fill="var(--lamp)"/><rect x="62" y="20" width="26" height="24" rx="8" fill="var(--lamp-hot)"/><rect x="12" y="19" width="16" height="13" rx="4" fill="#fff"/><rect x="34" y="19" width="16" height="13" rx="4" fill="#fff"/><rect x="68" y="25" width="12" height="9" rx="3" fill="#fff"/><rect x="18" y="4" width="12" height="10" rx="3" fill="var(--lamp-deep)"/><circle cx="20" cy="46" r="7" fill="#3b2a5e"/><circle cx="46" cy="46" r="7" fill="#3b2a5e"/><circle cx="76" cy="46" r="7" fill="#3b2a5e"/><circle cx="20" cy="46" r="2.6" fill="#fff"/><circle cx="46" cy="46" r="2.6" fill="#fff"/><circle cx="76" cy="46" r="2.6" fill="#fff"/><circle cx="76" cy="29.5" r="1.4" fill="#3b2a5e"/><ellipse cx="71" cy="38" rx="3" ry="1.8" fill="#ff9ec0" opacity=".8"/></svg><span class="tut-puff"></span><span class="tut-puff tut-puff-2"></span></span></div>' +
      '<div class="tut-quiz"><p><small>뜻</small>회의 일정을 잡다</p><div class="tut-options">' +
      '<button type="button" data-tut-act="pick" data-ok="0">cancel a meeting</button>' +
      '<button type="button" data-tut-act="pick" data-ok="1">schedule a meeting</button></div></div>',
    note: () => '<div class="tut-sheet"><span class="tut-sheet-tab">CHAPTER 03</span><b>Negotiating a deadline</b>' +
      '<span class="tut-line" style="width:88%"></span><span class="tut-line" style="width:72%"></span>' +
      '<button type="button" class="tut-key" data-tut-act="star" aria-label="중요한 줄에 별 붙이기"><mark>Could we push the deadline to Friday?</mark><span class="tut-star" aria-hidden="true">★</span></button>' +
      '<span class="tut-line" style="width:80%"></span><span class="tut-line" style="width:54%"></span>' +
      '<span class="tut-pen" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M6 34l4-12L28 4l8 8-18 18Z" fill="var(--lamp)"/><path d="M6 34l4-12 8 8Z" fill="#ffd9a8"/><path d="M6 34l1.6-4.8 3.2 3.2Z" fill="#3b2a5e"/><path d="M24 8l8 8" stroke="#fff" stroke-width="2.4"/></svg></span></div>' +
      '<span class="tut-chip-old">지난 수업도 계속 열람</span>'
  };

  function coins() { return cleared.filter(Boolean).length * COIN; }

  function build() {
    const el = document.createElement('div');
    el.className = 'tut-root'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'AJ ENGLISH 시작 안내');
    el.innerHTML = '<div class="tut-panel">' +
      STAGES.map((s, n) => '<div class="tut-tint tut-tint-' + n + '" aria-hidden="true"></div>').join('') + '<div class="tut-dots" aria-hidden="true"></div>' +
      '<div class="tut-top"><div class="tut-pills"><span class="tut-pill" data-tut-stage></span><span class="tut-pill tut-coinpill"><span class="tut-coin" aria-hidden="true"></span><span data-tut-coins>x0</span></span></div><button type="button" class="tut-skip" data-tut-skip>건너뛰기</button></div>' +
      '<div class="tut-map" aria-hidden="true"><div class="tut-track"></div><div class="tut-track tut-track-fill"></div>' +
      NODE_ICON.map((body, n) => '<span class="tut-node" data-tut-node="' + n + '" style="left:' + NODE_X[n] + '%"></span>').join('') +
      '<span class="tut-hopper">' + guide() + '</span></div>' +
      '<div class="tut-view"><div class="tut-slides">' +
      STAGES.map((s, n) => '<section class="tut-slide" data-tut-slide="' + n + '"><div class="tut-scene" data-tut-scene="' + s.key + '"></div>' +
        '<p class="tut-mission" data-tut-mission="' + n + '"></p><span class="tut-step">' + s.tag + '</span><h2>' + s.title + '</h2><p class="tut-desc">' + s.desc + '</p></section>').join('') +
      '</div></div>' +
      '<div class="tut-bottom"><div class="tut-dotsnav" aria-hidden="true">' + STAGES.map(() => '<span></span>').join('') + '</div>' +
      '<div class="tut-actions"><button type="button" class="tut-back" data-tut-back aria-label="이전 스테이지">' + icon('<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>') + '</button><button type="button" class="tut-next" data-tut-next></button></div></div>' +
      '<p class="tut-live" role="status" aria-live="polite"></p>' +
      '</div>';
    return el;
  }

  function paint() {
    if (!root) return;
    const last = i === STAGES.length - 1;
    root.dataset.stage = String(i);
    root.querySelector('[data-tut-stage]').textContent = 'STAGE ' + (i + 1) + '/3';
    root.querySelector('[data-tut-coins]').textContent = 'x' + coins();
    root.querySelector('.tut-track-fill').style.width = (i / 2) * 68 + '%';
    root.querySelector('.tut-hopper').style.left = NODE_X[i] + '%';
    root.querySelectorAll('[data-tut-node]').forEach((node, n) => {
      const state = cleared[n] ? 'done' : n === i ? 'now' : 'next';
      node.className = 'tut-node is-' + state; node.innerHTML = icon(state === 'done' ? CHECK : NODE_ICON[n]);
    });
    root.querySelector('.tut-slides').style.transform = 'translateX(-' + i * 100 + '%)';
    root.querySelectorAll('[data-tut-slide]').forEach((slide, n) => {
      const on = n === i;
      slide.setAttribute('aria-hidden', String(!on)); slide.inert = !on; slide.classList.toggle('is-on', on);
      const m = slide.querySelector('[data-tut-mission]');
      m.textContent = cleared[n] ? STAGES[n].done + ' · +' + COIN : STAGES[n].mission; m.classList.toggle('is-done', cleared[n]);
    });
    root.querySelectorAll('.tut-dotsnav span').forEach((dot, n) => dot.classList.toggle('is-on', n === i));
    root.querySelector('[data-tut-back]').hidden = i === 0 || finished;
    const next = root.querySelector('[data-tut-next]');
    next.textContent = last ? '학습 시작하기' : '다음';
    next.classList.toggle('is-last', last); next.disabled = finished;
    root.querySelector('[data-tut-skip]').hidden = finished;
  }

  function reward(n, from) {
    if (cleared[n] || finished) return;
    cleared[n] = true; paint();
    const pill = root.querySelector('.tut-coinpill'), plus = document.createElement('span');
    plus.className = 'tut-plus'; plus.textContent = '+' + COIN; pill.appendChild(plus); setTimeout(() => plus.remove(), 950);
    pill.classList.remove('is-bump'); void pill.offsetWidth; pill.classList.add('is-bump');
    root.querySelector('.tut-live').textContent = STAGES[n].done + ', 코인 ' + coins() + '개';
    burstFrom(from, 16, 110);
  }

  function goTo(n) {
    if (finished) return;
    const next = Math.max(0, Math.min(STAGES.length - 1, n)); if (next === i) return;
    i = next; paint();
  }

  function finish(from) {
    if (finished) return; finished = true; paint();
    const clear = document.createElement('div'); clear.className = 'tut-clear'; clear.setAttribute('aria-hidden', 'true');
    clear.innerHTML = '<div class="tut-clear-stars"><span>★</span><span>★</span><span>★</span></div><p class="tut-clear-text">STAGE CLEAR!</p><p class="tut-clear-sub">코인 ' + coins() + '개 · 이제 진짜 학습을 시작해요</p><span class="tut-clear-char">' + guide() + '</span>';
    root.querySelector('.tut-panel').appendChild(clear);
    root.querySelector('.tut-live').textContent = '안내 완료. 학습을 시작합니다.';
    burstFrom(from, 40, 200); burst(window.innerWidth / 2, window.innerHeight * .35, 36, 220);
    timer = setTimeout(() => close(true), reduce() ? 500 : CLEAR_MS);
  }

  function close(complete) {
    if (!root) return;
    clearTimeout(timer); document.removeEventListener('keydown', onKey, true);
    root.remove(); root = null; document.documentElement.classList.remove('tut-open');
    try { lastFocus?.focus?.({ preventScroll: true }); } catch (_) { /* 돌아갈 곳이 없으면 그대로 둠 */ }
    const cb = onClose; onClose = null; if (cb) cb(!!complete);
  }

  function onKey(event) {
    if (!root) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(false); }
    else if (event.key === 'ArrowRight') goTo(i + 1);
    else if (event.key === 'ArrowLeft') goTo(i - 1);
    else if (event.key === 'Tab') {
      const items = [...root.querySelectorAll('button:not([hidden]):not([disabled])')].filter(b => !b.closest('[inert]'));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (!root.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
    }
  }

  function onClick(event) {
    const button = event.target.closest('button'); if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-tut-skip')) return close(false);
    if (button.hasAttribute('data-tut-back')) return goTo(i - 1);
    if (button.hasAttribute('data-tut-next')) return i === STAGES.length - 1 ? finish(button) : goTo(i + 1);
    const act = button.getAttribute('data-tut-act');
    if (act === 'flip') { button.classList.toggle('is-flipped'); reward(0, button); }
    else if (act === 'pick') {
      if (button.getAttribute('data-ok') === '1') {
        button.classList.add('is-right'); button.parentNode.querySelectorAll('button').forEach(b => { b.disabled = true; });
        root.querySelector('.tut-rail').classList.add('is-go'); reward(1, button);
      } else { button.classList.remove('is-wrong'); void button.offsetWidth; button.classList.add('is-wrong'); root.querySelector('.tut-live').textContent = '다시 골라 보세요'; }
    }
    else if (act === 'star') { button.classList.add('is-starred'); reward(2, button); }
  }

  function open(options) {
    if (root) return true;
    onClose = options && typeof options.onClose === 'function' ? options.onClose : null;
    i = 0; cleared = [false, false, false]; finished = false; lastFocus = document.activeElement;
    root = build(); document.body.appendChild(root); document.documentElement.classList.add('tut-open');
    STAGES.forEach(s => { root.querySelector('[data-tut-scene="' + s.key + '"]').innerHTML = scenes[s.key](); });
    root.addEventListener('click', onClick);
    const view = root.querySelector('.tut-view');
    view.addEventListener('pointerdown', e => { startX = e.target.closest('button') ? null : e.clientX; });
    view.addEventListener('pointerup', e => { if (startX == null) return; const dx = e.clientX - startX; startX = null; if (dx < -SWIPE) goTo(i + 1); else if (dx > SWIPE) goTo(i - 1); });
    view.addEventListener('pointercancel', () => { startX = null; });
    document.addEventListener('keydown', onKey, true);
    paint();
    root.querySelector('[data-tut-next]').focus({ preventScroll: true });
    return true;
  }

  window.AJTutorial = { open, close: () => close(false), isOpen: () => !!root };
})();
