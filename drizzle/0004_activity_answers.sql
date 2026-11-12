CREATE TABLE activity_answers (
  run_id TEXT NOT NULL REFERENCES activity_runs(id),
  question_index INTEGER NOT NULL,
  answer TEXT NOT NULL,
  correct INTEGER NOT NULL,
  answered_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, question_index)
);
