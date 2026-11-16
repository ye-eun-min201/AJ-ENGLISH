/* 로그인 상태를 머리말에 또렷하게 보여 준다.
   · 로그인됨: 초록 점 + "카카오 로그인됨" + 로그아웃
   · 로그인 안 됨: "로그인하기" 단추 (기록을 저장하려면 로그인이 필요) */
(() => {
  'use strict';
  const NAMES = { kakao: '카카오', google: '구글' };
  const footerButton = document.querySelector('[data-auth-logout]');
  const host = document.querySelector('.dashboard-header-actions');
  async function logout(button) {
    if (button) button.disabled = true;
    try { await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch (_) { /* 아래에서 새로고침 */ }
    location.href = '/';
  }
  function show(status) {
    if (!host || host.querySelector('.auth-pill')) return;
    const anchor = host.querySelector('#nav-user');
    let pill;
    if (status && status.authenticated) {
      pill = document.createElement('span'); pill.className = 'auth-pill is-in';
      const label = document.createElement('span'); label.textContent = (NAMES[status.provider] || '계정') + ' 로그인됨';
      const out = document.createElement('button'); out.type = 'button'; out.textContent = '로그아웃'; out.addEventListener('click', () => logout(out));
      pill.append(document.createElement('i'), label, out);
    } else {
      const ready = status && status.providers && (status.providers.kakao || status.providers.google);
      pill = document.createElement('a'); pill.className = 'auth-pill is-out'; pill.href = '/login?return_to=' + encodeURIComponent('/' + location.hash);
      pill.textContent = '로그인하기'; pill.title = ready ? '로그인하면 캐릭터와 학습 기록이 저장돼요' : '로그인 준비 중';
    }
    host.insertBefore(pill, anchor || null);
    document.body.dataset.auth = status && status.authenticated ? 'in' : 'out';
    if (status && status.authenticated) askNickname(); else gate();
  }
  // 우리 반 사이트: 카카오로 로그인하지 않으면 내용 대신 로그인 안내만 보여 준다.
  function gate() {
    if (document.getElementById('aj-gate')) return;
    const box = document.createElement('div'); box.id = 'aj-gate'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '로그인');
    box.innerHTML = '<div class="aj-gate-card"><p class="aj-gate-mark">AJ <span>ENGLISH</span></p><h1>로그인한 사람만 볼 수 있어요</h1><p>카카오로 로그인하면 수업 자료와 학습 기록이 열려요.</p><a class="aj-gate-btn"></a></div>';
    box.querySelector('a').href = '/login?return_to=' + encodeURIComponent('/' + location.hash); box.querySelector('a').textContent = '카카오로 로그인';
    document.body.append(box);
  }
  // 처음 로그인하면 이름이 '학생 1234'로 잡힌다. 선생님이 누구인지 알 수 있게 닉네임을 만들어 달라고 묻는다.
  function nameBar() {
    if (document.getElementById('aj-name-bar')) return; const app = document.getElementById('app'); if (!app) return;
    const bar = document.createElement('div'); bar.id = 'aj-name-bar'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<span><strong>이름을 등록해 주세요</strong> 지금은 임시 이름이라 선생님이 누구인지 알 수 없어요.</span><button type="button">이름 만들기</button>';
    bar.querySelector('button').addEventListener('click', () => askNickname(true)); app.before(bar);
  }
  async function askNickname(force) {
    let later = false; try { later = !!sessionStorage.getItem('aj-nick-later'); } catch (_) { /* 물어보기는 계속 */ }
    let state; try { state = await fetch('/api/state', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.json()); } catch (_) { return; }
    const user = state && state.user; if (!user || !/^학생 \d{3,5}$/.test(String(user.nickname || '')) || document.getElementById('aj-nick')) return;
    if (later && !force) { nameBar(); return; }
    const box = document.createElement('div'); box.id = 'aj-nick'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '닉네임 만들기');
    box.innerHTML = '<form class="aj-gate-card"><h1>닉네임을 만들어 주세요</h1><p>지금은 ‘' + user.nickname.replace(/[<>&]/g, '') + '’로 보여요. 선생님과 친구들이 알아볼 이름으로 바꿔 주세요.</p><input name="nickname" maxlength="12" autocomplete="nickname" placeholder="예: 예은, JJ" aria-label="닉네임"><p class="aj-nick-status" role="status" aria-live="polite"></p><button type="submit" class="aj-gate-btn">이 이름으로 저장</button><button type="button" class="aj-nick-later">나중에 할게요</button></form>';
    const form = box.querySelector('form'), note = box.querySelector('.aj-nick-status');
    box.querySelector('.aj-nick-later').addEventListener('click', () => { try { sessionStorage.setItem('aj-nick-later', '1'); } catch (_) { /* 이번 화면에서만 닫힘 */ } box.remove(); nameBar(); });
    form.addEventListener('submit', async event => {
      event.preventDefault(); const nickname = form.elements.nickname.value.trim();
      if (nickname.length < 2) { note.textContent = '두 글자 이상으로 써 주세요.'; form.elements.nickname.focus(); return; }
      note.textContent = '저장하는 중';
      try {
        const response = await fetch('/api/profile', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname, avatar: user.avatar }) }), data = await response.json().catch(() => ({}));
        if (!response.ok) { note.textContent = data.message || '저장하지 못했어요. 다른 이름으로 해 보세요.'; return; }
        location.reload();
      } catch (_) { note.textContent = '연결을 확인한 뒤 다시 눌러 주세요.'; }
    });
    document.body.append(box); form.elements.nickname.focus({ preventScroll: true });
  }
  fetch('/api/auth/status', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.ok ? response.json() : null)
    .then(status => { if (status && status.authenticated && footerButton) footerButton.hidden = false; show(status); })
    .catch(() => { document.body.dataset.auth = 'out'; gate(); });
  footerButton?.addEventListener('click', () => logout(footerButton));
  // 캐릭터 화면의 '우리 반 입장' 단추 → 옆 메뉴의 반 입장과 같은 창을 연다 (휴대폰에서는 옆 메뉴 단추가 안 보이므로)
  document.addEventListener('click', event => { if (event.target.closest('[data-open-room]')) document.getElementById('class-open')?.click(); });
})();
