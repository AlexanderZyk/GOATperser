-- users: activation_link (email already indexed via UNIQUE)
CREATE INDEX IF NOT EXISTS idx_users_activation_link ON users(activation_link);

-- tokens: refresh_token (user_id already indexed via UNIQUE)
CREATE INDEX IF NOT EXISTS idx_tokens_refresh_token ON tokens(refresh_token);

-- cart_items: user_id — covered by composite UNIQUE(user_id,product_id,size)
-- but a dedicated index makes ORDER BY added_at scans faster
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- orders: user_id
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- order_items: order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
