// 빌드: worker/ 의 서버 로직과 client/ 의 학습 데이터를 하나로 묶어 server/core.mjs 를 만들고,
// drizzle/ 의 SQL을 server/migrations.mjs 로 옮긴다. 화면 파일(client/)은 그대로 정적 파일로 배포된다.
// 실행: npm run build   (Vercel이 배포할 때도 자동으로 실행한다)
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..'), at = p => path.join(root, p);
const read = p => readFile(at(p), 'utf8');
const banner = '// 자동 생성 파일입니다. 직접 고치지 말고 worker/ · client/data.js · drizzle/ 를 고친 뒤 `npm run build` 를 실행하세요.\n';

const scoped = async (file, name, exports) => 'const ' + name + ' = (() => {\n'
  + (await read(file)).replace(/^import\s+['"]\.\.\/client\/quiz-options\.js['"];?\s*$/gm, '').replace(/^export\s+/gm, '')
  + '\nreturn { ' + exports.join(', ') + ' };\n})();\n';

const core = banner
  + await read('client/quiz-options.js') + '\n'
  + (await read('worker/api.js')).replace(/^export\s+/gm, '') + '\n'
  + await read('client/data.js') + '\n'
  + await scoped('worker/teaching.js', 'Teaching', ['handleTeaching', 'getTeachingContent'])
  + await scoped('worker/activity.js', 'Activity', ['handleActivity'])
  + `
const BASE_CARDS = [...BUSINESS_DATA.map((c, i) => ({ ...c, id: 'builtin-business-' + i })), ...DATA.map((c, i) => ({ ...c, id: 'builtin-foundation-' + i }))];
/** /api/* 요청 하나를 처리한다. env = { DB, BUCKET, ADMIN_PASSWORD } */
export async function handleCore(request, env) {
  const special = await Teaching.handleTeaching(request, env, Date.now(), COURSE_DATA); if (special) return special;
  const model = await Teaching.getTeachingContent(env, COURSE_DATA);
  const activity = await Activity.handleActivity(request, env, model.content, BASE_CARDS); if (activity) return activity;
  return handleApi(request, env, model.courses);
}
`;

const migrations = [];
for (const file of (await readdir(at('drizzle'))).filter(name => name.endsWith('.sql')).sort()) {
  const statements = (await read('drizzle/' + file)).split('--> statement-breakpoint').map(part => part.trim()).filter(Boolean);
  migrations.push({ name: file.replace(/\.sql$/, ''), statements });
}

await mkdir(at('server'), { recursive: true });
await writeFile(at('server/core.mjs'), core);
await writeFile(at('server/migrations.mjs'), banner + 'export const MIGRATIONS = ' + JSON.stringify(migrations, null, 2) + ';\n');
console.log('server/core.mjs (' + Math.round(core.length / 1024) + ' KB) · server/migrations.mjs (' + migrations.length + '개) 생성 완료');
