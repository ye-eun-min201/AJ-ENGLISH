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
  }
  fetch('/api/auth/status', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.ok ? response.json() : null)
    .then(status => { if (status && status.authenticated && footerButton) footerButton.hidden = false; show(status); })
    .catch(() => { /* 상태 확인 실패 시 아무것도 덧붙이지 않는다 */ });
  footerButton?.addEventListener('click', () => logout(footerButton));
  // 캐릭터 화면의 '우리 반 입장' 단추 → 옆 메뉴의 반 입장과 같은 창을 연다 (휴대폰에서는 옆 메뉴 단추가 안 보이므로)
  document.addEventListener('click', event => { if (event.target.closest('[data-open-room]')) document.getElementById('class-open')?.click(); });
})();
