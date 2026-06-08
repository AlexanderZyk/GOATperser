require('dotenv').config()
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./db');
const migrate = require('./migrate');
const router = require('./router/index');
const errorMiddleware = require('./middlewares/error-middleware');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(o => o.trim()).filter(Boolean);
const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    }
};
app.use(cors(corsOptions));
app.use('/api', router);
app.use(errorMiddleware);

const start = async () => {
    try {
        await pool.query('SELECT 1');
        await migrate();
        await new Promise((resolve, reject) => {
            const server = app.listen(PORT, () => {
                console.log(`Server started on PORT = ${PORT}`);
                resolve();
            });
            server.on('error', reject);
        });
    } catch (e) {
        console.log(e);
    }
}

start()
