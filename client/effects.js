(function () {
  'use strict';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const raf = callback => window.requestAnimationFrame ? window.requestAnimationFrame(callback) : window.setTimeout(() => callback(Date.now()), 16);
  const caf = id => window.cancelAnimationFrame ? window.cancelAnimationFrame(id) : window.clearTimeout(id);
  const now = () => window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now();
  const media = query => window.matchMedia ? window.matchMedia(query) : { matches: false };
  const reducedPreference = media('(prefers-reduced-motion: reduce)');
  let active = null, booted = false;

  function boot() {
    if (booted) return;
    booted = true;
    const loader = document.querySelector('#arcade-loader');
    const value = loader && loader.querySelector('[data-loader-value]');
    const bar = loader && loader.querySelector('[data-loader-bar]');
    let closed = false, ready = document.readyState === 'complete', fontsReady = !document.fonts;
    function progress() {
      const percent = closed ? 100 : 15 + (document.readyState !== 'loading' ? 20 : 0) + (ready ? 35 : 0) + (fontsReady ? 30 : 0);
      if (value) value.textContent = String(percent).padStart(2, '0');
      if (bar) { bar.style.transform = 'scaleX(' + percent / 100 + ')'; bar.setAttribute('aria-valuenow', percent); }
    }
    function close() {
      if (closed) return;
      closed = true;
      progress();
      if (loader) {
        loader.classList.add('is-complete');
        loader.setAttribute('aria-hidden', 'true');
        window.setTimeout(() => { loader.hidden = true; }, reducedPreference.matches ? 0 : 450);
      }
    }
    function settle() { progress(); if (ready && fontsReady) close(); }
    if (loader) {
      const skip = loader.querySelector('[data-loader-skip]');
      if (skip) skip.addEventListener('click', close, { once: true });
      progress();
      window.setTimeout(close, 1500);
      if (document.fonts && document.fonts.ready) Promise.resolve(document.fonts.ready).catch(() => {}).then(() => { fontsReady = true; settle(); });
      if (ready) settle();
      else window.addEventListener('load', () => { ready = true; settle(); }, { once: true });
      document.addEventListener('DOMContentLoaded', progress, { once: true });
    }

    const cursor = document.querySelector('#arcade-cursor');
    const pointerFine = media('(pointer: fine)');
    if (cursor && pointerFine.matches && !reducedPreference.matches) {
      document.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch') return;
        cursor.style.setProperty('--cursor-x', event.clientX + 'px');
        cursor.style.setProperty('--cursor-y', event.clientY + 'px');
        cursor.classList.add('is-active');
        cursor.classList.toggle('is-hovering', !!event.target.closest('button,a,input,select,textarea,[role="button"]'));
      }, { passive: true });
      document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    }
    const progressBar = document.querySelector('[data-scroll-progress]');
    if (progressBar) {
      let pending = false;
      function update() {
        pending = false;
        const height = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const amount = height ? clamp((window.scrollY || 0) / height, 0, 1) : 0;
        progressBar.style.transform = 'scaleX(' + amount + ')';
      }
      function request() { if (!pending) { pending = true; raf(update); } }
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request, { passive: true });
      update();
    }
  }

  function mount(root) {
    if (active) active.destroy();
    if (!root || !root.querySelectorAll) return { destroy() {} };
    const cleanups = [], boards = [], horizontal = [];
    let destroyed = false, scrollFrame = 0;
    let reduced = reducedPreference.matches;
    const listen = (target, event, handler, options) => {
      if (!target || !target.addEventListener) return;
      target.addEventListener(event, handler, options);
      cleanups.push(() => target.removeEventListener(event, handler, options));
    };

    listen(root, 'click', event => {
      const control = event.target.closest('[data-scroll-to]');
      if (!control || !root.contains(control)) return;
      const id = control.getAttribute('data-scroll-to');
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      window.scrollTo({ top: Math.max(0, (window.scrollY || 0) + target.getBoundingClientRect().top - 88), behavior: reduced ? 'instant' : 'smooth' });
    });

    root.querySelectorAll('[data-spotlight]').forEach(room => {
      const phrases = [...room.querySelectorAll('[data-spotlight-phrase]')];
      const pinned = new Set();
      room.style.setProperty('--spot-x', '50%');
      room.style.setProperty('--spot-y', '50%');
      listen(room, 'pointermove', event => {
        const bounds = room.getBoundingClientRect();
        room.style.setProperty('--spot-x', clamp(event.clientX - bounds.left, 0, bounds.width) + 'px');
        room.style.setProperty('--spot-y', clamp(event.clientY - bounds.top, 0, bounds.height) + 'px');
        room.classList.add('spotlight-active');
        phrases.forEach(phrase => {
          const rect = phrase.getBoundingClientRect();
          const distance = Math.hypot(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
          phrase.classList.toggle('is-lit', distance < Math.max(135, rect.width * .53) || pinned.has(phrase) || phrase === document.activeElement);
        });
      }, { passive: true });
      listen(room, 'pointerleave', () => {
        room.classList.remove('spotlight-active');
        phrases.forEach(phrase => phrase.classList.toggle('is-lit', pinned.has(phrase) || phrase === document.activeElement));
      });
      phrases.forEach(phrase => {
        listen(phrase, 'focus', () => phrase.classList.add('is-lit'));
        listen(phrase, 'blur', () => { if (!pinned.has(phrase)) phrase.classList.remove('is-lit'); });
        listen(phrase, 'click', () => {
          if (pinned.has(phrase)) pinned.delete(phrase); else pinned.add(phrase);
          phrase.classList.toggle('is-revealed', pinned.has(phrase));
          phrase.classList.toggle('is-lit', pinned.has(phrase) || phrase === document.activeElement);
          phrase.setAttribute('aria-pressed', pinned.has(phrase) ? 'true' : 'false');
        });
      });
      cleanups.push(() => {
        room.classList.remove('spotlight-active');
        phrases.forEach(phrase => { phrase.classList.remove('is-lit', 'is-revealed'); phrase.removeAttribute('aria-pressed'); });
      });
    });

    const depthCards = [...root.querySelectorAll('[data-depth-card]')];
    depthCards.forEach((card, index) => { card.dataset.depthIndex = index; });

    root.querySelectorAll('[data-horizontal-scroll]').forEach(section => {
      const track = section.querySelector('[data-horizontal-track]');
      if (!track) return;
      const pin = section.querySelector('.reward-pin') || track.parentElement;
      const record = { section, track, pin, overflow: 0, distance: 0, progress: 0, enabled: false, originalHeight: section.style.height, originalTransform: track.style.transform };
      horizontal.push(record);
      function move(direction) {
        if (record.enabled) {
          const step = Math.min(1, Math.max(.2, (pin.clientWidth || 600) / Math.max(1, record.overflow)));
          const target = clamp(record.progress + direction * step, 0, 1);
          const top = (window.scrollY || 0) + section.getBoundingClientRect().top - 88 + target * record.distance;
          window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
        } else if (track.scrollBy) track.scrollBy({ left: direction * Math.max(250, (track.clientWidth || 300) * .8), behavior: reduced ? 'instant' : 'smooth' });
      }
      listen(section.querySelector('[data-reward-next]'), 'click', () => move(1));
      listen(section.querySelector('[data-reward-prev]'), 'click', () => move(-1));
      cleanups.push(() => {
        section.style.height = record.originalHeight;
        track.style.transform = record.originalTransform;
        section.classList.remove('is-horizontal-pinned');
      });
    });

    root.querySelectorAll('[data-flip-card]').forEach(card => {
      const originalExpanded = card.getAttribute('aria-expanded');
      const front = card.querySelector('.reward-front'), back = card.querySelector('.reward-back');
      const backControls = back ? [...back.querySelectorAll('a,button,input,select,textarea,[tabindex]')].map(element => ({ element, tabindex: element.getAttribute('tabindex') })) : [];
      function accessibility(expanded) {
        if (front) front.setAttribute('aria-hidden', String(expanded));
        if (back) {
          back.setAttribute('aria-hidden', String(!expanded));
          if (expanded) back.removeAttribute('inert'); else back.setAttribute('inert', '');
          backControls.forEach(({ element, tabindex }) => {
            if (!expanded) element.setAttribute('tabindex', '-1');
            else if (tabindex === null) element.removeAttribute('tabindex');
            else element.setAttribute('tabindex', tabindex);
          });
        }
      }
      function flip() {
        const expanded = !card.classList.contains('is-flipped');
        card.classList.toggle('is-flipped', expanded);
        card.setAttribute('aria-expanded', String(expanded));
        accessibility(expanded);
      }
      listen(card, 'click', event => {
        const interactive = event.target.closest('a,button,input,select,textarea');
        if (interactive && interactive !== card) return;
        flip();
      });
      listen(card, 'keydown', event => {
        if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault(); flip();
      });
      accessibility(card.classList.contains('is-flipped'));
      cleanups.push(() => {
        card.classList.remove('is-flipped');
        if (originalExpanded === null) card.removeAttribute('aria-expanded'); else card.setAttribute('aria-expanded', originalExpanded);
        if (front) front.removeAttribute('aria-hidden');
        if (back) { back.removeAttribute('aria-hidden'); back.removeAttribute('inert'); }
        backControls.forEach(({ element, tabindex }) => { if (tabindex === null) element.removeAttribute('tabindex'); else element.setAttribute('tabindex', tabindex); });
      });
    });

    if (window.IntersectionObserver) {
      const revealObserver = new window.IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } });
      }, { threshold: .08, rootMargin: '0px 0px -20px' });
      root.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
      cleanups.push(() => revealObserver.disconnect());
    } else root.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));

    function layout() {
      if (destroyed) return;
      const desktop = (window.innerWidth || 1200) >= 900 && !reduced;
      horizontal.forEach(record => {
        record.overflow = Math.max(0, record.track.scrollWidth - (record.pin.clientWidth || record.section.clientWidth || window.innerWidth));
        record.enabled = desktop && record.overflow > 30;
        record.section.classList.toggle('is-horizontal-pinned', record.enabled);
        if (record.enabled) {
          const height = Math.max(record.pin.offsetHeight || 540, 360);
          record.distance = record.overflow;
          record.section.style.height = height + record.distance + 'px';
        } else {
          record.section.style.height = record.originalHeight;
          record.track.style.transform = record.originalTransform;
        }
      });
      boards.forEach(board => board.resize());
      requestScroll();
    }
    function paintScroll() {
      scrollFrame = 0;
      if (destroyed) return;
      const vh = window.innerHeight || 800;
      depthCards.forEach((card, index) => {
        if (reduced) { card.style.transform = ''; return; }
        const rect = card.getBoundingClientRect();
        const progress = clamp((vh / 2 - rect.top - rect.height / 2) / (vh * .65), -1, 1);
        const sign = index % 2 ? -1 : 1;
        card.style.setProperty('--depth-progress', progress.toFixed(3));
        card.style.transform = 'perspective(1000px) translate3d(0,' + (progress * -28).toFixed(2) + 'px,0) rotateX(' + (progress * 9).toFixed(2) + 'deg) rotateY(' + (progress * sign * 6).toFixed(2) + 'deg) rotateZ(' + (sign * (1 - Math.abs(progress)) * 1.6).toFixed(2) + 'deg)';
      });
      horizontal.forEach(record => {
        if (!record.enabled) return;
        const rect = record.section.getBoundingClientRect();
        record.progress = clamp((88 - rect.top) / Math.max(1, record.distance), 0, 1);
        record.track.style.transform = 'translate3d(' + (-record.progress * record.overflow).toFixed(2) + 'px,0,0)';
        const previous = record.section.querySelector('[data-reward-prev]');
        const next = record.section.querySelector('[data-reward-next]');
        if (previous) previous.disabled = record.progress <= .001;
        if (next) next.disabled = record.progress >= .999;
      });
    }
    function requestScroll() { if (!scrollFrame && !destroyed) scrollFrame = raf(paintScroll); }
    listen(window, 'scroll', requestScroll, { passive: true });
    listen(window, 'resize', layout, { passive: true });
    listen(reducedPreference, 'change', event => { reduced = event.matches; boards.forEach(board => board.setReduced(reduced)); layout(); });

    root.querySelectorAll('[data-physics-board]').forEach(board => {
      const tokens = [...board.querySelectorAll('[data-physics-token]')];
      if (!tokens.length) return;
      const section = board.closest('.playground') || board.parentElement;
      const pauseButton = section.querySelector('[data-physics-pause]');
      const shakeButton = section.querySelector('[data-physics-shake]');
      const resetButton = section.querySelector('[data-physics-reset]');
      let width = 0, height = 0, frame = 0, lastTime = 0, visible = true, pageVisible = !document.hidden, paused = reduced, dragging = null;
      let dragHistory = [], dragOffset = { x: 0, y: 0 }, dragDistance = 0, suppressClickUntil = 0;
      const bodies = tokens.map((element, index) => ({ element, index, x: 0, y: 0, vx: 0, vy: 0, angle: 0, spin: 0, width: 0, height: 0, dragging: false }));
      const original = tokens.map(element => ({ transform: element.style.transform, position: element.style.position, left: element.style.left, top: element.style.top, touchAction: element.style.touchAction, aria: element.getAttribute('aria-label') }));

      function draw(body) { body.element.style.transform = 'translate3d(' + body.x.toFixed(2) + 'px,' + body.y.toFixed(2) + 'px,0) rotate(' + body.angle.toFixed(2) + 'deg)'; }
      function controls() {
        if (pauseButton) {
          pauseButton.textContent = paused ? '▶ 움직임 재생' : 'Ⅱ 움직임 정지';
          pauseButton.setAttribute('aria-pressed', String(paused));
        }
        board.classList.toggle('is-paused', paused);
      }
      function stopFrame() { if (frame) caf(frame); frame = 0; lastTime = 0; }
      function schedule() { if (!destroyed && !frame && visible && pageVisible && !paused) frame = raf(step); }
      function resize() {
        const rect = board.getBoundingClientRect();
        width = Math.max(240, board.clientWidth || rect.width || 800);
        height = Math.max(230, board.clientHeight || rect.height || 420);
        bodies.forEach(body => {
          body.width = Math.min(width - 12, body.element.offsetWidth || body.element.getBoundingClientRect().width || 156);
          body.height = body.element.offsetHeight || body.element.getBoundingClientRect().height || 56;
          body.x = clamp(body.x, 6, Math.max(6, width - body.width - 6));
          body.y = clamp(body.y, 6, Math.max(6, height - body.height - 6));
          draw(body);
        });
      }
      function reset() {
        resize();
        const columns = Math.max(1, Math.min(4, Math.floor(width / 190)));
        const cellWidth = width / columns;
        bodies.forEach((body, index) => {
          body.x = clamp((index % columns) * cellWidth + (cellWidth - body.width) / 2, 7, width - body.width - 7);
          body.y = clamp(20 + Math.floor(index / columns) * 78 + (index % 2) * 10, 7, height - body.height - 7);
          body.vx = ((index * 29) % 93) - 46;
          body.vy = 0;
          body.angle = ((index * 7) % 17) - 8;
          body.spin = (index % 2 ? 1 : -1) * 10;
          draw(body);
        });
        schedule();
      }
      function collide(a, b) {
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (overlapX <= 0 || overlapY <= 0 || a.dragging && b.dragging) return;
        const ax = a.x + a.width / 2, ay = a.y + a.height / 2;
        const bx = b.x + b.width / 2, by = b.y + b.height / 2;
        const vertical = overlapY < overlapX;
        const sign = vertical ? (ay < by ? -1 : 1) : (ax < bx ? -1 : 1);
        const amount = (vertical ? overlapY : overlapX) + .2;
        const shareA = a.dragging ? 0 : b.dragging ? 1 : .5;
        const shareB = b.dragging ? 0 : a.dragging ? 1 : .5;
        if (vertical) {
          a.y += sign * amount * shareA; b.y -= sign * amount * shareB;
          const relative = (a.vy - b.vy) * sign;
          if (relative < 0) { const impulse = -relative * .72; if (!a.dragging) a.vy += sign * impulse; if (!b.dragging) b.vy -= sign * impulse; }
          if (!a.dragging && !b.dragging) { a.vx *= .997; b.vx *= .997; }
        } else {
          a.x += sign * amount * shareA; b.x -= sign * amount * shareB;
          const relative = (a.vx - b.vx) * sign;
          if (relative < 0) { const impulse = -relative * .72; if (!a.dragging) a.vx += sign * impulse; if (!b.dragging) b.vx -= sign * impulse; }
        }
      }
      function bounds(body) {
        if (body.dragging) return;
        if (body.x < 6) { body.x = 6; body.vx = Math.abs(body.vx) * .64; body.spin *= -.5; }
        if (body.x > width - body.width - 6) { body.x = Math.max(6, width - body.width - 6); body.vx = -Math.abs(body.vx) * .64; body.spin *= -.5; }
        if (body.y < 6) { body.y = 6; body.vy = Math.abs(body.vy) * .5; }
        if (body.y > height - body.height - 6) {
          body.y = Math.max(6, height - body.height - 6);
          body.vy = Math.abs(body.vy) < 48 ? 0 : -Math.abs(body.vy) * .47;
          body.vx *= .96;
          body.spin *= .82;
        }
      }
      function step(timestamp) {
        frame = 0;
        if (destroyed || paused || !visible || !pageVisible) { lastTime = 0; return; }
        const dt = Math.min(.032, Math.max(.001, lastTime ? (timestamp - lastTime) / 1000 : .016));
        lastTime = timestamp;
        bodies.forEach(body => {
          if (body.dragging) return;
          body.vy = Math.min(1600, body.vy + 920 * dt);
          body.x += body.vx * dt; body.y += body.vy * dt;
          body.angle = clamp(body.angle + body.spin * dt, -23, 23);
          body.vx *= Math.pow(.998, dt * 60);
          bounds(body);
        });
        for (let iteration = 0; iteration < 3; iteration++) {
          for (let a = 0; a < bodies.length; a++) for (let b = a + 1; b < bodies.length; b++) collide(bodies[a], bodies[b]);
          bodies.forEach(bounds);
        }
        bodies.forEach(draw);
        schedule();
      }
      function localPoint(event) { const rect = board.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top, t: now() }; }
      function release(event) {
        if (!dragging || event && event.pointerId !== undefined && event.pointerId !== dragging.pointerId) return;
        const body = dragging;
        body.dragging = false;
        body.element.classList.remove('is-dragging');
        board.classList.remove('is-physics-dragging');
        const end = dragHistory[dragHistory.length - 1];
        const start = [...dragHistory].reverse().find(point => end.t - point.t >= 40) || dragHistory[0];
        if (start && end) {
          const dt = Math.max(.025, (end.t - start.t) / 1000);
          body.vx = clamp((end.x - start.x) / dt, -1400, 1400);
          body.vy = clamp((end.y - start.y) / dt, -1300, 1300);
          body.spin = clamp(body.vx / 8, -180, 180);
        }
        if (dragDistance > 7) suppressClickUntil = now() + 420;
        try { body.element.releasePointerCapture(body.pointerId); } catch (_) { /* Capture may already be released. */ }
        dragging = null;
        schedule();
      }
      bodies.forEach(body => {
        body.element.style.position = 'absolute';
        body.element.style.left = '0px'; body.element.style.top = '0px';
        body.element.style.touchAction = 'none';
        const text = body.element.getAttribute('data-en') || body.element.getAttribute('data-say') || body.element.textContent.trim();
        body.element.setAttribute('aria-label', text + ' · 듣기 · 방향키 이동 · 끌어 던지기');
        listen(body.element, 'pointerdown', event => {
          if (event.button !== undefined && event.button !== 0 || dragging) return;
          const point = localPoint(event);
          dragging = body; body.dragging = true; body.pointerId = event.pointerId;
          body.vx = body.vy = 0;
          dragOffset = { x: point.x - body.x, y: point.y - body.y };
          dragHistory = [point]; dragDistance = 0;
          body.element.classList.add('is-dragging'); board.classList.add('is-physics-dragging');
          try { body.element.setPointerCapture(event.pointerId); } catch (_) { /* Window events preserve dragging if capture is unavailable. */ }
        });
        listen(body.element, 'click', event => {
          if (now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
        }, true);
        listen(body.element, 'keydown', event => {
          const changes = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
          if (!changes[event.key]) return;
          event.preventDefault(); event.stopPropagation();
          const change = changes[event.key], distance = event.shiftKey ? 45 : 16;
          body.x = clamp(body.x + change[0] * distance, 6, width - body.width - 6);
          body.y = clamp(body.y + change[1] * distance, 6, height - body.height - 6);
          body.vx = body.vy = 0;
          draw(body);
        });
      });
      listen(window, 'pointermove', event => {
        if (!dragging || event.pointerId !== dragging.pointerId) return;
        if (event.cancelable) event.preventDefault();
        const point = localPoint(event), previous = dragHistory[dragHistory.length - 1];
        dragDistance += Math.hypot(point.x - previous.x, point.y - previous.y);
        dragHistory.push(point); if (dragHistory.length > 8) dragHistory.shift();
        dragging.x = clamp(point.x - dragOffset.x, 6, width - dragging.width - 6);
        dragging.y = clamp(point.y - dragOffset.y, 6, height - dragging.height - 6);
        dragging.angle = clamp((point.x - previous.x) * .35, -18, 18);
        draw(dragging);
      }, { passive: false });
      listen(window, 'pointerup', release);
      listen(window, 'pointercancel', release);
      listen(pauseButton, 'click', () => { paused = !paused; controls(); if (paused) stopFrame(); else schedule(); });
      listen(shakeButton, 'click', () => {
        if (reduced || paused) {
          bodies.forEach(body => { body.x = 7 + Math.random() * Math.max(0, width - body.width - 14); body.y = 7 + Math.random() * Math.max(0, height - body.height - 14); body.angle = Math.random() * 28 - 14; draw(body); });
        } else {
          bodies.forEach(body => { if (!body.dragging) { body.vx += (Math.random() - .5) * 950; body.vy = -350 - Math.random() * 450; body.spin = (Math.random() - .5) * 180; } });
          schedule();
        }
      });
      listen(resetButton, 'click', reset);
      listen(document, 'visibilitychange', () => { pageVisible = !document.hidden; if (pageVisible) schedule(); else stopFrame(); });
      const record = {
        resize,
        setReduced(value) { if (value) { paused = true; controls(); stopFrame(); } },
        snapshot() { return { paused, visible, width, height, bodies: bodies.map(body => ({ x: body.x, y: body.y, width: body.width, height: body.height, dragging: body.dragging })) }; }
      };
      boards.push(record);
      if (window.IntersectionObserver) {
        const observer = new window.IntersectionObserver(entries => {
          visible = entries.some(entry => entry.isIntersecting);
          if (visible) schedule(); else stopFrame();
        }, { threshold: 0 });
        observer.observe(board); cleanups.push(() => observer.disconnect());
      }
      board.classList.add('is-physics-ready');
      controls(); reset();
      cleanups.push(() => {
        release(); stopFrame();
        board.classList.remove('is-physics-ready', 'is-paused', 'is-physics-dragging');
        tokens.forEach((element, index) => {
          Object.assign(element.style, { transform: original[index].transform, position: original[index].position, left: original[index].left, top: original[index].top, touchAction: original[index].touchAction });
          element.classList.remove('is-dragging');
          if (original[index].aria === null) element.removeAttribute('aria-label'); else element.setAttribute('aria-label', original[index].aria);
        });
      });
    });

    const controller = {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        if (scrollFrame) caf(scrollFrame);
        cleanups.splice(0).forEach(cleanup => cleanup());
        depthCards.forEach(card => { card.style.transform = ''; card.style.removeProperty('--depth-progress'); delete card.dataset.depthIndex; });
        if (active === controller) active = null;
      },
      snapshot() { return { destroyed, physics: boards.map(board => board.snapshot()), horizontal: horizontal.map(record => ({ enabled: record.enabled, progress: record.progress, overflow: record.overflow })) }; }
    };
    active = controller;
    layout();
    return controller;
  }

  window.ArcadeEffects = { boot, mount, destroy() { if (active) active.destroy(); } };
  boot();
})();
