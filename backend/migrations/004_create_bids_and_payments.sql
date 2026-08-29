CREATE TABLE IF NOT EXISTS bids (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  auction_item_id INT UNSIGNED NOT NULL,
  amount INT UNSIGNED NOT NULL,
  status ENUM('pending', 'winning', 'outbid', 'won', 'lost', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bids_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bids_auction_item FOREIGN KEY (auction_item_id) REFERENCES auction_items(id) ON DELETE CASCADE,
  INDEX idx_bids_user (user_id),
  INDEX idx_bids_item (auction_item_id),
  INDEX idx_bids_status (status)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  auction_item_id INT UNSIGNED,
  crypto_wallet_id INT UNSIGNED,
  amount INT UNSIGNED NOT NULL,
  currency_symbol VARCHAR(40) NOT NULL,
  transaction_hash VARCHAR(255),
  status ENUM('pending', 'submitted', 'confirmed', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_auction_item FOREIGN KEY (auction_item_id) REFERENCES auction_items(id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_wallet FOREIGN KEY (crypto_wallet_id) REFERENCES crypto_wallets(id) ON DELETE SET NULL,
  INDEX idx_payments_user (user_id),
  INDEX idx_payments_status (status)
);
