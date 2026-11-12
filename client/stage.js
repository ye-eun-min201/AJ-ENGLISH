/* stage.js — '밤 무대' 테마의 움직임
   1) 처음 한 번 보이는 로딩 막(퍼센트)   2) 포인터를 따라다니는 조명
   3) 학습 순서 카드 뒤집기·조명 테두리    4) 잡아서 던지는 단어 놀이터
   학습 기능에는 손대지 않는다. 움직임 줄이기 설정을 켠 기기에서는 정지 화면으로 보여 준다. */
(() => {
  'use strict';
  const root = document.documentElement;
  const media = query => !!(window.matchMedia && window.matchMedia(query).matches);
  const reduced = media('(prefers-reduced-motion: reduce)');
  const finePointer = media('(hover: hover) and (pointer: fine)');
  const app = document.getElementById('app');
  const isStudent = document.body.classList.contains('dashboard-shell');
  const store = { get(key) { try { return sessionStorage.getItem(key); } catch (_) { return null; } }, set(key, value) { try { sessionStorage.setItem(key, value); } catch (_) { /* 저장 없이도 동작 */ } } };

  /* ---------- 1) 로딩 막 ---------- */
  function curtain() {
    if (!isStudent || !app || reduced || store.get('aj-stage-curtain') === '1') return Promise.resolve();
    const el = document.createElement('div');
    el.id = 'stage-curtain'; el.setAttribute('role', 'status'); el.setAttribute('aria-label', 'AJ ENGLISH 불러오는 중');
    el.innerHTML = '<div class="sc-inner"><div class="sc-brand"><b>AJ</b> ENGLISH</div><div class="sc-count"><span data-sc-count>0</span><small>%</small></div><div class="sc-rail"><i></i></div><div class="sc-note"><span>LOADING</span><span>20 MIN A DAY</span></div></div>';
    document.body.append(el);
    const count = el.querySelector('[data-sc-count]'), bar = el.querySelector('.sc-rail i');
    const ready = () => app.children.length > 0 && !app.querySelector('.loading-state');
    return new Promise(resolve => {
      const started = performance.now(); let shown = 0, finished = false;
      const finish = () => {
        if (finished) return; finished = true; store.set('aj-stage-curtain', '1');
        el.classList.add('is-done'); setTimeout(() => el.remove(), 1400); resolve();
      };
      const tick = now => {
        if (finished) return;
        const elapsed = now - started, cap = ready() || elapsed > 6000 ? 100 : 86;
        const target = Math.min(cap, elapsed / 11.5);
        shown = Math.max(shown, shown + (target - shown) * .2);
        const value = Math.min(100, Math.round(shown + .3));
        count.textContent = String(value); bar.style.width = value + '%';
        if (value >= 100) { setTimeout(finish, 220); return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(finish, 8000);
    });
  }

  /* ---------- 2) 조명 ---------- */
  function light() {
    if (reduced) return;
    const el = document.createElement('div'); el.id = 'stage-light'; el.setAttribute('aria-hidden', 'true'); document.body.append(el);
    let x = window.innerWidth * .64, y = window.innerHeight * .26, targetX = x, targetY = y, frame = 0;
    const place = () => { el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; };
    const step = () => {
      x += (targetX - x) * .14; y += (targetY - y) * .14; place();
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > .6 ? requestAnimationFrame(step) : 0;
    };
    const aim = event => { targetX = event.clientX; targetY = event.clientY; if (!frame) frame = requestAnimationFrame(step); };
    window.addEventListener('pointermove', aim, { passive: true });
    window.addEventListener('pointerdown', aim, { passive: true });
    place(); requestAnimationFrame(() => el.classList.add('is-on'));
  }

  /* ---------- 3) 카드 뒤집기 · 조명 테두리 ---------- */
  let flipped = false;
  const GLOW_TARGETS = '.he-step,.he-class,.aj-dashboard-records,.stage-play';
  function decorate() {
    if (!app) return;
    if (!flipped) {
      const steps = app.querySelectorAll('.he-step');
      if (steps.length) { flipped = true; steps.forEach((el, index) => { el.style.setProperty('--i', String(index)); el.classList.add('stage-flip'); }); }
    }
    if (!finePointer) return;
    app.querySelectorAll(GLOW_TARGETS).forEach(el => {
      if (el.classList.contains('stage-glow') || el.dataset.stageGlow === 'skip') return;
      const position = getComputedStyle(el).position, after = getComputedStyle(el, '::after').content;
      if ((position === 'static' || position === 'relative') && (after === 'none' || after === 'normal')) el.classList.add('stage-glow'); else el.dataset.stageGlow = 'skip';
    });
  }
  function glowFollow() {
    if (!finePointer) return;
    document.addEventListener('pointermove', event => {
      const card = event.target instanceof Element ? event.target.closest('.stage-glow') : null;
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty('--gx', (event.clientX - box.left).toFixed(0) + 'px');
      card.style.setProperty('--gy', (event.clientY - box.top).toFixed(0) + 'px');
    }, { passive: true });
  }

  /* ---------- 4) 단어 놀이터 ---------- */
  function wordsForToday() {
    const pool = [];
    const add = list => { if (Array.isArray(list)) for (const item of list) if (item && typeof item.en === 'string' && typeof item.ko === 'string') pool.push(item); };
    try { add(typeof BUSINESS_DATA !== 'undefined' ? BUSINESS_DATA : null); } catch (_) { /* 데이터 없이도 동작 */ }
    try { add(typeof DATA !== 'undefined' ? DATA : null); } catch (_) { /* 데이터 없이도 동작 */ }
    const seen = new Set(), short = [];
    for (const item of pool) {
      const en = item.en.trim();
      if (en.length < 3 || en.length > 19 || en.includes('…') || seen.has(en.toLowerCase())) continue;
      seen.add(en.toLowerCase()); short.push({ en, ko: item.ko.trim() });
    }
    const now = new Date(), day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 864e5);
    const count = Math.min(short.length, window.innerWidth < 700 ? 9 : 13), picked = [];
    for (let i = 0; i < count; i++) picked.push(short[(day * 5 + i * 7) % short.length]);
    return [...new Map(picked.map(item => [item.en, item])).values()];
  }
  const TONES = ['lamp', '', 'neon', 'serif', '', 'chalk', '', 'ticket', 'serif', '', 'neon', 'lamp', ''];
  let playground = null;
  function buildPlayground() {
    const words = wordsForToday();
    if (words.length < 4) return null;
    const section = document.createElement('section');
    section.className = 'stage-play'; section.setAttribute('aria-labelledby', 'stage-play-title');
    section.innerHTML = '<div class="stage-play-head"><div><p>PLAYGROUND</p><h2 id="stage-play-title">오늘의 표현, <em>잡아서</em> 던져보세요</h2><span>누르면 뜻이 보여요 · 끌어서 던질 수 있어요</span></div><div class="stage-play-actions"><button type="button" data-stage-shake>흔들기</button><button type="button" data-stage-drop>다시 떨어뜨리기</button></div></div><div class="stage-play-arena"></div>';
    const arena = section.querySelector('.stage-play-arena');
    const bodies = words.map((word, index) => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'stage-chip'; el.textContent = word.en;
      el.dataset.tone = TONES[index % TONES.length]; el.setAttribute('aria-label', word.en + ' — 누르면 뜻 보기');
      arena.append(el);
      return { el, word, showKo: false, x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, tilt: 0, held: false };
    });
    const toggle = body => {
      body.showKo = !body.showKo; body.el.textContent = body.showKo ? body.word.ko : body.word.en; body.el.classList.toggle('is-ko', body.showKo);
      body.el.setAttribute('aria-label', body.showKo ? body.word.ko + ' — 누르면 영어 보기' : body.word.en + ' — 누르면 뜻 보기'); measure(body); wake();
    };
    const measure = body => { body.w = body.el.offsetWidth; body.h = body.el.offsetHeight; };
    if (reduced) {
      section.classList.add('is-static'); section.querySelector('.stage-play-actions').remove();
      bodies.forEach(body => body.el.addEventListener('click', () => toggle(body)));
      return { section, destroy() {} };
    }
    let width = 0, height = 0, frame = 0, last = 0, visible = false, started = false, destroyed = false, calm = 0;
    const G = 2300, BOUNCE = .34, FRICTION = .86;
    const drop = () => {
      bodies.forEach((body, index) => {
        measure(body);
        body.x = Math.max(4, Math.min(width - body.w - 4, (width - body.w) * ((index * 0.37 + 0.11) % 1)));
        body.y = -body.h - 30 - index * 46; body.vx = (index % 2 ? -1 : 1) * (40 + index * 9); body.vy = 0; body.tilt = 0;
      });
      wake();
    };
    const paint = body => { body.el.style.transform = 'translate3d(' + body.x.toFixed(1) + 'px,' + body.y.toFixed(1) + 'px,0) rotate(' + body.tilt.toFixed(2) + 'deg)'; };
    const collide = (a, b) => {
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (overlapX <= 0 || overlapY <= 0) return;
      const moveA = a.held ? 0 : b.held ? 1 : .5, moveB = 1 - moveA;
      if (overlapX < overlapY) {
        const direction = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
        a.x += direction * overlapX * moveA; b.x -= direction * overlapX * moveB;
        const va = a.vx, vb = b.vx; if (!a.held) a.vx = vb * .8; if (!b.held) b.vx = va * .8;
      } else {
        const direction = a.y + a.h / 2 < b.y + b.h / 2 ? -1 : 1;
        a.y += direction * overlapY * moveA; b.y -= direction * overlapY * moveB;
        const va = a.vy, vb = b.vy; if (!a.held) a.vy = vb * BOUNCE; if (!b.held) b.vy = va * BOUNCE;
        if (!a.held) a.vx *= .94; if (!b.held) b.vx *= .94;
      }
    };
    const advance = dt => {
      for (const body of bodies) {
        if (body.held) continue;
        body.vy += G * dt; body.x += body.vx * dt; body.y += body.vy * dt;
        if (body.x < 0) { body.x = 0; body.vx = Math.abs(body.vx) * BOUNCE; }
        if (body.x + body.w > width) { body.x = width - body.w; body.vx = -Math.abs(body.vx) * BOUNCE; }
        if (body.y + body.h > height) { body.y = height - body.h; body.vy = Math.abs(body.vy) < 90 ? 0 : -Math.abs(body.vy) * BOUNCE; body.vx *= FRICTION; }
      }
      for (let pass = 0; pass < 3; pass++) for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) collide(bodies[i], bodies[j]);
      for (const body of bodies) {
        if (body.held) continue;
        if (body.x < 0) body.x = 0; if (body.x + body.w > width) body.x = Math.max(0, width - body.w);
        if (body.y + body.h > height) { body.y = height - body.h; if (body.vy > 0) body.vy = 0; }
        if (Math.abs(body.vx) < 6) body.vx = 0;
      }
    };
    const step = now => {
      frame = 0; if (destroyed || !visible) return;
      // 화면이 느린 기기에서도 실제 시간만큼 움직이도록 짧은 간격으로 나눠 계산한다
      let remaining = Math.min(.1, (now - (last || now)) / 1000) || .016; last = now;
      while (remaining > .0005) { const slice = Math.min(remaining, 1 / 100); advance(slice); remaining -= slice; }
      let energy = 0;
      for (const body of bodies) {
        const wanted = Math.max(-14, Math.min(14, body.vx * .018));
        body.tilt += (wanted - body.tilt) * .14; if (Math.abs(body.tilt) < .05) body.tilt = 0;
        energy += Math.abs(body.vx) + Math.abs(body.vy) + (body.held ? 1000 : 0) + Math.abs(body.tilt) * 4; paint(body);
      }
      calm = energy < 46 * bodies.length ? calm + 1 : 0;
      if (calm < 50) frame = requestAnimationFrame(step); else last = 0;
    };
    const wake = () => { calm = 0; if (!frame && visible && !destroyed) { last = 0; frame = requestAnimationFrame(step); } };
    const resize = () => { width = arena.clientWidth; height = arena.clientHeight; bodies.forEach(measure); wake(); };
    bodies.forEach(body => {
      let grab = null;
      body.el.addEventListener('pointerdown', event => {
        if (event.button) return;
        const box = arena.getBoundingClientRect();
        grab = { id: event.pointerId, dx: event.clientX - box.left - body.x, dy: event.clientY - box.top - body.y, startX: event.clientX, startY: event.clientY, moved: false, trail: [] };
        body.held = true; body.vx = body.vy = 0; body.el.setPointerCapture(event.pointerId); wake();
      });
      body.el.addEventListener('pointermove', event => {
        if (!grab || event.pointerId !== grab.id) return;
        if (Math.hypot(event.clientX - grab.startX, event.clientY - grab.startY) > 6) grab.moved = true;
        const box = arena.getBoundingClientRect();
        body.x = Math.max(0, Math.min(width - body.w, event.clientX - box.left - grab.dx));
        body.y = Math.max(-body.h, Math.min(height - body.h, event.clientY - box.top - grab.dy));
        grab.trail.push({ t: event.timeStamp, x: event.clientX, y: event.clientY }); if (grab.trail.length > 5) grab.trail.shift(); wake();
      });
      const release = event => {
        if (!grab || event.pointerId !== grab.id) return;
        const first = grab.trail[0], lastPoint = grab.trail[grab.trail.length - 1];
        if (grab.moved && first && lastPoint && lastPoint.t > first.t) {
          const seconds = (lastPoint.t - first.t) / 1000;
          body.vx = Math.max(-2600, Math.min(2600, (lastPoint.x - first.x) / seconds)); body.vy = Math.max(-2600, Math.min(2600, (lastPoint.y - first.y) / seconds));
        }
        body.held = false; body.justDragged = grab.moved; grab = null; wake();
      };
      body.el.addEventListener('pointerup', release); body.el.addEventListener('pointercancel', release);
      body.el.addEventListener('click', () => { if (body.justDragged) { body.justDragged = false; return; } toggle(body); });
    });
    section.querySelector('[data-stage-shake]').addEventListener('click', () => { bodies.forEach((body, index) => { body.vx += (index % 2 ? -1 : 1) * (500 + Math.random() * 700); body.vy = -(700 + Math.random() * 900); }); wake(); });
    section.querySelector('[data-stage-drop]').addEventListener('click', drop);
    const sizeWatcher = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    const viewWatcher = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible && !started) { started = true; resize(); drop(); } else if (visible) wake();
    }, { threshold: .15 }) : null;
    requestAnimationFrame(() => {
      if (destroyed) return;
      sizeWatcher?.observe(arena);
      if (viewWatcher) viewWatcher.observe(section); else { visible = true; started = true; resize(); drop(); }
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!destroyed) { bodies.forEach(measure); wake(); } });
    const onVisibility = () => { if (!document.hidden) wake(); };
    document.addEventListener('visibilitychange', onVisibility);
    return { section, destroy() { destroyed = true; cancelAnimationFrame(frame); sizeWatcher?.disconnect(); viewWatcher?.disconnect(); document.removeEventListener('visibilitychange', onVisibility); } };
  }
  function syncPlayground() {
    if (!app) return;
    const wanted = document.body.dataset.view === 'home' && !!app.querySelector('#home-entry .he-grid');
    if (playground && (!wanted || !playground.section.isConnected)) { playground.destroy(); playground.section.remove(); playground = null; }
    if (wanted && !playground) { playground = buildPlayground(); if (playground) app.append(playground.section); }
  }

  /* ---------- 시작 ---------- */
  let queued = false;
  const refresh = () => { queued = false; decorate(); syncPlayground(); };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(refresh); } };
  const lifted = curtain();
  light(); glowFollow();
  lifted.then(() => { root.classList.add('stage-ready'); schedule(); });
  if (app && isStudent && 'MutationObserver' in window) new MutationObserver(schedule).observe(app, { childList: true, subtree: true });
})();
