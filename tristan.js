// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

// Database connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'forum_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage route with search and filter
app.get('/homepage', async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = `
            SELECT posts.*, categories.name as category_name 
            FROM posts 
            LEFT JOIN categories ON posts.category_id = categories.id
        `;
        const params = [];

        // Build query based on search and filter
        if (search && category) {
            query += ` WHERE (title LIKE ? OR description LIKE ?) AND posts.category_id = ?`;
            params.push(`%${search}%`, `%${search}%`, category);
        } else if (search) {
            query += ` WHERE title LIKE ? OR description LIKE ?`;
            params.push(`%${search}%`, `%${search}%`);
        } else if (category) {
            query += ` WHERE posts.category_id = ?`;
            params.push(category);
        }

        query += ` ORDER BY created_at DESC`;

        const [rows] = await pool.execute(query, params);
        
        // Also get categories for the filter dropdown
        const [categories] = await pool.execute('SELECT * FROM categories');
        
        res.json({
            posts: rows,
            categories
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
