// 관리자 화면에 덧붙인 기능: (1) 수업 줄의 '녹음 글' (2) '오늘의 리딩' 올리기
(function () {
  'use strict';
  const A = window.AJAdmin, D = window.AJDaily; if (!A || !D) return;
  const $ = selector => document.querySelector(selector), esc = A.esc;
  const say = (selector, message, error) => A.status(selector, message, !!error);
  const confirms = new Map();
  /** 지우기처럼 되돌릴 수 없는 일은 두 번 눌러야 한다. */
  function twice(key, button, label) {
    if (confirms.has(key)) { clearTimeout(confirms.get(key)); confirms.delete(key); return true; }
    const original = button.textContent; button.textContent = label; button.classList.add('is-confirm');
    confirms.set(key, setTimeout(() => { confirms.delete(key); if (button.isConnected) { button.textContent = original; button.classList.remove('is-confirm'); } }, 4000));
    return false;
  }

  /* ---------- 녹음 글 ---------- */
  let transcriptTarget = null;
  async function uploadTranscript(file) {
    const chapterId = transcriptTarget; transcriptTarget = null; if (!file || !chapterId) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('파일이 너무 커요. 글만 들어 있는 텍스트 파일(.txt)을 골라 주세요.');
      const text = D.decodeText(await file.arrayBuffer()), parsed = D.parseTranscript(text);
      if (!parsed.turns.length) throw new Error('파일 안에 글이 없어요. 클로바노트에서 ‘텍스트(.txt)’로 받은 파일을 골라 주세요.');
      say('#chapter-list-status', '녹음 글 올리는 중');
      const result = await A.request('admin/transcript', { chapterId, name: file.name, text, turns: parsed.turns.length });
      A.setChapter(result.chapter, result.revision);
      say('#chapter-list-status', '녹음 글 저장 완료 · 말 ' + parsed.turns.length + '개' + (parsed.timed ? '' : ' (시간 표시 없는 글)') + ' · ' + (result.chapter.transcript.visible ? '학생도 봐요' : '지금은 나만 봐요'));
    } catch (error) { say('#chapter-list-status', error.message, true); }
  }
  async function viewTranscript(chapterId) {
    try { const data = await A.request('transcript/' + encodeURIComponent(chapterId)); window.AJTranscriptView.open({ title: data.title, text: data.text }); }
    catch (error) { say('#chapter-list-status', error.message, true); }
  }
  async function showTranscript(chapterId, visible) {
    try { const result = await A.request('admin/transcript/visible', { chapterId, visible }); A.setChapter(result.chapter, result.revision); say('#chapter-list-status', visible ? '녹음 글 · 로그인한 학생도 봐요 (저장 완료)' : '녹음 글 · 나만 봐요 (저장 완료)'); A.notify(result.revision, 'transcript', chapterId); }
    catch (error) { say('#chapter-list-status', error.message, true); }
  }
  async function removeTranscript(chapterId, button) {
    if (!twice('t:' + chapterId, button, '한 번 더 누르면 지워요')) return;
    try { const result = await A.request('admin/transcript/remove', { chapterId }); A.setChapter(result.chapter, result.revision); say('#chapter-list-status', '녹음 글을 지웠어요'); A.notify(result.revision, 'transcript', chapterId); }
    catch (error) { say('#chapter-list-status', error.message, true); }
  }
  function openWords(chapterId) {
    A.selectTab('daily');
    const box = document.querySelector('.bulk-paper'), select = $('#bulk-chapter'); if (box) box.open = true;
    if (select) select.value = chapterId;
    box?.scrollIntoView({ block: 'start' }); $('#bulk-input')?.focus({ preventScroll: true });
  }

  /* ---------- 오늘의 리딩 ---------- */
  const form = $('#reading-form'), field = name => form.elements[name];
  const readings = () => A.state().readings || [];
  function screen(mode) { $('#reading-collection').hidden = mode === 'edit'; $('#reading-editor').hidden = mode !== 'edit'; document.querySelector('[data-reading-list]').hidden = mode !== 'edit'; }
  function renderList() {
    const list = [...readings()].sort((a, b) => b.date.localeCompare(a.date)), today = A.kstDate();
    $('#reading-count').textContent = list.length;
    let week = '';
    $('#reading-list').innerHTML = list.length ? list.map(reading => {
      const open = reading.status === 'published', monday = D.mondayOf(reading.date), head = monday === week ? '' : '<h3 class="reading-week">' + esc(D.weekLabel(reading.date)) + '</h3>'; week = monday;
      const seen = open && reading.date <= today, id = esc(reading.id);
      return head + '<article class="reading-row"><div class="reading-row-main"><b>' + esc(D.dateLabel(reading.date)) + (reading.date === today ? ' <i>오늘</i>' : '') + '</b><strong>' + esc(reading.title || '제목 없음') + '</strong><small>' + (reading.body ? '글 ' + D.paragraphs(reading.body).length + '문단' : '글 없음') + ' · 단어 ' + reading.words.length + '개</small><em class="lesson-seen ' + (seen ? 'on' : 'off') + '">' + (seen ? '학생에게 보임' : open ? '그 날짜가 되면 보임' : '학생에게 안 보임 · 비공개') + '</em></div>' +
        '<div class="lesson-row-actions"><div class="lesson-toggle" role="group" aria-label="학생 공개 여부"><button type="button" data-reading-publish="published" data-reading="' + id + '" aria-pressed="' + open + '">공개</button><button type="button" data-reading-publish="draft" data-reading="' + id + '" aria-pressed="' + !open + '">비공개</button></div><button type="button" class="button secondary" data-reading-edit="' + id + '">수정</button><button type="button" class="button secondary lesson-delete" data-reading-remove="' + id + '">삭제</button></div></article>';
    }).join('') : '<div class="empty-state"><span>☀</span><h3>아직 올린 리딩이 없어요</h3><p>‘오늘 리딩 올리기 +’를 눌러 첫 글을 올려 보세요</p></div>';
  }
  const wordsToText = words => words.map((word, index) => [(index + 1) + '. ' + word.en, '뜻: ' + word.ko, word.example && 'Example: ' + word.example.replace(/\n/g, '\n- '), word.exampleKo && '해석: ' + word.exampleKo.replace(/\n/g, '\n- '), word.note && '참고: ' + word.note].filter(Boolean).join('\n')).join('\n\n');
  function edit(reading) {
    field('rid').value = reading?.id || ''; field('date').value = reading?.date || A.kstDate(); field('title').value = reading?.title || ''; field('body').value = reading?.body || ''; field('bodyKo').value = reading?.bodyKo || ''; field('words').value = reading ? wordsToText(reading.words) : '';
    $('#reading-editor-title').textContent = reading ? D.dateLabel(reading.date) + ' 리딩 고치기' : '오늘 리딩 올리기';
    say('#reading-status', ''); $('#reading-body-hint').textContent = ''; preview(); screen('edit'); field(reading ? 'body' : 'date').focus({ preventScroll: true }); window.scrollTo({ top: 0 });
  }
  let parsedWords = [];
  function preview() {
    const date = field('date').value, body = field('body').value, taken = date && readings().find(reading => reading.date === date && reading.id !== field('rid').value);
    $('#reading-date-hint').textContent = !date ? '' : taken ? '이 날짜에는 이미 올린 리딩이 있어요. 목록에서 그 날짜의 ‘수정’을 눌러 주세요.' : D.dateLabel(date) + ' · ' + D.weekLabel(date) + '에 들어가요';
    $('#reading-date-hint').classList.toggle('error', !!taken);
    parsedWords = D.parseWords(field('words').value);
    const paragraphs = D.paragraphs(body), found = new Set(); for (const paragraph of paragraphs) for (const piece of D.pieces(paragraph, parsedWords)) if (piece.word !== undefined) found.add(piece.word);
    if (body.trim()) $('#reading-body-hint').textContent = '문단 ' + paragraphs.length + '개로 나뉘어요';
    const koCount = D.paragraphs(field('bodyKo').value).length, koOff = koCount > 0 && koCount !== paragraphs.length;
    $('#reading-ko-hint').textContent = !koCount ? '해석을 넣으면 학생이 문단마다 ‘해석’을 눌러 볼 수 있어요.' : koOff ? '영어는 ' + paragraphs.length + '문단인데 해석은 ' + koCount + '문단이에요. 문단 수를 맞춰 주세요.' : '해석 ' + koCount + '문단 · 영어 문단과 수가 맞아요';
    $('#reading-ko-hint').classList.toggle('error', koOff);
    const problems = parsedWords.filter(word => word.problems.length).length;
    $('#reading-words-hint').textContent = !field('words').value.trim() ? '붙여넣으면 아래에 단어 카드로 나눠 보여 드려요.' : !parsedWords.length ? '단어를 찾지 못했어요. ‘1. 단어’처럼 번호를 붙이거나, 단어를 한 줄에 하나씩 써 주세요.' : '단어 ' + parsedWords.length + '개로 나눴어요' + (paragraphs.length ? ' · 그중 ' + found.size + '개가 글에 나와서 색이 칠해져요' : '') + (problems ? ' · 고칠 곳 ' + problems + '개' : '');
    $('#reading-words-hint').classList.toggle('error', !!problems || (!!field('words').value.trim() && !parsedWords.length));
    $('#reading-preview').innerHTML = parsedWords.map((word, index) => '<article class="rp-card' + (word.problems.length ? ' has-problem' : '') + '"><b>' + (index + 1) + '</b><div><strong lang="en">' + esc(word.en) + (found.has(index) ? '<i>글에 나옴</i>' : '') + '</strong><p>' + (word.ko ? esc(word.ko) : '<em>뜻이 비었어요 — 단어 아래 줄에 ‘뜻: …’을 써 주세요</em>') + '</p>' + (word.example ? '<p class="rp-ex" lang="en">' + D.markHTML(word.example.replace(/\n/g, ' / '), [word]) + '</p>' : '') + (word.exampleKo ? '<p class="rp-ko">' + esc(word.exampleKo.replace(/\n/g, ' / ')) + '</p>' : '') + (word.note ? '<p class="rp-note">참고 · ' + esc(word.note) + '</p>' : '') + '</div></article>').join('');
  }
  async function importFile(file) {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer(), text = /\.txt$/i.test(file.name) ? D.decodeText(buffer) : await D.hwpxText(buffer);
      if (!text.trim()) throw new Error('파일에서 글을 찾지 못했어요. 글을 복사해 붙여 주세요.');
      field('body').value = text; if (!field('title').value) field('title').value = file.name.replace(/\.[^.]+$/, '').replace(/_+/g, ' ').replace(/[\d\s()._\-]+$/, '').trim().slice(0, 120);
      preview(); say('#reading-status', '파일에서 글을 가져왔어요. 맞는지 한 번 봐 주세요.');
    } catch (error) { say('#reading-status', error.message, true); }
  }
  async function save(status, button) {
    const date = field('date').value, body = field('body').value.trim(); preview();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { say('#reading-status', '날짜를 골라 주세요.', true); field('date').focus(); return; }
    if (!body && !parsedWords.length) { say('#reading-status', '읽을 글이나 단어 중 하나는 넣어 주세요.', true); field('body').focus(); return; }
    const broken = parsedWords.find(word => word.problems.length);
    if (broken) { say('#reading-status', '‘' + broken.en + '’ — ' + broken.problems[0] + '. 고친 뒤 다시 저장해 주세요.', true); field('words').focus(); return; }
    const buttons = form.querySelectorAll('[data-reading-save]'); buttons.forEach(b => b.disabled = true); say('#reading-status', '저장하는 중');
    try {
      const id = field('rid').value, result = await A.request('admin/reading', { ...(id ? { id } : {}), date, title: field('title').value.trim(), body, bodyKo: field('bodyKo').value.trim(), status, words: parsedWords.map(({ en, ko, example, exampleKo, note }) => ({ en, ko, example, exampleKo, note })) });
      A.setReadings([result.reading, ...readings().filter(reading => reading.id !== result.reading.id)], result.revision); A.notify(result.revision, 'reading');
      screen('list'); say('#reading-list-status', D.dateLabel(date) + ' 리딩 저장 완료 · 단어 ' + result.reading.words.length + '개 · ' + (status === 'published' ? (date <= A.kstDate() ? '학생에게 보여요' : '그 날짜가 되면 보여요') : '비공개'));
    } catch (error) { say('#reading-status', error.message, true); }
    finally { buttons.forEach(b => b.disabled = false); }
  }
  async function publish(id, status) {
    const reading = readings().find(item => item.id === id); if (!reading || reading.status === status) return;
    try {
      const result = await A.request('admin/reading', { id, date: reading.date, title: reading.title, body: reading.body, bodyKo: reading.bodyKo || '', status, words: reading.words.map(({ en, ko, example, exampleKo, note }) => ({ en, ko, example, exampleKo, note })) });
      A.setReadings(readings().map(item => item.id === id ? result.reading : item), result.revision); A.notify(result.revision, 'reading');
      say('#reading-list-status', D.dateLabel(reading.date) + ' · ' + (status === 'published' ? '공개' : '비공개') + ' (저장 완료)');
    } catch (error) { say('#reading-list-status', error.message, true); }
  }
  async function remove(id, button) {
    if (!twice('r:' + id, button, '한 번 더 누르면 지워요')) return;
    try { const result = await A.request('admin/reading/remove', { id }); A.setReadings(readings().filter(item => item.id !== id), result.revision); A.notify(result.revision, 'reading'); say('#reading-list-status', '리딩을 지웠어요'); }
    catch (error) { say('#reading-list-status', error.message, true); }
  }

  document.addEventListener('aj-admin-render', renderList);
  form.addEventListener('input', preview);
  form.addEventListener('submit', event => event.preventDefault());
  $('#transcript-file').addEventListener('change', event => { const file = event.target.files?.[0]; event.target.value = ''; uploadTranscript(file); });
  $('#reading-file').addEventListener('change', event => { const file = event.target.files?.[0]; event.target.value = ''; importFile(file); });
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return; const data = button.dataset;
    if (data.transcriptPick) { transcriptTarget = data.transcriptPick; $('#transcript-file').click(); }
    else if (data.transcriptView) viewTranscript(data.transcriptView);
    else if (data.transcriptVisible) showTranscript(data.chapter, data.transcriptVisible === '1');
    else if (data.transcriptRemove) removeTranscript(data.transcriptRemove, button);
    else if (data.chapterWords) openWords(data.chapterWords);
    else if ('readingNew' in data) edit(readings().find(reading => reading.date === A.kstDate()) || null);
    else if ('readingList' in data) screen('list');
    else if ('readingFile' in data) $('#reading-file').click();
    else if (data.readingEdit) edit(readings().find(reading => reading.id === data.readingEdit));
    else if (data.readingPublish) publish(data.reading, data.readingPublish);
    else if (data.readingRemove) remove(data.readingRemove, button);
    else if (data.readingSave) save(data.readingSave, button);
    else if (data.tab === 'readings') screen('list');
  });
  renderList();
})();
