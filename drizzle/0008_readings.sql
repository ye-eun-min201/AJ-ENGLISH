CREATE TABLE teacher_readings (
  id TEXT PRIMARY KEY,
  study_date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
ALTER TABLE teacher_expressions ADD COLUMN example_ko TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE teacher_expressions ADD COLUMN study_date TEXT;
--> statement-breakpoint
ALTER TABLE teacher_expressions ADD COLUMN reading_id TEXT;
--> statement-breakpoint
CREATE INDEX teacher_expressions_reading ON teacher_expressions(reading_id);
