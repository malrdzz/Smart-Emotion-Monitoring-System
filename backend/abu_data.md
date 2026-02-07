# Data Script for User ID 9

Run this in your MySQL client to populate comprehensive test data for **User ID 9**.

```sql
-- CLEAR EXISTING DATA FOR USER 9 (Optional - strictly for cleaning before insert)
-- DELETE FROM chat_logs WHERE user_id = 9;
-- DELETE FROM checkins WHERE user_id = 9;
-- DELETE FROM conversations WHERE user_id = 9;

-- ==========================================
-- 1. INSERT CONVERSATIONS
-- ==========================================
INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES
(9, 9, 'Daily Check-in', '2026-01-04 08:00:00', '2026-01-04 08:05:00'),
(10, 9, 'Stress Management', '2026-01-02 14:00:00', '2026-01-02 14:15:00'),
(11, 9, 'Monthly Reflection', '2025-12-15 09:00:00', '2025-12-15 09:30:00');

-- ==========================================
-- 2. INSERT CHAT LOGS
-- ==========================================

-- Today's Chat (Daily Check-in)
INSERT INTO chat_logs (user_id, conversation_id, message_type, content, emotion, sentiment, timestamp) VALUES
(9, 9, 'user', 'I feel pretty good today!', 'Joy', 'Positive', '2026-01-04 08:01:00'),
(9, 9, 'bot', 'That is great to hear! Keep up the positive vibes.', NULL, NULL, '2026-01-04 08:01:05'),
(9, 9, 'user', 'Just a bit tired primarily.', 'Neutral', 'Neutral', '2026-01-04 08:02:00'),
(9, 9, 'bot', 'Make sure to get some rest later if you can.', NULL, NULL, '2026-01-04 08:02:05');

-- Past Chat (Stress Management - Weekly view)
INSERT INTO chat_logs (user_id, conversation_id, message_type, content, emotion, sentiment, timestamp) VALUES
(9, 10, 'user', 'I am really stressed about exams.', 'Fear', 'Negative', '2026-01-02 14:01:00'),
(9, 10, 'bot', 'It is normal to feel that way. Have you tried breaking down your study material?', NULL, NULL, '2026-01-02 14:01:10'),
(9, 10, 'user', 'No, but that sounds like a good idea. I am angry at myself for procrastinating.', 'Anger', 'Negative', '2026-01-02 14:02:00');

-- Older Chat (Monthly view)
INSERT INTO chat_logs (user_id, conversation_id, message_type, content, emotion, sentiment, timestamp) VALUES
(9, 11, 'user', 'This month has been a roller coaster.', 'Sadness', 'Negative', '2025-12-15 09:05:00'),
(9, 11, 'bot', 'Life has its ups and downs. How can I help you navigate it?', NULL, NULL, '2025-12-15 09:05:05');


-- ==========================================
-- 3. INSERT CHECK-INS (Dashboard Data)
-- ==========================================

-- DAILY DATA (Today: Jan 4, 2026)
INSERT INTO checkins (user_id, date, time, emotion, sentiment, emoji) VALUES
(9, '2026-01-04', '07:30:00', 'Joy', 'Positive', '🌅'),      -- Morning
(9, '2026-01-04', '09:00:00', 'Neutral', 'Neutral', '😐'),
(9, '2026-01-04', '11:00:00', 'Surprise', 'Positive', '😮'),
(9, '2026-01-04', '13:30:00', 'Sadness', 'Negative', '😢'),  -- Afternoon
(9, '2026-01-04', '16:00:00', 'Neutral', 'Neutral', '😶'),
(9, '2026-01-04', '19:45:00', 'Joy', 'Positive', '😊'),      -- Night
(9, '2026-01-04', '22:15:00', 'Relaxed', 'Positive', '😌');

-- WEEKLY DATA (Past 7 Days)
INSERT INTO checkins (user_id, date, time, emotion, sentiment, emoji) VALUES
(9, '2026-01-03', '10:00:00', 'Joy', 'Positive', '😄'),      -- Saturday
(9, '2026-01-03', '20:30:00', 'Joy', 'Positive', '🍕'),

(9, '2026-01-02', '08:00:00', 'Neutral', 'Neutral', '😐'),   -- Friday
(9, '2026-01-02', '14:00:00', 'Anger', 'Negative', '😠'),
(9, '2026-01-02', '18:00:00', 'Fear', 'Negative', '😨'),

(9, '2026-01-01', '09:30:00', 'Joy', 'Positive', '🎉'),      -- Thursday (New Year)
(9, '2026-01-01', '12:00:00', 'Excited', 'Positive', '🥳'),

(9, '2025-12-31', '23:59:00', 'Joy', 'Positive', '🎆'),      -- Wednesday

(9, '2025-12-30', '09:00:00', 'Sadness', 'Negative', '😔'),  -- Tuesday
(9, '2025-12-30', '15:00:00', 'Disgust', 'Negative', '🤢'),

(9, '2025-12-29', '08:30:00', 'Neutral', 'Neutral', '😐');   -- Monday

-- MONTHLY DATA (Older entries)
INSERT INTO checkins (user_id, date, time, emotion, sentiment, emoji) VALUES
(9, '2025-12-25', '10:00:00', 'Joy', 'Positive', '🎄'),
(9, '2025-12-20', '14:00:00', 'Fear', 'Negative', '😰'),
(9, '2025-12-15', '09:00:00', 'Neutral', 'Neutral', '😐'),
(9, '2025-12-10', '18:00:00', 'Sadness', 'Negative', '😢'),
(9, '2025-12-05', '12:00:00', 'Anger', 'Negative', '😡'),
(9, '2025-12-01', '08:00:00', 'Joy', 'Positive', '😊');

SELECT 'Complete dataset for User 9 inserted successfully' AS Status;
```
