CREATE TABLE IF NOT EXISTS card_folders (
 id CHAR(36) PRIMARY KEY,
 user_id CHAR(36) NOT NULL,
 name VARCHAR(100) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 UNIQUE KEY user_folder_name(user_id,name)
);
CREATE TABLE IF NOT EXISTS card_folder_members (
 card_id CHAR(36) PRIMARY KEY,
 folder_id CHAR(36) NOT NULL,
 FOREIGN KEY(card_id) REFERENCES business_cards(id) ON DELETE CASCADE,
 FOREIGN KEY(folder_id) REFERENCES card_folders(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS card_events (
 id CHAR(36) PRIMARY KEY,
 card_id CHAR(36) NOT NULL,
 kind VARCHAR(16) NOT NULL,
 visitor VARCHAR(64) NOT NULL,
 details JSON NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(card_id) REFERENCES business_cards(id) ON DELETE CASCADE,
 INDEX card_event_date(card_id,created_at)
);
INSERT IGNORE INTO card_events(id,card_id,kind,visitor,details,created_at)
 SELECT v.id,v.card_id,'view','',JSON_OBJECT(),v.created_at
 FROM card_visits v JOIN business_cards c ON c.id=v.card_id
 WHERE v.latitude IS NULL AND v.longitude IS NULL;
