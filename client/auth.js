/* 로그인한 학생에게만 '로그아웃'을 보여 준다. */
(() => {
  'use strict';
  const button = document.querySelector('[data-auth-logout]');
  if (!button) return;
  fetch('/api/auth/status', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(status => { if (status && status.authenticated) button.hidden = false; }).catch(() => { /* 상태 확인 실패 시 버튼을 숨긴 채 둔다 */ });
  button.addEventListener('click', async () => {
    button.disabled = true;
    try { await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch (_) { /* 아래에서 새로고침 */ }
    location.href = '/';
  });
})();
