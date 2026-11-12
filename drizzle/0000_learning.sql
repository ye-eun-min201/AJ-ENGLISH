CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  current_room_id TEXT,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE room_members (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, user_id)
);
--> statement-breakpoint
CREATE TABLE learning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  room_id TEXT,
  course TEXT NOT NULL,
  day INTEGER NOT NULL,
  local_date TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  reflection TEXT NOT NULL DEFAULT '',
  speech_json TEXT NOT NULL DEFAULT '[]'
);
--> statement-breakpoint
CREATE INDEX learning_sessions_user_date ON learning_sessions(user_id, local_date);
--> statement-breakpoint
CREATE UNIQUE INDEX learning_sessions_one_open ON learning_sessions(user_id, local_date) WHERE finished_at IS NULL;
--> statement-breakpoint
CREATE TABLE quiz_answers (
  session_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  answer_index INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  answered_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, question_index)
);
--> statement-breakpoint
CREATE TABLE learning_rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  room_id TEXT,
  local_date TEXT NOT NULL,
  month TEXT NOT NULL,
  points INTEGER NOT NULL,
  seconds INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  applied INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, local_date)
);
--> statement-breakpoint
CREATE INDEX learning_rewards_room_month ON learning_rewards(room_id, month, user_id);
--> statement-breakpoint
CREATE TABLE owned_items (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  purchased_at INTEGER NOT NULL,
  charged INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, item_id)
);
