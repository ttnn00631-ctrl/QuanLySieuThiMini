ALTER TABLE computer_assets
    ADD COLUMN screen_size_inch DECIMAL(4, 1) NULL,
    ADD COLUMN refresh_rate_hz INT NULL,
    ADD COLUMN usb_ports VARCHAR(300) NULL,
    ADD COLUMN has_headphone_jack BOOLEAN NULL,
    ADD COLUMN has_dedicated_graphics BOOLEAN NULL;

CREATE TABLE customer_accounts (
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
);

UPDATE computer_assets
SET screen_size_inch = COALESCE(screen_size_inch, CASE
        WHEN type = 'MONITOR' THEN 27.0
        WHEN type <> 'LAPTOP' THEN NULL
        WHEN LOWER(model_name) LIKE '%16%' THEN 16.0
        WHEN LOWER(model_name) LIKE '%15%' THEN 15.6
        WHEN LOWER(model_name) LIKE '%13%' THEN 13.3
        ELSE 14.0
    END),
    refresh_rate_hz = COALESCE(refresh_rate_hz, CASE
        WHEN type = 'MONITOR' THEN 60
        WHEN type = 'LAPTOP' AND LOWER(model_name) REGEXP 'gaming|rog|tuf|legion|nitro|predator|alienware|omen|victus' THEN 144
        WHEN type = 'LAPTOP' THEN 60
        ELSE NULL
    END),
    usb_ports = COALESCE(usb_ports, CASE
        WHEN type = 'LAPTOP' THEN '2 × USB-A, 2 × USB-C'
        WHEN type = 'DESKTOP' THEN '4 × USB-A, 2 × USB-C'
        WHEN type = 'MONITOR' THEN '2 × USB-A, 1 × USB-C'
        ELSE NULL
    END),
    has_headphone_jack = COALESCE(has_headphone_jack, CASE
        WHEN type IN ('LAPTOP', 'DESKTOP') THEN TRUE
        WHEN type = 'MONITOR' THEN FALSE
        ELSE NULL
    END),
    has_dedicated_graphics = COALESCE(has_dedicated_graphics, CASE
        WHEN type NOT IN ('LAPTOP', 'DESKTOP') THEN NULL
        WHEN LOWER(model_name) REGEXP 'gaming|rog|tuf|legion|nitro|predator|alienware|omen|victus|precision|thinkstation|zbook|proart|geforce|quadro|rtx' THEN TRUE
        ELSE FALSE
    END);
