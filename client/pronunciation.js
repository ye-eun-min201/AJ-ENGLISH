(function () {
  'use strict';

  const contractions = {
    "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
    "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is',
    "what's": 'what is', "there's": 'there is',
    "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'cannot',
    "couldn't": 'could not', "won't": 'will not', "wouldn't": 'would not',
    "shouldn't": 'should not', "isn't": 'is not', "aren't": 'are not',
    "wasn't": 'was not', "weren't": 'were not',
    "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have',
    "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "they'll": 'they will',
    "i'd": 'i would', "you'd": 'you would', "we'd": 'we would', "they'd": 'they would',
    "let's": 'let us'
  };

  function normalize(value) {
    return String(value || '').normalize('NFKC').toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\b[a-z]+(?:'[a-z]+)\b/g, token => contractions[token] || token)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  // 음성 인식기는 단어 끝소리(-s, -ed, -ing)를 자주 빼먹고 받아 적는다.
  // 같은 낱말의 꼴만 다른 경우(champion / championing)는 같은 단어로 본다.
  function sameWord(a, b) {
    if (a === b) return true;
    const short = a.length <= b.length ? a : b, long = short === a ? b : a;
    if (short.length < 3 || long.length - short.length > 4) return false;
    const tails = (base, list) => long.startsWith(base) && list.includes(long.slice(base.length));
    if (tails(short, ['s', 'es', 'ed', 'ing'])) return true;
    if (short.endsWith('e') && (tails(short, ['d']) || tails(short.slice(0, -1), ['ing']))) return true;
    if (short.endsWith('y') && tails(short.slice(0, -1) + 'i', ['es', 'ed'])) return true;
    if (/[^aeiou][aeiou][^aeiouwxy]$/.test(short) && tails(short + short.slice(-1), ['ed', 'ing'])) return true;
    return false;
  }

  function score(expected, transcript) {
    const wanted = normalize(expected).split(' ').filter(Boolean);
    const heard = normalize(transcript).split(' ').filter(Boolean);
    const table = Array.from({ length: wanted.length + 1 }, () => Array(heard.length + 1).fill(0));
    for (let i = 1; i <= wanted.length; i++) {
      for (let j = 1; j <= heard.length; j++) {
        table[i][j] = sameWord(wanted[i - 1], heard[j - 1])
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
    const matched = Array(wanted.length).fill(false), near = Array(wanted.length).fill(false), pair = Array(wanted.length).fill(-1);
    let i = wanted.length, j = heard.length;
    while (i && j) {
      if (sameWord(wanted[i - 1], heard[j - 1])) { matched[i - 1] = true; near[i - 1] = wanted[i - 1] !== heard[j - 1]; pair[i - 1] = j - 1; i--; j--; }
      else if (table[i - 1][j] >= table[i][j - 1]) i--;
      else j--;
    }
    const exact = wanted.length > 0 && wanted.length === heard.length && wanted.every((word, k) => sameWord(word, heard[k]));
    const percentage = exact ? 100 : Math.min(99, Math.round(100 * table[wanted.length][heard.length] / Math.max(1, wanted.length, heard.length)));
    // 못 맞힌 단어가 무엇으로 들렸는지: 앞뒤로 맞은 단어 사이에 남아 있는 '들린 단어'와 짝짓는다.
    const heardAs = Array(wanted.length).fill(''), used = new Set(pair.filter(n => n >= 0));
    for (let a = 0; a < wanted.length; a++) {
      if (matched[a]) continue;
      let b = a; while (b + 1 < wanted.length && !matched[b + 1]) b++;
      const lo = a > 0 ? pair[a - 1] : -1, hi = b + 1 < wanted.length ? pair[b + 1] : heard.length, spare = [];
      for (let h = lo + 1; h < hi; h++) if (!used.has(h)) spare.push(h);
      if (spare.length === b - a + 1) spare.forEach((h, n) => { heardAs[a + n] = heard[h]; });
      else for (let k = a; k <= b; k++) {
        let best = -1, top = 0.34;
        for (const h of spare) { if (used.has(h)) continue; const value = closeness(wanted[k], heard[h]); if (value > top) { top = value; best = h; } }
        if (best >= 0) { heardAs[k] = heard[best]; used.add(best); }
      }
      a = b;
    }
    return { exact, score: percentage, percentage, words: wanted, matched, near, nearWords: wanted.filter((_, k) => near[k]), heardAs, heard, normalized: heard.join(' ') };
  }
  // 두 낱말이 얼마나 비슷한지 (1 = 같음, 0 = 전혀 다름)
  function closeness(a, b) {
    const rows = Array.from({ length: a.length + 1 }, (_, n) => [n]);
    for (let n = 1; n <= b.length; n++) rows[0][n] = n;
    for (let x = 1; x <= a.length; x++) for (let y = 1; y <= b.length; y++) rows[x][y] = Math.min(rows[x - 1][y] + 1, rows[x][y - 1] + 1, rows[x - 1][y - 1] + (a[x - 1] === b[y - 1] ? 0 : 1));
    return 1 - rows[a.length][b.length] / Math.max(1, a.length, b.length);
  }
  // 못 맞힌 단어에 붙이는 한 줄 안내 (무엇으로 들렸는지, 어디를 고치면 되는지)
  const MIXUPS = [['r', 'l', 'r과 l: r은 혀가 입천장에 닿지 않게, l은 혀끝을 윗니 뒤에 붙여요'], ['f', 'p', 'f: 윗니를 아랫입술에 대고 바람만 (ㅍ 아님)'], ['v', 'b', 'v: 윗니를 아랫입술에 대고 목을 울려요 (ㅂ 아님)'], ['z', 'j', 'z: ‘스’에 목 울림을 넣어요 (ㅈ 아님)'], ['z', 's', 'z: ‘스’에 목 울림을 넣어요']];
  function wordHint(target, heardWord) {
    if (!heardWord) return '안 들렸어요 · 앞뒤 단어와 붙이지 말고 또박또박';
    const said = '‘' + heardWord + '’(으)로 들렸어요';
    if (target.startsWith(heardWord) && target.length > heardWord.length) return said + ' · 끝소리 ‘-' + target.slice(heardWord.length) + '’까지 내요';
    if (heardWord.startsWith(target)) return said + ' · 끝에 소리가 더 붙었어요';
    if (target.replace(/th/g, 's') === heardWord || target.replace(/th/g, 'd') === heardWord || target.replace(/th/g, 't') === heardWord) return said + ' · th: 혀끝을 이 사이로 살짝 내밀어요';
    if (target.length === heardWord.length) {
      const diff = []; for (let n = 0; n < target.length; n++) if (target[n] !== heardWord[n]) diff.push([target[n], heardWord[n]]);
      for (const [x, y, tip] of MIXUPS) if (diff.length && diff.every(([t, h]) => (t === x && h === y) || (t === y && h === x))) return said + ' · ' + tip;
    }
    return said;
  }
  // 단어별로 몇 번 걸렸는지(이 화면을 열어 둔 동안)와 서버에서 받아 온 발음 도움말
  const missCount = new Map(), helpCache = new Map();
  function pronunciationHelp(word) {
    if (!helpCache.has(word)) helpCache.set(word, fetch('/api/pronounce?w=' + encodeURIComponent(word), { credentials: 'same-origin' }).then(response => response.ok ? response.json() : null).catch(() => null).then(data => { if (!data) helpCache.delete(word); return data; }));
    return helpCache.get(word);
  }

  window.SpeechMatch = { normalize, score, sameWord, wordHint };

  let activeDestroy = null;
  let artSequence = 0;
  const fruitNames = { orange: '오렌지', apple: '사과', grape: '포도', banana: '바나나', strawberry: '딸기', watermelon: '수박' };
  const fruitOrder = Object.keys(fruitNames);
  const fruitArt = Object.fromEntries(fruitOrder.map(kind => [kind, true]));
  function fruitArtwork(kind) {
    const id = 'fruit-' + (++artSequence), name = fruitArt[kind] ? kind : 'orange';
    const colors = { orange:['#ffd387','#f6a238','#dc741c'],apple:['#ffb29b','#e97566','#a9342e'],grape:['#d9c0ec','#a58acb','#69498d'],banana:['#fff0a1','#f4d568','#b59b3c'],strawberry:['#ffb2a3','#ec817d','#bd3f48'],watermelon:['#ffb8ab','#e99085','#d55d63'] }[name];
    const defs = '<defs><radialGradient id="'+id+'-skin" cx="32%" cy="24%" r="80%"><stop stop-color="'+colors[0]+'"/><stop offset=".48" stop-color="'+colors[1]+'"/><stop offset="1" stop-color="'+colors[2]+'"/></radialGradient><linearGradient id="'+id+'-leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9bbb57"/><stop offset=".5" stop-color="#5e883e"/><stop offset="1" stop-color="#315a35"/></linearGradient><radialGradient id="'+id+'-shadow"><stop stop-color="#384329" stop-opacity=".26"/><stop offset="1" stop-color="#384329" stop-opacity="0"/></radialGradient><pattern id="'+id+'-pores" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".55" fill="#af5e19" opacity=".38"/><circle cx="6" cy="6" r=".6" fill="#fff3c9" opacity=".45"/></pattern></defs>';
    const skin = 'url(#'+id+'-skin)',leaf = 'url(#'+id+'-leaf)';
    let shape = '';
    if(name==='orange')shape='<path d="M70 31c-2-18 10-25 24-21-4 15-11 23-24 21Z" fill="'+leaf+'"/><path d="M69 36c0-9-3-15-7-19" stroke="#795534" stroke-width="5" stroke-linecap="round"/><path d="M120 83c0 32-20 53-50 53S18 115 18 83s20-52 51-52 51 20 51 52Z" fill="'+skin+'" stroke="#ce7d29" stroke-width="1.3"/><path d="M120 83c0 32-20 53-50 53S18 115 18 83s20-52 51-52 51 20 51 52Z" fill="url(#'+id+'-pores)"/><path d="M32 69c4-13 13-22 27-25" stroke="#ffe3ac" stroke-width="7" stroke-linecap="round" opacity=".68"/><ellipse cx="48" cy="58" rx="9" ry="14" transform="rotate(29 48 58)" fill="#fff4d4" opacity=".2"/><path d="M66 130h10" stroke="#b96722" stroke-width="2" opacity=".45"/>';
    if(name==='apple')shape='<path d="M72 35c1-13 3-22 8-29" stroke="#745132" stroke-width="5" stroke-linecap="round"/><path d="M76 29C88 7 110 9 113 15 101 31 87 34 76 29Z" fill="'+leaf+'"/><path d="M70 41C28 18 8 55 20 94c9 27 23 46 40 39 7-3 13-3 20 0 18 7 35-16 42-44 10-37-10-70-52-48Z" fill="'+skin+'" stroke="#b6493c" stroke-width="1.3"/><path d="M69 43q-7 14-4 35" fill="none" stroke="#b84839" stroke-width="2" opacity=".35"/><path d="M34 64c3-11 11-17 18-16" stroke="#ffd0b6" stroke-width="8" stroke-linecap="round" opacity=".62"/><path d="M105 91c-2 18-8 29-17 34" fill="none" stroke="#9d332f" stroke-width="5" opacity=".22"/>';
    if(name==='grape')shape='<path d="M70 31c3-17 7-23 18-26" stroke="#6c7040" stroke-width="5" stroke-linecap="round"/><path d="M70 26C38 22 34 8 41 5c19-3 34 5 29 21Z" fill="'+leaf+'"/><g fill="'+skin+'" stroke="#745395" stroke-width="1.3"><circle cx="48" cy="48" r="23"/><circle cx="85" cy="47" r="23"/><circle cx="32" cy="80" r="22"/><circle cx="68" cy="79" r="25"/><circle cx="104" cy="79" r="22"/><circle cx="49" cy="111" r="23"/><circle cx="86" cy="110" r="23"/><circle cx="68" cy="131" r="16"/></g><g fill="none" stroke="#f0dafa" stroke-width="4" stroke-linecap="round" opacity=".54"><path d="M36 43q3-7 10-8m26 5q3-7 10-8M18 75q3-7 10-8m26 6q3-9 12-10m26 5q3-7 10-8m-65 48q3-7 10-8m25 5q3-7 10-8"/></g>';
    if(name==='banana')shape='<path d="M108 20c18 39-9 96-54 111-28 9-49-5-47-20 44 11 87-34 87-80l14-11Z" fill="'+skin+'" stroke="#b39a3f" stroke-width="1.5"/><path d="M96 32c1 52-38 94-77 88" stroke="#fff7c8" stroke-width="7" stroke-linecap="round" fill="none" opacity=".7"/><path d="m94 32-1-15 14-4 5 13" fill="#827147" stroke="#685c3e" stroke-width="2"/><path d="M10 109 5 111l2 8 8 3" fill="#786046"/><g fill="#b68c3d" opacity=".5"><ellipse cx="78" cy="88" rx="1" ry="2"/><ellipse cx="64" cy="105" rx="1.2" ry="1.8"/><ellipse cx="46" cy="116" rx="1" ry="1.6"/></g>';
    if(name==='strawberry')shape='<path d="M70 36C14 14 7 62 27 97c16 28 32 45 43 45s31-22 45-49c17-37 5-78-45-57Z" fill="'+skin+'" stroke="#b94e4c" stroke-width="1.5"/><path d="m70 40-31-8 11-14 20 14 5-22 12 19 23-8-12 21-28 1Z" fill="'+leaf+'" stroke="#59773c" stroke-width="1"/><g fill="#ffe0a4" stroke="#bb7040" stroke-width=".5">'+[[36,57],[56,67],[83,62],[104,55],[31,82],[58,89],[90,87],[105,80],[46,108],[74,113],[90,105],[67,131]].map(([x,y])=>'<ellipse cx="'+x+'" cy="'+y+'" rx="2" ry="3.2" transform="rotate(-14 '+x+' '+y+')"/>').join('')+'</g><path d="M36 52q8-9 15-8" stroke="#ffd3bd" stroke-width="6" stroke-linecap="round" opacity=".5"/>';
    if(name==='watermelon')shape='<path d="M10 42h120c-1 58-29 96-60 96S11 100 10 42Z" fill="#4e874d" stroke="#396c41" stroke-width="1.5"/><path d="M17 42h106c-1 50-25 87-53 87S18 92 17 42Z" fill="#d9e7a7"/><path d="M24 42h92c-2 45-22 76-46 76S26 87 24 42Z" fill="'+skin+'"/><path d="M16 42h109" stroke="#ffe1c5" stroke-width="3"/><g fill="#694337">'+[[40,61],[72,57],[101,61],[52,81],[89,81],[70,101]].map(([x,y])=>'<path d="M'+x+' '+y+'q-5 8 0 9 5-1 0-9Z"/>').join('')+'</g><path d="M23 99q8 22 24 31m47-1q15-10 22-30" stroke="#74a35b" stroke-width="4" fill="none" opacity=".7"/>';
    return '<svg class="harvest-fruit-art" viewBox="0 0 140 155" aria-hidden="true">'+defs+'<ellipse cx="70" cy="146" rx="53" ry="8" fill="url(#'+id+'-shadow)"/>'+shape+'</svg>';
  }
  function woodDefinitions(id) {
    return '<defs><linearGradient id="'+id+'-wood" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e5c18a"/><stop offset=".24" stop-color="#d9ae70"/><stop offset=".72" stop-color="#c89a5d"/><stop offset="1" stop-color="#b98547"/></linearGradient><linearGradient id="'+id+'-side" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#9f703e"/><stop offset="1" stop-color="#c39155"/></linearGradient><pattern id="'+id+'-grain" width="86" height="32" patternUnits="userSpaceOnUse"><path d="M-5 7q25-5 48 0t48 0M-5 11q21-3 43 0t53 0M-5 24q28-7 51-2t45 2" fill="none" stroke="#936337" stroke-width="1" opacity=".27"/><path d="M0 16q23 3 43-1t45 2" fill="none" stroke="#fff0c5" stroke-width="1" opacity=".28"/><ellipse cx="66" cy="9" rx="9" ry="2.7" fill="none" stroke="#936337" stroke-width=".7" opacity=".32"/></pattern></defs>';
  }
  function crateBackArtwork(id) {
    return '<svg class="crate-wood-art crate-back-art" viewBox="0 0 520 260" preserveAspectRatio="none" aria-hidden="true">'+woodDefinitions(id)+'<ellipse cx="261" cy="239" rx="238" ry="16" fill="#5f4827" opacity=".13"/><path d="m28 75 37-35v158l-37 32Z" fill="url(#'+id+'-side)" stroke="#916638" stroke-width="2"/><path d="m492 75-37-35v158l37 32Z" fill="#a77944" stroke="#916638" stroke-width="2"/><rect x="65" y="40" width="390" height="155" rx="3" fill="url(#'+id+'-wood)" stroke="#ae814b" stroke-width="2"/><path d="M65 88h390M65 137h390M65 184h390" stroke="#a77a46" stroke-width="4"/><rect x="65" y="40" width="390" height="155" fill="url(#'+id+'-grain)"/><path d="m28 75 37-35h390l37 35-15 10-29-27H72L43 86Z" fill="#e9ca98" stroke="#ba8e55" stroke-width="2"/><path d="M72 58h376" stroke="#f8ddb1" stroke-width="3" opacity=".8"/></svg>';
  }
  function crateFrontArtwork(id) {
    const nails=[[32,22],[32,138],[488,22],[488,138],[65,33],[455,33],[65,127],[455,127]].map(([x,y])=>'<g><circle cx="'+x+'" cy="'+y+'" r="3.2" fill="#735d40"/><circle cx="'+(x-.6)+'" cy="'+(y-.8)+'" r="1.2" fill="#cbb78e"/></g>').join('');
    return '<svg class="crate-wood-art crate-front-art" viewBox="0 0 520 160" preserveAspectRatio="none" aria-hidden="true">'+woodDefinitions(id)+'<path d="m16 9 20-9h448l20 9-9 145H25Z" fill="#4e3825" opacity=".09"/>'+[[16,30],[62,31],[108,32]].map(([y,h])=>'<rect x="28" y="'+y+'" width="464" height="'+h+'" rx="3" fill="url(#'+id+'-wood)" stroke="#b2844d" stroke-width="1.5"/><rect x="29" y="'+y+'" width="462" height="'+h+'" rx="3" fill="url(#'+id+'-grain)"/><path d="M32 '+(y+3)+'h456" stroke="#f5d8a5" stroke-width="2" opacity=".65"/>').join('')+'<rect x="18" y="5" width="29" height="149" rx="3" fill="url(#'+id+'-wood)" stroke="#a77a42" stroke-width="2"/><rect x="473" y="5" width="29" height="149" rx="3" fill="url(#'+id+'-wood)" stroke="#a77a42" stroke-width="2"/><path d="M23 10v138m455-138v138" stroke="#f5dcb0" stroke-width="3" opacity=".7"/>'+nails+'<rect x="160" y="65" width="200" height="25" rx="3" fill="#efe0b9" stroke="#b39562" stroke-width="1"/><text x="260" y="81" text-anchor="middle" font-size="10" font-family="sans-serif" font-weight="700" letter-spacing="2" fill="#7c6845">BUSINESS ENGLISH</text></svg>';
  }

  function mount(container, options = {}) {
    if (!container || !container.appendChild) throw new Error('SpeakingCrateGame requires a container.');
    if (activeDestroy) activeDestroy();
    const targets = Array.isArray(options.targets) ? options.targets.filter(t => t && normalize(t.en)) : [];
    const alreadyPassed = new Set((options.initialPassed || []).map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < targets.length));
    let index = targets.findIndex((_, n) => !alreadyPassed.has(n));
    let recognition = null, generation = 0, destroyed = false, busy = false, listening = false;
    let advanceTimer = null, listenTimer = null, successTimer = null, completed = false, finalReceived = false;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const sceneId = 'harvest-crate-' + (++artSequence);
    const root = document.createElement('section');
    root.className = 'orange-game speaking-crate-game harvest-game';
    root.setAttribute('aria-label', '말하기 학습');
    root.innerHTML = '<div class="orange-game-top"><div><p class="eyebrow">SPEAK & FILL</p><h3>말하기 수확 퀘스트</h3></div><span class="chip peach orange-round"></span></div>' +
      '<div class="orange-scene crate-scene" aria-hidden="true"><span class="orange-scene-label">SPEAKING PRACTICE</span><div class="orange-cloud cloud-one"></div><div class="orange-cloud cloud-two"></div><div class="crate-sign"><small>BUSINESS ENGLISH</small><span>학습 표현</span></div><div class="fruit-crate"><div class="crate-back">' + crateBackArtwork(sceneId + '-back') + '</div><div class="crate-slots"></div><div class="cargo-orange" hidden></div><div class="crate-front">' + crateFrontArtwork(sceneId + '-front') + '</div></div><div class="crate-spark spark-left">✧</div><div class="crate-spark spark-right">✦</div></div>' +
      '<p class="crate-count" role="status" aria-live="polite" aria-atomic="true"></p><div class="harvest-progress"><div class="harvest-stars" aria-label="완료한 퀘스트 별"></div><ol class="harvest-checkpoints" aria-label="말하기 세 단계"></ol></div><div class="harvest-success" role="status" aria-live="polite" hidden></div>' +
      '<div class="orange-target"><p class="orange-instruction">비즈니스 영어 문장 말하기</p><p class="orange-target-en"></p><p class="orange-target-ko"></p><div class="orange-word-list" aria-label="단어별 인식 결과"></div></div>' +
      '<div class="orange-actions"><button type="button" class="btn secondary orange-listen">◖ 먼저 듣기</button><button type="button" class="btn primary orange-mic">● 마이크로 말하기</button></div>' +
      '<div class="orange-recognition" role="status" aria-live="polite" aria-atomic="true"><div class="orange-match-head"><span>문장 인식 일치도</span><strong class="orange-percent">—</strong></div><div class="orange-match-track"><span></span></div><p class="orange-transcript">음성 인식 문장</p><p class="orange-message">문장 전체 인식 시 과일 1개 추가</p></div>' +
      '<div class="orange-coach" hidden></div>' +
      '<div class="orange-skip-row"><p class="orange-tries" role="status" aria-live="polite" hidden></p><button type="button" class="btn secondary orange-skip" hidden>넘어가기 · 점수 절반</button></div>' +
      '<p class="orange-disclaimer">문장 인식 결과 비교 · 정밀 발음 평가 미지원<br>음성 인식 시 브라우저 제공업체의 음성 처리 가능</p>';
    container.replaceChildren(root);
    const $ = sel => root.querySelector(sel);
    const scene = $('.orange-scene'), fruit = $('.cargo-orange'), round = $('.orange-round');
    const en = $('.orange-target-en'), ko = $('.orange-target-ko'), words = $('.orange-word-list');
    const listenButton = $('.orange-listen'), micButton = $('.orange-mic');
    const percent = $('.orange-percent'), track = $('.orange-match-track > span');
    const transcriptText = $('.orange-transcript'), message = $('.orange-message');
    const crateSlots = $('.crate-slots'), crateCount = $('.crate-count');
    // 틀린 단어를 짚어 주는 상자: 무엇으로 들렸는지 알려 주고, 세 번 넘게 걸린 단어는 발음(한글로 비슷하게·강세·입 모양)을 보여 준다.
    const coach = $('.orange-coach'), helpAfter = 3;
    const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function shown(word) {              // 채점용 소문자 낱말을 문장에 적힌 모양(CEO 등)으로
      for (const raw of String(targets[index]?.en || '').split(/\s+/)) if (normalize(raw) === word) return raw.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '');
      return word;
    }
    function speakWord(word, rate) {
      if (destroyed || busy) return;
      closeAttempt(false); stopRecognition();
      if (typeof options.say === 'function') options.say(word, rate);
    }
    async function openHelp(row, word, autoplay) {
      const box = row.querySelector('.coach-help'), button = row.querySelector('[data-coach-help]');
      if (!box || box.dataset.open === '1') return;
      box.dataset.open = '1'; box.hidden = false; if (button) button.hidden = true;
      box.innerHTML = '<p class="coach-note">발음 불러오는 중</p>';
      const data = await pronunciationHelp(word);
      if (destroyed || !box.isConnected) return;
      if (!data || !data.found) box.innerHTML = '<p class="coach-note">이 단어는 발음 사전에 없어요. “천천히”를 눌러 듣고 따라 해 보세요.</p>';
      else box.innerHTML = '<p class="coach-read"><span>비슷한 소리</span> ' + data.syllables.map((part, n) => n === data.stress ? '<b>' + esc(part) + '</b>' : esc(part)).join('') + (data.stress >= 0 && data.syllables.length > 1 ? ' <small>굵은 곳을 세게, 길게</small>' : '') + '</p>'
        + (data.tips.length ? '<ul class="coach-tips">' + data.tips.map(tip => '<li>' + esc(tip) + '</li>').join('') + '</ul>' : '')
        + '<p class="coach-note">한글은 비슷하게 적은 것이에요. “천천히”로 진짜 소리를 듣고 따라 하세요.</p>';
      if (autoplay) speakWord(word, 0.55);
    }
    function renderCoach(result, fresh) {
      coach.replaceChildren();
      const missing = result ? result.words.map((word, n) => ({ word, heard: result.heardAs[n], hit: result.matched[n] })).filter(item => !item.hit) : [];
      if (!missing.length || index < 0) { coach.hidden = true; return; }
      coach.hidden = false;
      const title = document.createElement('p'); title.className = 'coach-title'; title.textContent = '다시 볼 단어'; coach.appendChild(title);
      const seen = new Set();
      missing.filter(item => !seen.has(item.word) && seen.add(item.word)).slice(0, 4).forEach(item => {
        const word = shown(item.word), count = missCount.get(item.word) || 0, row = document.createElement('div');
        row.className = 'coach-row' + (count >= helpAfter ? ' is-hard' : '');
        row.innerHTML = '<div class="coach-head"><strong lang="en">' + esc(word) + '</strong><span>' + esc(wordHint(item.word, item.heard)) + '</span></div>'
          + (count >= helpAfter ? '<p class="coach-many">' + count + '번 걸렸어요 · 이렇게 소리 내 보세요</p>' : '')
          + '<div class="coach-actions"><button type="button" class="btn secondary" data-coach-say="' + esc(word) + '">▶ 듣기</button><button type="button" class="btn secondary" data-coach-slow="' + esc(word) + '">천천히</button><button type="button" class="btn secondary" data-coach-help="' + esc(word) + '">발음 보기</button></div><div class="coach-help" hidden></div>';
        coach.appendChild(row);
        if (count >= helpAfter) openHelp(row, word, fresh && count === helpAfter);
      });
      if (seen.size > 4) { const more = document.createElement('p'); more.className = 'coach-note'; more.textContent = '외 ' + (seen.size - 4) + '개 · 위 단어부터 고쳐 보세요'; coach.appendChild(more); }
    }
    function onCoachClick(event) {
      const button = event.target.closest('button'); if (!button || !coach.contains(button)) return;
      if (button.dataset.coachSay) speakWord(button.dataset.coachSay);
      else if (button.dataset.coachSlow) speakWord(button.dataset.coachSlow, 0.55);
      else if (button.dataset.coachHelp) openHelp(button.closest('.coach-row'), button.dataset.coachHelp, false);
    }
    // 여러 번 말해도 안 될 때: 정해진 횟수(기본 열 번)를 채우면 점수 절반으로 넘어갈 수 있다.
    const triesText = $('.orange-tries'), skipButton = $('.orange-skip');
    const canSkip = typeof options.onSkip === 'function';
    const skipAfter = Number.isInteger(options.skipAfter) && options.skipAfter > 0 ? options.skipAfter : 10;
    const tries = {};
    Object.entries(options.initialTries || {}).forEach(([key, count]) => { const n = Number(key), c = Math.floor(Number(count)); if (Number.isInteger(n) && n >= 0 && n < targets.length && c > 0) tries[n] = Math.min(c, 999); });
    function renderTries() {
      const count = index >= 0 ? (tries[index] || 0) : 0, open = canSkip && !completed && index >= 0 && (count >= skipAfter || !Recognition);
      triesText.hidden = !canSkip || completed || index < 0 || (count === 0 && Recognition);
      triesText.textContent = !Recognition ? '이 브라우저는 말하기 인식이 안 돼요 · Chrome이나 Safari로 열면 점수를 다 받을 수 있어요'
        : open ? skipAfter + '번 시도했어요 · 넘어가면 이 문장 점수는 절반' : count + '번 시도 · ' + skipAfter + '번이 되면 넘어갈 수 있어요';
      skipButton.hidden = !open;
      skipButton.disabled = busy || listening || destroyed;
    }
    // 폰에서 생긴 말하기 문제를 서버에 남긴다(선생님 화면의 학생 현황에서 원인을 볼 수 있게). 실패해도 공부에는 영향 없음.
    function report(kind, detail) {
      if (typeof options.onIssue !== 'function') return;
      try { options.onIssue(kind, detail || ''); } catch (_) { /* 기록 실패는 무시 */ }
    }
    // attempt: 마이크를 눌러 시작한 한 번의 시도. 통과·실패·오류·중지 가운데 무엇으로 끝나든 딱 한 번만 정리한다.
    let attempt = null;
    function closeAttempt(countIt) {
      if (!attempt || attempt.done) return false;
      attempt.done = true; clearTimeout(attempt.timer);
      if (countIt) addTry();
      return true;
    }
    function addTry() {
      if (!canSkip || index < 0) return;
      tries[index] = Math.min(999, (tries[index] || 0) + 1);
      if (typeof options.onTry === 'function') { try { options.onTry(index, tries[index]); } catch (_) { /* 기록 실패는 무시 */ } }
      renderTries();
    }
    function fruitKey(targetIndex = index) { return targets[targetIndex] && fruitArt[targets[targetIndex].fruit] ? targets[targetIndex].fruit : fruitOrder[Math.max(0, targetIndex) % fruitOrder.length]; }
    function renderCrate() {
      crateSlots.replaceChildren();
      crateSlots.style.gridTemplateColumns = 'repeat(' + Math.min(4, Math.max(1, targets.length)) + ', minmax(0, 1fr))';
      targets.forEach((target, n) => {
        const slot = document.createElement('div');
        slot.className = 'crate-slot' + (alreadyPassed.has(n) ? ' is-filled' : '');
        slot.setAttribute('data-crate-slot', n);
        if (alreadyPassed.has(n)) slot.innerHTML = fruitArtwork(fruitKey(n));
        else { const marker = document.createElement('span'); marker.textContent = '✦'; slot.appendChild(marker); }
        crateSlots.appendChild(slot);
      });
      crateCount.textContent = '과일 상자 ' + alreadyPassed.size + ' / ' + targets.length + ' 채움';
      round.textContent = alreadyPassed.size + ' / ' + targets.length + ' 표현';
      scene.classList.toggle('crate-full', targets.length > 0 && alreadyPassed.size === targets.length);
      $('.harvest-stars').innerHTML = targets.map((_, n) => '<span class="harvest-star' + (alreadyPassed.has(n) ? ' earned' : '') + '" aria-label="' + (n + 1) + '단계 ' + (alreadyPassed.has(n) ? '완료' : '미완료') + '">' + (alreadyPassed.has(n) ? '★' : '☆') + '</span>').join('');
      $('.harvest-checkpoints').innerHTML = targets.map((_, n) => '<li class="harvest-checkpoint' + (alreadyPassed.has(n) ? ' is-complete' : n === index ? ' is-current' : '') + '"><b>' + (alreadyPassed.has(n) ? '✓' : String(n + 1).padStart(2, '0')) + '</b><span>' + (alreadyPassed.has(n) ? '수확 완료' : n === index ? '말하기 도전' : '다음 수확') + '</span></li>').join('');
    }

    function stopSpeech() { if (window.speechSynthesis) window.speechSynthesis.cancel(); }
    function setMessage(text, state) {
      message.textContent = text;
      root.dataset.state = state || '';
    }
    function updateControls() {
      const blocked = busy || completed || destroyed || index < 0;
      listenButton.disabled = blocked;
      micButton.disabled = blocked || !Recognition;
      micButton.textContent = listening ? '■ 다 말했어요' : '● 문장 말하기';
      micButton.classList.toggle('recording', listening);
      renderTries();
    }
    function stopRecognition() {
      generation++;
      clearTimeout(listenTimer);
      if (recognition) {
        recognition.onresult = recognition.onerror = recognition.onend = null;
        try { recognition.abort(); } catch (_) { /* Already stopped. */ }
        recognition = null;
      }
      listening = false;
      updateControls();
    }
    function renderWords(result) {
      words.replaceChildren();
      const tokens = result ? result.words : normalize(targets[index].en).split(' ');
      tokens.forEach((word, n) => {
        const chip = document.createElement('span');
        const isNear = !!(result && result.matched[n] && result.near[n]);
        chip.className = 'orange-word' + (result ? (result.matched[n] ? ' matched' + (isNear ? ' near' : '') : ' missing') : '');
        chip.textContent = word;
        chip.setAttribute('aria-label', word + (result ? (result.matched[n] ? (isNear ? ': 인식됨 · 끝소리 확인' : ': 인식됨') : ': 재인식 필요') : ''));
        words.appendChild(chip);
      });
    }
    function showTranscript(value) {
      const result = score(targets[index].en, value);
      transcriptText.textContent = value ? '들린 문장: “' + value + '”' : '음성 인식 문장';
      percent.textContent = value ? result.percentage + '%' : '—';
      track.style.width = value ? result.percentage + '%' : '0%';
      renderWords(value ? result : null);
      return result;
    }
    function finish() {
      completed = true;
      index = -1;
      renderCrate();
      scene.classList.add('all-delivered');
      en.textContent = 'Speaking complete';
      ko.textContent = '전체 표현 학습 완료';
      words.replaceChildren();
      setMessage('말하기 학습 완료', 'complete');
      listenButton.hidden = true;
      micButton.hidden = true;
      updateControls();
      if (typeof options.onComplete === 'function') options.onComplete();
    }
    function renderTarget() {
      fruit.classList.remove('is-passed');
      fruit.hidden = true;
      scene.classList.remove('shipping');
      renderCrate();
      en.textContent = targets[index].en;
      ko.textContent = targets[index].ko || '';
      percent.textContent = '—'; track.style.width = '0%';
      transcriptText.textContent = '음성 인식 문장';
      setMessage(Recognition ? '문장 전체 인식 시 과일 1개 추가' : '음성 인식 미지원 · HTTPS 주소를 Chrome 또는 Edge에서 열기', Recognition ? '' : 'unsupported');
      renderWords(null);
      renderCoach(null);
      busy = false;
      updateControls();
    }

    // 통과(또는 넘어가기)를 서버에 확인받고, 과일을 상자에 넣은 뒤 다음 문장으로 간다.
    async function settle(validate, successText, rewardLabel) {
      stopRecognition();
      busy = true; updateControls();
      const passingIndex = index;
      try {
        const validation = await validate(passingIndex);
        if (destroyed || passingIndex !== index) return;
        if (!validation || validation.passed !== true) {
          busy = false;
          setMessage(validation && validation.message ? validation.message : '통과 기준 미충족 · 문장 전체 재시도', 'retry');
          updateControls();
          return;
        }
        fruit.innerHTML = fruitArtwork(fruitKey(passingIndex));
        fruit.hidden = false;
        const targetSlot = crateSlots.children[passingIndex];
        const slotBounds = targetSlot?.getBoundingClientRect?.();
        const sceneBounds = scene.getBoundingClientRect?.();
        const crateBounds = $('.fruit-crate').getBoundingClientRect?.();
        const fruitBounds = fruit.getBoundingClientRect?.();
        const dropY = slotBounds && crateBounds ? (slotBounds.bottom - crateBounds.top - (fruitBounds?.height || 145)) + 'px' : '23px';
        if (fruit.style.setProperty) fruit.style.setProperty('--crate-drop-y', dropY); else fruit.style['--crate-drop-y'] = dropY;
        const dropX = slotBounds && sceneBounds ? (slotBounds.left + slotBounds.width / 2 - sceneBounds.left - sceneBounds.width / 2) + 'px' : '0px';
        if (fruit.style.setProperty) fruit.style.setProperty('--crate-drop-x', dropX);
        else fruit.style['--crate-drop-x'] = dropX;
        scene.classList.add('shipping');
        requestAnimationFrame(() => { if (!destroyed) fruit.classList.add('is-passed'); });
        setMessage(successText, 'success');
        advanceTimer = setTimeout(() => {
          if (destroyed) return;
          const before = Math.round(alreadyPassed.size / Math.max(1, targets.length) * 100);
          alreadyPassed.add(passingIndex);
          fruit.hidden = true;
          renderCrate();
          const after = Math.round(alreadyPassed.size / Math.max(1, targets.length) * 100);
          const points = Number.isInteger(validation.points) && validation.points > 0 ? validation.points : 0;
          const banner = $('.harvest-success'); banner.textContent = (validation.skipped ? '넘어가기 · ' : '퀘스트 성공 · ') + alreadyPassed.size + ' / ' + targets.length + ' 수확'; banner.hidden = false;
          if (window.AJRewards && typeof window.AJRewards.show === 'function') window.AJRewards.show({ anchor: root, points, progress: after, deltaProgress: after - before, label: rewardLabel });
          clearTimeout(successTimer); successTimer = setTimeout(() => { if (!destroyed) banner.hidden = true; }, 2000);
          const nextIndex = targets.findIndex((_, n) => !alreadyPassed.has(n));
          if (nextIndex < 0) finish();
          else { index = nextIndex; renderTarget(); }
        }, 1100);
      } catch (error) {
        if (destroyed || passingIndex !== index) return;
        busy = false;
        setMessage(error && error.message ? error.message : '결과 저장 실패 · 연결 확인 후 재시도', 'error');
        updateControls();
      }
    }

    async function acceptTranscript(value, currentGeneration) {
      if (destroyed || busy || currentGeneration !== generation || index < 0) return;
      const result = showTranscript(value);
      if (!result.exact) {
        closeAttempt(true);
        stopRecognition();
        new Set(result.words.filter((_, n) => !result.matched[n])).forEach(word => missCount.set(word, (missCount.get(word) || 0) + 1));
        renderCoach(result, true);
        setMessage('아래 “다시 볼 단어” 확인 후 문장 전체 재시도', 'retry');
        return;
      }
      closeAttempt(false);
      renderCoach(null);
      setMessage('문장 전체 인식 · 통과 여부 확인 중', 'checking');
      await settle(passingIndex => typeof options.onPass === 'function' ? options.onPass(passingIndex, value) : { passed: false },
        result.nearWords.length ? '통과 · 끝소리까지 또렷하게: ' + result.nearWords.join(', ') : '문장 인식 완료 · 과일 1개 추가', '말하기 퀘스트 성공');
    }

    async function skipTarget() {
      if (destroyed || busy || completed || index < 0 || !canSkip || (Recognition && (tries[index] || 0) < skipAfter)) return;
      const count = Math.max(skipAfter, tries[index] || 0);
      closeAttempt(false);
      setMessage('넘어가는 중', 'checking');
      await settle(async passingIndex => { const answer = await options.onSkip(passingIndex, count); return answer ? { ...answer, skipped: true } : answer; },
        '넘어가기 · 이 문장 점수는 절반', '넘어가기 · 점수 절반');
    }

    const errorMessages = {
      'not-allowed': '마이크 권한 필요 · 사이트 설정에서 허용 후 재시도',
      'service-not-allowed': '음성 인식 서비스 미지원 · Chrome 또는 Edge에서 열기',
      'audio-capture': '마이크 없음 · 연결 및 기기 설정 확인',
      'no-speech': '음성 미감지 · 마이크 선택 후 재시도',
      'network': '음성 인식 연결 실패 · 인터넷 확인 후 재시도',
      'language-not-supported': '영어 음성 인식 미지원 · Chrome 또는 Edge의 영어 음성 설정 확인'
    };

    // 지금까지 받아 적힌 문장 가운데 가장 잘 맞는 것으로 채점한다. 아무것도 못 받아 적었으면 시도 한 번으로만 센다.
    function resolveWithHeard(currentGeneration, emptyText, emptyState, issueDetail) {
      if (destroyed || busy || currentGeneration !== generation || !attempt || attempt.done || index < 0) return;
      const best = [...attempt.heard].map((text, order) => ({ text, order, value: score(targets[index].en, text).percentage })).sort((a, b) => b.value - a.value || b.order - a.order)[0]?.text || '';
      if (best) { finalReceived = true; acceptTranscript(best, currentGeneration); return; }
      closeAttempt(true);
      stopRecognition();
      report(emptyState === 'error' ? 'error' : 'empty', issueDetail || '');
      setMessage(emptyText || '인식 문장 없음 · 마이크 선택 후 재시도', emptyState || 'retry');
    }

    function startListening() {
      if (destroyed || busy || completed || !Recognition || index < 0) return;
      // 말하는 중에 한 번 더 누르면 "다 말했어요": 버리지 않고, 받아 적힌 데까지로 채점한다.
      if (listening) {
        const instance = recognition, currentGeneration = generation;
        if (attempt && !attempt.done) {
          try { if (instance) instance.stop(); } catch (_) { /* Already stopped. */ }
          setMessage('받아 적는 중', 'listening');
          clearTimeout(attempt.timer); attempt.timer = setTimeout(() => resolveWithHeard(currentGeneration), 1500);
          return;
        }
        // 이미 채점이 끝난 시도인데 인식기만 켜져 있던 경우: 끄고 아래에서 새로 시작한다.
      }
      stopSpeech();
      stopRecognition();
      const currentGeneration = generation;
      const instance = new Recognition();
      recognition = instance;
      instance.lang = 'en-US';
      instance.continuous = false;
      instance.interimResults = true;
      instance.maxAlternatives = 3;
      finalReceived = false;
      const heardSoFar = new Set();
      attempt = { done: false, heard: heardSoFar, timer: null };
      let started = false;
      instance.onstart = () => {
        if (destroyed || currentGeneration !== generation) return;
        started = true;
        listening = true; updateControls();
        setMessage('음성 인식 중 · 화면의 영어 문장 말하기', 'listening');
      };
      instance.onresult = event => {
        if (destroyed || currentGeneration !== generation || busy) return;
        const candidates = [], finalCandidates = [];
        for (let r = event.resultIndex; r < event.results.length; r++) {
          const entry = event.results[r];
          for (let a = 0; a < entry.length; a++) {
            const text = String(entry[a].transcript || '').trim();
            candidates.push(text);
            if (text) heardSoFar.add(text);
            if (entry.isFinal) finalCandidates.push(text);
          }
        }
        // 인식기가 중간에 맞게 받아 적었다가 마지막에 고쳐 쓰는 일이 있어, 이번에 들은 후보 전체에서 고른다.
        const pool = finalCandidates.length ? finalCandidates.concat([...heardSoFar]) : candidates;
        const best = pool.map((text, order) => ({ text, order, value: score(targets[index].en, text).percentage })).sort((a, b) => b.value - a.value || a.order - b.order)[0]?.text || '';
        showTranscript(best);
        if (finalCandidates.length && !finalReceived) {
          finalReceived = true;
          acceptTranscript(best, currentGeneration);
        }
      };
      instance.onerror = event => {
        if (destroyed || currentGeneration !== generation || busy) return;
        if (event.error === 'aborted') return;   // 곧 onend 가 와서 거기서 정리한다
        listening = false; updateControls();
        // 권한 거부·서비스 오류처럼 말해 볼 수조차 없던 경우도 시도 한 번으로 센다(그래야 열 번 뒤에 넘어갈 수 있다).
        resolveWithHeard(currentGeneration, errorMessages[event.error] || '음성 인식 실패 · 마이크 선택 후 재시도', 'error', String(event.error || 'unknown'));
      };
      instance.onend = () => {
        if (destroyed || currentGeneration !== generation) return;
        listening = false; recognition = null; clearTimeout(listenTimer); updateControls();
        if (!finalReceived) resolveWithHeard(currentGeneration);
      };
      try {
        listening = true; updateControls();
        setMessage('마이크 연결 중', 'listening');
        instance.start();
        attempt.timer = setTimeout(() => {
          if (destroyed || started || currentGeneration !== generation || !attempt || attempt.done) return;
          resolveWithHeard(currentGeneration, '마이크가 켜지지 않았어요 · 잠시 뒤 다시 눌러 주세요', 'error', 'no-start');
        }, 6000);
        listenTimer = setTimeout(() => {
          if (destroyed || !listening || currentGeneration !== generation) return;
          try { instance.stop(); } catch (_) { /* Already stopped. */ }
          if (attempt && !attempt.done) { clearTimeout(attempt.timer); attempt.timer = setTimeout(() => resolveWithHeard(currentGeneration), 1500); }
        }, 25000);
      } catch (_) {
        listening = false; recognition = null;
        closeAttempt(true);
        updateControls();
        report('error', 'start-failed');
        setMessage('마이크 시작 실패 · Chrome 또는 Edge의 마이크 권한 확인', 'error');
      }
    }

    function playTarget() {
      if (destroyed || busy || index < 0) return;
      closeAttempt(false);
      stopRecognition();
      if (typeof options.say === 'function') options.say(targets[index].en);
      else setMessage('듣기 미지원 · 화면의 영어 문장으로 연습');
    }

    listenButton.addEventListener('click', playTarget);
    if (!Recognition) report('unsupported', '');
    micButton.addEventListener('click', startListening);
    skipButton.addEventListener('click', skipTarget);
    coach.addEventListener('click', onCoachClick);
    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      clearTimeout(advanceTimer); clearTimeout(listenTimer); clearTimeout(successTimer);
      closeAttempt(false);
      stopRecognition(); stopSpeech();
      listenButton.removeEventListener('click', playTarget);
      micButton.removeEventListener('click', startListening);
      skipButton.removeEventListener('click', skipTarget);
      coach.removeEventListener('click', onCoachClick);
      if (activeDestroy === destroy) activeDestroy = null;
    };
    activeDestroy = destroy;
    if (!targets.length || index < 0) finish();
    else renderTarget();
    return { destroy };
  }

  window.SpeakingCrateGame = {
    mount,
    destroy() { if (activeDestroy) activeDestroy(); }
  };
  window.OrangeGame = window.SpeakingCrateGame;
})();
