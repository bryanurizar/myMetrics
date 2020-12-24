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
    database: process.env.DB_NAME
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

    connection.query('CREATE TABLE IF NOT EXISTS todos (id CHAR(255), description CHAR(255), price INT)', err => {
        if (err) throw err;
        console.log('Table created.');
    });

    // connection.query(`INSERT INTO products (id, description, price) VALUES ('Laptop', 'HP Laptop', 600)`, err => {
    //     if (err) throw err;
    //     console.log('Product added to database.');
    // });
});

app.get('/', (req, res) => {
    connection.query('SELECT * FROM todos', (err, results) => {
        if (err) throw err;
        console.log(results[0].id);
        console.log('Query completed');
        res.render('home', { results: results });
    });
});

// connection.end();
app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}.`));