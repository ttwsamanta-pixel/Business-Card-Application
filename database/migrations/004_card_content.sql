CREATE TABLE IF NOT EXISTS card_content (
  card_id CHAR(36) PRIMARY KEY,
  content JSON NOT NULL,
  CONSTRAINT fk_content_card FOREIGN KEY (card_id) REFERENCES business_cards(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS card_leads (
  id CHAR(36) PRIMARY KEY,
  card_id CHAR(36) NOT NULL,
  section_id VARCHAR(80) NOT NULL,
  answers JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lead_card FOREIGN KEY (card_id) REFERENCES business_cards(id) ON DELETE CASCADE
);
