CREATE TABLE IF NOT EXISTS product_brands (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    in_trash BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT uk_product_brand_name UNIQUE (name)
);

INSERT IGNORE INTO product_brands (name)
SELECT DISTINCT TRIM(manufacturer)
FROM computer_assets
WHERE TRIM(manufacturer) <> '';
