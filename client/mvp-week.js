// 주간 MVP: 일요일 오후 2시에 발표한다. 첫 화면에 얇은 띠로 보여 주고, 발표 뒤 처음 들어온 때 한 번 크게 띄운다.
(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const face = (avatar, name) => window.CuteCharacters ? window.CuteCharacters.render(avatar || { species: 0 }, name) : '';
  const when = iso => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric' }).format(new Date(iso));
  const day = date => Number(date.slice(5, 7)) + '월 ' + Number(date.slice(8)) + '일';
  function celebrate(data) {
    const key = 'ajenglish-mvp-seen:' + data.week.end + ':' + (data.scope?.id || 'all');
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (_) { return; }
    const previous = document.activeElement, wrap = document.createElement('div'); wrap.className = 'mvpw-pop'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', '이번 주 MVP');
    wrap.innerHTML = '<div class="mvpw-card"><p class="mvpw-kicker">주간 MVP · ' + esc(day(data.week.end)) + ' 발표' + (data.scope ? ' · ' + esc(data.scope.name) : '') + '</p><div class="mvpw-face" aria-hidden="true">' + face(data.winner.avatar, 'mvpw-avatar') + '</div><h2>' + esc(data.winner.nickname) + (data.winner.isMe ? ' <span>바로 나!</span>' : '') + '</h2><p class="mvpw-score"><b>' + data.winner.points.toLocaleString('ko-KR') + '</b> XP · ' + data.winner.activeDays + '일 공부</p>' +
      (data.top.length > 1 ? '<ol class="mvpw-top">' + data.top.map((row, index) => '<li' + (row.isMe ? ' class="is-me"' : '') + '><b>' + (index + 1) + '</b><span>' + esc(row.nickname) + '</span><em>' + row.points.toLocaleString('ko-KR') + ' XP</em></li>').join('') + '</ol>' : '') + '<button type="button" class="mvpw-close">축하해요!</button></div>';
    const close = () => { document.removeEventListener('keydown', onKey); wrap.remove(); previous?.focus?.(); };
    const onKey = event => { if (event.key === 'Escape') close(); };
    wrap.addEventListener('click', event => { if (event.target === wrap || event.target.closest('.mvpw-close')) close(); });
    document.addEventListener('keydown', onKey); document.body.append(wrap); wrap.querySelector('.mvpw-close').focus({ preventScroll: true });
  }
  async function mount(container, options = {}) {
    if (!container || typeof options.api !== 'function') return;
    let data; try { data = await options.api('mvp/week'); } catch (_) { return; }
    if (!container.isConnected || !data?.week) return data;
    const mine = data.authenticated ? ' · 지금 내 점수 ' + Number(data.myPoints || 0).toLocaleString('ko-KR') + ' XP' + (data.myRank ? ' (' + data.myRank + '등)' : '') : '';
    container.innerHTML = ''; (options.top && options.top.isConnected ? options.top : container).innerHTML = data.winner
      ? '<section class="mvpw" aria-label="이번 주 MVP"><span class="mvpw-mini" aria-hidden="true">' + face(data.winner.avatar, 'mvpw-avatar') + '</span><div><strong>주간 MVP · ' + esc(data.winner.nickname) + '</strong><small>' + data.winner.points.toLocaleString('ko-KR') + ' XP' + (data.scope ? ' · ' + esc(data.scope.name) : '') + ' · 다음 발표 ' + esc(when(data.nextAnnounceAt)) + mine + '</small></div></section>'
      : '<section class="mvpw is-waiting" aria-label="이번 주 MVP"><span class="mvpw-mini mvpw-cup" aria-hidden="true">★</span><div><strong>주간 MVP는 ' + esc(when(data.nextAnnounceAt)) + '에 발표해요</strong><small>20분 공부 · 단어 카드 · 게임 점수를 더해요' + mine + '</small></div></section>';
    // 이번 주 달리기: 점수만큼 캐릭터가 앞으로 나간다. 일요일 오후 두 시가 결승선.
    const race = Array.isArray(data.race) ? data.race : [], top = Math.max(1, ...race.map(row => row.points));
    container.insertAdjacentHTML('beforeend', '<section class="mvpr" aria-label="이번 주 달리기 현황"><div class="mvpr-head"><strong>이번 주 달리기</strong><small>결승 ' + esc(when(data.nextAnnounceAt)) + (data.runners ? ' · ' + data.runners + '명 달리는 중' : '') + '</small></div>' +
      (race.some(row => row.points > 0) ? '<ol class="mvpr-lanes">' + race.map((row, index) => '<li class="' + (row.isMe ? 'is-me' : '') + '"><span class="mvpr-name">' + (row.points > 0 ? '<b>' + (index + 1) + '</b>' : '<b>·</b>') + esc(row.nickname) + (row.isMe ? ' <i>나</i>' : '') + (row.unnamed ? ' <u>이름 없음</u>' : '') + '</span><span class="mvpr-track"><span class="mvpr-runner" style="left:' + Math.round(Math.max(0, Math.min(1, row.points / top)) * 100) + '%" aria-hidden="true">' + face(row.avatar, 'mvpw-avatar') + '</span></span><em>' + row.points.toLocaleString('ko-KR') + ' XP</em></li>').join('') + '</ol>' : '<p class="mvpr-empty">아직 출발한 사람이 없어요. 퀘스트 하나만 해도 첫 주자가 돼요.</p>') + '</section>');
    if (data.winner) celebrate(data);
    return data;
  }
  window.WeeklyMVP = { mount };
})();
