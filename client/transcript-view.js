// 녹음 글 보기 창 (관리자·학생 화면이 같이 쓴다). 말한 사람·시간·말을 차례로 보여 주고, 낱말로 찾을 수 있다.
(function () {
  'use strict';
  let closeCurrent = null;
  function open({ title, text }) {
    closeCurrent?.();
    const D = window.AJDaily, esc = D.esc, parsed = D.parseTranscript(text), speakers = parsed.speakers, previous = document.activeElement;
    const wrap = document.createElement('div'); wrap.className = 'trv'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', '녹음 글');
    wrap.innerHTML = '<div class="trv-card"><header class="trv-head"><div><strong>녹음 글</strong><span>' + esc(title || '') + '</span></div><button type="button" class="trv-close" data-trv-close aria-label="닫기">닫기 ×</button></header>' +
      '<div class="trv-tools"><input type="search" class="trv-search" placeholder="찾을 말 (예: 스트레스)" aria-label="녹음 글에서 찾기"><span class="trv-count" role="status"></span></div><ol class="trv-list"></ol></div>';
    const list = wrap.querySelector('.trv-list'), count = wrap.querySelector('.trv-count'), search = wrap.querySelector('.trv-search');
    function render() {
      const query = search.value.trim().toLowerCase(), shown = parsed.turns.filter(turn => !query || turn.text.toLowerCase().includes(query));
      list.innerHTML = shown.map(turn => { const tone = turn.speaker ? speakers.indexOf(turn.speaker) % 6 : 0; return '<li class="trv-turn"><div class="trv-who trv-tone-' + tone + '">' + esc(turn.speaker || '말') + (turn.time ? '<time>' + esc(turn.time) + '</time>' : '') + '</div><p>' + esc(turn.text).replace(/\n/g, '<br>') + '</p></li>'; }).join('') || '<li class="trv-empty">찾는 말이 없어요.</li>';
      count.textContent = query ? shown.length + '곳에서 찾음' : '말 ' + parsed.turns.length + '개 · ' + (speakers.length || 1) + '명';
    }
    function close() { document.removeEventListener('keydown', onKey); wrap.remove(); closeCurrent = null; previous?.focus?.(); }
    function onKey(event) { if (event.key === 'Escape') close(); }
    wrap.addEventListener('click', event => { if (event.target === wrap || event.target.closest('[data-trv-close]')) close(); });
    search.addEventListener('input', render); document.addEventListener('keydown', onKey);
    document.body.append(wrap); render(); search.focus({ preventScroll: true }); closeCurrent = close;
    return { close };
  }
  window.AJTranscriptView = { open };
})();
