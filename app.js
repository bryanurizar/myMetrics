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
// const { Duration } = require('luxon');

// let studySessionDuration = Duration.fromObject({ hours: 10, minutes: 0, seconds: 0 });
// setInterval(countdown, 1000);

// function countdown() {
//     studySessionDuration = studySessionDuration.minus({ seconds: 1 });
//     console.log(studySessionDuration.toFormat('hh : mm : ss'));
// }

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
        res.redirect('/');
    });

// Dashboard route
app.route('/dashboard')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;

        db.connection.query('SELECT boardID, boardName FROM Boards WHERE userID=? ORDER BY createdAt', loggedInUserId, (err, results) => {
            if (err) throw err;
            res.render('pages/dashboard', { user: req.user, results: results });
        });
    });

// Board routes
app.route('/boards')
    // .get(isUserAuthenticated, (req, res) => {
    //     db.connection.query('SELECT * FROM BOARDS', (err, results) => {
    //         if (err) throw err;
    //         res.json(results);
    //     });
    // })
    .post(isUserAuthenticated, (req, res) => {
        const newBoardId = nanoid();
        const newBoardName = req.body.newBoardName;
        const loggedInUserId = req.user.id;

        db.connection.query('INSERT INTO Boards (boardID, boardName, userID) VALUES(?, ?, ?)', [newBoardId, newBoardName, loggedInUserId], (err) => {
            if (err) throw err;
            console.log('New board inserted into Boards table');
            res.json({ newBoardId: newBoardId });
        });
    });

app.route('/boards/:boardId/:boardName')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;
        const boardID = req.params.boardId;

        db.connection.query('SELECT * FROM Lists WHERE userID=? AND boardID=? ORDER BY createdAt', [loggedInUserId, boardID], (err, lists) => {
            if (err) throw err;

            db.connection.query('SELECT * FROM Items WHERE isItemCompleted=0 AND userID=? ORDER BY createdAt', loggedInUserId, (err, items) => {
                if (err) throw err;
                res.render('pages/board', { lists: lists, items: items });
            });
        });
    });

// Items routes
app.route('/items')
    .post(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;
        const itemName = req.body.itemName;
        const listId = req.body.listId;
        const itemId = nanoid();
        const boardId = req.body.boardId;

        db.connection.query('INSERT INTO Items (itemID, itemName, listID, userID, boardID) VALUES (?, ?, ?, ?, ?)', [itemId, itemName, listId, loggedInUserId, boardId], (err) => {
            if (err) throw err;
            console.log('Item inserted into database.');
            res.json({ itemId: itemId });
        });
    })
    .patch(isUserAuthenticated, (req, res) => {
        const targetListItems = req.body;
        const studySessionId = nanoid();

        for (let i = 0; i < targetListItems.length; i++) {
            db.connection.query('UPDATE Items SET isOnTargetList=1 WHERE itemID=?', targetListItems[i], err => {
                if (err) throw err;
            });
        }
        res.json({ studySessionId: studySessionId });
        console.log('TargetList updated in database');
    });

app.route('/items/:itemId')

    // Is the post route being used??
    .post(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;
        const itemName = req.body.itemName;
        const listId = req.body.listId;
        const itemId = nanoid();

        db.connection.query('INSERT INTO Items (itemID, itemName, listID, userID) VALUES (?, ?, ?, ?)', [itemId, itemName, listId, loggedInUserId], err => {
            if (err) throw err;
            console.log('Item inserted into database.');
            res.redirect('board');
        });
    })
    .patch(isUserAuthenticated, (req, res) => {
        const updatedItemDescription = req.body.updatedItem;
        const editedItemId = req.body.editedItemId;
        const completedItemId = req.body.completedItemId;

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
    })
    .delete(isUserAuthenticated, (req, res) => {
        const deletedItemId = req.body.deletedItemId;

        db.connection.query('DELETE FROM Items WHERE itemId=?', deletedItemId, err => {
            if (err) throw err;
            console.log('Item deleted from database.');
        });
    });

// List routes
app.route('/lists')
    .post(isUserAuthenticated, (req, res) => {
        const listName = req.body.listName;
        const boardId = req.body.boardId;
        const loggedInUser = req.user.id;
        const listId = nanoid();

        db.connection.query('INSERT INTO Lists (listID, listName, userID, boardId) VALUES (?, ?, ?, ?)', [listId, listName, loggedInUser, boardId], (err) => {
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
        console.log('entered deleted route');

        const listId = req.body.listId;
        db.connection.beginTransaction(function (err) {
            if (err) { throw err; }
            db.connection.query('DELETE FROM Items Where listID=?', listId, function (error) {
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
                        console.log('List removed along with items');
                    });
                });
            });
            res.redirect('/board');
        });
    });

app.route('/study-session')
    .post(isUserAuthenticated, (req, res) => {
        const studySessionId = req.body.sessionId;
        const sessionDuration = 3600 * req.body.hours + 60 * req.body.minutes;
        const loggedInUser = req.user.id;
        const boardId = req.body.boardId;

        db.connection.query('INSERT INTO StudySessions (sessionID, sessionDuration, userID, boardID) VALUES (?, ?, ?, ?)', [studySessionId, sessionDuration, loggedInUser, boardId], (err, result) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log('Study session created');
        });
    });

app.route('/study-session/:studySessionId')
    .get(isUserAuthenticated, (req, res) => {
        db.connection.query('SELECT * FROM ITEMS WHERE isOnTargetList=1 ORDER BY createdAt', (err, items) => {
            if (err) {
                console.log(err);
                throw err;
            }
            res.render('pages/study-session', { items: items });
            return;
        });
    });

app.route('/data')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.user.id;

        db.connection.query(`
        SELECT Boards.boardName, COUNT(*) as itemCount 
        FROM Items 
        INNER JOIN Boards 
        ON Items.boardID = Boards.boardID  
        WHERE Items.isItemCompleted=0 AND Items.userID=?
        GROUP BY Items.boardID
        ORDER BY itemCount DESC
        `, loggedInUser, (err, data) => {
            if (err) throw err;
            const boardNames = [];
            const itemCount = [];
            for (let i = 0; i < data.length; i++) {
                boardNames.push(data[i].boardName);
                itemCount.push(data[i].itemCount);
            }
            res.json({ boardNames: boardNames, itemCount: itemCount });
        });
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
