(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const kstDate = ms => new Date(ms + 32400000).toISOString().slice(0, 10);

  function classSchedule(now) {
    const local = new Date(now + 32400000), weekday = local.getUTCDay();
    let days = (7 - weekday) % 7;
    let start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + days, 7);
    const inClass = weekday === 0 && now >= start && now < start + 3600000;
    if (weekday === 0 && now >= start + 3600000) { start += 7 * 86400000; days = 7; }
    return { start, end: start + 3600000, days, inClass };
  }

  function mount(container, initial = {}) {
    if (!container?.replaceChildren) throw new Error('HomeEntry requires a container.');
    let state = initial.state || {}, content = initial.content || {}, nextDay = initial.nextDay || { id: 1 };
    let destroyed = false, busy = '', error = '', actionVersion = 0;
    const root = document.createElement('section'); root.className = 'home-entry'; root.setAttribute('aria-label', '오늘의 복습과 다음 수업');
    container.replaceChildren(root);
    const $ = selector => root.querySelector(selector);

    function lesson() {
      const active = state.activeSession;
      return { id: Number(active?.day || nextDay?.id) || 1, title: active?.lesson?.title || nextDay?.title || content.activeChapter?.title || '비즈니스 영어', active: !!active };
    }
    function todayProgress() {
      const completed = state.progress?.todayCompleted === true;
      const rows = Array.isArray(state.progress?.activity) ? state.progress.activity : [];
      const record = rows.find(row => row.date === kstDate(Date.now()));
      const provided = finite(record?.questSeconds), unknown = !!record && !provided || completed && !record;
      const seconds = provided ? Math.max(0, record.questSeconds) : 0;
      return { completed, unknown, seconds, minutes: Math.floor(seconds / 60), percent: Math.min(100, Math.round(seconds / 1200 * 100)) };
    }
    function actionLabel() {
      if (busy === 'start') return '학습 연결 중';
      if (lesson().active) return '20분 복습 이어하기';
      if (state.progress?.todayCompleted === true) return '20분 추가 복습';
      return '오늘 20분 복습 시작';
    }
    function updateSchedule() {
      if (destroyed || !$('[data-he-class-date]')) return;
      const schedule = classSchedule(Date.now());
      const date = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(schedule.start));
      $('[data-he-class-label]').textContent = schedule.inClass ? '오늘 수업' : '다음 수업';
      const time = $('[data-he-class-date]'); time.textContent = date; time.setAttribute('datetime', new Date(schedule.start).toISOString());
      const badge = $('[data-he-dday]'); badge.textContent = schedule.inClass ? '수업 중' : schedule.days === 0 ? 'D-DAY' : 'D-' + schedule.days;
      badge.classList.toggle('is-live', schedule.inClass); badge.setAttribute('aria-label', schedule.inClass ? '현재 수업 시간' : schedule.days === 0 ? '오늘 수업 예정' : '다음 수업까지 ' + schedule.days + '일');
    }
    // 오늘의 퀘스트 판: 처음 보이는 것은 '눌러서 바로 시작하는 퀘스트' — 설명을 읽지 않아도 누르면 공부가 시작된다.
    const ICON = {
      rail: '<path d="M5 5h14a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2Zm-2 6h18M8 21l1.5-3m6.5 3-1.5-3M8 14.5h.01M16 14.5h.01"/>',
      words: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H12v15H6.5A2.5 2.5 0 0 0 4 21.5Zm16 0A2.5 2.5 0 0 0 17.5 4H12v15h5.5a2.5 2.5 0 0 1 2.5 2.5Z"/>',
      start: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4.5l3 2M9.5 2.5h5"/>',
      slides: '<path d="M6 3h9l4 4v14H6ZM14 3v5h5M9 13h7M9 17h5"/>'
    };
    function railDone() { try { const saved = JSON.parse(localStorage.getItem('ajenglish-rail-daily-v2:' + kstDate(Date.now()) + ':words') || 'null'); return !!saved && saved.finished === true; } catch (_) { return false; } }
    function render() {
      if (destroyed) return;
      const current = lesson(), progress = todayProgress(), room = state.room;
      const timeText = progress.unknown ? '수업 시간 집계 확인' : progress.minutes + '분 / 20분';
      const name = state.user?.nickname ? String(state.user.nickname) : '';
      const quests = [
        { key: 'rail', title: '레일 퀘스트', note: '10문제 맞히고 기차 출발', done: railDone(), go: '출발' },
        { key: 'words', title: '단어 카드', note: '오늘의 단어·문장 뒤집어 보기', done: false, go: '뒤집기', disabled: typeof initial.onWords !== 'function' },
        { key: 'start', title: '20분 복습', note: 'DAY ' + current.id + ' · ' + current.title, done: progress.completed, go: current.active ? '이어하기' : progress.completed ? '한 번 더' : '시작', disabled: typeof initial.onStart !== 'function', meter: progress.percent, meterText: timeText }
      ];
      const next = quests.find(q => !q.done && !q.disabled) || quests[0], doneCount = quests.filter(q => q.done).length;
      const avatar = window.CuteCharacters ? window.CuteCharacters.render(state.user?.avatar || { species: 0, outfit: 3, color: 3 }, 'qb-avatar') : '';
      const points = finite(state.progress?.points) ? state.progress.points : 0, streak = finite(state.progress?.streak) ? state.progress.streak : 0;
      root.innerHTML = '<div class="qb"><div class="qb-hero"><div class="qb-char" aria-hidden="true">' + avatar + '</div><div class="qb-say"><p class="qb-hello">' + (name ? esc(name) + ', ' : '') + '오늘의 퀘스트가 도착했어요</p><h1>눌러서 바로 <em>시작</em></h1><div class="qb-chips"><span class="qb-chip"><i class="qb-star" aria-hidden="true"></i>퀘스트 ' + doneCount + ' / ' + quests.length + '</span><span class="qb-chip qb-class"><span data-he-class-label>다음 수업</span><time data-he-class-date></time><strong class="he-dday" data-he-dday></strong></span></div></div></div>' +
        '<ol class="qb-quests">' + quests.map((q, n) => '<li class="' + (q.done ? 'is-done' : q === next ? 'is-next' : '') + '"><button type="button" class="qb-quest" data-he-action="' + q.key + '" ' + (busy || q.disabled ? 'disabled' : '') + '><span class="qb-no">QUEST ' + (n + 1) + '</span><span class="qb-ico" aria-hidden="true"><svg viewBox="0 0 24 24">' + (q.done ? '<path d="m5 12.5 4.5 4.5L19 7.5"/>' : ICON[q.key]) + '</svg></span><strong>' + q.title + '</strong><small>' + esc(q.note) + '</small>' + (q.meter !== undefined ? '<span class="qb-meter" role="progressbar" aria-label="오늘의 20분 복습" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + q.meter + '" aria-valuetext="' + esc(q.meterText) + '"><i style="width:' + q.meter + '%"></i></span><span class="qb-meter-text" data-he-time>' + esc(q.meterText) + '</span>' : '') + '<span class="qb-go">' + (q.done ? '완료 · 한 번 더' : (busy === q.key ? '여는 중' : q.go)) + ' <b aria-hidden="true">▶</b></span></button></li>').join('') + '</ol>' +
        '</div>' +
        '<p class="he-status" role="status" aria-live="polite">' + esc(error) + '</p>';
      updateSchedule();
    }
    function localAction(action) {
      if (action === 'rail') {
        const target = document.querySelector('#rail-quest-home'); if (!target) return false;
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        const begin = target.querySelector('[data-rq-start]'); if (begin && !begin.disabled) begin.click(); else target.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
        return true;
      }
      if (action === 'slides') { const link = document.querySelector('.dashboard-nav [data-view="slides"]'); if (link) link.click(); else location.hash = '#slides'; return true; }
      return false;
    }
    async function onClick(event) {
      const button = event.target.closest('[data-he-action]');
      if (!button || !root.contains(button) || button.disabled || destroyed || busy) return;
      const action = button.dataset.heAction; if (localAction(action)) return;
      const callback = action === 'start' ? initial.onStart : action === 'join' ? initial.onJoin : initial.onWords;
      if (typeof callback !== 'function') return;
      const version = ++actionVersion, day = lesson().id; busy = action; error = ''; render();
      try { await callback(...(action === 'start' ? [day] : [])); }
      catch (failure) { if (!destroyed && version === actionVersion) error = failure?.message || '학습 연결 실패 · 재시도'; }
      finally { if (!destroyed && version === actionVersion) { busy = ''; render(); } }
    }
    function onVisible() { if (!document.hidden) updateSchedule(); }
    root.addEventListener('click', onClick); document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(updateSchedule, 30000); render();
    return {
      update(nextState, nextContent, nextLesson) { if (destroyed) return; state = nextState || {}; content = nextContent || {}; nextDay = nextLesson || nextDay; render(); },
      destroy() { if (destroyed) return; destroyed = true; actionVersion++; clearInterval(timer); root.removeEventListener('click', onClick); document.removeEventListener('visibilitychange', onVisible); }
    };
  }
  window.HomeEntry = { mount };
})();
