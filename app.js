require('dotenv').config();
const express = require('express');
const mysql = require('mysql');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

connection.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('Database successfully connected.');

    connection.query('CREATE DATABASE IF NOT EXISTS todoDB', (err, result) => {
        if (err) throw err;
        console.log('Database created: ' + result);
    });

    connection.query('CREATE TABLE IF NOT EXISTS todos (todo CHAR(255))', err => {
        if (err) throw err;
        console.log('Table created.');
    });

    connection.query('INSERT INTO todos (todo) VALUES (\'study\')', err => {
        if (err) throw err;
        console.log('Todo added to database.');
    });
});

app.get('/', (req, res) => {
    connection.query('SELECT * FROM todos', (err, results) => {
        if (err) throw err;
        console.log('Query completed');
        res.render('home', { results: results });
    });
});

// connection.end();
app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}.`));