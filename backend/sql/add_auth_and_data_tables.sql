-- Migration: add password_hash to users, and create checkins and chat_logs tables
-- Run this in your MySQL (adjust database and host/port as needed)

ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD UNIQUE INDEX uq_users_email (email);

-- Create checkins table
CREATE TABLE checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  emotion VARCHAR(50) NOT NULL,
  sentiment VARCHAR(50) NOT NULL,
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create chat_logs table
CREATE TABLE chat_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message_type ENUM('user', 'bot') NOT NULL,
  content TEXT NOT NULL,
  emotion VARCHAR(50),
  sentiment VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);