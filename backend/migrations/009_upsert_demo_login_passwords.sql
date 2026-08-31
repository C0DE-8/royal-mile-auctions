INSERT INTO users (
  name,
  email,
  password_hash,
  role,
  phone,
  is_active
) VALUES
(
  'Royal Mile Admin',
  'admin@royalmileauctions.com',
  '$2b$10$Jjtf/PquPNxipnbpQcYyy.cqb8RIEFMMRFfeZWO0kHUPdTyjRDNvy',
  'admin',
  '+1 (512) 647-6269',
  1
),
(
  'Sample Buyer',
  'info@royalmileauctions.com',
  '$2b$10$F5vXEeXvewQUvy/jTcq.7uA0G5aG2LEQ0LVN4QdxKBUlAi.1aERou',
  'user',
  '+1 (512) 647-6269',
  1
),
(
  'Jax Demo',
  'jax6920@gmail.com',
  '$2b$10$kMRkbJCJ6yuR5MpaaZLk8OGFf73QdhicHIrOREKrmo2qBTgSWOtf2',
  'user',
  NULL,
  1
),
(
  '8 AM Light Demo',
  '8amlight@gmail.com',
  '$2b$10$rmK2App7SI3oyxk8vTEkE.niBfXrSW9mYLBpIrtw1h1cMQ.OFo3ym',
  'user',
  NULL,
  1
),
(
  'David Miller Demo',
  'david.miller.demo2@demo.local',
  '$2b$10$4sucVkzlNFtBdhGYWOLUj.i.A2S9UUEJnaSmnX2FNv95EB0.0esAC',
  'user',
  NULL,
  1
),
(
  'Emily Johnson Demo',
  'emily.johnson.demo2@demo.local',
  '$2b$10$ZadNH9/MsepK1JTPTMWWhOOgEq2Yj7el1FuLElLAuhOyb9YvDRDjK',
  'user',
  NULL,
  1
),
(
  'James Thompson Demo',
  'james.thompson.demo2@demo.local',
  '$2b$10$uhb0HrJTYrMndpS5EPy7uePaznHUyjqRDqRS/s5FINmLIulQZW5OS',
  'user',
  NULL,
  1
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  phone = VALUES(phone),
  is_active = VALUES(is_active);
