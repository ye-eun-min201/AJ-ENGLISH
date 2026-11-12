// 밝은 원본 CSS와 어두운 변환본을 비교해, 달라진 선언만 html[data-theme="dark"] 아래로 모은 dark.css 를 만든다.
// 사용: node make-dark.mjs <밝은 client 폴더> <어두운 css 폴더> <출력 파일>
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
const [lightDir, darkDir, out] = process.argv.slice(2);
const ORDER = ['style','arcade','practice','flashcards','slides','characters','dashboard','admin','admin-simple','pastel','admin-types','admin-learners','help','quest-map','fruit-game','rail-game','rewards','theme-park','storage-status','typography','home-entry','form-guidance','site-info','responsive'];
const P = 'html[data-theme="dark"]';
const scope = sel => postcss.list.comma(sel).map(s => {
  s = s.trim();
  if (/^:root\b/.test(s)) return P + s.slice(5);
  if (/^html\b/.test(s)) return P + s.slice(4);
  return P + ' ' + s;
}).join(',');
let total = 0, kf = 0; const warn = [];
function walk(l, d, file) {
  const res = [];
  const ln = l.nodes || [], dn = d.nodes || [];
  if (ln.length !== dn.length) { warn.push(file + ': 구조 다름 ' + (l.selector || l.name || 'root')); return res; }
  for (let i = 0; i < ln.length; i++) {
    const a = ln[i], b = dn[i];
    if (a.type !== b.type) { warn.push(file + ': 종류 다름'); continue; }
    if (a.type === 'rule') {
      const decls = [];
      const ad = a.nodes.filter(n => n.type === 'decl'), bd = b.nodes.filter(n => n.type === 'decl');
      if (ad.length !== bd.length) { const have = new Set(ad.map(x => x.prop + '|' + x.value + '|' + !!x.important)); for (const x of bd) if (!have.has(x.prop + '|' + x.value + '|' + !!x.important)) decls.push(`${x.prop}:${x.value}${x.important ? ' !important' : ''}`); }
      else for (let j = 0; j < ad.length; j++) if (ad[j].value !== bd[j].value || ad[j].important !== bd[j].important) decls.push(`${bd[j].prop}:${bd[j].value}${bd[j].important ? ' !important' : ''}`);
      if (decls.length) { total += decls.length; res.push(`${scope(b.selector)}{${decls.join(';')}}`); }
    } else if (a.type === 'atrule') {
      if (/keyframes$/.test(a.name)) { if (a.toString() !== b.toString()) { kf++; } }
      else if (a.nodes) { const inner = walk(a, b, file); if (inner.length) res.push(`@${a.name} ${a.params}{${inner.join('')}}`); }
    }
  }
  return res;
}
let css = '/* dark.css — 자동 생성 파일(직접 고치지 말 것). 어두운 판에서만 달라지는 색을 모아 둠. */\n';
const renamed = [];
for (const name of ORDER) {
  let a, b;
  try { a = await readFile(path.join(lightDir, name + '.css'), 'utf8'); b = await readFile(path.join(darkDir, name + '.css'), 'utf8'); } catch { continue; }
  const parts = walk(postcss.parse(a), postcss.parse(b), name);
  for (const p of parts) { const m = p.match(/^\/\*KF:(.+)\*\/$/); if (m) renamed.push(m[1]); }
  css += `/* ${name} */\n` + parts.filter(p => !p.startsWith('/*KF:')).join('\n') + '\n';
}
await writeFile(out, css);
console.log('선언', total, '· 키프레임', kf, renamed.join(','), '· 크기', (css.length / 1024).toFixed(1) + 'KB');
if (warn.length) console.log('경고\n' + warn.slice(0, 20).join('\n'));
