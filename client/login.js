/* 로그인 화면: 연결된 로그인만 보여 주고, 로그인 뒤 원래 보던 화면으로 돌려보낸다. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const wanted = params.get('return_to') || '/';
  const back = /^\/(?![\/\\])[\w\-./?=&%#~+]{0,180}$/.test(wanted) ? wanted : '/';   // 우리 사이트 안의 경로만
  const message = document.getElementById('login-message'), actions = document.getElementById('login-actions');
  const texts = {
    cancelled: '로그인을 취소했어요. 다시 시도해 주세요.',
    expired: '로그인 확인 시간이 지났어요. 다시 시도해 주세요.',
    provider: '로그인 서비스에서 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.',
    not_configured: '이 로그인은 아직 연결되지 않았어요. 다른 로그인을 사용하거나 선생님께 알려 주세요.',
    not_ready: '저장소를 준비하고 있어요. 잠시 후 다시 시도해 주세요.'
  };
  const show = text => { message.textContent = text; message.hidden = false; };
  if (texts[params.get('error')]) show(texts[params.get('error')]);
  document.getElementById('login-skip').href = back;
  const buttons = { kakao: document.getElementById('login-kakao'), google: document.getElementById('login-google') };
  for (const name of Object.keys(buttons)) buttons[name].href = '/auth/' + name + '?return_to=' + encodeURIComponent(back);
  fetch('/api/auth/status', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.ok ? response.json() : Promise.reject(new Error('status'))).then(status => {
    if (status.authenticated) { location.replace(back); return; }
    let available = 0;
    for (const name of Object.keys(buttons)) { const on = !!(status.providers && status.providers[name]); buttons[name].hidden = !on; if (on) available++; }
    if (!available && !params.get('error')) { actions.hidden = true; show('아직 로그인이 연결되지 않았어요. 관리자가 카카오·구글 로그인 설정을 마치면 사용할 수 있어요.'); }
  }).catch(() => { if (!params.get('error')) show(texts.not_ready); });
})();
