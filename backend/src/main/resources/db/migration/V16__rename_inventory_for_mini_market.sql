-- Chuyen bang ton kho sang ten nghiep vu cua sieu thi mini.
ALTER TABLE computer_assets RENAME TO mini_mart_products;

-- Chuẩn hóa mã danh mục dựa trên mã hàng hóa, không phụ thuộc dữ liệu mẫu cũ.
UPDATE mini_mart_products
SET type = CASE
    WHEN asset_code LIKE 'SNK-%' THEN 'SNACK'
    WHEN asset_code LIKE 'TOY-%' THEN 'TOY'
    WHEN asset_code LIKE 'DRK-%' THEN 'DRINK'
    ELSE type
END;
