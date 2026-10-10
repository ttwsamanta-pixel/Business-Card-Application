CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
);

CREATE TABLE IF NOT EXISTS card_templates (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  accent_color VARCHAR(32) NOT NULL,
  layout_key VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_templates_active (is_active),
  INDEX idx_templates_category (category)
);

CREATE TABLE IF NOT EXISTS business_cards (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  template_id VARCHAR(64) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  full_name VARCHAR(180) NOT NULL,
  designation VARCHAR(180) NULL,
  company VARCHAR(180) NULL,
  bio TEXT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(80) NULL,
  whatsapp VARCHAR(80) NULL,
  website VARCHAR(255) NULL,
  address TEXT NULL,
  maps_url VARCHAR(500) NULL,
  profile_image_url VARCHAR(500) NULL,
  logo_url VARCHAR(500) NULL,
  theme JSON NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cards_template FOREIGN KEY (template_id) REFERENCES card_templates(id),
  INDEX idx_cards_user_status (user_id, status),
  INDEX idx_cards_slug_status (slug, status)
);

CREATE TABLE IF NOT EXISTS card_social_links (
  id CHAR(36) PRIMARY KEY,
  card_id CHAR(36) NOT NULL,
  platform VARCHAR(80) NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_social_card FOREIGN KEY (card_id) REFERENCES business_cards(id) ON DELETE CASCADE,
  INDEX idx_social_card (card_id)
);

CREATE TABLE IF NOT EXISTS media_uploads (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  card_id CHAR(36) NULL,
  purpose ENUM('profile','logo','other') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INT NOT NULL,
  public_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_card FOREIGN KEY (card_id) REFERENCES business_cards(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_token (token_hash),
  INDEX idx_reset_user (user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_token (token_hash),
  INDEX idx_sessions_user (user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  actor_user_id CHAR(36) NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120) NULL,
  metadata JSON NULL,
  ip_address VARCHAR(80) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_actor (actor_user_id),
  INDEX idx_audit_action (action)
);
