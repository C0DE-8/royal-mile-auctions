CREATE TABLE IF NOT EXISTS crypto_wallets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  wallet_name VARCHAR(160) NOT NULL,
  network VARCHAR(120) NOT NULL,
  currency_symbol VARCHAR(40) NOT NULL,
  wallet_address VARCHAR(500) NOT NULL,
  qr_code_url VARCHAR(500) NOT NULL,
  instructions TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_crypto_wallets_active (is_active),
  INDEX idx_crypto_wallets_symbol (currency_symbol)
);
