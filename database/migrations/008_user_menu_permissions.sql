CREATE TABLE IF NOT EXISTS user_menu_permissions (
  user_id CHAR(36) PRIMARY KEY,
  permissions JSON NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
