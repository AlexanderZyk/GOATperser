const pool = require('../db');

module.exports = {
    async findByUserId(userId) {
        const { rows } = await pool.query('SELECT * FROM tokens WHERE user_id = $1', [userId]);
        return rows[0] || null;
    },

    async findByRefreshToken(refreshToken) {
        const { rows } = await pool.query('SELECT * FROM tokens WHERE refresh_token = $1', [refreshToken]);
        return rows[0] || null;
    },

    async upsert(userId, refreshToken) {
        await pool.query(
            `INSERT INTO tokens (user_id, refresh_token) VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET refresh_token = $2`,
            [userId, refreshToken]
        );
    },

    async deleteByRefreshToken(refreshToken) {
        await pool.query('DELETE FROM tokens WHERE refresh_token = $1', [refreshToken]);
    },
};
