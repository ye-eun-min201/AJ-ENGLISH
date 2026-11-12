CREATE TABLE showcase_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  sentence TEXT NOT NULL,
  meaning TEXT NOT NULL DEFAULT '',
  tag TEXT NOT NULL,
  local_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);
--> statement-breakpoint
CREATE INDEX showcase_posts_room_created ON showcase_posts(room_id, created_at DESC);
--> statement-breakpoint
CREATE INDEX showcase_posts_user_date ON showcase_posts(user_id, local_date);
--> statement-breakpoint
CREATE TABLE showcase_likes (
  post_id TEXT NOT NULL REFERENCES showcase_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  local_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
--> statement-breakpoint
CREATE INDEX showcase_likes_user_date ON showcase_likes(user_id, local_date);
