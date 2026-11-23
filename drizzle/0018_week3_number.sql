-- 어제(11월 22일) 수업은 3주차인데 4주차로 올라가 있던 것을 바로잡는다.
-- 4주차로 올라간 수업이 있으면 거기에 0017이 따로 만든 3주차 수업의 문장·단어를 합치고, 번호와 제목의 4를 3으로 바꾼다. 없으면 아무것도 하지 않는다.
UPDATE teacher_expressions SET chapter_id = (SELECT b.id FROM teacher_chapters b WHERE b.number = 4 AND b.id <> 'w3-chapter' AND b.status = 'published' AND b.week_start <= '2026-11-23' ORDER BY b.created_at DESC LIMIT 1) WHERE chapter_id = 'w3-chapter' AND deleted_at IS NULL AND EXISTS (SELECT 1 FROM teacher_chapters b WHERE b.number = 4 AND b.id <> 'w3-chapter' AND b.status = 'published' AND b.week_start <= '2026-11-23') AND NOT EXISTS (SELECT 1 FROM teacher_expressions o WHERE o.deleted_at IS NULL AND o.chapter_id = (SELECT b.id FROM teacher_chapters b WHERE b.number = 4 AND b.id <> 'w3-chapter' AND b.status = 'published' AND b.week_start <= '2026-11-23' ORDER BY b.created_at DESC LIMIT 1) AND lower(o.en) = lower(teacher_expressions.en));
--> statement-breakpoint
UPDATE teacher_expressions SET chapter_id = (SELECT b.id FROM teacher_chapters b WHERE b.number = 4 AND b.id <> 'w3-chapter' AND b.status = 'published' AND b.week_start <= '2026-11-23' ORDER BY b.created_at DESC LIMIT 1), deleted_at = 1795449600000 WHERE chapter_id = 'w3-chapter' AND EXISTS (SELECT 1 FROM teacher_chapters b WHERE b.number = 4 AND b.id <> 'w3-chapter' AND b.status = 'published' AND b.week_start <= '2026-11-23');
--> statement-breakpoint
DELETE FROM teacher_chapters WHERE id = 'w3-chapter' AND EXISTS (SELECT 1 FROM teacher_chapters b WHERE b.number = 4 AND b.id <> 'w3-chapter' AND b.status = 'published' AND b.week_start <= '2026-11-23');
--> statement-breakpoint
UPDATE teacher_chapters SET number = 3, title = replace(replace(title, 'Week 4', 'Week 3'), '4주차', '3주차'), body = replace(body, '4주차', '3주차'), updated_at = 1795449600000 WHERE number = 4 AND status = 'published' AND week_start <= '2026-11-23';
--> statement-breakpoint
INSERT INTO teacher_revisions (kind, created_at) SELECT 'chapter', 1795449600000 WHERE EXISTS (SELECT 1 FROM teacher_chapters WHERE number = 3);
