// 데이터베이스 연결: 서버 로직(worker/)은 Cloudflare D1 형식으로 쓰여 있어서,
// 같은 형식의 호출을 Turso(libSQL · SQLite 호환)로 이어 주는 얇은 층이다. SQL은 한 줄도 바꾸지 않는다.
import { MIGRATIONS } from './migrations.mjs';

let ready;   // 함수 인스턴스마다 한 번만 연결·테이블 확인

async function connect() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  if (url.startsWith('file:')) {                       // 내 컴퓨터에서 시험할 때: 파일 하나가 곧 DB
    const { createClient } = await import('@libsql/client');
    return createClient({ url });
  }
  const { createClient } = await import('@libsql/client/web');   // 배포 환경: HTTP로 Turso에 접속
  return createClient({ url: url.replace(/^libsql:/, 'https:'), authToken: process.env.TURSO_AUTH_TOKEN });
}

/** 아직 적용하지 않은 drizzle/*.sql 을 순서대로 적용한다. 처음 접속할 때 테이블이 자동으로 만들어진다. */
async function ensureSchema(client) {
  await client.execute('CREATE TABLE IF NOT EXISTS _aj_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
  const applied = new Set((await client.execute('SELECT name FROM _aj_migrations')).rows.map(row => row[0]));
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    try {
      await client.batch([...migration.statements, { sql: 'INSERT INTO _aj_migrations (name, applied_at) VALUES (?, ?)', args: [migration.name, Date.now()] }], 'write');
    } catch (error) {
      // 두 인스턴스가 동시에 처음 뜨면 한쪽이 먼저 끝냈을 수 있다. 그 경우만 통과시킨다.
      const done = await client.execute({ sql: 'SELECT 1 FROM _aj_migrations WHERE name = ?', args: [migration.name] });
      if (!done.rows.length) throw error;
    }
  }
}

const toArgs = args => args.map(value => typeof value === 'boolean' ? (value ? 1 : 0) : value === undefined ? null : value);
const toRows = set => set.rows.map(row => { const item = {}; set.columns.forEach((column, index) => { const value = row[index]; item[column] = typeof value === 'bigint' ? Number(value) : value; }); return item; });
const toResult = set => ({ results: toRows(set), success: true, meta: { changes: Number(set.rowsAffected || 0), last_row_id: set.lastInsertRowid === undefined ? null : Number(set.lastInsertRowid) } });

class Statement {
  constructor(client, sql, args = []) { this.client = client; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.client, this.sql, toArgs(args)); }
  async first(column) { const rows = toRows(await this.client.execute({ sql: this.sql, args: this.args })); if (!rows.length) return null; return column ? rows[0][column] : rows[0]; }
  async all() { return toResult(await this.client.execute({ sql: this.sql, args: this.args })); }
  async run() { return toResult(await this.client.execute({ sql: this.sql, args: this.args })); }
}

function asD1(client) {
  return {
    prepare: sql => new Statement(client, sql),
    async batch(statements) { return (await client.batch(statements.map(statement => ({ sql: statement.sql, args: statement.args })), 'write')).map(toResult); },
    async exec(sql) { await client.executeMultiple(sql); return { count: 1 }; }
  };
}

/** 설정이 없으면 null. 있으면 D1 형식의 DB 객체. */
export async function getDatabase() {
  if (!ready) {
    ready = (async () => { const client = await connect(); if (!client) return null; await ensureSchema(client); return asD1(client); })();
    ready.catch(() => { ready = undefined; });   // 실패하면 다음 요청에서 다시 시도
  }
  return ready;
}
