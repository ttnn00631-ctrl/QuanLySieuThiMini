ALTER TABLE computer_assets ADD COLUMN in_trash BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN in_trash BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_users ADD COLUMN in_trash BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sale_orders ADD COLUMN in_trash BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE trash_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    item_type VARCHAR(20) NOT NULL,
    entity_id BIGINT NOT NULL,
    label VARCHAR(255) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    deleted_at TIMESTAMP(6) NOT NULL,
    deleted_by VARCHAR(80) NOT NULL,
    original_enabled BOOLEAN,
    PRIMARY KEY (id),
    INDEX idx_trash_deleted_at (deleted_at)
);
