CREATE TABLE IF NOT EXISTS super_admin_accounts (
  user_id CHAR(36) PRIMARY KEY,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO super_admin_accounts (user_id)
SELECT id FROM users WHERE email = 'admin@example.com' AND role = 'admin'
AND NOT EXISTS (SELECT 1 FROM super_admin_accounts);
