// Add session middleware (if not already present)
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using HTTPS
}));

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
