const pool = require('../db');

module.exports = {
    async create(userId, deliveryAddress, deliveryType, totalRub, items) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: [order] } = await client.query(
                `INSERT INTO orders (user_id, delivery_address, delivery_type, total_rub)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [userId, deliveryAddress, deliveryType, totalRub]
            );

            for (const item of items) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, size, quantity, price_usd)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [order.id, item.productId, item.size, item.quantity, item.priceUsd]
                );
                await client.query(
                    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
                    [item.cartItemId, userId]
                );
            }

            await client.query('COMMIT');
            return order;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getByUser(userId) {
        const { rows } = await pool.query(
            `SELECT
                o.id, o.delivery_address, o.delivery_type,
                o.total_rub, o.status, o.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id',         oi.id,
                            'size',       oi.size,
                            'quantity',   oi.quantity,
                            'price_usd',  oi.price_usd,
                            'product_id', p.id,
                            'name',       p.name,
                            'brand',      p.brand,
                            'images',     p.images,
                            'url',        p.url
                        ) ORDER BY oi.id
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products p    ON p.id = oi.product_id
             WHERE o.user_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );
        return rows;
    },

    async getAll() {
        const { rows } = await pool.query(
            `SELECT
                o.id, o.delivery_address, o.delivery_type,
                o.total_rub, o.status, o.created_at,
                u.id   AS user_id,
                u.email AS user_email,
                u.first_name AS user_first_name,
                u.last_name  AS user_last_name,
                u.phone      AS user_phone,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id',         oi.id,
                            'size',       oi.size,
                            'quantity',   oi.quantity,
                            'price_usd',  oi.price_usd,
                            'product_id', p.id,
                            'name',       p.name,
                            'brand',      p.brand,
                            'images',     p.images,
                            'url',        p.url
                        ) ORDER BY oi.id
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
             FROM orders o
             JOIN users u ON u.id = o.user_id
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products p    ON p.id = oi.product_id
             GROUP BY o.id, u.id
             ORDER BY o.created_at DESC`
        );
        return rows;
    },

    async updateStatus(orderId, status) {
        const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!allowed.includes(status)) {
            throw new Error('Недопустимый статус');
        }
        const { rows } = await pool.query(
            `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
            [status, orderId]
        );
        return rows[0] || null;
    },

};
