CREATE TABLE IF NOT EXISTS email_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT UNSIGNED NOT NULL,
  recipient_email VARCHAR(190) NOT NULL,
  recipient_user_id INT UNSIGNED,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('sent', 'failed') NOT NULL,
  error_message TEXT,
  provider_message_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_logs_admin FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_email_logs_recipient_user FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_email_logs_admin (admin_user_id),
  INDEX idx_email_logs_recipient_email (recipient_email),
  INDEX idx_email_logs_status (status),
  INDEX idx_email_logs_created_at (created_at)
);
