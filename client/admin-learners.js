(function () {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const count = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const number = value => count(value).toLocaleString('ko-KR');
  const kstMonth = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit' }).format(new Date());
  function duration(value) {
    const seconds = count(value), hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60), rest = seconds % 60;
    if (hours) return hours + '시간 ' + minutes + '분';
    if (minutes) return minutes + '분' + (rest ? ' ' + rest + '초' : '');
    return seconds + '초';
  }
  function dateTime(value) {
    const ms = typeof value === 'number' ? value : NaN;
    return Number.isFinite(ms) && ms > 0 ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms)) : '기록 없음';
  }
  function avatarHTML(learner) {
    if (window.CuteCharacters?.render) {
      const source = learner.avatar && typeof learner.avatar === 'object' ? learner.avatar : {};
      const limits = { species: 12, skin: 5, hair: 5, eyes: 3, outfit: 5, accessory: 5, color: 7 }, avatar = {};
      for (const [key, limit] of Object.entries(limits)) avatar[key] = typeof source[key] === 'number' && Number.isFinite(source[key]) ? Math.min(limit, count(source[key])) : key === 'skin' ? 1 : 0;
      return window.CuteCharacters.render(avatar);
    }
    return '<span class="al-avatar-initial">' + esc(Array.from(String(learner.nickname || '?'))[0]) + '</span>';
  }
  function accuracy(correct, total) { return count(total) ? number(correct) + ' / ' + number(total) + '문제 (' + Math.round(count(correct) / count(total) * 100) + '%)' : '기록 없음'; }

  function mount(host, options) {
    if (!host) throw new Error('학생 현황 표시 위치 확인');
    let config = { ...options }, destroyed = false, sequence = 0, data = null, month = kstMonth(), roomId = '', search = '';
    const $ = selector => host.querySelector(selector);
    host.innerHTML = '<div class="admin-learners"><form class="al-filters" data-al-filter-form><label>조회 월 <input type="month" data-al-month value="' + month + '" max="' + month + '" required></label><label>반 <select data-al-room><option value="">전체 반</option></select></label><label class="al-search">학생 검색 <input type="search" data-al-search placeholder="닉네임 검색" maxlength="80" autocomplete="off"></label><button class="al-refresh" type="submit" data-al-refresh>새로고침 <span aria-hidden="true">↻</span></button></form><div class="al-status" data-al-status role="status" aria-live="polite"></div><div data-al-content></div><aside class="al-scope"><strong>집계 기준</strong><p>한국 시간(KST) · 선택 월의 서버 저장 기록</p><p>수업 학습 시간은 수업 퀘스트에 기록된 시간만 집계. 카드 학습 시간은 측정하지 않음. 게임 시간은 수업 학습 시간에 미포함.</p><p>반 필터는 소속 학생 선택 기준. 학습 기록은 해당 학생의 사이트 전체 기록.</p></aside></div>';

    function setStatus(message, error) { const element = $('[data-al-status]'); element.textContent = message; element.classList.toggle('is-error', !!error); }
    function summaryHTML(summary) {
      const stats = [
        ['학생', number(summary.learnerCount), '명', '전체 조회 학생'],
        ['학습 참여', number(summary.activeLearners), '명', '선택 월의 활동 학생'],
        ['수업 학습 시간', duration(summary.studySeconds), '', '수업 퀘스트 기록'],
        ['획득 포인트', number(summary.points), 'XP', '학습 ' + number(summary.studyPoints) + ' · 게임 ' + number(summary.gamePoints)]
      ];
      return '<dl class="al-summary">' + stats.map(([label, value, unit, note]) => '<div><dt>' + label + '</dt><dd>' + value + (unit ? ' <span>' + unit + '</span>' : '') + '</dd><small>' + note + '</small></div>').join('') + '</dl>';
    }
    // 반 관리: 반을 만들고, 아래 표에서 학생마다 소속 반을 고른다.
    function roomsHTML(rooms) {
      const list = Array.isArray(rooms) ? rooms : [];
      return '<section class="al-rooms" aria-label="반 관리"><h2>반</h2><p>반을 만든 뒤, 아래 표에서 학생 이름 밑의 칸으로 소속 반을 골라 주세요. 고르면 바로 저장돼요.</p><form class="al-room-form" data-al-room-form><input name="name" maxlength="40" placeholder="새 반 이름 (예: 주일 오후반)" aria-label="새 반 이름"><button type="submit" class="button primary">반 만들기</button></form><ul class="al-room-list">' + (list.length ? list.map(room => '<li><strong>' + esc(room.name || '이름 없는 반') + '</strong><span>' + number(room.memberCount) + '명 · 입장 코드 ' + esc(room.code || '') + '</span><button type="button" class="al-room-remove" data-al-room-remove="' + esc(room.id) + '">지우기</button></li>').join('') : '<li class="al-room-empty">아직 만든 반이 없어요.</li>') + '</ul><p class="al-room-status" data-al-room-status role="status" aria-live="polite"></p></section>';
    }
    function learnerHTML(learner) {
      const mine = Array.isArray(learner.rooms) ? learner.rooms : [], currentRoom = (mine.find(room => room.isCurrent) || mine[0] || {}).id || '';
      const rooms = '<select class="al-assign" data-al-assign="' + esc(learner.id) + '" aria-label="' + esc(learner.nickname || '학생') + ' 소속 반"><option value="">반 없음</option>' + (data?.rooms || []).map(room => '<option value="' + esc(room.id) + '"' + (room.id === currentRoom ? ' selected' : '') + '>' + esc(room.name || '이름 없는 반') + '</option>').join('') + '</select>';
      const name = learner.nickname || '닉네임 없음';
      return '<tr class="al-student-row"><th scope="row"><div class="al-student"><span class="al-avatar" aria-hidden="true">' + avatarHTML(learner) + '</span><span><strong>' + esc(name) + '</strong><small>' + rooms + '</small></span></div></th><td data-label="수업 학습 시간"><strong>' + duration(learner.studySeconds) + '</strong></td><td data-label="수업 완료">' + number(learner.completedLessons) + '<span class="al-unit">회</span></td><td data-label="게임 완료">' + number(learner.gameCount) + '<span class="al-unit">회</span></td><td data-label="학습 XP">' + number(learner.studyPoints) + '</td><td data-label="게임 XP">' + number(learner.gamePoints) + '</td><td data-label="최근 학습"><time>' + dateTime(learner.lastStudiedInMonthAt) + '</time></td><td class="al-details-cell"><details class="al-student-details"><summary>' + esc(name) + ' 상세</summary><dl><div><dt>선택 월 학습일</dt><dd>' + number(learner.activeDays) + '일</dd></div><div><dt>리딩 읽은 날</dt><dd>' + number(learner.readingDays) + '일</dd></div><div><dt>수업 완료 · 중복 제외</dt><dd>' + number(learner.completedUniqueLessons) + '개</dd></div><div><dt>수업 퀴즈 정답</dt><dd>' + accuracy(learner.quizCorrect, learner.quizAnswered) + '</dd></div><div><dt>게임 정답</dt><dd>' + accuracy(learner.gameCorrect, learner.gameQuestions) + '</dd></div><div><dt>누적 암기 카드</dt><dd>' + number(learner.flashcardKnown) + '개</dd></div><div><dt>누적 복습 카드</dt><dd>' + number(learner.reviewedCardCount) + '개 · ' + number(learner.reviewedCards) + '회</dd></div><div><dt>전체 기간 최근 학습</dt><dd>' + dateTime(learner.lastStudiedAt) + '</dd></div></dl><p>누적 암기·복습 카드와 전체 기간 최근 학습은 조회 월과 무관한 기록.</p></details></td></tr>';
    }
    function render() {
      if (destroyed || !data) return;
      const normalized = search.trim().toLocaleLowerCase('ko-KR');
      const learners = data.learners.filter(learner => !normalized || String(learner.nickname || '').toLocaleLowerCase('ko-KR').includes(normalized));
      const content = $('[data-al-content]');
      content.innerHTML = roomsHTML(data.rooms) + summaryHTML(data.summary) + '<div class="al-results-heading"><h2>학생별 학습 기록</h2><p>' + number(learners.length) + '명' + (normalized ? ' · 닉네임 검색 결과' : '') + ' <span>요약은 월·반 전체 기준</span></p></div>' + (learners.length ? '<div class="al-table-wrap" tabindex="0" role="region" aria-label="학생별 월간 학습 현황"><table class="al-table"><caption class="al-sr-only">' + esc(month) + ' 학생별 수업 학습 시간·완료 횟수·포인트·최근 학습 기록</caption><thead><tr><th scope="col">학생 · 반</th><th scope="col">수업 학습 시간</th><th scope="col">수업 완료</th><th scope="col">게임 완료</th><th scope="col">학습 XP</th><th scope="col">게임 XP</th><th scope="col">최근 학습 <small>선택 월</small></th><th scope="col">상세</th></tr></thead><tbody>' + learners.map(learnerHTML).join('') + '</tbody></table></div><p class="al-table-note">수업 완료 횟수는 재학습 포함 · 상세에서 중복 제외 수업 수와 누적 카드 기록 확인</p>' : '<div class="al-empty"><span aria-hidden="true">◎</span><h3>' + (normalized ? '검색 결과 없음' : '조회 학생 없음') + '</h3><p>' + (normalized ? '닉네임 확인 또는 검색어 변경' : roomId ? '선택한 반의 등록 학생 없음' : '계정과 캐릭터를 등록한 학생부터 표시. 학습 기록이 없으면 0으로 표시.') + '</p></div>');
    }
    function renderRooms() {
      const select = $('[data-al-room]');
      select.innerHTML = '<option value="">전체 반</option>' + data.rooms.map(room => '<option value="' + esc(room.id) + '">' + esc(room.name || '이름 없는 반') + ' · ' + number(room.memberCount) + '명</option>').join('');
      select.value = roomId;
      // A removed class no longer has an option; allow returning to all classes.
      if (roomId && !data.rooms.some(room => String(room.id) === roomId)) {
        const option = document.createElement('option'); option.value = roomId; option.textContent = '선택한 반'; select.appendChild(option); select.value = roomId;
      }
    }
    async function load() {
      if (destroyed) return;
      const ownSequence = ++sequence;
      data = null; $('[data-al-content]').replaceChildren(); host.setAttribute('aria-busy', 'true'); setStatus('학습 현황 조회 중');
      $('[data-al-refresh]')?.setAttribute('disabled', '');
      try {
        const result = await config.request('admin/learners?month=' + encodeURIComponent(month) + (roomId ? '&roomId=' + encodeURIComponent(roomId) : ''));
        if (destroyed || ownSequence !== sequence) return;
        if (!result || !Array.isArray(result.learners) || !Array.isArray(result.rooms) || !result.summary || typeof result.summary !== 'object') throw new Error('학습 현황 응답 확인 후 재시도');
        data = result; renderRooms(); render(); setStatus(month.replace('-', '년 ') + '월 · 조회 완료');
      } catch (error) {
        if (destroyed || ownSequence !== sequence) return;
        data = null; $('[data-al-content]').replaceChildren();
        setStatus(error.status === 401 ? '로그인 만료 · 재로그인 필요' : error.message || '학습 현황 조회 실패', true);
        if (error.status !== 401) $('[data-al-content]').innerHTML = '<div class="al-empty al-load-error"><h3>조회 실패</h3><p>연결 확인 후 재시도</p><button class="al-refresh" type="button" data-al-retry>다시 조회</button></div>';
      } finally {
        if (!destroyed && ownSequence === sequence) { host.removeAttribute('aria-busy'); $('.al-refresh')?.removeAttribute('disabled'); }
      }
    }
    function onSubmit(event) { if (!event.target.hasAttribute('data-al-filter-form')) return; event.preventDefault(); load(); }
    function onChange(event) {
      if (event.target.hasAttribute('data-al-month')) {
        const next = event.target.value;
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(next) || next > kstMonth()) { event.target.value = month; setStatus('현재 월까지 조회 가능', true); return; }
        month = next; load();
      } else if (event.target.hasAttribute('data-al-room')) { roomId = event.target.value; load(); }
    }
    function onInput(event) { if (event.target.hasAttribute('data-al-search')) { search = event.target.value; render(); } }
    function onClick(event) { if (event.target.closest('[data-al-retry]')) load(); }
    host.addEventListener('submit', onSubmit); host.addEventListener('change', onChange); host.addEventListener('input', onInput); host.addEventListener('click', onClick);
    load();
    const roomNote = (message, error) => { const node = host.querySelector('[data-al-room-status]'); if (node) { node.textContent = message; node.classList.toggle('error', !!error); } };
    let removeArmed = null;
    host.addEventListener('submit', async event => {
      const form = event.target.closest('[data-al-room-form]'); if (!form || destroyed) return; event.preventDefault();
      const name = form.elements.name.value.trim(); if (!name) { roomNote('반 이름을 써 주세요.', true); form.elements.name.focus(); return; }
      try { await config.request('admin/room', { name }); await load(); roomNote('‘' + name + '’ 반을 만들었어요.'); } catch (error) { roomNote(error.message, true); }
    });
    host.addEventListener('change', async event => {
      const select = event.target.closest('[data-al-assign]'); if (!select || destroyed) return; select.disabled = true;
      try { await config.request('admin/room/assign', { learnerId: select.dataset.alAssign, roomId: select.value || null }); const label = select.selectedOptions[0]?.textContent || ''; await load(); roomNote('소속 반 저장 완료 · ' + label); }
      catch (error) { select.disabled = false; roomNote(error.message, true); }
    });
    host.addEventListener('click', async event => {
      const button = event.target.closest('[data-al-room-remove]'); if (!button || destroyed) return;
      if (removeArmed !== button.dataset.alRoomRemove) { removeArmed = button.dataset.alRoomRemove; button.textContent = '한 번 더 누르면 지워요'; setTimeout(() => { if (removeArmed === button.dataset.alRoomRemove) { removeArmed = null; if (button.isConnected) button.textContent = '지우기'; } }, 4000); return; }
      removeArmed = null;
      try { await config.request('admin/room/remove', { roomId: button.dataset.alRoomRemove }); await load(); roomNote('반을 지웠어요. 그 반 학생은 ‘반 없음’이 됐어요.'); } catch (error) { roomNote(error.message, true); }
    });
    return {
      update(next) { if (destroyed) return; config = { ...config, ...(next || {}) }; if (next?.refresh !== false) return load(); },
      destroy() { if (destroyed) return; destroyed = true; sequence++; host.removeEventListener('submit', onSubmit); host.removeEventListener('change', onChange); host.removeEventListener('input', onInput); host.removeEventListener('click', onClick); host.removeAttribute('aria-busy'); host.replaceChildren(); data = null; }
    };
  }
  window.AdminLearners = { mount };
})();
