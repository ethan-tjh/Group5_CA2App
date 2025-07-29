const express = require('express');
const router = express.Router();

module.exports = (connection) => {
    // Delete post route
    router.post('/deletePost/:id', (req, res) => {
        const postId = req.params.id;

        // Optional: add admin check here if needed
        const sql = 'DELETE FROM posts WHERE id = ?';
        connection.query(sql, [postId], (err, result) => {
            if (err) {
                console.error('Error deleting post:', err);
                req.flash('error', 'Failed to delete post');
                return res.redirect('/');
            }

            req.flash('success', 'Post deleted successfully');
            res.redirect('/');
        });
    });

    return router;
};
