-- ====================================================================
-- HỆ THỐNG QUẢN LÝ SIÊU THỊ MINI - ĐỒ ĂN VẶT & ĐỒ CHƠI
-- FILE SQL TỔNG HỢP CHO SIÊU THỊ MINI (MySQL 8.x / MariaDB)
-- Bao gồm V5, V8-V14 và sửa dữ liệu demo tiếng Việt; có thể chạy lại an toàn trên database cũ.
-- ====================================================================

-- 1. Tạo Database nếu chưa có
CREATE DATABASE IF NOT EXISTS `QuanLySieuThiMini`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `QuanLySieuThiMini`;

-- 2. Bảng Tài khoản người dùng (app_users)
CREATE TABLE IF NOT EXISTS app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_trash BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT uk_app_user_username UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng hàng hóa (mini_mart_products - tên bảng tương thích với backend hiện tại)
CREATE TABLE IF NOT EXISTS mini_mart_products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_code VARCHAR(40) NOT NULL,
    serial_number VARCHAR(100),
    type VARCHAR(20) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    image_url VARCHAR(500),
    processor VARCHAR(300),
    memory_gb INT,
    storage VARCHAR(120),
    screen_size_inch DECIMAL(4, 1),
    refresh_rate_hz INT,
    usb_ports VARCHAR(300),
    has_headphone_jack BOOLEAN,
    has_dedicated_graphics BOOLEAN,
    purchase_date DATE,
    warranty_until DATE,
    purchase_cost DECIMAL(14, 2),
    location VARCHAR(120) NOT NULL,
    assignee_name VARCHAR(120),
    status VARCHAR(20) NOT NULL,
    notes VARCHAR(1000),
    in_trash BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT uk_asset_code UNIQUE (asset_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Danh mục và trường nghiệp vụ dành cho hàng hóa siêu thị mini.
CREATE TABLE IF NOT EXISTS product_categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category_code VARCHAR(30) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_category_code (category_code),
    UNIQUE KEY uk_product_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO product_categories (category_code, category_name, description) VALUES
('SNACK', 'Đồ ăn vặt', 'Bánh kẹo, snack, nước uống và thực phẩm ăn liền'),
('TOY', 'Đồ chơi', 'Đồ chơi trẻ em, thú bông và đồ chơi giải trí');

ALTER TABLE mini_mart_products
    ADD COLUMN IF NOT EXISTS category_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unit VARCHAR(30) NULL,
    ADD COLUMN IF NOT EXISTS selling_price DECIMAL(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS expiry_date DATE NULL,
    ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(120) NULL;

-- Tài khoản khách dùng riêng, không được cấp quyền quản trị/nhân viên.
CREATE TABLE IF NOT EXISTS customer_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    email VARCHAR(120),
    phone VARCHAR(20),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_customer_account_username UNIQUE (username),
    CONSTRAINT uk_customer_account_phone UNIQUE (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Lịch sử Xuất hàng & Nhập lại kho (assignment_history)
CREATE TABLE IF NOT EXISTS assignment_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_id BIGINT NOT NULL,
    assignee_name VARCHAR(120) NOT NULL,
    location VARCHAR(120) NOT NULL,
    assigned_at TIMESTAMP(6) NOT NULL,
    returned_at TIMESTAMP(6) NULL DEFAULT NULL,
    note VARCHAR(500),
    return_note VARCHAR(500),
    PRIMARY KEY (id),
    CONSTRAINT fk_assignment_asset FOREIGN KEY (asset_id) REFERENCES mini_mart_products (id) ON DELETE CASCADE,
    INDEX idx_assignment_asset (asset_id, assigned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Phản hồi / Xử lý hàng lỗi (maintenance_records)
CREATE TABLE IF NOT EXISTS maintenance_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_id BIGINT NOT NULL,
    issue VARCHAR(1000) NOT NULL,
    opened_at TIMESTAMP(6) NOT NULL,
    closed_at TIMESTAMP(6) NULL DEFAULT NULL,
    resolution_note VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_maintenance_asset FOREIGN KEY (asset_id) REFERENCES mini_mart_products (id) ON DELETE CASCADE,
    INDEX idx_maintenance_asset (asset_id, opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5b. Bảng Khách hàng (customers)
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    address VARCHAR(255),
    membership_tier VARCHAR(20) NOT NULL DEFAULT 'BRONZE',
    total_spent DECIMAL(14, 2) DEFAULT 0.00,
    orders_count INT DEFAULT 0,
    joined_date DATE,
    in_trash BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT uk_customer_phone UNIQUE (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Liên kết hồ sơ cửa hàng với hồ sơ thành viên theo định danh ổn định.
SET @add_customer_account_customer_id = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'customer_accounts' AND column_name = 'customer_id') = 0,
    'ALTER TABLE customer_accounts ADD COLUMN customer_id BIGINT NULL',
    'SET @migration_noop = 1');
PREPARE add_customer_account_customer_id_stmt FROM @add_customer_account_customer_id;
EXECUTE add_customer_account_customer_id_stmt;
DEALLOCATE PREPARE add_customer_account_customer_id_stmt;

SET @add_customer_account_customer_index = IF(
    (SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'customer_accounts'
       AND index_name = 'uk_customer_account_customer') = 0,
    'ALTER TABLE customer_accounts ADD CONSTRAINT uk_customer_account_customer UNIQUE (customer_id)',
    'SET @migration_noop = 1');
PREPARE add_customer_account_customer_index_stmt FROM @add_customer_account_customer_index;
EXECUTE add_customer_account_customer_index_stmt;
DEALLOCATE PREPARE add_customer_account_customer_index_stmt;

SET @add_customer_account_customer_fk = IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE constraint_schema = DATABASE() AND table_name = 'customer_accounts'
       AND constraint_name = 'fk_customer_account_customer') = 0,
    'ALTER TABLE customer_accounts ADD CONSTRAINT fk_customer_account_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL',
    'SET @migration_noop = 1');
PREPARE add_customer_account_customer_fk_stmt FROM @add_customer_account_customer_fk;
EXECUTE add_customer_account_customer_fk_stmt;
DEALLOCATE PREPARE add_customer_account_customer_fk_stmt;

-- 5c. Bảng Bình luận & Đánh giá (product_reviews)
CREATE TABLE IF NOT EXISTS product_reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_name VARCHAR(120) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    rating INT NOT NULL,
    comment VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admin_reply VARCHAR(1000),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5d. Bảng Hóa đơn Bán hàng / Thanh toán (sale_orders)
CREATE TABLE IF NOT EXISTS sale_orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30),
    is_guest BOOLEAN DEFAULT FALSE,
    customer_id BIGINT NULL,
    cashier_name VARCHAR(120),
    subtotal DECIMAL(14, 2),
    discount_amount DECIMAL(14, 2),
    total_amount DECIMAL(14, 2) NOT NULL,
    payment_method VARCHAR(50),
    items_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    in_trash BOOLEAN NOT NULL DEFAULT FALSE,
    order_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    PRIMARY KEY (id),
    CONSTRAINT uk_order_code UNIQUE (order_code),
    CONSTRAINT fk_sale_order_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5e. Thùng rác tạm thời (V5)
CREATE TABLE IF NOT EXISTS trash_records (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_brands (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    in_trash BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT uk_product_brand_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bổ sung cột an toàn khi chạy lại file trên database đã tạo trước V5.
SET @add_trash_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'mini_mart_products' AND column_name = 'in_trash') = 0,
    'ALTER TABLE mini_mart_products ADD COLUMN in_trash BOOLEAN NOT NULL DEFAULT FALSE',
    'SET @migration_noop = 1');
PREPARE add_trash_column_stmt FROM @add_trash_column;
EXECUTE add_trash_column_stmt;
DEALLOCATE PREPARE add_trash_column_stmt;

SET @add_order_status_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'sale_orders' AND column_name = 'order_status') = 0,
    'ALTER TABLE sale_orders ADD COLUMN order_status VARCHAR(20) NOT NULL DEFAULT ''COMPLETED''',
    'SET @migration_noop = 1');
PREPARE add_order_status_column_stmt FROM @add_order_status_column;
EXECUTE add_order_status_column_stmt;
DEALLOCATE PREPARE add_order_status_column_stmt;

SET @add_customer_id_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'sale_orders' AND column_name = 'customer_id') = 0,
    'ALTER TABLE sale_orders ADD COLUMN customer_id BIGINT NULL',
    'SET @migration_noop = 1');
PREPARE add_customer_id_column_stmt FROM @add_customer_id_column;
EXECUTE add_customer_id_column_stmt;
DEALLOCATE PREPARE add_customer_id_column_stmt;

SET @add_customer_fk = IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE constraint_schema = DATABASE() AND table_name = 'sale_orders'
       AND constraint_name = 'fk_sale_order_customer') = 0,
    'ALTER TABLE sale_orders ADD CONSTRAINT fk_sale_order_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL',
    'SET @migration_noop = 1');
PREPARE add_customer_fk_stmt FROM @add_customer_fk;
EXECUTE add_customer_fk_stmt;
DEALLOCATE PREPARE add_customer_fk_stmt;

SET @add_trash_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'customers' AND column_name = 'in_trash') = 0,
    'ALTER TABLE customers ADD COLUMN in_trash BOOLEAN NOT NULL DEFAULT FALSE',
    'SET @migration_noop = 1');
PREPARE add_trash_column_stmt FROM @add_trash_column;
EXECUTE add_trash_column_stmt;
DEALLOCATE PREPARE add_trash_column_stmt;

UPDATE customer_accounts ca
JOIN customers c ON c.phone = ca.phone AND c.in_trash = FALSE
SET ca.customer_id = c.id
WHERE ca.phone IS NOT NULL AND ca.customer_id IS NULL;

SET @add_trash_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'app_users' AND column_name = 'in_trash') = 0,
    'ALTER TABLE app_users ADD COLUMN in_trash BOOLEAN NOT NULL DEFAULT FALSE',
    'SET @migration_noop = 1');
PREPARE add_trash_column_stmt FROM @add_trash_column;
EXECUTE add_trash_column_stmt;
DEALLOCATE PREPARE add_trash_column_stmt;

SET @add_trash_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'sale_orders' AND column_name = 'in_trash') = 0,
    'ALTER TABLE sale_orders ADD COLUMN in_trash BOOLEAN NOT NULL DEFAULT FALSE',
    'SET @migration_noop = 1');
PREPARE add_trash_column_stmt FROM @add_trash_column;
EXECUTE add_trash_column_stmt;
DEALLOCATE PREPARE add_trash_column_stmt;

SET @add_screen_size_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'mini_mart_products' AND column_name = 'screen_size_inch') = 0,
    'ALTER TABLE mini_mart_products ADD COLUMN screen_size_inch DECIMAL(4, 1) NULL',
    'SET @migration_noop = 1');
PREPARE add_screen_size_column_stmt FROM @add_screen_size_column;
EXECUTE add_screen_size_column_stmt;
DEALLOCATE PREPARE add_screen_size_column_stmt;

SET @add_refresh_rate_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'mini_mart_products' AND column_name = 'refresh_rate_hz') = 0,
    'ALTER TABLE mini_mart_products ADD COLUMN refresh_rate_hz INT NULL',
    'SET @migration_noop = 1');
PREPARE add_refresh_rate_column_stmt FROM @add_refresh_rate_column;
EXECUTE add_refresh_rate_column_stmt;
DEALLOCATE PREPARE add_refresh_rate_column_stmt;

SET @add_usb_ports_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'mini_mart_products' AND column_name = 'usb_ports') = 0,
    'ALTER TABLE mini_mart_products ADD COLUMN usb_ports VARCHAR(300) NULL',
    'SET @migration_noop = 1');
PREPARE add_usb_ports_column_stmt FROM @add_usb_ports_column;
EXECUTE add_usb_ports_column_stmt;
DEALLOCATE PREPARE add_usb_ports_column_stmt;

SET @add_headphone_jack_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'mini_mart_products' AND column_name = 'has_headphone_jack') = 0,
    'ALTER TABLE mini_mart_products ADD COLUMN has_headphone_jack BOOLEAN NULL',
    'SET @migration_noop = 1');
PREPARE add_headphone_jack_column_stmt FROM @add_headphone_jack_column;
EXECUTE add_headphone_jack_column_stmt;
DEALLOCATE PREPARE add_headphone_jack_column_stmt;

SET @add_dedicated_graphics_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'mini_mart_products' AND column_name = 'has_dedicated_graphics') = 0,
    'ALTER TABLE mini_mart_products ADD COLUMN has_dedicated_graphics BOOLEAN NULL',
    'SET @migration_noop = 1');
PREPARE add_dedicated_graphics_column_stmt FROM @add_dedicated_graphics_column;
EXECUTE add_dedicated_graphics_column_stmt;
DEALLOCATE PREPARE add_dedicated_graphics_column_stmt;

-- Các cột tương thích của mô hình nền được tái sử dụng làm mô tả, số lượng, đơn vị tính và thông tin hàng hóa.

SET @add_store_view_count_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'mini_mart_products' AND column_name = 'store_view_count') = 0,
    'ALTER TABLE mini_mart_products ADD COLUMN store_view_count INT NOT NULL DEFAULT 0',
    'SET @migration_noop = 1');
PREPARE add_store_view_count_column_stmt FROM @add_store_view_count_column;
EXECUTE add_store_view_count_column_stmt;
DEALLOCATE PREPARE add_store_view_count_column_stmt;

SET @add_image_url_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'mini_mart_products' AND column_name = 'image_url') = 0,
    'ALTER TABLE mini_mart_products ADD COLUMN image_url VARCHAR(500) NULL',
    'SET @migration_noop = 1');
PREPARE add_image_url_column_stmt FROM @add_image_url_column;
EXECUTE add_image_url_column_stmt;
DEALLOCATE PREPARE add_image_url_column_stmt;

CREATE TABLE IF NOT EXISTS customer_repair_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_account_id BIGINT NOT NULL,
    device_type VARCHAR(40) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    serial_number VARCHAR(100),
    issue VARCHAR(1000) NOT NULL,
    opened_at TIMESTAMP(6) NOT NULL,
    closed_at TIMESTAMP(6) NULL DEFAULT NULL,
    resolution_note VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_repair_request_customer_account
        FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id),
    INDEX idx_repair_request_status_opened (status, opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Flyway Schema History (để Spring Boot không xung đột version khi khởi chạy)
CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INT NOT NULL,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success TINYINT(1) NOT NULL,
    PRIMARY KEY (installed_rank),
    INDEX idx_flyway_schema_history_s (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Đăng ký Flyway migration V1 đến V10 với checksum chuẩn xác
INSERT INTO flyway_schema_history 
  (installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES 
  (1, '1', 'create schema', 'SQL', 'V1__create_schema.sql', 1099211443, 'root', 10, 1),
  (2, '2', 'seed inventory', 'SQL', 'V2__seed_inventory.sql', -1406142442, 'root', 10, 1),
  (3, '3', 'seed assignment history', 'SQL', 'V3__seed_assignment_history.sql', -898786100, 'root', 10, 1),
  (4, '4', 'seed brand inventory', 'SQL', 'V4__seed_brand_inventory.sql', -1097036972, 'root', 10, 1),
  (5, '5', 'add recycle bin', 'SQL', 'V5__add_recycle_bin.sql', 1607544279, 'root', 10, 1),
  (6, '6', 'add website order status', 'SQL', 'V6__add_website_order_status.sql', 914052360, 'root', 10, 1),
  (7, '7', 'link orders to customers', 'SQL', 'V7__link_orders_to_customers.sql', 1918773436, 'root', 10, 1),
  (8, '8', 'add product specs and customer accounts', 'SQL', 'V8__add_product_specs_and_customer_accounts.sql', 586704006, 'root', 10, 1),
  (9, '9', 'link customer accounts to customers', 'SQL', 'V9__link_customer_accounts_to_customers.sql', 1989433665, 'root', 10, 1),
  (10, '10', 'store popularity and customer repairs', 'SQL', 'V10__store_popularity_and_customer_repairs.sql', -1058414725, 'root', 10, 1)
ON DUPLICATE KEY UPDATE checksum = VALUES(checksum), success = 1;

-- ====================================================================
-- BẢN CHỤP DATABASE QuanLySieuThiMini — xuất lúc 2026-10-20T15:53:01.825Z
-- INSERT IGNORE giúp chạy lại migration không ghi đè dữ liệu đã chỉnh sửa.
-- Bản chụp này được dùng để khôi phục dữ liệu khi chạy npm run migrate trên máy mới.
-- File này chứa dữ liệu cá nhân và hash mật khẩu; chỉ lưu/chia sẻ an toàn.
-- ====================================================================
SET @OLD_TIME_ZONE = @@TIME_ZONE;
SET time_zone = '+00:00';
INSERT IGNORE INTO `app_users` (`id`, `username`, `display_name`, `password_hash`, `user_role`, `enabled`, `in_trash`) VALUES (1,'admin','Quản trị viên','$2a$10$ifHbHp3VvwrdzI23FIHhzeqJ6qjk7PCuyYMw.jXEmBgWAOridP3qe','ADMIN',1,0);
INSERT IGNORE INTO `app_users` (`id`, `username`, `display_name`, `password_hash`, `user_role`, `enabled`, `in_trash`) VALUES (2,'cashier','Nguyễn Thu Ngân','$2a$10$ifHbHp3VvwrdzI23FIHhzeqJ6qjk7PCuyYMw.jXEmBgWAOridP3qe','CASHIER',1,0);
INSERT IGNORE INTO `app_users` (`id`, `username`, `display_name`, `password_hash`, `user_role`, `enabled`, `in_trash`) VALUES (3,'fixer','Trần Minh Khang','$2a$10$ifHbHp3VvwrdzI23FIHhzeqJ6qjk7PCuyYMw.jXEmBgWAOridP3qe','FIXER',1,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (1,'SNK-001','SNACK-001','SNACK','Oishi','Snack khoai tây vị phô mai','/snack.svg','Snack giòn vị phô mai',120,'Gói',15000.00,'Kệ đồ ăn vặt','AVAILABLE','Đồ ăn vặt | Giá bán: 15000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (2,'SNK-002','SNACK-002','SNACK','Oreo','Bánh quy kem Oreo','/snack.svg','Bánh quy socola nhân kem vani',90,'Gói',18000.00,'Kệ đồ ăn vặt','AVAILABLE','Đồ ăn vặt | Giá bán: 18000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (3,'SNK-003','SNACK-003','SNACK','Poca','Snack khoai tây vị BBQ','/snack.svg','Khoai tây lát vị BBQ',80,'Gói',16000.00,'Kệ đồ ăn vặt','AVAILABLE','Đồ ăn vặt | Giá bán: 16000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (4,'SNK-004','SNACK-004','SNACK','Chin-su','Xúc xích tiệt trùng','/snack.svg','Xúc xích ăn liền',70,'Cây',9000.00,'Kệ đồ ăn vặt','AVAILABLE','Đồ ăn vặt | Giá bán: 9000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (5,'SNK-005','SNACK-005','SNACK','Cosy','Bánh quy bơ','/snack.svg','Bánh quy bơ giòn',60,'Hộp',32000.00,'Kệ đồ ăn vặt','AVAILABLE','Đồ ăn vặt | Giá bán: 32000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (6,'SNK-006','SNACK-006','DRINK','Coca-Cola','Nước ngọt Coca-Cola 330ml','/drink.svg','Nước giải khát lon 330ml',100,'Lon',12000.00,'Kệ đồ ăn vặt','AVAILABLE','Đồ ăn vặt | Giá bán: 12000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (7,'TOY-001','TOY-001','TOY','ToyJoy','Xe ô tô đồ chơi mini','/toy-bear.svg','Xe đồ chơi nhựa nhiều màu',45,'Cái',35000.00,'Kệ đồ chơi','AVAILABLE','Đồ chơi | Giá bán: 35000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (8,'TOY-002','TOY-002','TOY','Plushie','Gấu bông mini','/toy-bear.svg','Gấu bông mềm kích thước nhỏ',30,'Con',65000.00,'Kệ đồ chơi','AVAILABLE','Đồ chơi | Giá bán: 65000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (9,'TOY-003','TOY-003','TOY','ToyJoy','Bộ xếp hình sáng tạo','/toy-bear.svg','Bộ xếp hình nhiều chi tiết',25,'Bộ',79000.00,'Kệ đồ chơi','AVAILABLE','Đồ chơi | Giá bán: 79000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (10,'TOY-004','TOY-004','TOY','ToyJoy','Búp bê mini','/toy-bear.svg','Búp bê đồ chơi kèm phụ kiện',35,'Con',55000.00,'Kệ đồ chơi','AVAILABLE','Đồ chơi | Giá bán: 55000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (11,'TOY-005','TOY-005','TOY','ToyJoy','Bóng nhựa nhiều màu','/toy-bear.svg','Bóng nhựa nhẹ cho trẻ em',50,'Quả',25000.00,'Kệ đồ chơi','AVAILABLE','Đồ chơi | Giá bán: 25000 VNĐ',0,0);
INSERT IGNORE INTO `mini_mart_products` (`id`,`asset_code`,`serial_number`,`type`,`manufacturer`,`model_name`,`image_url`,`processor`,`memory_gb`,`storage`,`purchase_cost`,`location`,`status`,`notes`,`in_trash`,`store_view_count`) VALUES (12,'TOY-006','TOY-006','TOY','ToyJoy','Rubik 3x3','/toy-bear.svg','Đồ chơi rubik giải trí',40,'Cái',30000.00,'Kệ đồ chơi','AVAILABLE','Đồ chơi | Giá bán: 30000 VNĐ',0,0);

INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (1,'Hoàng Minh Đức','0912345678','duc.hoang@gmail.com','Cầu Giấy, Hà Nội','GOLD',1250000.00,6,'2025-02-10',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (2,'Trần Thị Mai Anh','0987654321','maianh.tran@gmail.com','Ba Đình, Hà Nội','GOLD',989000.00,5,'2025-03-15',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (3,'Lê Văn Hùng','0903123456','hung.le@techcorp.vn','Quận 1, TP.HCM','GOLD',850000.00,4,'2025-04-01',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (4,'Phạm Thu Hà','0938111222','thuha.design@gmail.com','Đống Đa, Hà Nội','GOLD',760000.00,4,'2025-05-20',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (5,'Nguyễn Tiến Đạt','0979333444','dat.nguyen@fpt.com','Hải Châu, Đà Nẵng','SILVER',450000.00,3,'2025-06-12',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (6,'Đỗ Bích Ngọc','0968555666','ngoc.dobic@gmail.com','Thanh Xuân, Hà Nội','SILVER',380000.00,2,'2025-07-08',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (7,'Vũ Hoàng Long','0945777888','long.vu@viettel.vn','Bình Thạnh, TP.HCM','SILVER',329000.00,2,'2025-08-25',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (8,'Ngô Bảo Trâm','0918999000','tram.ngo@gmail.com','Tây Hồ, Hà Nội','SILVER',280000.00,2,'2025-09-14',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (9,'Đặng Quang Huy','0922334455','huy.dang@gmail.com','Ninh Kiều, Cần Thơ','SILVER',240000.00,2,'2025-10-05',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (10,'Bùi Tuấn Anh','0933445566','anh.bui@gmail.com','Nam Từ Liêm, Hà Nội','BRONZE',189000.00,1,'2025-11-18',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (11,'Nguyễn Khánh Linh','0944556677','linh.nk@gmail.com','Quận 7, TP.HCM','BRONZE',140000.00,1,'2025-12-01',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (12,'Trịnh Quốc Việt','0955667788','viet.tq@gmail.com','Ngô Quyền, Hải Phòng','BRONZE',125000.00,1,'2026-01-10',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (13,'Đinh Hương Giang','0966778899','giang.dinh@outlook.com','Long Biên, Hà Nội','BRONZE',89000.00,1,'2026-02-14',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (14,'Mai Văn Phúc','0977889900','phuc.mai@gmail.com','Thủ Đức, TP.HCM','BRONZE',52000.00,1,'2026-03-02',0);
INSERT IGNORE INTO `customers` (`id`, `full_name`, `phone`, `email`, `address`, `membership_tier`, `total_spent`, `orders_count`, `joined_date`, `in_trash`) VALUES (15,'Phan Thanh Thảo','0988990011','thao.phan@gmail.com','Hoàng Mai, Hà Nội','BRONZE',225000.00,1,'2026-03-20',0);
INSERT IGNORE INTO product_brands (name)
SELECT DISTINCT TRIM(manufacturer)
FROM mini_mart_products
WHERE TRIM(manufacturer) <> '';





UPDATE mini_mart_products
SET category_id = (SELECT id FROM product_categories WHERE category_code = 'SNACK')
WHERE asset_code LIKE 'SNK-%';
UPDATE mini_mart_products
SET category_id = (SELECT id FROM product_categories WHERE category_code = 'TOY')
WHERE asset_code LIKE 'TOY-%';
UPDATE mini_mart_products SET quantity = COALESCE(memory_gb, 0), unit = storage
WHERE asset_code LIKE 'SNK-%' OR asset_code LIKE 'TOY-%';
UPDATE mini_mart_products SET selling_price = CASE asset_code
  WHEN 'SNK-001' THEN 15000 WHEN 'SNK-002' THEN 18000 WHEN 'SNK-003' THEN 16000
  WHEN 'SNK-004' THEN 9000 WHEN 'SNK-005' THEN 32000 WHEN 'SNK-006' THEN 12000
  WHEN 'TOY-001' THEN 35000 WHEN 'TOY-002' THEN 65000 WHEN 'TOY-003' THEN 79000
  WHEN 'TOY-004' THEN 55000 WHEN 'TOY-005' THEN 25000 WHEN 'TOY-006' THEN 30000
  ELSE selling_price END
WHERE asset_code LIKE 'SNK-%' OR asset_code LIKE 'TOY-%';

CREATE OR REPLACE VIEW products AS
SELECT a.id, a.asset_code AS product_code, a.model_name AS product_name,
       a.category_id, c.category_name, a.manufacturer AS brand,
       a.quantity, a.unit, a.purchase_cost AS cost_price, a.selling_price,
       a.expiry_date, a.supplier_name, a.image_url, a.status, a.notes
FROM mini_mart_products a LEFT JOIN product_categories c ON c.id = a.category_id;

SET time_zone = @OLD_TIME_ZONE;
