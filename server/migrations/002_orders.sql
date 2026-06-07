CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_address TEXT    NOT NULL,
    delivery_type    VARCHAR(20)  NOT NULL DEFAULT 'pickup',
    total_rub        INTEGER      NOT NULL DEFAULT 0,
    status           VARCHAR(30)  NOT NULL DEFAULT 'paid',
    created_at       TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id         SERIAL  PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    size       VARCHAR(50),
    quantity   INTEGER NOT NULL DEFAULT 1,
    price_usd  TEXT
);
