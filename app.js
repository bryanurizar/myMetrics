require('dotenv').config();

const express = require('express');
const db = require('./database/db_init');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cookieParser());
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
    .get(isUserAuthenticated, (req, res) => {
        res.render('pages/dashboard');
    });

app.route('/board')
    .get(isUserAuthenticated, (req, res) => {
        db.connection.query('SELECT * FROM TodoLists', (err, todoLists) => {
            if (err) throw err;

            db.connection.query('SELECT * FROM Todos WHERE isTodoCompleted=0', (err, todos) => {
                if (err) throw err;
                res.render('pages/board', { todoLists: todoLists, todos: todos, });
            });
        });
    })
    .post(isUserAuthenticated, (req, res) => {
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
    .put(isUserAuthenticated, (req, res) => {
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
    .delete(isUserAuthenticated, (req, res) => {
        const deletedTodo = Number(req.body.id);

        db.connection.query('DELETE FROM Todos WHERE todoId=?', deletedTodo, err => {
            if (err) throw err;
            console.log('Todo deleted from database.');
        });
        res.redirect(303, 'board');
    });

app.route('/login')
    .get((req, res) => {
        res.render('pages/login');
    })
    .post(async (req, res) => {
        const token = req.body.token;
        const user = {};

        try {
            await verify();
            databaseValidation(user);
            console.log('user authenticated by google');
            res.cookie('session-cookie', token);
            res.send('user authenticated');
        } catch (err) {
            console.log('user not authenticated by google');
        }

        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            console.log('first verify', token);

            const payload = ticket.getPayload();

            user.id = payload.sub;
            user.firstName = payload.given_name;
            user.lastName = payload.family_name;
            user.email = payload.email;
            user.image = payload.picture;
        }

        function databaseValidation(user) {
            db.connection.query('SELECT * FROM Users WHERE userID = ?', user.id, (err, results) => {
                if (err) throw err;

                const isUserFound = results.length === 1;

                if (isUserFound) {
                    console.log('user already exists - redirected to dashboard');
                } else {
                    db.connection.query('INSERT INTO Users (userID, firstName, lastName, email, userImage) VALUES (?, ?, ?, ?, ?)', [user.id, user.firstName, user.lastName, user.email, user.image], (err) => {
                        if (err) throw err;
                        console.log('user added to db and redirected to dashboard');
                    });
                }
            });
        }
    });


// app.route('/logout')
//     .get((req, res) => {
//         res.redirect('/login');
//     });

app.route('/board/create-list')
    .post(isUserAuthenticated, (req, res) => {
        const listName = req.body.name;
        db.connection.query('INSERT INTO TodoLists (todoListDescription) VALUES (?)', listName, (err, result) => {
            if (err) throw err;
            res.json({ id: result.insertId });
        });
    });

app.route('/board/delete-list')
    .post(isUserAuthenticated, (req, res) => {
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
    .post(isUserAuthenticated, (req, res) => {
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
    .put(isUserAuthenticated, (req) => {
        const targetTasksArray = req.body;

        for (let i = 0; i < targetTasksArray.length; i++) {
            db.connection.query('UPDATE Todos SET isOnTargetList=1 WHERE todoID=?', targetTasksArray[i], err => {
                if (err) throw err;
                console.log('Todo updated from database.');
            });
        }
    });

app.route('/get-todos')
    .get(isUserAuthenticated, (req, res) => {
        db.connection.query('SELECT * FROM TodoLists', err => {
            if (err) throw err;

            db.connection.query('SELECT * FROM Todos WHERE isTodoCompleted=0', (err, todos) => {
                if (err) throw err;
                res.send(todos);
            });
        });
    });

app.listen(port, () => console.log(`Listening on port ${port}.`));

async function isUserAuthenticated(req, res, next) {
    console.log('entered isUserAuthenticated function');

    const token = req.cookies['session-cookie'];
    console.log(token);
    const user = {};

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        user.id = payload.sub;
        user.firstName = payload.given_name;
        user.lastName = payload.family_name;
        user.email = payload.email;
        user.image = payload.picture;
    }

    try {
        await verify();
        console.log('user verified again');
        next();
    } catch (err) {
        console.log(err);
    }
}