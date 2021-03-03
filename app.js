require('dotenv').config();

const express = require('express');
const db = require('./database/db_init');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}));
app.use(cors());
app.set('view engine', 'ejs');

// Routes
app.route('/')
    .get((_, res) => {
        res.render('pages/landing');
    });

app.route('/dashboard')
    .get((_, res) => {
        res.render('pages/dashboard');
    });

app.route('/board')
    .get((_, res) => {
        db.connection.query('SELECT * FROM TodoLists', (err, todoLists) => {
            if (err) throw err;

            db.connection.query('SELECT * FROM Todos WHERE isTodoCompleted=0', (err, todos) => {
                if (err) throw err;
                res.render('pages/board', { todoLists: todoLists, todos: todos, });
            });
        });
    })
    .post((req, res) => {
        const todoDescription = req.body.todoDescription;
        const todoListID = req.body.id;
        const newTodoList = req.body.newList;

        if (todoDescription) {
            db.connection.query('INSERT INTO Todos (todoDescription, todoListID) VALUES (?, ?)', [todoDescription, todoListID], err => {
                if (err) throw err;
                console.log('Todo inserted into database.');
                res.redirect('board');
            });
        } else if (newTodoList) {
            console.log('entered the new todo list else?');
            db.connection.query('INSERT INTO TodoLists (todoListDescription) VALUES (?)', newTodoList, err => {
                if (err) throw err;
                console.log('Todo inserted into database.');
                res.redirect('board');
            });
        }

    })
    .put((req, res) => {
        const updatedTodo = req.body.updatedTodo;
        const completedTodoId = Number(req.body.compltedTodoId);
        const editedTodoId = Number(req.body.editedTodoId);

        if (completedTodoId) {
            db.connection.query('UPDATE Todos SET isTodoCompleted=1 WHERE todoID=?', completedTodoId, err => {
                if (err) throw err;
                console.log('Todo updated from database.');
            });
        } else {
            db.connection.query('UPDATE Todos SET todoDescription=? WHERE todoID=?', [updatedTodo, editedTodoId], err => {
                if (err) throw err;
                console.log('Todo updated from database.');
            });
        }
        res.redirect(303, 'board');
    })
    .delete((req, res) => {
        const deletedTodo = Number(req.body.id);

        db.connection.query('DELETE FROM Todos WHERE todoId=?', deletedTodo, err => {
            if (err) throw err;
            console.log('Todo deleted from database.');
        });
        res.redirect(303, 'board');
    });

app.route('/login')
    .get((_, res) => {
        res.render('pages/login');
    })
    .post((req, res) => {
        res.redirect('/board');
    });

app.route('/board/create-list')
    .post((req, res) => {
        const listName = req.body.name;
        db.connection.query('INSERT INTO TodoLists (todoListDescription) VALUES (?)', listName, (err, result) => {
            if (err) throw err;
            res.json({ id: result.insertId });
        });
    });

app.route('/board/delete-list')
    .post((req, res) => {
        const todoListId = req.body.id;
        db.connection.beginTransaction(function (err) {
            if (err) { throw err; }
            db.connection.query('DELETE FROM Todos Where todoListID=?', todoListId, function (error) {
                if (error) {
                    return db.connection.rollback(function () {
                        throw error;
                    });
                }
                db.connection.query('DELETE FROM TodoLists WHERE todoListID=?', todoListId, function (error) {
                    if (error) {
                        return db.connection.rollback(function () {
                            throw error;
                        });
                    }
                    db.connection.commit(function (err) {
                        if (err) {
                            return db.connection.rollback(function () {
                                throw err;
                            });
                        }
                        console.log('Todo List removed along with todos');
                    });
                });
            });
            res.redirect('/board');
        });
    });

app.route('/board/add-item')
    .post((req, res) => {
        const listId = req.body.listId;
        const itemDescription = req.body.content;
        console.log(listId, itemDescription);
        db.connection.query('INSERT INTO Todos (todoDescription, todoListID) VALUES (?, ?)', [itemDescription, listId], (err, result) => {
            if (err) throw err;
            console.log('New ajax card added to DB');
            res.json({ id: result.insertId });
        });
    });

app.route('/board/create-target-list')
    .put((req) => {
        const targetTasksArray = req.body;

        for (let i = 0; i < targetTasksArray.length; i++) {
            db.connection.query('UPDATE Todos SET isOnTargetList=1 WHERE todoID=?', targetTasksArray[i], err => {
                if (err) throw err;
                console.log('Todo updated from database.');
            });
        }
    });

app.route('/get-todos')
    .get((req, res) => {
        db.connection.query('SELECT * FROM TodoLists', err => {
            if (err) throw err;

            db.connection.query('SELECT * FROM Todos WHERE isTodoCompleted=0', (err, todos) => {
                if (err) throw err;
                res.send(todos);
            });
        });
    });

app.listen(port, () => console.log(`Listening on port ${port}.`));
