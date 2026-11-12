CREATE TABLE daily_rail_passes (
  run_id TEXT NOT NULL REFERENCES activity_runs(id),
  question_index INTEGER NOT NULL,
  passed_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, question_index)
);
--> statement-breakpoint
CREATE UNIQUE INDEX activity_runs_daily_goal ON activity_runs (
  user_id, local_date, json_extract(challenge_json, '$.collection')
) WHERE json_valid(challenge_json) AND json_extract(challenge_json, '$.daily') = 1 AND COALESCE(json_extract(challenge_json, '$.practice'), 0) = 0;
--> statement-breakpoint
CREATE UNIQUE INDEX activity_runs_daily_practice_open ON activity_runs (
  user_id, local_date, json_extract(challenge_json, '$.collection')
) WHERE json_valid(challenge_json) AND json_extract(challenge_json, '$.daily') = 1 AND json_extract(challenge_json, '$.practice') = 1 AND finished_at IS NULL;
