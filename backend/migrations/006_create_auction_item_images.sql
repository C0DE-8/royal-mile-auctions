CREATE TABLE IF NOT EXISTS auction_item_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  auction_item_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auction_item_images_item
    FOREIGN KEY (auction_item_id) REFERENCES auction_items(id)
    ON DELETE CASCADE,
  INDEX idx_auction_item_images_item (auction_item_id, sort_order)
);
