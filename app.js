require('dotenv').config();
const express = require('express');
const mysql = require('mysql');

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}));
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

    connection.query('CREATE TABLE IF NOT EXISTS todos (id INT AUTO_INCREMENT PRIMARY KEY, todo CHAR(255))', err => {
        if (err) throw err;
        console.log('Table created.');
    });

    // connection.query('INSERT INTO todos (todo) VALUES (\'hello\')', err => {
    //     if (err) throw err;
    //     console.log('Todo added to database.');
    // });
});

app.route('/')

    .get((req, res) => {
        connection.query('SELECT * FROM todos', (err, results) => {
            if (err) throw err;
            console.log('Todos read from database');
            res.render('home', { results: results });
        });
    })
    .post((req, res) => {
        const todoItem = req.body.todo;

        connection.query('INSERT INTO todos (todo) VALUES (?)', todoItem, err => {
            if (err) throw err;
            console.log('Todo inserted into database.');
            res.redirect('/');
        });
    })
    .delete((req, res) => {
        const todo = req.body.todoItem;

        connection.query('DELETE FROM todos WHERE todo=?', todo, err => {
            if (err) throw err;
            console.log('Todo deleted from database.');
        });
        res.redirect(303, '/');
    })
    .put((req, res) => {
        const originalTodo = req.body.originalTodo;
        const updatedTodo = req.body.updatedTodo;

        connection.query('UPDATE todos SET todo=? WHERE todo=?', [updatedTodo, originalTodo], err => {
            if (err) throw err;
            console.log('Todo updated from database.');
        });
        res.redirect(303, '/');
    });

// connection.end();
app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}.`));