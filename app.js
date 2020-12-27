require('dotenv').config();
const express = require('express');
const db = require('./database/db_init');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}));
app.set('view engine', 'ejs');

app.route('/')
    .get((req, res) => {
        db.connection.query('SELECT * FROM todos', (err, results) => {
            if (err) throw err;
            console.log('Todos read from database');
            res.render('home', { results: results });
        });
    })
    .post((req, res) => {
        const todoItem = req.body.todo;

        db.connection.query('INSERT INTO todos (todo) VALUES (?)', todoItem, err => {
            if (err) throw err;
            console.log('Todo inserted into database.');
            res.redirect('/');
        });
    })
    .put((req, res) => {
        const originalTodo = req.body.originalTodo;
        const updatedTodo = req.body.updatedTodo;

        db.connection.query('UPDATE todos SET todo=? WHERE todo=?', [updatedTodo, originalTodo], err => {
            if (err) throw err;
            console.log('Todo updated from database.');
        });
        res.redirect(303, '/');
    })
    .delete((req, res) => {
        const todo = req.body.todoItem;

        db.connection.query('DELETE FROM todos WHERE todo=?', todo, err => {
            if (err) throw err;
            console.log('Todo deleted from database.');
        });
        res.redirect(303, '/');
    });

app.listen(port, () => console.log(`Listening on port ${port}.`));