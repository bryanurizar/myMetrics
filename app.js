import connection from './database/db_init.js';
import express from 'express';
const app = express();
import passportConfig from './config/passport.js';
passportConfig(app);
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import nanoid from './helpers/nanoid.js';
import passport from 'passport';
import findById from './helpers/findById.js';
import isUserAuthenticated from './helpers/isUserAuthenticated.js';

const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}));
app.use(cors());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    findById(id, done);
});

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
    .post((req, res) => {
        console.log(res);
    });

app.route('/auth/google')
    .get(passport.authenticate('google', { Scope: ['userinfo.profile', 'userinfo.email'] }));

app.route('/auth/google/callback')
    .get(passport.authenticate('google', { failureredirect: '/login' }),
        function (req, res) {
            req.session.user = req.user;
            res.redirect('/dashboard');
        });

app.route('/logout')
    .get((req, res) => {
        req.session.destroy(function (err) {
            if (err) throw err;
            res.redirect('/');
        });
    });

// Dashboard route
app.route('/dashboard')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;

        connection.query('SELECT boardID, boardName FROM Boards WHERE userID=? AND isBoardDeleted=FALSE ORDER BY createdAt', loggedInUserId, (err, results) => {
            if (err) throw err;
            res.setHeader('Cache-Control', 'no-store');
            res.render('pages/dashboard', { user: req.user, results: results });
        });
    });

// Board routes
app.route('/boards')
    .post(isUserAuthenticated, (req, res) => {
        const newBoardId = nanoid();
        const newBoardName = req.body.newBoardName;
        const loggedInUserId = req.user.id;

        connection.query('INSERT INTO Boards (boardID, boardName, userID) VALUES(?, ?, ?)', [newBoardId, newBoardName, loggedInUserId], (err) => {
            if (err) throw err;
            console.log('New board inserted into Boards table');
            res.json({ newBoardId: newBoardId });
        });
    });

app.route('/boards/:boardId/:boardName')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;
        const boardID = req.params.boardId;

        connection.query('UPDATE Items SET isOnTargetList=? WHERE userID=? AND isOnTargetList=1', [0, loggedInUserId], (err, result) => {
            if (err) throw err;
            console.log('Target list reset.');
        });

        connection.query('SELECT * FROM Lists WHERE userID=? AND boardID=? ORDER BY createdAt', [loggedInUserId, boardID], (err, lists) => {
            if (err) throw err;

            connection.query('SELECT * FROM Items WHERE isItemCompleted=0 AND userID=? ORDER BY createdAt', loggedInUserId, (err, items) => {
                if (err) throw err;
                res.render('pages/board', { lists: lists, items: items });
            });
        });
    })
    .patch(isUserAuthenticated, (req, res) => {
        const boardId = req.body.boardId;
        connection.query('UPDATE Boards SET isBoardDeleted=True WHERE BoardID=?', boardId, (err, result) => {
            if (err) throw err;
            console.log('Board marked as deleted');
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

        connection.query('INSERT INTO Items (itemID, itemName, listID, userID, boardID) VALUES (?, ?, ?, ?, ?)', [itemId, itemName, listId, loggedInUserId, boardId], (err) => {
            if (err) throw err;
            console.log('Item inserted into database.');
            res.json({ itemId: itemId });
        });
    })
    .patch(isUserAuthenticated, (req, res) => {
        const targetListItems = req.body;
        const studySessionId = nanoid();

        for (let i = 0; i < targetListItems.length; i++) {
            connection.query('UPDATE Items SET isOnTargetList=1 WHERE itemID=?', targetListItems[i], err => {
                if (err) throw err;
            });
        }
        res.json({ studySessionId: studySessionId });
        console.log('TargetList updated in database');
    });

app.route('/items/:itemId')

    .patch(isUserAuthenticated, (req, res) => {
        const updatedItemDescription = req.body.updatedItem;
        const editedItemId = req.body.editedItemId;
        const completedItemId = req.body.completedItemId;

        if (completedItemId) {
            connection.query('UPDATE Items SET isItemCompleted=1 WHERE itemID=?', completedItemId, err => {
                if (err) throw err;
                console.log('Item updated from database.');
            });
        } else {
            connection.query('UPDATE Items SET itemName=? WHERE itemID=?', [updatedItemDescription, editedItemId], err => {
                if (err) throw err;
                console.log('Item updated from database.');
            });
        }
    })
    .delete(isUserAuthenticated, (req, res) => {
        const deletedItemId = req.body.deletedItemId;

        connection.query('DELETE FROM Items WHERE itemId=?', deletedItemId, err => {
            if (err) throw err;
            console.log('Item deleted from database.');
        });
        res.send('Item deleted');
    });

// List routes
app.route('/lists')
    .post(isUserAuthenticated, (req, res) => {
        const listName = req.body.listName;
        const boardId = req.body.boardId;
        const loggedInUser = req.user.id;
        const listId = nanoid();

        connection.query('INSERT INTO Lists (listID, listName, userID, boardId) VALUES (?, ?, ?, ?)', [listId, listName, loggedInUser, boardId], (err) => {
            if (err) throw err;
            res.json({ listId: listId });
        });
    });

app.route('/lists/:listId')
    .post(isUserAuthenticated, (req, res) => {
        const newList = req.body.newList;
        const loggedInUser = req.user.id;

        connection.query('INSERT INTO Lists (listDescription, userID) VALUES (?, ?)', [newList, loggedInUser], err => {
            if (err) throw err;
            console.log('Item inserted into database.');
            res.redirect('board');
        });
    })
    .delete(isUserAuthenticated, (req, res) => {
        const listId = req.body.listId;
        connection.beginTransaction(function (err) {
            if (err) { throw err; }
            connection.query('DELETE FROM Items Where listID=?', listId, function (error) {
                if (error) {
                    return connection.rollback(function () {
                        throw error;
                    });
                }
                connection.query('DELETE FROM Lists WHERE listID=?', listId, function (error) {
                    if (error) {
                        return connection.rollback(function () {
                            throw error;
                        });
                    }
                    connection.commit(function (err) {
                        if (err) {
                            return connection.rollback(function () {
                                throw err;
                            });
                        }
                        console.log('List removed along with items');
                    });
                });
            });
        });
        res.json({});
    });

app.route('/study-session')
    .post(isUserAuthenticated, (req, res) => {
        const studySessionId = req.body.sessionID;
        const sessionDuration = req.body.sessionDuration;
        const loggedInUser = req.user.id;
        const boardId = req.body.boardId;

        connection.query('INSERT INTO StudySessions (sessionID, sessionDuration, userID, boardID) VALUES (?, ?, ?, ?)', [studySessionId, sessionDuration, loggedInUser, boardId], (err, result) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log('Study session created');
            res.json({});
        });
    })
    .patch(isUserAuthenticated, (req, res) => {
        const studySessionId = req.body.sessionId;
        const sessionDuration = 3600 * req.body.hours + 60 * req.body.minutes;

        connection.query('UPDATE StudySessions SET sessionDuration=? WHERE sessionId=?', [sessionDuration, studySessionId], (err, result) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log('Study session created');
        });
    });

app.route('/study-session/:studySessionId')
    .get(isUserAuthenticated, (req, res) => {
        const studySessionId = req.params.studySessionId;
        let isSessionPageVisited;

        connection.query('SELECT * FROM StudySessions WHERE sessionID=?', studySessionId, (err, result) => {
            if (err) throw err;
            isSessionPageVisited = result[0].isSessionPageVisited;
        });

        connection.query('SELECT * FROM ITEMS WHERE isOnTargetList=1 ORDER BY createdAt', (err, items) => {
            if (err) {
                throw err;
            }
            const status = {
                items: items,
                isSessionPageVisited: isSessionPageVisited
            };
            res.setHeader('Cache-Control', 'no-store');
            res.render('pages/study-session', status);
        });

        connection.query('UPDATE StudySessions SET isSessionPageVisited="Yes" WHERE sessionID=?', studySessionId, (err, result) => {
            if (err) throw err;
            isSessionPageVisited = 'Yes';
            console.log('isSessionPageVisited property updated.');
        });
    })
    .post(isUserAuthenticated, (req, res) => {
        console.log(req.body);
        const studySessionDuration = (req.body.hours || 0) * 3600 + (req.body.minutes || 0) * 60 + (req.body.seconds || 0) + (req.body.milliseconds || 0) / 1000;
        console.log(studySessionDuration);
        const boardId = req.body.boardId;
        const sessionId = req.params.studySessionId;
        const userAction = req.body.userAction;
        const loggedInUser = req.user.id;

        connection.query('INSERT INTO STUDYSESSIONLOGS (sessionDurationRemaining, userAction, sessionID, userID, boardID) VALUES (?, ?, ?, ?, ?)', [studySessionDuration, userAction, sessionId, loggedInUser, boardId, sessionId], (err, result) => {
            if (err) throw err;
            console.log('User action added to study session log');
        });
    });

app.route('/analytics')
    .get(isUserAuthenticated, (req, res) => {
        res.render('pages/analytics');
    });

app.route('/leaderboard')
    .get(isUserAuthenticated, (req, res) => {
        res.render('pages/leaderboard');
    });

app.route('/profile')
    .get(isUserAuthenticated, (req, res) => {
        res.render('pages/profile');
    });

app.route('/itemCountChart')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.user.id;

        connection.query(`
        SELECT Boards.boardName, COUNT(*) as itemCount 
        FROM Items 
        INNER JOIN Boards 
        ON Items.boardID = Boards.boardID  
        WHERE Items.isItemCompleted=0 AND Items.userID=? AND isBoardDeleted=FALSE
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

app.route('/studyTimeByBoardsChart')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.user.id;

        connection.query(`
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

app.listen(port, () => console.log(`Listening on port http://localhost:${port}.`));
