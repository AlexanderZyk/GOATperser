const pool = require('../db');

module.exports = {
    async findByEmail(email) {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0] || null;
    },

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return rows[0] || null;
    },

    async create(email, password) {
        const { rows } = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
            [email, password]
        );
        return rows[0];
    },

    async findAll() {
        const { rows } = await pool.query('SELECT id, email FROM users');
        return rows;
    },

    async updateProfile(id, firstName, lastName, phone) {
        const { rows } = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4 RETURNING *',
            [firstName || null, lastName || null, phone || null, id]
        );
        return rows[0] || null;
    },

    async updatePassword(id, hashedPassword) {
        const { rows } = await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
            [hashedPassword, id]
        );
        return rows[0] || null;
    },
};
