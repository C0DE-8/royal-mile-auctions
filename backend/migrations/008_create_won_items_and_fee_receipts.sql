SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auction_items' AND COLUMN_NAME = 'auction_fee') = 0,
  'ALTER TABLE auction_items ADD COLUMN auction_fee INT UNSIGNED NOT NULL DEFAULT 0 AFTER main_price',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS won_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  auction_item_id INT UNSIGNED NOT NULL,
  winning_bid_id INT UNSIGNED NOT NULL,
  winning_amount INT UNSIGNED NOT NULL,
  fee_amount INT UNSIGNED NOT NULL,
  fee_payment_id INT UNSIGNED,
  fee_status ENUM('pending', 'submitted', 'confirmed', 'rejected') NOT NULL DEFAULT 'pending',
  item_status ENUM('on_hold', 'pending', 'processing', 'docs_in_transit', 'delivered') NOT NULL DEFAULT 'on_hold',
  admin_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_won_items_auction_item (auction_item_id),
  INDEX idx_won_items_user (user_id),
  INDEX idx_won_items_auction_item (auction_item_id),
  INDEX idx_won_items_winning_bid (winning_bid_id),
  INDEX idx_won_items_fee_payment (fee_payment_id),
  INDEX idx_won_items_fee_status (fee_status),
  INDEX idx_won_items_item_status (item_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'won_item_id') = 0,
  'ALTER TABLE payments ADD COLUMN won_item_id INT UNSIGNED AFTER auction_item_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'payment_type') = 0,
  'ALTER TABLE payments ADD COLUMN payment_type VARCHAR(40) NOT NULL DEFAULT ''auction_fee'' AFTER currency_symbol',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'receipt_url') = 0,
  'ALTER TABLE payments ADD COLUMN receipt_url VARCHAR(500) AFTER transaction_hash',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND INDEX_NAME = 'idx_payments_won_item') = 0,
  'ALTER TABLE payments ADD INDEX idx_payments_won_item (won_item_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND INDEX_NAME = 'idx_payments_type') = 0,
  'ALTER TABLE payments ADD INDEX idx_payments_type (payment_type)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
