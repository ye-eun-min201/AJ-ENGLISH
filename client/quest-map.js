(function () {
  'use strict';
  let active = null;
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const regions = ['입장 광장','캔디 정원','구름 다리','회전목마','피크닉 호수','관람차','페스티벌 성'];
  const desktop = [[200,890],[450,800],[770,810],[1000,600],[720,430],[430,330],[790,175]];
  const mobile = [[130,220],[350,410],[180,620],[350,840],[170,1060],[350,1280],[220,1490]];
  const symbol = name => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + ({arrow:'M5 12h14m-5-5 5 5-5 5',check:'m5 12 4 4 10-10',lock:'M6 10h12v11H6Zm3 0V6a3 3 0 0 1 6 0v4m-3 5v2',book:'M12 6C8 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2Zm0 0v15',sound:'m11 5-6 4H2v6h3l6 4Zm4 3a6 6 0 0 1 0 8',mic:'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0Zm-3 7a6 6 0 0 0 12 0m-6 6v5m-4 0h8',star:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',pin:'M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 0 1 14 0Zm-7-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4'}[name] || '') + '"/></svg>';
  const companion = '<svg viewBox="0 0 110 125" role="img" aria-label="학습 캐릭터"><ellipse cx="55" cy="116" rx="28" ry="7" fill="#355b4222"/><path d="M21 69c0-29 14-44 34-44s35 16 35 44v33c-23 15-47 15-69 0Z" fill="#d6dbad" stroke="#52765b" stroke-width="2"/><path d="m31 32-7-19 24 12m28 7 8-19-23 12" fill="#bbc98d" stroke="#52765b" stroke-width="2"/><path d="M42 57v5m27-5v5m-24 15c6 6 13 6 19 0" fill="none" stroke="#52765b" stroke-width="3" stroke-linecap="round"/><path d="m24 88 30-7 31 7v25l-31-7-30 7Z" fill="#f0dfb9" stroke="#8b875c" stroke-width="2"/><path d="M54 83v22m-23-9 16-4m16 0 15 4" stroke="#b5a778" stroke-width="2"/></svg>';

  function mount(container, initial = {}) {
    if (!container || !container.replaceChildren) throw new Error('QuestMap requires a container.');
    if (active) active.destroy();
    let options = {...initial}, lessons = [], selected = 0, busy = false, destroyed = false;
    const root = document.createElement('section'); root.className = 'quest-map-game'; root.setAttribute('aria-label','7일 영어 퀘스트 지도');
    container.replaceChildren(root);
    function normalize() {
      const builtin = Array.isArray(window.BUSINESS_DAYS) ? window.BUSINESS_DAYS : typeof BUSINESS_DAYS !== 'undefined' && Array.isArray(BUSINESS_DAYS) ? BUSINESS_DAYS : [];
      const source = Array.isArray(options.days) && options.days.length ? options.days : builtin;
      lessons = Array.from({length:7},(_,i) => ({...(source[i] || builtin[i] || {}),id:Number(source[i]?.id || builtin[i]?.id) || i+1,title:source[i]?.title || builtin[i]?.title || (i+1) + '일차 영어 연습'}));
    }
    function key(day) { return (options.course || 'business') + ':' + (day.chapterId ? day.chapterId + ':' : '') + day.id; }
    function completed(day) { return new Set((options.completedDays || []).map(String)).has(key(day)); }
    function currentIndex() { const index = lessons.findIndex(day=>!completed(day)); return index < 0 ? lessons.length-1 : index; }
    function unlocked(index) { return completed(lessons[index]) || index === currentIndex(); }
    function position(index) { return '--qx:' + desktop[index][0]/14 + '%;--qy:' + desktop[index][1]/11 + '%;--qmx:' + mobile[index][0]/5.2 + '%;--qmy:' + mobile[index][1]/16 + '%'; }
    function render() {
      if (destroyed) return;
      const count = lessons.filter(completed).length, percent = Math.round(count/7*100), current = currentIndex();
      root.innerHTML = '<div class="qm-heading"><div><span class="qm-eyebrow">ENGLISH QUEST PARK</span><h2>' + esc(options.title || '이번 주 영어 모험') + '</h2></div><span class="qm-week-tag">7일 학습 지도</span></div>' +
        '<div class="qm-hud"><div class="qm-week-progress"><div><span>주간 탐험</span><strong>' + count + '<small> / 7 완료</small></strong></div><div class="qm-progress-track" role="progressbar" aria-label="주간 퀘스트 완료" aria-valuemin="0" aria-valuemax="7" aria-valuenow="' + count + '"><i style="width:' + percent + '%"></i></div><b>' + percent + '%</b></div><div class="qm-star-total">' + symbol('star') + '<span>완료 별 <strong>' + count*3 + '</strong></span></div><button class="qm-locate" type="button" data-quest-locate>' + symbol('pin') + '현재 위치</button></div>' +
        '<div class="qm-layout"><div class="qm-stage"><div class="qm-world"><picture aria-hidden="true"><source media="(max-width:600px)" srcset="/assets/quest-world.svg?v=park1#portrait"><img class="qm-background" src="/assets/quest-world.svg?v=park1#landscape" alt=""></picture><div class="qm-world-vignette" aria-hidden="true"></div><div class="qm-map-caption" aria-hidden="true"><span>AJ ENGLISH PARK</span><i>✦</i><small>주간 학습 코스</small></div>' +
        lessons.map((day,index) => {
          const done=completed(day), locked=!unlocked(index), isCurrent=index===current;
          return '<div class="qm-node-wrap' + (done?' is-complete':'') + (locked?' is-locked':'') + (isCurrent?' is-current':'') + '" style="' + position(index) + '"><button class="qm-node' + (index===selected?' is-selected':'') + '" type="button" data-quest-node="' + index + '" aria-pressed="' + (index===selected) + '" aria-label="DAY ' + day.id + ', ' + esc(regions[index]) + ', ' + esc(day.title) + ', ' + (done?'완료. 다시 학습 가능':locked?'잠금. 이전 퀘스트 완료 필요':'현재 퀘스트. 학습 가능') + '"><span class="qm-node-top" aria-hidden="true">' + (done?symbol('check'):locked?symbol('lock'):'<b>' + String(day.id).padStart(2,'0') + '</b>') + '</span><span class="qm-node-depth" aria-hidden="true"></span></button><div class="qm-node-label"><span>DAY ' + day.id + '</span><strong>' + regions[index] + '</strong><div class="qm-node-stars" aria-label="완료 별 ' + (done?'3':'0') + '개">' + [1,2,3].map(()=>'<i class="' + (done?'earned':'') + '">' + symbol('star') + '</i>').join('') + '</div></div></div>';
        }).join('') + '<div class="qm-character" style="' + position(current) + '"><span class="qm-character-flag">' + (count===7?'탐험 완료':'현재 위치') + '</span><div class="qm-character-art">' + (options.avatarHTML || companion) + '</div><i class="qm-character-shadow"></i></div><span class="qm-world-edge edge-one" aria-hidden="true">✦</span><span class="qm-world-edge edge-two" aria-hidden="true">✧</span></div><div class="qm-legend"><span><i class="legend-dot complete"></i>완료</span><span><i class="legend-dot current"></i>현재 퀘스트</span><span><i class="legend-dot locked"></i>다음 퀘스트</span><small>노드 선택 · 화살표 키 이동</small></div></div><aside class="qm-inspector" aria-label="선택한 퀘스트"><div class="qm-selection" aria-live="polite"></div></aside></div>' +
        (options.guest?'<p class="qm-guest-note">체험 지도 · 로그인 후 학습 기록 저장</p>':'<p class="qm-save-note">완료 기록 연동 · 완료 퀘스트 재학습 가능</p>');
      renderPanel();
    }
    function renderPanel() {
      const panel = root.querySelector('.qm-selection'); if (!panel || destroyed) return;
      const day=lessons[selected], done=completed(day), locked=!unlocked(selected), chapterId=day.chapterId || options.chapterId;
      panel.innerHTML = '<div class="qm-panel-kicker"><span>DAY ' + String(day.id).padStart(2,'0') + '</span><b class="' + (locked?'locked':done?'complete':'available') + '">' + (locked?'진행 잠금':done?'학습 완료':'현재 퀘스트') + '</b></div><div class="qm-region-name">' + esc(regions[selected]) + '</div><h3>' + esc(day.title) + '</h3><p class="qm-description">' + esc(day.subtitle || '수업 표현을 듣고 말하는 20분 학습') + '</p><div class="qm-learning-types"><span>' + symbol('sound') + '<b>듣기</b><small>5분</small></span><span>' + symbol('mic') + '<b>말하기·대화</b><small>12분</small></span><span>' + symbol('book') + '<b>퀴즈</b><small>3분</small></span></div><div class="qm-panel-reward"><span>완료 보상</span><b>' + symbol('star') + '완료 별 3개</b></div>' + (locked?'<p class="qm-lock-note">' + symbol('lock') + '이전 퀘스트 완료 후 입장</p>':'') + '<button class="qm-start" type="button" data-quest-start' + (locked || busy || typeof options.onStart!=='function'?' disabled':'') + '>' + (busy?'학습 연결 중':locked?'진행 잠금':done?'다시 학습':'퀘스트 시작') + symbol('arrow') + '</button>' + (chapterId && typeof options.onOpenChapter==='function'?'<button class="qm-chapter-link" type="button" data-quest-chapter>이번 주 수업 자료 ↗</button>':'') + '<p class="qm-panel-status" role="status"></p>';
      root.querySelectorAll('[data-quest-node]').forEach(button => { const chosen=Number(button.dataset.questNode)===selected;button.classList.toggle('is-selected',chosen);button.setAttribute('aria-pressed',String(chosen)); });
    }
    async function start() {
      if (destroyed || busy || !unlocked(selected) || typeof options.onStart!=='function') return;
      busy=true;renderPanel();
      try { await options.onStart(Number(lessons[selected].id)); }
      catch(error) { if (!destroyed) { const status=root.querySelector('.qm-panel-status');if(status)status.textContent=error?.message || '학습 연결 오류 · 다시 시도'; } }
      finally { if (!destroyed) {busy=false;const button=root.querySelector('[data-quest-start]');if(button){button.disabled=!unlocked(selected);button.innerHTML=(completed(lessons[selected])?'다시 학습':'퀘스트 시작')+symbol('arrow');}} }
    }
    function click(event) {
      const button=event.target.closest('button');if(!button || !root.contains(button))return;
      if(button.dataset.questNode!==undefined){event.stopPropagation();selected=Number(button.dataset.questNode);renderPanel();return;}
      if(button.hasAttribute('data-quest-start')){event.stopPropagation();start();return;}
      if(button.hasAttribute('data-quest-locate')){event.stopPropagation();selected=currentIndex();renderPanel();const node=root.querySelector('[data-quest-node="'+selected+'"]');node?.scrollIntoView?.({block:'center',inline:'center',behavior:'smooth'});node?.focus({preventScroll:true});return;}
      if(button.hasAttribute('data-quest-chapter')){event.stopPropagation();const id=lessons[selected].chapterId||options.chapterId;if(id&&typeof options.onOpenChapter==='function')Promise.resolve(options.onOpenChapter(id)).catch(error=>{const status=root.querySelector('.qm-panel-status');if(status&&!destroyed)status.textContent=error?.message||'자료 연결 오류';});}
    }
    function keydown(event) {
      const button=event.target.closest('[data-quest-node]');if(!button)return;
      let index=Number(button.dataset.questNode);
      if(['ArrowRight','ArrowDown'].includes(event.key))index=(index+1)%7;
      else if(['ArrowLeft','ArrowUp'].includes(event.key))index=(index+6)%7;
      else if(event.key==='Home')index=0;else if(event.key==='End')index=6;else return;
      event.preventDefault();event.stopPropagation();selected=index;renderPanel();root.querySelector('[data-quest-node="'+index+'"]')?.focus({preventScroll:true});
    }
    root.addEventListener('click',click);root.addEventListener('keydown',keydown);
    normalize();selected=currentIndex();render();
    const controller={
      update(next={}) { if(destroyed)return;const previousCurrent=currentIndex(),wasCurrent=selected===previousCurrent,oldKey=key(lessons[selected]);options={...options,...next};normalize();const previous=lessons.findIndex(day=>key(day)===oldKey);selected=wasCurrent?currentIndex():previous<0?currentIndex():previous;render(); },
      destroy(){if(destroyed)return;destroyed=true;root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);if(active===controller)active=null;}
    };
    active=controller;return controller;
  }
  window.QuestMap={mount,destroy(){active?.destroy();}};
})();
