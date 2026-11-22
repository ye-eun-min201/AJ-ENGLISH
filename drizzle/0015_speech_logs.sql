CREATE TABLE speech_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, created_at INTEGER NOT NULL, kind TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', ua TEXT NOT NULL DEFAULT '');
--> statement-breakpoint
CREATE INDEX speech_logs_user ON speech_logs(user_id, created_at);
