-- Chuyển dữ liệu nghiệp vụ sang quản lý hàng hóa siêu thị mini.
CREATE TABLE IF NOT EXISTS product_categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category_code VARCHAR(30) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_category_code (category_code),
    UNIQUE KEY uk_product_category_name (category_name)
);

INSERT IGNORE INTO product_categories (category_code, category_name, description) VALUES
('SNACK', 'Đồ ăn vặt', 'Bánh kẹo, snack, nước uống và thực phẩm ăn liền'),
('TOY', 'Đồ chơi', 'Đồ chơi trẻ em, thú bông và đồ chơi giải trí');

ALTER TABLE computer_assets
    ADD COLUMN IF NOT EXISTS category_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unit VARCHAR(30) NULL,
    ADD COLUMN IF NOT EXISTS selling_price DECIMAL(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS expiry_date DATE NULL,
    ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(120) NULL;

UPDATE computer_assets
SET category_id = (SELECT id FROM product_categories WHERE category_code = 'SNACK')
WHERE asset_code LIKE 'SNK-%';
UPDATE computer_assets
SET category_id = (SELECT id FROM product_categories WHERE category_code = 'TOY')
WHERE asset_code LIKE 'TOY-%';

-- View nghiệp vụ giúp tra cứu hàng hóa bằng tên cột dễ hiểu trong MySQL Workbench/phpMyAdmin; bảng nội bộ được giữ tương thích backend.
CREATE OR REPLACE VIEW products AS
SELECT a.id, a.asset_code AS product_code, a.model_name AS product_name,
       a.category_id, c.category_name, a.manufacturer AS brand,
       a.memory_gb AS legacy_quantity, a.quantity, a.unit,
       a.purchase_cost AS cost_price, a.selling_price, a.expiry_date,
       a.supplier_name, a.image_url, a.status, a.notes
FROM computer_assets a
LEFT JOIN product_categories c ON c.id = a.category_id;
