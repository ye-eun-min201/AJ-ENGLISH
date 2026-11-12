CREATE TABLE teacher_chapters (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  week_start TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  publish_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX teacher_chapters_schedule ON teacher_chapters(status, week_start, publish_at);
--> statement-breakpoint
CREATE TABLE teacher_expressions (
  id TEXT PRIMARY KEY,
  chapter_id TEXT REFERENCES teacher_chapters(id),
  en TEXT NOT NULL,
  ko TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT '표현',
  example TEXT NOT NULL DEFAULT '',
  study_day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  publish_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
--> statement-breakpoint
CREATE INDEX teacher_expressions_schedule ON teacher_expressions(chapter_id, status, publish_at);
--> statement-breakpoint
CREATE TABLE teacher_pdfs (
  chapter_id TEXT PRIMARY KEY REFERENCES teacher_chapters(id),
  object_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  pages INTEGER,
  uploaded_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE teacher_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE teacher_admin_sessions (
  token_hash TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX teacher_admin_sessions_expiry ON teacher_admin_sessions(expires_at);
--> statement-breakpoint
CREATE TABLE teacher_login_attempts (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX teacher_login_attempts_window ON teacher_login_attempts(ip_hash, created_at);
--> statement-breakpoint
CREATE TABLE teacher_notes (
  user_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL REFERENCES teacher_chapters(id),
  page INTEGER NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  strokes_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, chapter_id, page)
);
--> statement-breakpoint
ALTER TABLE learning_sessions ADD COLUMN lesson_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE learning_sessions ADD COLUMN chapter_id TEXT;
