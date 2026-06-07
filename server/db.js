const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DB_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

module.exports = pool;
