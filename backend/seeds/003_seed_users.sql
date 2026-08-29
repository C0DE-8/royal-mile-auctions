INSERT INTO users (
  name,
  email,
  password_hash,
  role,
  phone
) VALUES
(
  'Royal Mile Admin',
  'admin@royalmileauctions.com',
  '$2b$10$zmtUKybo6fMPRMCiJeHVuu1CP0ICj/WowGW9n8bt6n5E65rnE3MhS',
  'admin',
  '(302) 555-0188'
),
(
  'Sample Buyer',
  'buyer@example.com',
  '$2b$10$OU0fRRCuCmvakfqOlzKfseydcHtCBiRWKLebsuqlLFi3zW6YdSmRG',
  'user',
  '(302) 555-0199'
);
