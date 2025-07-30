const express = require('express');

module.exports = (connection) => {
    const router = express.Router();

    // 1️⃣ GET: Show delete confirmation page
    router.get('/deletePost/:id', (req, res) => {
        const postId = req.params.id;
        connection.query('SELECT * FROM posts WHERE id = ?', [postId], (err, results) => {
            if (err) return res.sendStatus(500);
            if (results.length === 0) return res.status(404).send('Post not found');
            res.render('deletePost', { post: results[0] });
        });
    });

    // 2️⃣ POST: Handle delete submission
    router.post('/deletePost/:id', (req, res) => {
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

    return router;
};
