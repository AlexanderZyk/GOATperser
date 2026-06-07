const pool = require('../db');

module.exports = {
    async getByUser(userId) {
        const { rows } = await pool.query(
            `SELECT ci.id, ci.size, ci.quantity, ci.added_at,
                    p.id as product_id, p.url, p.name, p.brand, p.images, p.lowest_price, p.sizes
             FROM cart_items ci
             JOIN products p ON p.id = ci.product_id
             WHERE ci.user_id = $1
             ORDER BY ci.added_at DESC`,
            [userId]
        );
        return rows;
    },

    async add(userId, productId, size) {
        const { rows } = await pool.query(
            `INSERT INTO cart_items (user_id, product_id, size)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, product_id, size) DO UPDATE SET quantity = cart_items.quantity + 1
             RETURNING *`,
            [userId, productId, size]
        );
        return rows[0];
    },

    async remove(id, userId) {
        await pool.query(
            'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
    },

    async clear(userId) {
        await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    },
};
