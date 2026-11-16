CREATE TABLE teacher_transcripts (
  chapter_id TEXT PRIMARY KEY REFERENCES teacher_chapters(id),
  name TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  turns INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 0,
  uploaded_at INTEGER NOT NULL
);
