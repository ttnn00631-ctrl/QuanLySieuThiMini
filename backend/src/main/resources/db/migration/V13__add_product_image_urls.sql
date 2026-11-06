SET @add_image_url_column = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'computer_assets' AND column_name = 'image_url') = 0,
    'ALTER TABLE computer_assets ADD COLUMN image_url VARCHAR(500) NULL',
    'SET @migration_noop = 1');
PREPARE add_image_url_column_stmt FROM @add_image_url_column;
EXECUTE add_image_url_column_stmt;
DEALLOCATE PREPARE add_image_url_column_stmt;

UPDATE computer_assets
SET image_url = CASE LOWER(TRIM(manufacturer))
    WHEN 'acer' THEN '/acer.png'
    WHEN 'apple' THEN '/apple.jpg'
    WHEN 'asus' THEN '/asus.jpg'
    WHEN 'dell' THEN '/dell.png'
    WHEN 'hp' THEN '/hp.jpg'
    WHEN 'lenovo' THEN '/lenovo.jpg'
    WHEN 'lg' THEN '/lg-monitor.svg'
    WHEN 'msi' THEN '/msi.webp'
    WHEN 'samsung' THEN '/samsung.jpg'
    ELSE image_url
END
WHERE image_url IS NULL OR TRIM(image_url) = '';
