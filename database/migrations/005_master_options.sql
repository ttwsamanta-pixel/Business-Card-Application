CREATE TABLE IF NOT EXISTS master_options (
 id VARCHAR(80) PRIMARY KEY,
 category VARCHAR(40) NOT NULL,
 value VARCHAR(80) NOT NULL,
 label VARCHAR(120) NOT NULL,
 subtitle VARCHAR(250) NOT NULL DEFAULT '',
 icon_key VARCHAR(80) NOT NULL DEFAULT 'globe',
 icon_url VARCHAR(1000) NOT NULL DEFAULT '',
 active BOOLEAN NOT NULL DEFAULT TRUE,
 sort_order INT NOT NULL DEFAULT 0,
 INDEX idx_master_category (category,sort_order)
);
