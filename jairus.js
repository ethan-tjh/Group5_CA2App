// GET: Show confirmation page
app.get('/deletePost/:id', (req, res) => {
    const postId = req.params.id;
    const query = 'SELECT * FROM posts WHERE id = ?';
    connection.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Error fetching post:', err);
            return res.sendStatus(500);
        }
        if (results.length === 0) {
            return res.status(404).send('Post not found');
        }
        res.render('deletePost', { post: results[0] });
    });
});

// POST: Perform deletion
app.post('/deletePost/:id', (req, res) => {
    const postId = req.params.id;
    const query = 'DELETE FROM posts WHERE id = ?';
    connection.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Error deleting post:', err);
            return res.sendStatus(500);
        }
        res.redirect('/homepage');
    });
});

