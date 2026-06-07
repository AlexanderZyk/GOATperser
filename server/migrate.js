const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version    VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT NOW()
        )
    `);

    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const version = path.basename(file, '.sql');

        const { rows } = await pool.query(
            'SELECT version FROM schema_migrations WHERE version = $1',
            [version]
        );
        if (rows.length > 0) continue;

        const sql = fs.readFileSync(path.join(dir, file), 'utf8');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query(
                'INSERT INTO schema_migrations (version) VALUES ($1)',
                [version]
            );
            await client.query('COMMIT');
            console.log(`Migration applied: ${file}`);
        } catch (e) {
            await client.query('ROLLBACK');
            throw new Error(`Migration failed (${file}): ${e.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = migrate;
