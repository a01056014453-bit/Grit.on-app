# Supabase DB 스키마

> CLAUDE.md에서 @import. 전체 테이블/컬럼/Enum 상세 참조용.

```
profiles              user_id, nickname, email, instrument, level
                      grit_score, daily_goal, streak_days

teachers              user_id(FK), name, specialty[], verified
                      career(JSON), rating, bio, badges[]

teacher_students      teacher_id, student_id, type(전공/취미), category

invitations           teacher_id(FK), token(UNIQUE), status, expires_at

feedback_requests     student_id(FK), teacher_id(FK)
                      composer, piece, problem_type
                      status(ENUM), video_url, credit_amount, payment_status

feedbacks             request_id(FK), comments(JSON), demo_video_url, practice_card

practice_sessions     user_id(FK), piece_name
                      practice_time(순연습), total_time(전체)
                      practice_type, audio_url

daily_rankings        user_id(FK), date, net_practice_time, grit_score

songs                 user_id(FK), title, composer, opus

song_analyses         composer, title, content(JSON), difficulty_level

pieces                id, title, composer_*, opus, key
piece_analyses        piece_id(FK), sections(JSON), total_measures

schools               id, name, type, year, deadline
rooms                 school_id(FK), member_count, video_count
room_memberships      room_id(FK), user_id(FK)

drill_cards           user_id(FK), song, measures, tempo
practice_todos        user_id(FK), song_title, technique, is_completed
push_subscriptions    user_id(UNIQUE), endpoint, keys(JSON)
```

## Enums

```
feedback_request_status  pending | accepted | completed | rejected
payment_status           unpaid | paid | refunded
instrument_type          piano | violin | cello | flute | ...
problem_type             technique | interpretation | tempo | ...
practice_type            focused | run_through | drill | ...
difficulty_level         beginner | intermediate | advanced | professional
```

모든 타입의 소스 오브 트루스는 `src/types/database.ts` (Supabase CLI 자동생성, 직접 수정 금지).
