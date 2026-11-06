CREATE TABLE app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT uk_app_user_username UNIQUE (username)
);

CREATE TABLE computer_assets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_code VARCHAR(40) NOT NULL,
    serial_number VARCHAR(100),
    type VARCHAR(20) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    processor VARCHAR(300),
    memory_gb INT,
    storage VARCHAR(120),
    purchase_date DATE,
    warranty_until DATE,
    purchase_cost DECIMAL(14, 2),
    location VARCHAR(120) NOT NULL,
    assignee_name VARCHAR(120),
    status VARCHAR(20) NOT NULL,
    notes VARCHAR(1000),
    PRIMARY KEY (id),
    CONSTRAINT uk_asset_code UNIQUE (asset_code)
);

CREATE TABLE assignment_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_id BIGINT NOT NULL,
    assignee_name VARCHAR(120) NOT NULL,
    location VARCHAR(120) NOT NULL,
    assigned_at TIMESTAMP(6) NOT NULL,
    returned_at TIMESTAMP(6),
    note VARCHAR(500),
    return_note VARCHAR(500),
    PRIMARY KEY (id),
    CONSTRAINT fk_assignment_asset FOREIGN KEY (asset_id) REFERENCES computer_assets (id),
    INDEX idx_assignment_asset (asset_id, assigned_at)
);

CREATE TABLE maintenance_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_id BIGINT NOT NULL,
    issue VARCHAR(1000) NOT NULL,
    opened_at TIMESTAMP(6) NOT NULL,
    closed_at TIMESTAMP(6),
    resolution_note VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_maintenance_asset FOREIGN KEY (asset_id) REFERENCES computer_assets (id),
    INDEX idx_maintenance_asset (asset_id, opened_at)
);