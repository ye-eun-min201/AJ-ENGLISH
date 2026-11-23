-- 지난 수업 목록 바로잡기: 1주차(week1)·2주차·3주차가 각각 일요일 수업 날짜와 번호 1·2·3으로 보이게 한다.
-- 제목에 Week 1 / Week 2 / Week 3 이 든 수업만 건드리고, 없으면 아무 일도 하지 않는다. 제목의 오타(Disucssion)도 고친다.
UPDATE teacher_chapters SET number = 1, week_start = '2026-11-08', title = CASE WHEN lower(title) = 'week1' THEN 'English Discussion Class Week 1' ELSE title END, updated_at = 1795450000000 WHERE (lower(title) = 'week1' OR lower(title) LIKE '%week 1%') AND week_start <= '2026-11-15';
--> statement-breakpoint
UPDATE teacher_chapters SET number = 2, week_start = '2026-11-15', updated_at = 1795450000000 WHERE title LIKE '%Week 2%' AND week_start <= '2026-11-22';
--> statement-breakpoint
UPDATE teacher_chapters SET number = 3, week_start = '2026-11-22', updated_at = 1795450000000 WHERE title LIKE '%Week 3%' AND week_start <= '2026-11-23';
--> statement-breakpoint
UPDATE teacher_chapters SET title = replace(title, 'Disucssion', 'Discussion'), updated_at = 1795450000000 WHERE title LIKE '%Disucssion%';
--> statement-breakpoint
INSERT INTO teacher_revisions (kind, created_at) SELECT 'chapter', 1795450000000 WHERE EXISTS (SELECT 1 FROM teacher_chapters);
