ALTER TABLE computer_assets
    ADD COLUMN store_view_count INT NOT NULL DEFAULT 0;

CREATE TABLE customer_repair_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_account_id BIGINT NOT NULL,
    device_type VARCHAR(40) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    serial_number VARCHAR(100),
    issue VARCHAR(1000) NOT NULL,
    opened_at TIMESTAMP(6) NOT NULL,
    closed_at TIMESTAMP(6),
    resolution_note VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_repair_request_customer_account
        FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id),
    INDEX idx_repair_request_status_opened (status, opened_at)
);
