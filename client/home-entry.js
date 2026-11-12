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
    function render() {
      if (destroyed) return;
      const current = lesson(), progress = todayProgress(), account = !!(state.authenticated && state.user), room = state.room;
      const accountLabel = !state.authenticated ? '로그인·캐릭터 설정' : !state.user ? '캐릭터 설정' : room ? '반 확인' : '반 코드 참여';
      const accountNote = !state.authenticated ? '로그인 후 캐릭터 저장' : !state.user ? '별명·캐릭터 저장 후 계정 기록' : room ? String(room.name || '참여한 반') : '계정 설정 완료 · 반 참여 선택';
      const timeText = progress.unknown ? '수업 시간 집계 확인' : '수업 기록 ' + progress.minutes + '분 / 목표 20분';
      const completionLabel = progress.completed ? progress.seconds >= 1200 ? '오늘 20분 목표 완료' : '오늘 퀘스트 완료' : current.active ? '진행 중인 복습' : '오늘의 복습';
      root.innerHTML = '<div class="he-grid"><div class="he-study"><p class="he-eyebrow">AJ ENGLISH · 주간 수업 복습</p><h1>오늘의 <em>20분</em> 복습</h1><p class="he-lesson"><span>DAY ' + esc(current.id) + '</span><strong>' + esc(current.title) + '</strong></p><div class="he-progress-heading"><span class="he-completion ' + (progress.completed ? 'is-complete' : '') + '">' + completionLabel + '</span><span data-he-time>' + timeText + '</span></div><div class="he-progress" role="progressbar" aria-label="오늘의 20분 수업 복습 목표" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress.percent + '" aria-valuetext="' + esc(timeText) + '"><i style="width:' + progress.percent + '%"></i></div><button type="button" class="he-start" data-he-action="start" ' + (busy || typeof initial.onStart !== 'function' ? 'disabled' : '') + '>' + actionLabel() + '<span aria-hidden="true">→</span></button><p class="he-main-note">듣기 5분 · 말하기 5분 · 대화 7분 · 퀴즈 3분</p>' + (progress.completed ? '<p class="he-record-note">오늘 첫 완료 기록 있음 · 추가 복습 가능</p>' : '') + '</div>' +
        '<aside class="he-class" aria-label="정기 수업 일정"><div class="he-class-top"><span data-he-class-label>다음 수업</span><strong class="he-dday" data-he-dday></strong></div><time data-he-class-date></time><p class="he-class-time">일요일 <strong>16:00–17:00</strong> <span>KST</span></p><p class="he-class-note">주일 오후 예배 후 · 매주 1시간</p><div class="he-class-divider" aria-hidden="true"></div><p class="he-class-source">매주 수업 · 매일 20분 복습<br>레일 퀘스트 10문제와 별도 진행</p></aside></div>' +
        '<section class="he-guide" aria-labelledby="he-guide-title"><div class="he-guide-title"><h2 id="he-guide-title">학습 순서</h2><p>반 참여는 선택 · 반 없이도 학습 가능</p></div><ol class="he-steps"><li class="he-step ' + (account ? 'is-complete' : '') + '"><span class="he-step-number" aria-hidden="true">01</span><div><h3>로그인·캐릭터</h3><p>' + esc(accountNote) + '</p><button type="button" class="he-step-action" data-he-action="join" ' + (busy || typeof initial.onJoin !== 'function' ? 'disabled' : '') + '>' + esc(accountLabel) + ' <span aria-hidden="true">↗</span></button></div></li><li class="he-step"><span class="he-step-number" aria-hidden="true">02</span><div><h3>단어 복습</h3><p>매일 영단어 · 말하기 문장 카드</p><button type="button" class="he-step-action" data-he-action="words" ' + (busy || typeof initial.onWords !== 'function' ? 'disabled' : '') + '>복습 카드 <span aria-hidden="true">↗</span></button></div></li><li class="he-step ' + (progress.completed ? 'is-complete' : '') + '"><span class="he-step-number" aria-hidden="true">03</span><div><h3>20분 퀘스트</h3><p>' + (progress.completed ? '오늘 완료 기록 있음 · 추가 복습 가능' : '상단 버튼으로 시작 · 완료 후 기록 저장') + '</p><span class="he-step-note">수업 시간만 목표에 반영</span></div></li></ol></section><p class="he-status" role="status" aria-live="polite">' + esc(error) + '</p>';
      updateSchedule();
    }
    async function onClick(event) {
      const button = event.target.closest('[data-he-action]');
      if (!button || !root.contains(button) || button.disabled || destroyed || busy) return;
      const action = button.dataset.heAction, callback = action === 'start' ? initial.onStart : action === 'join' ? initial.onJoin : initial.onWords;
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
