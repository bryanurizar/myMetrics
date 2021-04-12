require('dotenv').config();

const express = require('express');
const db = require('./database/db_init');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 12);

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

// Home route
app.route('/')
    .get((_, res) => {
        res.render('pages/landing');
    });

// Auth routes
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

app.route('/logout')
    .get((req, res) => {
        res.clearCookie('session-cookie');
        res.redirect('/login');
    });

// Dashboard route
app.route('/dashboard')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;

        db.connection.query('SELECT boardID, boardName FROM Boards WHERE userID=? ORDER BY createdAt', loggedInUserId, (err, results) => {
            if (err) throw err;
            res.render('pages/dashboard', { user: req.user, results: results });
            console.log(results);
        });
    });

// Board routes
app.route('/boards')
    .post(isUserAuthenticated, (req, res) => {
        console.log(req.body);
        const newBoardId = nanoid();
        const newBoardName = req.body.newBoardName;
        const loggedInUserId = req.user.id;

        db.connection.query('INSERT INTO Boards (boardID, boardName, userID) VALUES(?, ?, ?)', [newBoardId, newBoardName, loggedInUserId], (err, result) => {
            if (err) throw err;
            console.log('New board inserted into Boards table');
            res.json({ newBoardId: newBoardId });
        });
    });

app.route('/boards/:boardId/:boardName')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;
        const boardID = req.params.boardId;

        console.log(loggedInUserId, boardID);

        db.connection.query('SELECT * FROM Lists WHERE userID=? AND boardID=?', [loggedInUserId, boardID], (err, lists) => {
            if (err) throw err;

            db.connection.query('SELECT * FROM Items WHERE isItemCompleted=0 AND userID=?', loggedInUserId, (err, items) => {
                if (err) throw err;
                res.render('pages/board', { lists: lists, items: items });
            });
        });
    });

// Items routes
app.route('/items')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.body.id;

        db.connection.query('SELECT * FROM Lists WHERE userID=?', loggedInUser, err => {
            if (err) throw err;

            db.connection.query('SELECT * FROM Items WHERE isItemCompleted=0 AND userID=?', loggedInUser, (err, items) => {
                if (err) throw err;
                res.send(items);
            });
        });
    })
    .post(isUserAuthenticated, (req, res) => {
        const listId = req.body.listId;
        const itemDescription = req.body.content;
        const loggedInUser = req.user.id;

        db.connection.query('INSERT INTO Items (itemName, ListID, userID) VALUES (?, ?, ?)', [itemDescription, listId, loggedInUser], (err, result) => {
            if (err) throw err;
            console.log('New ajax card added to DB');
            res.json({ id: result.insertId });
        });
    });

app.route('items/:itemId')
    .post(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;
        const itemDescription = req.body.todoDescription;
        const listId = req.body.id;

        db.connection.query('INSERT INTO Items (itemName, listID, userID) VALUES (?, ?, ?)', [itemDescription, listId, loggedInUserId], err => {
            if (err) throw err;
            console.log('Item inserted into database.');
            res.redirect('board');
        });
    })
    .patch(isUserAuthenticated, (req, res) => {
        const updatedItemDescription = req.body.updatedItem;
        const editedItemId = Number(req.body.editedItem.id);
        const completedItemId = Number(req.body.completedItem.id);

        if (completedItemId) {
            db.connection.query('UPDATE Items SET isItemCompleted=1 WHERE itemID=?', completedItemId, err => {
                if (err) throw err;
                console.log('Item updated from database.');
            });
        } else {
            db.connection.query('UPDATE Items SET itemName=? WHERE itemID=?', [updatedItemDescription, editedItemId], err => {
                if (err) throw err;
                console.log('Item updated from database.');
            });
        }
        res.redirect(303, 'board');

    })
    .delete(isUserAuthenticated, (req, res) => {
        const deletedItem = Number(req.body.id);

        db.connection.query('DELETE FROM Items WHERE itemId=?', deletedItem, err => {
            if (err) throw err;
            console.log('Item deleted from database.');
        });
        res.redirect(303, 'board');
    });

// List routes
app.route('/lists')
    .post(isUserAuthenticated, (req, res) => {
        const listName = req.body.name;
        const loggedInUser = req.user.id;
        const listId = nanoid();
        const boardId =
            console.log(req.referer);

        db.connection.query('INSERT INTO Lists (listID, listName, userID, boardId) VALUES (?, ?, ?, ?)', [listId, listName, loggedInUser, boardId], (err, result) => {
            if (err) throw err;
            res.json({ listId: listId });
        });
    });

app.route('/lists/:listId')
    .post(isUserAuthenticated, (req, res) => {
        const newList = req.body.newList;
        const loggedInUser = req.user.id;

        db.connection.query('INSERT INTO Lists (listDescription, userID) VALUES (?, ?)', [newList, loggedInUser], err => {
            if (err) throw err;
            console.log('Item inserted into database.');
            res.redirect('board');
        });
    })
    .delete(isUserAuthenticated, (req, res) => {
        const listId = req.body.id;
        db.connection.beginTransaction(function (err) {
            if (err) { throw err; }
            db.connection.query('DELETE FROM Items Where itemID=?', listId, function (error) {
                if (error) {
                    return db.connection.rollback(function () {
                        throw error;
                    });
                }
                db.connection.query('DELETE FROM Lists WHERE listID=?', listId, function (error) {
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
                        console.log('Items List removed along with items');
                    });
                });
            });
            res.redirect('/board');
        });
    });

// New endpoint required as it is a new resource
app.route('/board/create-target-list')
    .put(isUserAuthenticated, (req) => {
        const targetTasksArray = req.body;

        for (let i = 0; i < targetTasksArray.length; i++) {
            db.connection.query('UPDATE Items SET isOnTargetList=1 WHERE itemID=?', targetTasksArray[i], err => {
                if (err) throw err;
                console.log('Item updated from database.');
            });
        }
    });

app.listen(port, () => console.log(`Listening on port ${port}.`));

async function isUserAuthenticated(req, res, next) {
    const token = req.cookies['session-cookie'];
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
        req.user = user;
        console.log('user verified again');
        next();
    } catch (err) {
        console.log('user not authenticated');
        res.redirect('login');

    }
}

