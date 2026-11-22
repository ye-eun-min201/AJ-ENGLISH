// 영어 단어의 발음 도움말을 만든다 (AI 없이 규칙으로).
// 발음 사전(CMU Pronouncing Dictionary)에서 소리 기호를 찾아 ① 한글로 비슷하게 적고 ② 강세 자리를 표시하고 ③ 한국 사람이 자주 틀리는 소리의 입 모양을 알려 준다.
// 한글 표기는 "비슷한 소리"일 뿐 정확한 발음이 아니다. 화면에서도 그렇게 안내한다.

let dictionaryPromise = null;
async function dictionary() {
  if (!dictionaryPromise) dictionaryPromise = import('cmu-pronouncing-dictionary').then(module => module.dictionary).catch(() => ({}));
  return dictionaryPromise;
}

const ONSET = { '': 11, B: 7, CH: 14, D: 3, DH: 3, F: 17, G: 0, HH: 18, JH: 12, K: 15, L: 5, M: 6, N: 2, NG: 11, P: 17, R: 5, S: 9, SH: 9, T: 16, TH: 9, V: 7, Z: 12, ZH: 12 };
// 모음 번호: ㅏ0 ㅐ1 ㅑ2 ㅒ3 ㅓ4 ㅔ5 ㅕ6 ㅖ7 ㅗ8 ㅘ9 ㅙ10 ㅚ11 ㅛ12 ㅜ13 ㅝ14 ㅞ15 ㅟ16 ㅠ17 ㅡ18 ㅢ19 ㅣ20
const PLAIN = { AA: [0], AE: [1], AH: [4], AO: [8], AW: [0, 13], AY: [0, 20], EH: [5], ER: [4], EY: [5, 20], IH: [20], IY: [20], OW: [8], OY: [8, 20], UH: [13], UW: [13] };
const WITH_Y = { AA: [2], AE: [3], AH: [6], AO: [12], AW: [2, 13], AY: [2, 20], EH: [7], ER: [6], EY: [7, 20], IH: [20], IY: [20], OW: [12], OY: [12, 20], UH: [17], UW: [17] };
const WITH_W = { AA: [9], AE: [10], AH: [14], AO: [14], AW: [9, 13], AY: [9, 20], EH: [15], ER: [14], EY: [15, 20], IH: [16], IY: [16], OW: [14], OY: [14, 20], UH: [13], UW: [13] };
const SHORT = new Set(['IH', 'EH', 'AE', 'AH', 'UH', 'AA', 'AO']);
const CODA = { M: 16, N: 4, NG: 21, L: 8, K: 1, P: 17, T: 19 };
const isVowel = sound => Object.prototype.hasOwnProperty.call(PLAIN, sound);
const block = (onset, vowel, coda = 0) => String.fromCharCode(0xAC00 + (onset * 21 + vowel) * 28 + coda);

/** 소리 기호 배열(['CH','AE1','M', …])을 한글 음절 목록으로 바꾼다. 돌려주는 값: { syllables: ['챔','피','어','닝'], stress: 0 } */
export function toHangul(phones) {
  const out = []; let pending = [], stress = -1, droppedR = false, before = '';
  const last = () => out[out.length - 1];
  const alone = (sound, opensCluster = false) => {            // 모음 없이 혼자 남은 자음 (opensCluster: pr, tr, kl 처럼 바로 뒤 자음과 한 덩어리로 다음 음절을 여는 경우)
    const prev = last();
    if (sound === 'R') { if (prev) droppedR = true; else out.push({ o: 5, v: 18, c: 0 }); return; }
    if (sound === 'Y' || sound === 'W' || sound === 'HH') return;
    if (['M', 'N', 'NG', 'L'].includes(sound)) { if (prev && !prev.c) prev.c = CODA[sound]; else out.push({ o: ONSET[sound === 'NG' ? '' : sound], v: 18, c: sound === 'NG' ? 21 : 0 }); return; }
    if (['K', 'P', 'T'].includes(sound) && !opensCluster && prev && !prev.c && prev.short && !droppedR) { prev.c = CODA[sound]; return; }
    if (['SH', 'CH', 'JH', 'ZH'].includes(sound)) { out.push({ o: ONSET[sound], v: 20, c: 0 }); return; }
    out.push({ o: ONSET[sound], v: 18, c: 0 });
  };
  const flush = () => { for (const sound of pending) alone(sound); pending = []; };
  for (const raw of phones) {
    const sound = raw.replace(/\d/g, ''), mark = raw.match(/\d/)?.[0];
    if (!isVowel(sound)) { pending.push(sound); before = sound; continue; }
    let glide = '';
    if (pending.length && (pending[pending.length - 1] === 'Y' || pending[pending.length - 1] === 'W')) glide = pending.pop();
    let onsetSound = pending.length ? pending.pop() : '';
    pending.forEach((sound2, n) => alone(sound2, n === pending.length - 1 && (onsetSound === 'R' || onsetSound === 'L')));
    pending = [];
    let table = glide === 'Y' ? WITH_Y : glide === 'W' ? WITH_W : PLAIN;
    if (onsetSound === 'SH' && !glide) table = WITH_Y;            // sh + 모음: 샤 셔 쇼 슈
    const prev = last();
    if (onsetSound === 'L' && prev && !prev.c) prev.c = 8;        // 낱말 가운데 l: ㄹㄹ (클린, 릴리)
    if (onsetSound === 'NG') { if (prev && !prev.c) prev.c = 21; onsetSound = ''; }
    const vowels = table[sound];
    if (mark === '1' && stress < 0) stress = out.length;
    const linkR = before === 'ER' && !onsetSound && !glide;      // er 뒤에 바로 모음: r 소리가 이어진다 (레버리지)
    out.push({ o: linkR ? 5 : (ONSET[onsetSound] ?? 11), v: vowels[0], c: 0, short: SHORT.has(sound) && vowels.length === 1 });
    before = sound;
    if (vowels.length > 1) out.push({ o: 11, v: vowels[1], c: 0, short: false });
    droppedR = false;
  }
  flush();
  return { syllables: out.map(item => block(item.o, item.v, item.c)), stress };
}

const TIPS = [
  [['TH'], 'th 소리: 혀끝을 윗니와 아랫니 사이로 살짝 내밀고 바람을 내보내요. ‘ㅅ’이나 ‘ㄸ’이 아니에요.'],
  [['DH'], 'th 소리(the, this): 혀끝을 이 사이에 살짝 두고 목을 울려요. ‘ㄷ’보다 부드러워요.'],
  [['R', 'ER'], 'R 소리: 혀끝이 입천장에 닿지 않게 뒤로 살짝 말아요. 입술은 조금 동그랗게.'],
  [['L'], 'L 소리: 혀끝을 윗니 바로 뒤에 꾹 붙였다 떼요.'],
  [['F'], 'F 소리: 윗니를 아랫입술에 살짝 대고 바람만 내보내요. ‘ㅍ’이 아니에요.'],
  [['V'], 'V 소리: 윗니를 아랫입술에 살짝 대고 목을 울려요. ‘ㅂ’이 아니에요.'],
  [['Z'], 'Z 소리: ‘ㅈ’이 아니라 ‘스’ 소리에 목 울림을 넣어요.']
];

async function lookup(word) {
  const words = await dictionary(), plain = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!plain) return null;
  if (words[plain]) return words[plain].split(' ');
  // 사전에 없는 꼴(-ing, -ed, -s)은 원래 낱말에 끝소리를 붙여 만든다.
  const voiceless = new Set(['P', 'T', 'K', 'F', 'TH', 'S', 'SH', 'CH']), sibilant = new Set(['S', 'Z', 'SH', 'ZH', 'CH', 'JH']);
  const tryBase = (base, add) => { const found = words[base]; if (!found) return null; const list = found.split(' '), end = list[list.length - 1].replace(/\d/g, ''); return list.concat(add(end)); };
  const stems = suffix => { const cut = plain.slice(0, -suffix.length); return [cut, cut + 'e', cut.replace(/(.)\1$/, '$1')]; };
  if (plain.endsWith('ing')) for (const base of stems('ing')) { const made = tryBase(base, () => ['IH0', 'NG']); if (made) return made; }
  if (plain.endsWith('ed')) for (const base of stems('ed')) { const made = tryBase(base, end => end === 'T' || end === 'D' ? ['IH0', 'D'] : voiceless.has(end) ? ['T'] : ['D']); if (made) return made; }
  if (plain.endsWith('ies')) { const made = tryBase(plain.slice(0, -3) + 'y', () => ['Z']); if (made) return made; }
  if (plain.endsWith('es')) for (const base of [plain.slice(0, -2), plain.slice(0, -1)]) { const made = tryBase(base, end => sibilant.has(end) ? ['IH0', 'Z'] : voiceless.has(end) ? ['S'] : ['Z']); if (made) return made; }
  if (plain.endsWith('s')) { const made = tryBase(plain.slice(0, -1), end => sibilant.has(end) ? ['IH0', 'Z'] : voiceless.has(end) ? ['S'] : ['Z']); if (made) return made; }
  // 대문자 줄임말(KPI, CEO 등)은 글자 이름으로 읽는다.
  if (/^[A-Z]{2,5}$/.test(word)) { const letters = []; for (const letter of plain) { const sound = words[letter]; if (!sound) return null; letters.push(...sound.split(' ')); } return letters; }
  return null;
}

/** 단어 하나의 발음 도움말. 사전에 없으면 found:false (화면은 천천히 듣기만 보여 준다). */
export async function pronounce(word) {
  const text = String(word || '').trim().slice(0, 40);
  const phones = await lookup(text);
  if (!phones) return { word: text, found: false, syllables: [], stress: -1, tips: [] };
  const { syllables, stress } = toHangul(phones), sounds = new Set(phones.map(sound => sound.replace(/\d/g, '')));
  const tips = [], plain = phones.map(sound => sound.replace(/\d/g, '')), lastSound = plain[plain.length - 1], spelled = text.toLowerCase();
  // 가장 도움이 되는 순서: 강세 → 끝소리 → 한국 사람이 자주 틀리는 소리
  if (plain.filter(isVowel).length > 1 && stress >= 0) tips.push('세게 읽는 곳은 ‘' + syllables[stress] + '’ 한 군데예요. 나머지는 약하고 빠르게 지나가요.');
  if (spelled.endsWith('ing') && lastSound === 'NG') tips.push('끝의 -ing: 콧소리 ‘잉’으로 끝까지 내요. 빼먹으면 다른 단어로 들려요.');
  else if (spelled.endsWith('ed') && (lastSound === 'T' || lastSound === 'D')) tips.push('끝의 -ed: 아주 짧은 ‘' + (lastSound === 'T' ? '트' : '드') + '’ 소리를 꼭 붙여요.');
  else if (/[^s]s$/.test(spelled) && (lastSound === 'S' || lastSound === 'Z')) tips.push('끝의 -s: ‘' + (lastSound === 'S' ? '스' : '즈') + '’ 소리를 끝까지 내요.');
  else if (['T', 'D', 'K', 'G', 'P', 'B'].includes(lastSound)) tips.push('끝소리 ' + lastSound.toLowerCase() + ': ‘' + syllables[syllables.length - 1] + '’ 뒤에 ‘으’를 길게 붙이지 말고 짧게 끊어요.');
  for (const [keys, tip] of TIPS) { if (tips.length >= 3) break; if (keys.some(key => sounds.has(key))) tips.push(tip); }
  return { word: text, found: true, syllables, stress, tips };
}
