// 자동 생성 파일입니다. 직접 고치지 말고 worker/ · client/data.js · drizzle/ 를 고친 뒤 `npm run build` 를 실행하세요.
export const MIGRATIONS = [
  {
    "name": "0000_learning",
    "statements": [
      "CREATE TABLE profiles (\n  user_id TEXT PRIMARY KEY,\n  public_id TEXT NOT NULL UNIQUE,\n  nickname TEXT NOT NULL,\n  avatar TEXT NOT NULL,\n  total_points INTEGER NOT NULL DEFAULT 0,\n  coins INTEGER NOT NULL DEFAULT 0,\n  current_room_id TEXT,\n  created_at INTEGER NOT NULL\n);",
      "CREATE TABLE rooms (\n  id TEXT PRIMARY KEY,\n  code TEXT NOT NULL UNIQUE,\n  name TEXT NOT NULL,\n  owner_id TEXT NOT NULL,\n  created_at INTEGER NOT NULL\n);",
      "CREATE TABLE room_members (\n  room_id TEXT NOT NULL,\n  user_id TEXT NOT NULL,\n  joined_at INTEGER NOT NULL,\n  PRIMARY KEY (room_id, user_id)\n);",
      "CREATE TABLE learning_sessions (\n  id TEXT PRIMARY KEY,\n  user_id TEXT NOT NULL,\n  room_id TEXT,\n  course TEXT NOT NULL,\n  day INTEGER NOT NULL,\n  local_date TEXT NOT NULL,\n  started_at INTEGER NOT NULL,\n  finished_at INTEGER,\n  elapsed_seconds INTEGER NOT NULL DEFAULT 0,\n  reflection TEXT NOT NULL DEFAULT '',\n  speech_json TEXT NOT NULL DEFAULT '[]'\n);",
      "CREATE INDEX learning_sessions_user_date ON learning_sessions(user_id, local_date);",
      "CREATE UNIQUE INDEX learning_sessions_one_open ON learning_sessions(user_id, local_date) WHERE finished_at IS NULL;",
      "CREATE TABLE quiz_answers (\n  session_id TEXT NOT NULL,\n  question_index INTEGER NOT NULL,\n  answer_index INTEGER NOT NULL,\n  correct INTEGER NOT NULL,\n  answered_at INTEGER NOT NULL,\n  PRIMARY KEY (session_id, question_index)\n);",
      "CREATE TABLE learning_rewards (\n  id TEXT PRIMARY KEY,\n  user_id TEXT NOT NULL,\n  room_id TEXT,\n  local_date TEXT NOT NULL,\n  month TEXT NOT NULL,\n  points INTEGER NOT NULL,\n  seconds INTEGER NOT NULL,\n  correct_answers INTEGER NOT NULL,\n  question_count INTEGER NOT NULL,\n  applied INTEGER NOT NULL DEFAULT 0,\n  created_at INTEGER NOT NULL,\n  UNIQUE (user_id, local_date)\n);",
      "CREATE INDEX learning_rewards_room_month ON learning_rewards(room_id, month, user_id);",
      "CREATE TABLE owned_items (\n  user_id TEXT NOT NULL,\n  item_id TEXT NOT NULL,\n  purchased_at INTEGER NOT NULL,\n  charged INTEGER NOT NULL DEFAULT 0,\n  PRIMARY KEY (user_id, item_id)\n);"
    ]
  },
  {
    "name": "0001_showcase",
    "statements": [
      "CREATE TABLE showcase_posts (\n  id TEXT PRIMARY KEY,\n  user_id TEXT NOT NULL,\n  room_id TEXT NOT NULL,\n  sentence TEXT NOT NULL,\n  meaning TEXT NOT NULL DEFAULT '',\n  tag TEXT NOT NULL,\n  local_date TEXT NOT NULL,\n  created_at INTEGER NOT NULL,\n  deleted_at INTEGER\n);",
      "CREATE INDEX showcase_posts_room_created ON showcase_posts(room_id, created_at DESC);",
      "CREATE INDEX showcase_posts_user_date ON showcase_posts(user_id, local_date);",
      "CREATE TABLE showcase_likes (\n  post_id TEXT NOT NULL REFERENCES showcase_posts(id) ON DELETE CASCADE,\n  user_id TEXT NOT NULL,\n  local_date TEXT NOT NULL,\n  created_at INTEGER NOT NULL,\n  PRIMARY KEY (post_id, user_id)\n);",
      "CREATE INDEX showcase_likes_user_date ON showcase_likes(user_id, local_date);"
    ]
  },
  {
    "name": "0002_teaching",
    "statements": [
      "CREATE TABLE teacher_chapters (\n  id TEXT PRIMARY KEY,\n  number INTEGER NOT NULL,\n  title TEXT NOT NULL,\n  week_start TEXT NOT NULL,\n  body TEXT NOT NULL DEFAULT '',\n  status TEXT NOT NULL DEFAULT 'draft',\n  publish_at INTEGER,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL\n);",
      "CREATE INDEX teacher_chapters_schedule ON teacher_chapters(status, week_start, publish_at);",
      "CREATE TABLE teacher_expressions (\n  id TEXT PRIMARY KEY,\n  chapter_id TEXT REFERENCES teacher_chapters(id),\n  en TEXT NOT NULL,\n  ko TEXT NOT NULL,\n  note TEXT NOT NULL DEFAULT '',\n  kind TEXT NOT NULL DEFAULT '표현',\n  example TEXT NOT NULL DEFAULT '',\n  study_day INTEGER NOT NULL DEFAULT 1,\n  status TEXT NOT NULL DEFAULT 'draft',\n  publish_at INTEGER,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL,\n  deleted_at INTEGER\n);",
      "CREATE INDEX teacher_expressions_schedule ON teacher_expressions(chapter_id, status, publish_at);",
      "CREATE TABLE teacher_pdfs (\n  chapter_id TEXT PRIMARY KEY REFERENCES teacher_chapters(id),\n  object_key TEXT NOT NULL UNIQUE,\n  name TEXT NOT NULL,\n  size INTEGER NOT NULL,\n  pages INTEGER,\n  uploaded_at INTEGER NOT NULL\n);",
      "CREATE TABLE teacher_revisions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  kind TEXT NOT NULL,\n  created_at INTEGER NOT NULL\n);",
      "CREATE TABLE teacher_admin_sessions (\n  token_hash TEXT PRIMARY KEY,\n  secret_hash TEXT NOT NULL,\n  created_at INTEGER NOT NULL,\n  expires_at INTEGER NOT NULL\n);",
      "CREATE INDEX teacher_admin_sessions_expiry ON teacher_admin_sessions(expires_at);",
      "CREATE TABLE teacher_login_attempts (\n  id TEXT PRIMARY KEY,\n  ip_hash TEXT NOT NULL,\n  created_at INTEGER NOT NULL\n);",
      "CREATE INDEX teacher_login_attempts_window ON teacher_login_attempts(ip_hash, created_at);",
      "CREATE TABLE teacher_notes (\n  user_id TEXT NOT NULL,\n  chapter_id TEXT NOT NULL REFERENCES teacher_chapters(id),\n  page INTEGER NOT NULL,\n  text TEXT NOT NULL DEFAULT '',\n  strokes_json TEXT NOT NULL DEFAULT '[]',\n  updated_at INTEGER NOT NULL,\n  PRIMARY KEY (user_id, chapter_id, page)\n);",
      "ALTER TABLE learning_sessions ADD COLUMN lesson_json TEXT NOT NULL DEFAULT '{}';",
      "ALTER TABLE learning_sessions ADD COLUMN chapter_id TEXT;"
    ]
  },
  {
    "name": "0003_activity",
    "statements": [
      "CREATE TABLE study_cards (user_id TEXT NOT NULL, card_id TEXT NOT NULL, known INTEGER NOT NULL DEFAULT 0, starred INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, PRIMARY KEY (user_id,card_id));",
      "CREATE TABLE activity_runs (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,room_id TEXT,mode TEXT NOT NULL,challenge_json TEXT NOT NULL,started_at INTEGER NOT NULL,finished_at INTEGER,local_date TEXT NOT NULL);",
      "CREATE INDEX activity_runs_user_day ON activity_runs(user_id,local_date);",
      "CREATE TABLE activity_awards (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,room_id TEXT,category TEXT NOT NULL,mode TEXT NOT NULL,points INTEGER NOT NULL,coins INTEGER NOT NULL DEFAULT 0,seconds INTEGER NOT NULL DEFAULT 0,local_date TEXT NOT NULL,month TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);",
      "CREATE INDEX activity_awards_month ON activity_awards(room_id,month,user_id);",
      "CREATE INDEX activity_awards_user_day ON activity_awards(user_id,local_date,category);"
    ]
  },
  {
    "name": "0004_activity_answers",
    "statements": [
      "CREATE TABLE activity_answers (\n  run_id TEXT NOT NULL REFERENCES activity_runs(id),\n  question_index INTEGER NOT NULL,\n  answer TEXT NOT NULL,\n  correct INTEGER NOT NULL,\n  answered_at INTEGER NOT NULL,\n  PRIMARY KEY (run_id, question_index)\n);"
    ]
  },
  {
    "name": "0005_daily_rail",
    "statements": [
      "CREATE TABLE daily_rail_passes (\n  run_id TEXT NOT NULL REFERENCES activity_runs(id),\n  question_index INTEGER NOT NULL,\n  passed_at INTEGER NOT NULL,\n  PRIMARY KEY (run_id, question_index)\n);",
      "CREATE UNIQUE INDEX activity_runs_daily_goal ON activity_runs (\n  user_id, local_date, json_extract(challenge_json, '$.collection')\n) WHERE json_valid(challenge_json) AND json_extract(challenge_json, '$.daily') = 1 AND COALESCE(json_extract(challenge_json, '$.practice'), 0) = 0;",
      "CREATE UNIQUE INDEX activity_runs_daily_practice_open ON activity_runs (\n  user_id, local_date, json_extract(challenge_json, '$.collection')\n) WHERE json_valid(challenge_json) AND json_extract(challenge_json, '$.daily') = 1 AND json_extract(challenge_json, '$.practice') = 1 AND finished_at IS NULL;"
    ]
  },
  {
    "name": "0006_auth",
    "statements": [
      "CREATE TABLE auth_sessions (\n  token_hash TEXT PRIMARY KEY,\n  user_id TEXT NOT NULL,\n  provider TEXT NOT NULL,\n  created_at INTEGER NOT NULL,\n  expires_at INTEGER NOT NULL\n);",
      "CREATE INDEX auth_sessions_user_idx ON auth_sessions (user_id);",
      "CREATE INDEX auth_sessions_expiry_idx ON auth_sessions (expires_at);"
    ]
  }
];
