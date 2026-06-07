CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_activated BOOLEAN DEFAULT FALSE,
    activation_link VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    name VARCHAR(500),
    brand VARCHAR(255),
    images JSONB DEFAULT '[]',
    lowest_price VARCHAR(100),
    sizes JSONB DEFAULT '[]',
    parsed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(50),
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id, size)
);
