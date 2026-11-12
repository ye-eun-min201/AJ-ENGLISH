/* theme.js — 밝은 판·어두운 판 전환. <head>에서 가장 먼저 실행되어 화면이 깜빡이지 않게 한다.
   · 고른 판은 이 기기에 저장(aj-theme). 저장값이 없으면 밝은 판.
   · 바뀔 때 document에 'aj-theme' 신호를 보낸다(3D 장면 등이 받아 씀). */
(function () {
  'use strict';
  var KEY = 'aj-theme', root = document.documentElement;
  function saved() { try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch (_) { return null; } }
  function paint(theme) {
    root.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d0f1a' : '#f7f8fa');
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var dark = theme === 'dark';
      buttons[i].setAttribute('aria-pressed', String(dark));
      buttons[i].setAttribute('aria-label', dark ? '밝은 화면으로 바꾸기' : '어두운 화면으로 바꾸기');
      buttons[i].title = dark ? '밝은 화면으로' : '어두운 화면으로';
    }
  }
  function set(theme) {
    try { localStorage.setItem(KEY, theme); } catch (_) { /* 저장이 안 돼도 이번 방문 동안은 유지 */ }
    paint(theme);
    document.dispatchEvent(new CustomEvent('aj-theme', { detail: theme }));
  }
  paint(saved() || 'light');

  var ICON = '<svg class="tt-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>' +
    '<svg class="tt-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z"/></svg>';
  function mount() {
    if (document.querySelector('[data-theme-toggle]')) return;
    var host = document.querySelector('.dashboard-header-actions') || document.querySelector('.teacher-header .header-actions');
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'theme-toggle'; button.setAttribute('data-theme-toggle', ''); button.innerHTML = ICON;
    if (host) { var help = host.querySelector('.aj-help-entry'); if (help && help.parentNode === host) host.insertBefore(button, help); else host.appendChild(button); }
    else { button.classList.add('theme-toggle-floating'); document.body.appendChild(button); }
    button.addEventListener('click', function () { set(root.dataset.theme === 'dark' ? 'light' : 'dark'); });
    paint(root.dataset.theme);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  window.addEventListener('storage', function (e) { if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) { paint(e.newValue); document.dispatchEvent(new CustomEvent('aj-theme', { detail: e.newValue })); } });
  window.AJTheme = { set: set, get: function () { return root.dataset.theme; } };
})();
