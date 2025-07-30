const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const app = express();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); 
    }
});
const upload = multer({ storage: storage });

const connection = mysql.createConnection({
    host: 'z41can.h.filess.io',
    port: 61002,
    user: 'CA2Group5_satisfied',
    password: '356693b4eecb61c0cd53d80999306bf2c9e34221',
    database: 'CA2Group5_satisfied'
  });
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.use(flash());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// Manage session cookies such that after 3 days of inactivity, the session expires. (by Ethan)
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    // Session expires after 3 days of inactivity
    cookie: {maxAge: 1000*60*60*24*3}
}));

// Routes
// Login & Register (by Jiayi)
app.get('/', (req, res) => {
    res.render('login', {title: 'RPConnect'});
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'RPConnect - Create Account' });
});

app.post('/register', (req, res) => {
    const { username, email, password, profileImage } = req.body;
    const role = "user";
    const sql = 'INSERT INTO users (username, email, password, role, profileImage) VALUES (?, ?, SHA1(?), ?, ?)';
    
    connection.query(sql, [username, email, password, role, profileImage], (err, result) => {
        if (err) {
            // Handle the error (e.g., user already exists)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.send('User already exists.');
            }
            throw err; // For other errors, you can throw or handle accordingly
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/');
    });
});

// Homepage, View, Search and Filter (by Tristan)
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

// Create Post (by Kate)
// Route to display the create post form (Reddit-style)
app.get('/createPost', async (req, res) => {
    try {
        // Fetch categories for the dropdown
        const [categories] = await connection.promise().query('SELECT id, name FROM categories');
        
        res.render('createPost', { 
            categories,
            user: req.session.user,
            messages: req.flash()
        });
    } catch (err) {
        console.error('Error fetching categories:', err);
        req.flash('error', 'Error loading post form');
        res.redirect('/');
    }
});

// Route to handle post creation
app.post('/createPost', upload.single('image'), async (req, res) => {
    const { title, content, category_id } = req.body;
    const userId = req.session.user?.id; // Assuming user is logged in
    
    // Validate required fields
    if (!title || !content || !category_id) {
        req.flash('error', 'Title, content, and category are required');
        return res.redirect('/createPost');
    }

    // Handle image upload if present
    let imageUrl = null;
    if (req.file) {
        imageUrl = `/images/${req.file.filename}`;
    }

    try {
        // Insert the new post
        const [result] = await connection.promise().query(
            `INSERT INTO posts (title, content, image_url, category_id, user_id, created_at, upvotes) 
             VALUES (?, ?, ?, ?, ?, NOW(), 0)`,
            [title, content, imageUrl, category_id, userId]
        );

        req.flash('success', 'Post created successfully!');
        res.redirect(`/post/${result.insertId}`);
    } catch (err) {
        console.error('Error creating post:', err);
        req.flash('error', 'Failed to create post');
        res.redirect('/createPost');
    }
});

// View Post (by Jerome)
app.get('/viewPost/:id', (req, res) => {
    const {id} = req.params;
    const isAdmin = req.session.user && req.session.user.role === 'admin';
    
    let sql = '';
    let params = [];

    if (isAdmin) {
      sql = 'SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE 1=1';
      if (search) {
        sql += ' AND p.title LIKE ?';
        params.push(`%${search}%`);
      }
      if (status && status !== 'all') {
        sql += ' AND p.created_at = ?';
        params.push(status);
      }
    } else {
      sql = 'SELECT * FROM posts WHERE user_id = ?';
      params.push(req.session.user.id);
    }

    connection.query(sql, params, (err, results) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Failed to load post');
        return res.redirect('/homepage');
      }
      res.render('viewPost', {
        task: results[0],
        user: req.session.user,
        success: req.flash('success'),
        error: req.flash('error')
      });
    });
});

// Update Post (by Ethan)
app.get('/updatePost/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM posts WHERE id = ?';

    connection.query(sql, [id], (error, results) => {
        if (error) throw error;

        if (results.length>0) {
            res.render('updatePost', { posts: results[0] });
        } else {
            res.status(404).send('Post not found.');
        }
    });
});

app.post('/updatePost/:id', (req, res) => {
    console.log("BODY:", req.body);

    const id = req.params.id;
    const { title, description } = req.body;
    const sql = 'UPDATE posts SET title = ?, description = ?, updated_at = NOW() WHERE id = ?';
    connection.query(sql, [title, description, id], (error, results) => {
        if (error) {
            console.error("Error when updating post:", error);
            res.status(500).send('Error in updating post');
        } else {
            res.redirect('/homepage');
        }
    });
});

// Delete Post (by Jairus)
app.get('/deletePost/:id', (req, res) => {
        const postId = req.params.id;
        connection.query('SELECT * FROM posts WHERE id = ?', [postId], (err, results) => {
            if (err) return res.sendStatus(500);
            if (results.length === 0) return res.status(404).send('Post not found');
            res.render('deletePost', { post: results[0] });
        });
    });

app.post('/deletePost/:id', (req, res) => {
        const postId = req.params.id;
        connection.query('DELETE FROM posts WHERE id = ?', [postId], (err) => {
            if (err) {
                req.flash('error', 'Failed to delete post');
                return res.redirect('/');
            }
            req.flash('success', 'Post deleted successfully');
            res.redirect('/');
        });
    });

// Starting the server
const PORT = process.env.PORT || 61002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));