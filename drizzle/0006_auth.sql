CREATE TABLE auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX auth_sessions_user_idx ON auth_sessions (user_id);
--> statement-breakpoint
CREATE INDEX auth_sessions_expiry_idx ON auth_sessions (expires_at);
