app.get('/viewPost/:id', checkAuthenticated, (req, res) => {
    const {id} = req.params;
    const isAdmin = req.session.user.role == 'admin';
    
    let sql = '';
    let params = [];

    if (isAdmin) {
      sql = 'SELECT t.*, u.username FROM tasks t JOIN users u ON t.user_id = u.id WHERE 1=1';
      if (search) {
        sql += ' AND t.title LIKE ?';
        params.push(`%${search}%`);
      }
      if (status && status !== 'all') {
        sql += ' AND t.status = ?';
        params.push(status);
      }
    } else {
      sql = 'SELECT * FROM tasks WHERE user_id = ?';
      params.push(req.session.user.id);
    }

    connection.query(sql, params, (err, results) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Failed to load post');
        return res.redirect('/');
      }
      res.render('viewPost', {
        task: results[0],
        user: req.session.user,
        success: req.flash('success'),
        error: req.flash('error')
      });
    });
});
