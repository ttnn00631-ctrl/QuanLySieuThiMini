ALTER TABLE customer_accounts
    ADD COLUMN customer_id BIGINT NULL;

ALTER TABLE customer_accounts
    ADD CONSTRAINT uk_customer_account_customer UNIQUE (customer_id);

ALTER TABLE customer_accounts
    ADD CONSTRAINT fk_customer_account_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL;

UPDATE customer_accounts ca
JOIN customers c ON c.phone = ca.phone AND c.in_trash = FALSE
SET ca.customer_id = c.id
WHERE ca.phone IS NOT NULL AND ca.customer_id IS NULL;
