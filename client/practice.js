(() => {
  'use strict';

  let activeDestroy = null;
  const normalize = value => String(value || '').normalize('NFKC').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const button = (text, action, className = '') => {
    const element = node('button', 'bp-button ' + className, text);
    element.type = 'button';
    element.dataset.practiceAction = action;
    return element;
  };

  function mount(container, options = {}) {
    if (!container || typeof container.replaceChildren !== 'function') throw new Error('BusinessPractice requires a container.');
    if (!['arrange', 'listening'].includes(options.mode)) throw new Error('BusinessPractice mode must be arrange or listening.');
    if (activeDestroy) activeDestroy();

    const mode = options.mode;
    const source = Array.isArray(options.phrases)?options.phrases:typeof BUSINESS_DAYS !== 'undefined' && BUSINESS_DAYS[5] ? BUSINESS_DAYS[5].phrases : [];
    const dictionary = typeof BUSINESS_DATA !== 'undefined' ? BUSINESS_DATA : [];
    const targets = source.slice(0, 3).filter(item => item && item.en && item.ko).map(item => ({
      en: String(item.en).trim(), ko: String(item.ko),
      note: item.note || dictionary.find(card => normalize(card.en) === normalize(item.en))?.note || '업무 협업 표현'
    }));
    let destroyed = false, completed = false, completionSent = false, answerBusy = false, playGeneration = 0;
    const reportedRounds = new Set(), completedRounds = new Set(), rewardShown = new Set();
    const firstAnswers = new Map(), failedSaves = new Set();
    let round = 0, score = 0, checks = 0, solved = false, played = false;
    let selectedAnswer = null, choices = [], tokens = [], bank = [], answer = [];
    const results = [], responseAnswers=[];
    const root = node('section', 'business-practice bp-' + mode);
    root.setAttribute('aria-label', mode === 'arrange' ? '비즈니스 영어 문장 조립 게임' : '비즈니스 영어 듣기 퀴즈');
    const header = node('div', 'bp-header');
    const identity = node('div', 'bp-identity');
    identity.append(node('span', 'bp-kicker', '비즈니스 영어'), node('h3', 'bp-title', mode === 'arrange' ? '문장 조립' : '듣기 퀴즈'));
    const scoreLabel = node('span', 'bp-score');
    const stars = node('div', 'bp-stars'); stars.setAttribute('aria-label', '문제 완료 별');
    header.append(identity, scoreLabel);
    const checkpoints = node('ol', 'bp-checkpoints'); checkpoints.setAttribute('aria-label', '세 문제 퀘스트 진행');
    const progressLine = node('div', 'bp-progress-line');
    const roundLabel = node('span', 'bp-round');
    const progress = node('progress', 'bp-progress');
    progress.max = 3;
    progress.setAttribute('aria-label', '완료한 문제');
    progressLine.append(roundLabel, progress);
    const stage = node('div', 'bp-stage');
    const feedback = node('div', 'bp-feedback');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-atomic', 'true');
    const footer = node('div', 'bp-footer');
    const note = node('p', 'bp-local-note', typeof options.onAnswer === 'function' ? '문제별 첫 정답 +2 XP · 전체 완료 +4 XP · 서버 확인 기준' : '자유 연습 · 랭킹 포인트 미지급');
    root.append(header, stars, checkpoints, progressLine, stage, feedback, footer, note);
    container.replaceChildren(root);

    function announce(text, state = '') {
      feedback.textContent = text;
      feedback.dataset.state = state;
    }
    function stopVoice() {
      if (window.speechSynthesis && typeof window.speechSynthesis.cancel === 'function') window.speechSynthesis.cancel();
    }
    function focusAction(action, tokenId) {
      const selector = '[data-practice-action="' + action + '"]' + (tokenId !== undefined ? '[data-token="' + tokenId + '"]' : '');
      root.querySelector(selector)?.focus?.();
    }
    function summary() {
      scoreLabel.textContent = (mode === 'arrange' ? '문장 완성 ' : '첫 정답 ') + score + ' / ' + targets.length;
      roundLabel.textContent = completed ? '전체 완료' : '퀘스트 ' + (round + 1) + ' / ' + targets.length;
      const finished = completedRounds.size;
      progress.value = finished;
      progress.setAttribute('aria-valuetext', finished + '문제 완료 · ' + Math.round(finished / Math.max(1, targets.length) * 100) + '%');
      stars.replaceChildren(); checkpoints.replaceChildren();
      targets.forEach((_, index) => {
        const done = completedRounds.has(index), current = !completed && index === round;
        const star = node('span', 'bp-star' + (done ? ' earned' : ''), done ? '★' : '☆');
        star.setAttribute('aria-label', (index + 1) + '번 문제 ' + (done ? '완료' : '미완료')); stars.append(star);
        const checkpoint = node('li', 'bp-checkpoint' + (done ? ' is-complete' : current ? ' is-current' : ''));
        checkpoint.append(node('b', 'bp-checkpoint-number', done ? '✓' : String(index + 1).padStart(2, '0')), node('span', 'bp-checkpoint-label', done ? '완료' : current ? '도전 중' : '다음 문제'));
        checkpoints.append(checkpoint);
      });
    }
    function rewardPopup(index, result, correct) {
      if (!correct || rewardShown.has(index) || destroyed) return;
      rewardShown.add(index);
      const before = Math.round((completedRounds.size - 1) / Math.max(1, targets.length) * 100);
      const progressValue = Math.round(completedRounds.size / Math.max(1, targets.length) * 100);
      const points = result && Number.isInteger(result.points) && result.points > 0 ? result.points : 0;
      const detail = { anchor: root, points, progress: progressValue, deltaProgress: progressValue - before, label: mode === 'arrange' ? '문장 조립 성공' : '정답 성공' };
      if (window.AJRewards && typeof window.AJRewards.show === 'function') window.AJRewards.show(detail);
      else {
        root.querySelector('.bp-reward-toast')?.remove();
        const popup = node('div', 'bp-reward-toast'); popup.setAttribute('role', 'status');
        popup.append(node('span', 'bp-reward-star', '★'), node('strong', '', detail.label), node('b', '', '+' + detail.deltaProgress + '%'));
        if (points) popup.append(node('em', '', '+' + points + ' XP'));
        root.append(popup);
      }
    }
    async function reportFirst(index, value, correct) {
      if (reportedRounds.has(index)) return { points: 0 };
      if (!firstAnswers.has(index)) firstAnswers.set(index, Object.freeze({ index, answer: value, correct }));
      if (typeof options.onAnswer !== 'function') { reportedRounds.add(index); return { points: 0 }; }
      const generation = playGeneration;
      answerBusy = true; render(); announce('답변 기록 확인 중', 'checking');
      try {
        const result = await options.onAnswer({ ...firstAnswers.get(index) }) || { points: 0 };
        if (destroyed || generation !== playGeneration) return { points: 0, saveFailed: true };
        if (result.saveFailed || result.deferred || result.rewardUnavailable) {
          failedSaves.add(index);
          return { ...result, points: 0, saveFailed: true };
        }
        reportedRounds.add(index); failedSaves.delete(index);
        return result;
      }
      catch (_) { failedSaves.add(index); return { points: 0, saveFailed: true }; }
      finally { if (!destroyed && generation === playGeneration) answerBusy = false; }
    }
    function showSaveFailure() {
      render();
      announce('답변 저장 실패 · 첫 답변 유지 · 저장 재시도', 'error');
      focusAction('save-answer');
    }
    function acceptAnswer(index, value, correct, reward) {
      if (mode === 'listening') {
        if (!completedRounds.has(index)) {
          results[index] = correct; responseAnswers[index] = value;
          if (correct) score++;
          completedRounds.add(index);
        }
        render(); rewardPopup(index, reward, correct);
        announce(correct ? '정답 · 해설 확인 후 다음 문제' : '오답 · 정답·해설 확인 후 다음 문제', correct ? 'correct' : 'retry');
      } else {
        if (!correct) { render(); announce('오답 · 단어 선택 취소 또는 문장 듣기 후 순서 재배열', 'retry'); return; }
        if (!completedRounds.has(index)) {
          solved = true; score++; results[index] = true; responseAnswers[index] = value;
          completedRounds.add(index);
        }
        render(); rewardPopup(index, reward, true);
        announce('정답 · ' + targets[index].en + ' — ' + targets[index].note, 'correct');
      }
      focusAction('next');
    }
    function prepareRound() {
      root.querySelector('.bp-reward-toast')?.remove();
      solved = false;
      played = false;
      selectedAnswer = null;
      answer = [];
      tokens = targets[round].en.split(/\s+/).map((text, id) => ({ id, text }));
      bank = shuffle(tokens.map(token => token.id));
      const correctChoice={text:targets[round].ko,targetIndex:round};const wrongMeanings=[...new Set([...targets.map(t=>t.ko),...dictionary.map(t=>t.ko),'업무 시작 시간이 늦어졌어요.','아래층 회의실을 예약했어요.'])].filter(t=>t&&t!==correctChoice.text).slice(0,2);choices=shuffle([correctChoice,...wrongMeanings.map(text=>({text,targetIndex:-1}))]);
    }
    function renderArrangement() {
      const current = targets[round];
      const intro = node('div', 'bp-mission');
      intro.append(node('span', 'bp-mission-icon', '↗'), node('p', 'bp-instruction', '뜻에 맞는 단어 배열'), node('h4', 'bp-meaning', current.ko));
      const answerArea = node('div', 'bp-answer-zone' + (solved ? ' is-solved' : ''));
      answerArea.setAttribute('aria-label', '조립 문장 · 단어 선택 시 취소');
      if (!answer.length) answerArea.append(node('span', 'bp-placeholder', '단어를 순서대로 선택'));
      answer.forEach((id, index) => {
        const token = button(tokens[id].text, 'return', 'bp-token bp-token-selected');
        token.dataset.token = id;
        token.disabled = solved;
        token.setAttribute('aria-label', (index + 1) + '번째 단어 ' + tokens[id].text + ', 선택 취소');
        answerArea.append(token);
      });
      const bankArea = node('div', 'bp-word-bank');
      bankArea.setAttribute('aria-label', '선택할 단어');
      bank.filter(id => !answer.includes(id)).forEach(id => {
        const token = button(tokens[id].text, 'select', 'bp-token');
        token.dataset.token = id;
        token.disabled = solved;
        token.setAttribute('aria-label', tokens[id].text + ', 문장에 추가');
        bankArea.append(token);
      });
      if (!bankArea.children.length) bankArea.append(node('span', 'bp-bank-empty', solved ? '문장 완성 ✓' : '전체 단어 선택 완료 · 순서 확인'));
      const tools = node('div', 'bp-tools');
      const undo = button('↶ 한 단어 취소', 'undo', 'bp-tool');
      const reset = button('다시 놓기', 'reset', 'bp-tool');
      const mix = button('⤨ 단어 섞기', 'shuffle', 'bp-tool');
      const hint = button('첫 단어 힌트', 'hint', 'bp-tool');
      const listen = button('◖ 문장 듣기', 'listen', 'bp-tool');
      undo.disabled = solved || !answer.length;
      reset.disabled = solved || !answer.length;
      mix.disabled = solved || bank.length - answer.length < 2;
      hint.disabled = solved;
      listen.disabled = typeof options.say !== 'function';
      tools.append(undo, reset, mix, hint, listen);
      stage.replaceChildren(intro, answerArea, bankArea, tools, node('p', 'bp-helper', '선택 단어 재선택 시 취소 · 정답 순서 완성 후 다음 문제 진행'));
      const check = button(solved ? '✓ 조립 성공' : '문장 확인 ↗', 'check', 'bp-primary');
      check.disabled = solved;
      const next = button(round === targets.length - 1 ? '연습 결과 보기 →' : '다음 문장 →', 'next', 'bp-next');
      next.disabled = !solved;
      footer.replaceChildren(check, next);
    }
    function renderListening() {
      const current = targets[round];
      const intro = node('div', 'bp-mission bp-listening-mission');
      intro.append(node('span', 'bp-mission-icon bp-sound-icon', '◖'), node('p', 'bp-instruction', '음성 듣기 후 뜻 선택'), node('h4', 'bp-meaning', '문장의 뜻'));
      const listen = button(played ? '◖ 한 번 더 듣기' : '◖ 영어 문장 듣기', 'listen', 'bp-listen');
      listen.disabled = typeof options.say !== 'function';
      const choiceArea = node('div', 'bp-choices');
      choiceArea.setAttribute('aria-label', '들리는 문장의 뜻');
      choices.forEach((choice, index) => {
        const picked = selectedAnswer === index;
        const correct = choice.targetIndex === round;
        const option = button('', 'choice', 'bp-choice' + (selectedAnswer !== null && correct ? ' is-correct' : picked ? ' is-wrong' : ''));
        option.dataset.choice = index;
        option.disabled = !played || selectedAnswer !== null;
        option.setAttribute('aria-pressed', picked ? 'true' : 'false');
        option.append(node('span', 'bp-choice-letter', ['A', 'B', 'C'][index]), node('span', 'bp-choice-text', choice.text));
        if (selectedAnswer !== null && correct) option.append(node('span', 'bp-choice-mark', '✓ 정답'));
        if (picked && !correct) option.append(node('span', 'bp-choice-mark', '내 선택'));
        choiceArea.append(option);
      });
      const contents = [intro, listen, choiceArea];
      if (selectedAnswer !== null) {
        const explanation = node('div', 'bp-explanation');
        const english = node('p', 'bp-revealed-en', current.en);
        english.lang = 'en';
        explanation.append(english, node('p', 'bp-revealed-ko', current.ko), node('p', 'bp-explainer', current.note));
        contents.push(explanation);
      }
      contents.push(node('p', 'bp-helper', typeof options.say !== 'function' ? '듣기 미지원 · 음성 지원 브라우저에서 재실행' : '듣기 후 답 선택 · 최초 답변 기준 점수 · 반복 듣기 가능'));
      stage.replaceChildren(...contents);
      const next = button(round === targets.length - 1 ? '연습 결과 보기 →' : '다음 듣기 →', 'next', 'bp-primary');
      next.disabled = selectedAnswer === null;
      footer.replaceChildren(next);
    }
    function render() {
      summary();
      if (mode === 'arrange') renderArrangement();
      else renderListening();
      if (failedSaves.has(round)) {
        footer.prepend(button('답변 저장 재시도', 'save-answer', 'bp-primary'));
        root.querySelectorAll('[data-practice-action]').forEach(control => {
          if (!['save-answer', 'listen'].includes(control.dataset.practiceAction)) control.disabled = true;
        });
      }
      if (answerBusy) root.querySelectorAll('[data-practice-action]').forEach(control => control.disabled = true);
    }
    function finish() {
      if (answerBusy || failedSaves.size || completedRounds.size !== targets.length || targets.some((_, index) => !reportedRounds.has(index))) return;
      completed = true;
      stopVoice();
      summary();
      const badge = node('span', 'bp-completion-badge', mode === 'arrange' ? '✦' : '◖');
      const title = node('h4', 'bp-completion-title', mode === 'arrange' ? '문장 조립 완료' : '듣기 학습 완료');
      const outcome = node('p', 'bp-completion-score', '연습점수 ' + score + ' / ' + targets.length);
      const detail = node('p', 'bp-completion-detail', mode === 'arrange' ? '정답 문장 ' + score + '개 완성 · 문장 확인 ' + checks + '회' : '처음 선택한 답 ' + targets.length + '개 중 ' + score + '개 정답 · 오답 표현 다시 듣기');
      const review = node('div', 'bp-review');
      targets.forEach((target, index) => {
        const row = node('div', 'bp-review-row');
        const en = node('p', 'bp-review-en', target.en);
        en.lang = 'en';
        row.append(node('span', 'bp-review-mark', mode === 'arrange' || results[index] ? '✓' : '↺'), en, node('p', 'bp-review-ko', target.ko));
        const replay = button('◖', 'review-listen', 'bp-review-listen');
        replay.dataset.review = index;
        replay.disabled = typeof options.say !== 'function';
        replay.setAttribute('aria-label', target.en + ' 다시 듣기');
        row.append(replay);
        review.append(row);
      });
      stage.replaceChildren(badge, title, outcome, detail, review);
      const retry = button('↻ 한 번 더 연습', 'retry', 'bp-next');
      const quest = node('button', 'bp-button bp-primary', '20분 학습 시작 ↗');
      quest.type = 'button';
      quest.dataset.practiceQuest = '6';
      quest.dataset.course = 'business';
      footer.replaceChildren(retry, quest);
      announce(typeof options.onAnswer === 'function' ? '세 문제 완료 · 최종 보상 확인' : '자유 연습 완료 · 랭킹 포인트 미지급', 'complete');
      if (!completionSent) {
        completionSent = true;
        if (typeof options.onComplete === 'function') options.onComplete({ mode, score, total: targets.length, checks, answers:responseAnswers.slice() });
      }
    }
    async function playText(text) {
      if (destroyed || typeof options.say !== 'function') return false;
      stopVoice();
      try {
        const result = await options.say(text);
        if (destroyed) return false;
        if (result === false) throw new Error('Speech unavailable');
        return true;
      } catch (_) {
        if (!destroyed) announce('음성 재생 실패 · 기기 음량·듣기 설정 확인 후 재시도', 'error');
        return false;
      }
    }
    async function handleClick(event) {
      const control = event.target.closest?.('[data-practice-action]');
      if (destroyed || answerBusy || !control || !root.contains(control) || control.disabled) return;
      const action = control.dataset.practiceAction;
      if (action === 'review-listen' && completed) { playText(targets[Number(control.dataset.review)]?.en || ''); return; }
      if (action === 'retry' && completed) {
        if(typeof options.onRestart==='function')options.onRestart();playGeneration++; reportedRounds.clear(); completedRounds.clear(); rewardShown.clear(); firstAnswers.clear(); failedSaves.clear(); root.querySelector('.bp-reward-toast')?.remove(); completed = false; completionSent = false; round = 0; score = 0; checks = 0; results.length = 0; responseAnswers.length=0;
        prepareRound(); render(); announce(mode === 'arrange' ? '문장 조립 시작 · 단어 선택' : '듣기 학습 시작 · 음성 재생 선택');
        focusAction(mode === 'arrange' ? 'select' : 'listen');
        return;
      }
      if (completed) return;
      if (action === 'save-answer') {
        const index = round, first = firstAnswers.get(index), generation = playGeneration;
        if (!first || !failedSaves.has(index)) return;
        const reward = await reportFirst(index, first.answer, first.correct);
        if (destroyed || generation !== playGeneration) return;
        if (reward.saveFailed) { showSaveFailure(); return; }
        acceptAnswer(index, first.answer, first.correct, reward);
        return;
      }
      if (failedSaves.has(round) && action !== 'listen') return;
      if (action === 'listen') {
        const listeningRound = round;
        playText(targets[round].en).then(success => {
          if (!success || destroyed || completed || listeningRound !== round) return;
          if (mode === 'listening' && !played) {
            played = true; render(); announce('문장의 뜻 선택 · 반복 듣기 가능');
            focusAction('choice');
          }
        });
        return;
      }
      if (action === 'next') {
        if (!reportedRounds.has(round) || failedSaves.has(round)) return;
        if (mode === 'arrange' ? !solved : selectedAnswer === null) return;
        stopVoice();
        if (round === targets.length - 1) { finish(); return; }
        round++;
        prepareRound(); render(); announce(mode === 'arrange' ? '다음 문장 단어 배열' : '다음 문장 듣기');
        focusAction(mode === 'arrange' ? 'select' : 'listen');
        return;
      }
      if (mode === 'listening') {
        if (action !== 'choice' || !played || selectedAnswer !== null) return;
        const chosen = Number(control.dataset.choice);
        if (!Number.isInteger(chosen) || !choices[chosen]) return;
        selectedAnswer = chosen;
        const correct = choices[chosen].targetIndex === round;
        const index = round, value = choices[chosen].text, generation = playGeneration;
        let reward = { points: 0 };
        if (typeof options.onAnswer === 'function') reward = await reportFirst(index, value, correct);
        else reportedRounds.add(index);
        if (destroyed || generation !== playGeneration) return;
        if (reward.saveFailed) { showSaveFailure(); return; }
        acceptAnswer(index, value, correct, reward);
        return;
      }
      if (solved) return;
      if (action === 'select') {
        const id = Number(control.dataset.token);
        if (!tokens[id] || answer.includes(id)) return;
        answer.push(id); render(); announce(answer.length + ' / ' + tokens.length + '개 단어 선택');
        focusAction('select');
        if (answer.length === tokens.length) focusAction('check');
      } else if (action === 'return') {
        const id = Number(control.dataset.token);
        answer = answer.filter(value => value !== id); render(); announce(tokens[id].text + ' 단어 선택 취소'); focusAction('select', id);
      } else if (action === 'undo') {
        const id = answer.pop(); render(); announce('마지막 단어 취소'); if (id !== undefined) focusAction('select', id);
      } else if (action === 'reset') {
        answer = []; render(); announce('전체 선택 취소'); focusAction('select');
      } else if (action === 'shuffle') {
        bank = shuffle(bank); render(); announce('미선택 단어 순서 변경'); focusAction('select');
      } else if (action === 'hint') {
        announce('첫 단어 힌트: ' + tokens[0].text + ' · 나머지 단어 배열 필요', 'hint');
      } else if (action === 'check') {
        if (answer.length !== tokens.length) { announce('단어 ' + tokens.length + '개 전체 배열 후 확인', 'retry'); return; }
        checks++;
        const value = answer.map(id => tokens[id].text).join(' ');
        const correct = normalize(value) === normalize(targets[round].en);
        const index = round, generation = playGeneration;
        let reward = { points: 0 };
        if (!reportedRounds.has(index)) {
          if (typeof options.onAnswer === 'function') reward = await reportFirst(index, value, correct);
          else reportedRounds.add(index);
        }
        if (destroyed || generation !== playGeneration) return;
        if (reward.saveFailed) { showSaveFailure(); return; }
        acceptAnswer(index, value, correct, reward);
      }
    }
    root.addEventListener('click', handleClick);
    function destroy() {
      if (destroyed) return;
      destroyed = true; playGeneration++;
      root.removeEventListener('click', handleClick);
      stopVoice();
      root.remove();
      if (activeDestroy === destroy) activeDestroy = null;
    }
    activeDestroy = destroy;
    if (targets.length !== 3) {
      stage.replaceChildren(node('p', 'bp-helper', '학습 표현 불러오기 실패 · 새로고침 필요'));
      announce('수업 자료 불러오기 실패 · 학습 시작 불가', 'error');
    } else {
      prepareRound(); render();
      announce(mode === 'arrange' ? '단어를 순서대로 선택' : '자동 재생 없음 · 문장 듣기 선택 후 시작');
    }
    return { destroy };
  }
  window.BusinessPractice = { mount, destroy() { if (activeDestroy) activeDestroy(); } };
})();
