CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    is_activated    BOOLEAN      NOT NULL DEFAULT FALSE,
    activation_link VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tokens (
    id            SERIAL  PRIMARY KEY,
    user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id           SERIAL PRIMARY KEY,
    url          TEXT   NOT NULL UNIQUE,
    name         TEXT   NOT NULL,
    brand        VARCHAR(255),
    images       JSONB  NOT NULL DEFAULT '[]',
    lowest_price VARCHAR(50),
    sizes        JSONB  NOT NULL DEFAULT '[]',
    parsed_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id         SERIAL  PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size       VARCHAR(50)  NOT NULL,
    quantity   INTEGER      NOT NULL DEFAULT 1,
    added_at   TIMESTAMP    DEFAULT NOW(),
    UNIQUE (user_id, product_id, size)
);
