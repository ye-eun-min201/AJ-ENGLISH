// 카카오톡 같은 앱 안에서 링크를 열면 '앱 속 작은 브라우저'로 열려서 소리(영어 읽어 주기)가 안 날 수 있다.
// 그래서 그런 곳에서 열리면 크롬·사파리 같은 진짜 브라우저로 바로 넘긴다. 안 넘어가면 맨 위에 안내 띠를 보여 준다.
(function () {
  'use strict';
  var ua = navigator.userAgent || '', url = location.href;
  var kakao = /KAKAOTALK/i.test(ua), android = /Android/i.test(ua);
  var other = /NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps|BAND\/|; wv\)/i.test(ua);
  if (!kakao && !other) return;
  function openOutside() {
    if (kakao) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
    else if (android) location.href = 'intent://' + url.replace(/^https?:\/\//i, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  }
  function bar() {
    if (document.getElementById('aj-inapp-bar')) return;
    var box = document.createElement('div'); box.id = 'aj-inapp-bar'; box.setAttribute('role', 'status');
    box.style.cssText = 'position:sticky;top:0;z-index:2000;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 14px;background:#191f28;color:#fff;font:700 14px/1.45 Pretendard,system-ui,sans-serif';
    var text = document.createElement('span'); text.style.cssText = 'flex:1 1 180px';
    text.textContent = kakao || android ? '소리가 안 나면 크롬·사파리에서 열어 주세요.' : '소리가 안 나면 오른쪽 아래 메뉴에서 ‘Safari로 열기’를 눌러 주세요.';
    box.appendChild(text);
    function button(label, action) { var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.style.cssText = 'min-height:40px;padding:0 14px;border:0;border-radius:999px;background:#fff;color:#191f28;font:800 14px Pretendard,system-ui,sans-serif'; b.addEventListener('click', action); box.appendChild(b); return b; }
    if (kakao || android) button('브라우저로 열기', openOutside);
    var copy = button('주소 복사', function () {
      var done = function () { copy.textContent = '복사했어요'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt('이 주소를 복사해 크롬·사파리에 붙여 주세요', url); });
      else window.prompt('이 주소를 복사해 크롬·사파리에 붙여 주세요', url);
    });
    document.body.insertBefore(box, document.body.firstChild);
  }
  var tried = false; try { tried = sessionStorage.getItem('aj-open-outside') === '1'; sessionStorage.setItem('aj-open-outside', '1'); } catch (_) { /* 저장을 못 해도 안내 띠는 보여 준다 */ }
  // 화면을 먼저 다 그린 다음에 넘긴다 — 넘어가지 못해도 지금 화면은 그대로 쓸 수 있게.
  function start() { bar(); if (!tried && (kakao || android)) setTimeout(openOutside, 400); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
