ALTER TABLE sale_orders
    ADD COLUMN customer_id BIGINT NULL;

ALTER TABLE sale_orders
    ADD CONSTRAINT fk_sale_order_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL;
