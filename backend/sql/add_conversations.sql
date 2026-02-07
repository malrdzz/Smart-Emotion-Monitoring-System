-- Add conversation support to chat_logs
ALTER TABLE chat_logs
  ADD COLUMN conversation_id INT NULL,
  ADD INDEX idx_chat_logs_conversation (conversation_id);

-- Create conversations table
CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) DEFAULT 'New Chat',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversations_user (user_id, updated_at DESC)
);

-- Create default conversation for existing users with chat logs
INSERT INTO conversations (user_id, title, created_at, updated_at)
SELECT DISTINCT cl.user_id, 'Chat History', MIN(cl.timestamp), MAX(cl.timestamp)
FROM chat_logs cl
GROUP BY cl.user_id;

-- Update existing chat_logs to use the default conversation
UPDATE chat_logs cl
JOIN conversations c ON cl.user_id = c.user_id
SET cl.conversation_id = c.id
WHERE cl.conversation_id IS NULL;