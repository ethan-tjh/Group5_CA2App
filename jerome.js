app.get('/viewPost/:id', (req, res) => {
    const { id } = req.params;
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
