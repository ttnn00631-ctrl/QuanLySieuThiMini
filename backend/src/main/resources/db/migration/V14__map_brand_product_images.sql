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
WHERE image_url IS NULL
   OR TRIM(image_url) = ''
   OR image_url IN (
       '/acer.png', '/apple.jpg', '/asus.jpg', '/dell.png', '/hp.jpg',
       '/lenovo.jpg', '/lg-monitor.svg', '/msi.webp', '/samsung.jpg'
   );
