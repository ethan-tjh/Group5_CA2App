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
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: false
}));

app.get('/viewPost/:id', checkAuthenticated, (req, res) => {
    const {id} = req.params;
    const isAdmin = req.session.user.role == 'admin';

//pls continue below here, i'm still writing my section -jerome :')
