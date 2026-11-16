CREATE TABLE reading_reads (
  user_id TEXT NOT NULL,
  study_date TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, study_date)
);
