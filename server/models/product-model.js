const pool = require('../db');

module.exports = {
    async findByUrl(url) {
        const { rows } = await pool.query('SELECT * FROM products WHERE url = $1', [url]);
        return rows[0] || null;
    },

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        return rows[0] || null;
    },

    async upsert(url, name, brand, images, lowestPrice, sizes) {
        const { rows } = await pool.query(
            `INSERT INTO products (url, name, brand, images, lowest_price, sizes, parsed_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (url) DO UPDATE
             SET name = $2, brand = $3, images = $4, lowest_price = $5, sizes = $6, parsed_at = NOW()
             RETURNING *`,
            [url, name, brand, JSON.stringify(images), lowestPrice, JSON.stringify(sizes)]
        );
        return rows[0];
    },
};
