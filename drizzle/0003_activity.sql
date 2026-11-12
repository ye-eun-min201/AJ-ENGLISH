CREATE TABLE study_cards (user_id TEXT NOT NULL, card_id TEXT NOT NULL, known INTEGER NOT NULL DEFAULT 0, starred INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, PRIMARY KEY (user_id,card_id));
--> statement-breakpoint
CREATE TABLE activity_runs (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,room_id TEXT,mode TEXT NOT NULL,challenge_json TEXT NOT NULL,started_at INTEGER NOT NULL,finished_at INTEGER,local_date TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX activity_runs_user_day ON activity_runs(user_id,local_date);
--> statement-breakpoint
CREATE TABLE activity_awards (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,room_id TEXT,category TEXT NOT NULL,mode TEXT NOT NULL,points INTEGER NOT NULL,coins INTEGER NOT NULL DEFAULT 0,seconds INTEGER NOT NULL DEFAULT 0,local_date TEXT NOT NULL,month TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX activity_awards_month ON activity_awards(room_id,month,user_id);
--> statement-breakpoint
CREATE INDEX activity_awards_user_day ON activity_awards(user_id,local_date,category);
