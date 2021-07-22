import pool from './database/db_init.js';
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
import faker from 'faker';
import ordinalSuffixOf from './helpers/ordinalSuffix.js';

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

        pool.query('SELECT boardID, boardName FROM Boards WHERE userID=$1 AND isBoardDeleted=FALSE ORDER BY createdAt', [loggedInUserId], (err, results) => {
            if (err) throw err;
            res.setHeader('Cache-Control', 'no-store');
            res.render('pages/dashboard', { user: req.user, results: results.rows });
        });
    });

// Board routes
app.route('/boards')
    .post(isUserAuthenticated, (req, res) => {
        const newBoardId = nanoid();
        const newBoardName = req.body.newBoardName;
        const loggedInUserId = req.user.id;

        pool.query('INSERT INTO Boards (boardID, boardName, userID) VALUES($1, $2, $3)', [newBoardId, newBoardName, loggedInUserId], (err) => {
            if (err) throw err;
            console.log('New board inserted into Boards table');
            res.json({ newBoardId: newBoardId });
        });
    });

app.route('/boards/:boardId/:boardName')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUserId = req.user.id;
        const boardID = req.params.boardId;

        pool.query('UPDATE Items SET isOnTargetList=FALSE WHERE userID=$1 AND isOnTargetList=True', [loggedInUserId], (err, result) => {
            if (err) throw err;
            console.log('Target list reset.');
        });

        pool.query('SELECT * FROM Lists WHERE userID=$1 AND boardID=$2 ORDER BY createdAt', [loggedInUserId, boardID], (err, lists) => {
            if (err) throw err;

            pool.query('SELECT * FROM Items WHERE isItemCompleted=FALSE AND userID=$1 ORDER BY itemposition', [loggedInUserId], (err, items) => {
                if (err) throw err;
                res.setHeader('Cache-Control', 'no-store');
                res.render('pages/board', { lists: lists.rows, items: items.rows });
            });
        });
    })
    .patch(isUserAuthenticated, (req, res) => {
        const boardId = req.body.boardId;

        pool.query('UPDATE Boards SET isBoardDeleted=True WHERE BoardID=$1', [boardId], (err, result) => {
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

        pool.query('INSERT INTO Items (itemID, itemName, listID, userID, boardID) VALUES ($1, $2, $3, $4, $5)', [itemId, itemName, listId, loggedInUserId, boardId], (err) => {
            if (err) throw err;
            console.log('Item inserted into database.');
            res.json({ itemId: itemId });
        });
    })
    .patch(isUserAuthenticated, (req, res) => {
        const targetListItems = req.body;
        const studySessionId = nanoid();

        for (let i = 0; i < targetListItems.length; i++) {
            pool.query('UPDATE Items SET isOnTargetList=True WHERE itemID=$1', [targetListItems[i]], err => {
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
        const rankData = req.body;

        switch (!undefined) {
            case !!completedItemId:
                pool.query('UPDATE Items SET isItemCompleted=True WHERE itemID=$1', [completedItemId], err => {
                    if (err) throw err;
                    console.log('Item updated from database.');
                });
                break;
            case !!editedItemId:
                pool.query('UPDATE Items SET itemName=$1 WHERE itemID=$2', [updatedItemDescription, editedItemId], err => {
                    if (err) throw err;
                    console.log('Item updated from database.');
                });
                break;
            case !!rankData:
                updateRank(rankData);
                break;
            default:
                console.log('No cases matched');
                break;
        }
        res.json(res.statusCode);
    })
    .delete(isUserAuthenticated, (req, res) => {
        const deletedItemId = req.body.deletedItemId;

        pool.query('DELETE FROM Items WHERE itemId=$1', [deletedItemId], err => {
            if (err) throw err;
            console.log('Item deleted from database.');
        });
        res.send('Item deleted');
    });

async function updateRank(rankData) {
    const { previousCardId, movedCardId, nextCardId } = rankData;
    const client = await pool.connect();
    const { rows: [{ itemposition: movedCardRank }] } = await client.query('SELECT itemposition FROM items WHERE itemid=$1', [movedCardId]);

    if (previousCardId && nextCardId) {
        try {
            const { rows: [{ itemposition: previousCardRank }] } = await client.query('SELECT itemposition FROM items WHERE itemid=$1', [previousCardId]);
            const { rows: [{ itemposition: nextCardRank }]
            } = await client.query('SELECT itemposition FROM items WHERE itemid=$1', [nextCardId]);
            const { rows: [{ listid: newListId }] } = await client.query('SELECT listid FROM items WHERE itemid=$1', [previousCardId]);

            if (movedCardRank < previousCardRank) {
                await client.query('UPDATE items SET itemposition=itemposition - 1 WHERE itemposition<=$1', [previousCardRank]);
                await client.query('UPDATE items SET itemposition=$1 WHERE itemid=$2', [previousCardRank, movedCardId]);

            } else if (movedCardRank > nextCardRank) {
                await client.query('UPDATE items SET itemposition=itemposition + 1 WHERE itemposition>=$1', [nextCardRank]);
                await client.query('UPDATE items SET itemposition=$1 WHERE itemid=$2', [nextCardRank, movedCardId]);
            }

            await client.query('UPDATE items SET listid=$1 WHERE itemid=$2', [newListId, movedCardId]);
            await client.query('COMMIT');
        }
        catch (err) {
            if (err) throw err;
            await client.query('ROLLBACK');
        }
        finally {
            client.release();
        }

    } else if (previousCardId) {

        try {
            await client.query('BEGIN');
            const { rows: [{ itemposition: previousCardRank }] } = await client.query('SELECT itemposition FROM items WHERE itemid=$1', [previousCardId]);
            const { rows: [{ listid: newListId }] } = await client.query('SELECT listid FROM items WHERE itemid=$1', [previousCardId]);

            if (movedCardRank < previousCardRank) {
                await client.query('UPDATE items SET itemposition=itemposition - 1 WHERE itemposition <=$1', [previousCardRank]);
                await client.query('UPDATE items SET itemposition=$1 WHERE itemid=$2', [previousCardRank, movedCardId]);
            }

            await client.query('UPDATE items SET listid=$1 WHERE itemid=$2', [newListId, movedCardId]);
            await client.query('COMMIT');
        } catch (err) {
            if (err) throw err;
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    } else {
        try {
            await client.query('BEGIN');
            const { rows: [{ itemposition: nextCardRank }] } = await client.query('SELECT itemposition FROM items WHERE itemid=$1', [nextCardId]);
            const { rows: [{ listid: newListId }] } = await client.query('SELECT listid FROM items WHERE itemid=$1', [nextCardId]);

            if (movedCardRank > nextCardRank) {
                await client.query('UPDATE items SET itemposition=itemposition + 1 WHERE itemposition >=$1', [nextCardRank]);
                await client.query('UPDATE items SET itemposition=$1 WHERE itemid=$2', [nextCardRank, movedCardId]);
            }

            await client.query('UPDATE items SET listid=$1 WHERE itemid=$2', [newListId, movedCardId]);
            await client.query('COMMIT');
        } catch (err) {
            if (err) throw err;
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }


    }
}

app.route('/lists')
    .post(isUserAuthenticated, (req, res) => {
        const listName = req.body.listName;
        const boardId = req.body.boardId;
        const loggedInUser = req.user.id;
        const listId = nanoid();

        pool.query('INSERT INTO Lists (listID, listName, userID, boardId) VALUES ($1, $2, $3, $4)', [listId, listName, loggedInUser, boardId], (err) => {
            if (err) throw err;
            res.json({ listId: listId });
        });
    });

app.route('/lists/:listId')
    .post(isUserAuthenticated, (req, res) => {
        const newList = req.body.newList;
        const loggedInUser = req.user.id;

        pool.query('INSERT INTO Lists (listDescription, userID) VALUES ($1, $2)', [newList, loggedInUser], err => {
            if (err) throw err;
            console.log('Item inserted into database.');
            res.redirect('board');
        });
    })
    .delete(isUserAuthenticated, async (req, res) => {
        const listId = req.body.listId;

        // Acquires a client from the pool
        const client = await pool.connect();

        // SQL transaction to delete a list and all its items
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM Items Where ListID=$1', [listId]);
            await client.query('DELETE FROM Lists WHERE listID=$1', [listId]);
            await client.query('COMMIT');
            console.log('Lists removed along with its items.');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            // Releases the acquired client
            client.release();
        }
        res.json({});
    });

app.route('/study-session')
    .post(isUserAuthenticated, (req, res) => {
        const studySessionId = req.body.sessionID;
        const sessionDuration = req.body.sessionDuration;
        const loggedInUser = req.user.id;
        const boardId = req.body.boardId;

        pool.query('INSERT INTO StudySessions (sessionID, sessionDuration, userID, boardID) VALUES ($1, $2, $3, $4)', [studySessionId, sessionDuration, loggedInUser, boardId], (err, result) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log('Study session created');
        });
        res.json({});
    })
    .patch(isUserAuthenticated, (req, res) => {
        const studySessionId = req.body.sessionId;
        const sessionDuration = 3600 * req.body.hours + 60 * req.body.minutes;

        pool.query('UPDATE StudySessions SET sessionDuration=$1 WHERE sessionId=$2', [sessionDuration, studySessionId], (err, result) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log('Study session created');
        });
        res.json({});
    });

app.route('/study-session/:studySessionId')
    .get(isUserAuthenticated, (req, res) => {
        const studySessionId = req.params.studySessionId;
        let isSessionPageVisited;

        pool.query('SELECT * FROM StudySessions WHERE sessionID=$1', [studySessionId], (err, result) => {
            if (err) throw err;
            isSessionPageVisited = result.rows[0].isSessionPageVisited;
        });

        pool.query('SELECT * FROM ITEMS WHERE isOnTargetList=True ORDER BY createdAt', (err, items) => {
            if (err) {
                throw err;
            }
            const status = {
                items: items.rows,
                isSessionPageVisited: isSessionPageVisited
            };
            res.setHeader('Cache-Control', 'no-store');
            res.render('pages/study-session', status);
        });

        pool.query('UPDATE StudySessions SET isSessionPageVisited=TRUE  WHERE sessionID=$1', [studySessionId], (err, result) => {
            if (err) throw err;
            isSessionPageVisited = true;
            console.log('isSessionPageVisited property updated.');
        });
    })
    .post(isUserAuthenticated, (req, res) => {
        const studySessionDuration = (req.body.hours || 0) * 3600 + (req.body.minutes || 0) * 60 + (req.body.seconds || 0) + (req.body.milliseconds || 0) / 1000;
        const boardId = req.body.boardId;
        const sessionId = req.params.studySessionId;
        const userAction = req.body.userAction;
        const loggedInUser = req.user.id;

        pool.query('INSERT INTO STUDYSESSIONLOGS (sessionDurationRemaining, userAction, sessionID, userID, boardID) VALUES ($1, $2, $3, $4, $5)', [studySessionDuration, userAction, sessionId, loggedInUser, boardId], (err, result) => {
            if (err) throw err;
            console.log('User action added to study session log');
        });
        res.json({});
    });

app.route('/analytics')
    .get(isUserAuthenticated, (req, res) => {
        res.render('pages/analytics');
    });

app.route('/profile')
    .get(isUserAuthenticated, (req, res) => {
        res.render('pages/profile');
    });

app.route('/itemCountChart')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.user.id;

        pool.query(`
        SELECT Boards.boardName, COUNT(*) as itemCount FROM Items 
        INNER JOIN Boards 
        ON Items.boardID = Boards.boardID  
        WHERE Items.isItemCompleted=FALSE AND Items.userID=$1 AND isBoardDeleted=FALSE
        GROUP BY boards.boardName
        ORDER BY Boards.boardName;
        `, [loggedInUser], (err, data) => {
            if (err) throw err;
            const boardNames = [];
            const itemCount = [];
            const itemCountResults = data.rows;
            for (let i = 0; i < itemCountResults.length; i++) {
                boardNames.push(itemCountResults[i].boardname);
                itemCount.push(itemCountResults[i].itemcount);
            }
            res.json({ boardNames: boardNames, itemCount: itemCount });
        });
    });

app.route('/studyTimeByBoardsChart')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.user.id;

        pool.query(`
        SELECT T5.boardName, SUM(T5.TimeStudied) AS boardStudyTime FROM (
            SELECT T4.boardName, T4.isBoardDeleted, T3.TimeStudied FROM (
                SELECT T1.*, T2.sessionDuration, (T2.sessionDuration - T1.sessionDurationRemaining) AS TimeStudied FROM (
                    SELECT * FROM StudySessionLogs 
                    WHERE StudySessionLogs.userAction='Cancel' AND userID=$1) AS T1
               LEFT JOIN StudySessions As T2
               ON T1.sessionID = T2.sessionId) AS T3
            INNER JOIN Boards AS T4
            ON T4.boardID = T3.boardID) AS T5
            WHERE T5.isBoardDeleted=FALSE
        GROUP BY T5.boardName
        ORDER BY T5.boardName;
        `, [loggedInUser], (err, data) => {
            if (err) throw err;
            const boardNames = [];
            const boardStudyTime = [];
            const boardsData = data.rows;
            boardsData.forEach(boardData => {
                boardNames.push(boardData.boardname);
                boardStudyTime.push(boardData.boardstudytime / (60 * 60));
            });
            res.json({ boardNames: boardNames, boardStudyTime: boardStudyTime });
        });
    });

app.route('/daysSinceLastSession')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.user.id;

        pool.query(`
        SELECT T3.boardName, MAX(T3.createdAt) AS LastSessionDate FROM (
	        SELECT T1.*, T2.boardName, T2.isBoardDeleted FROM (
		        SELECT StudySessionLogs.LogId, StudySessionLogs.boardID, StudySessionLogs.createdAt FROM StudySessionLogs 
			    WHERE StudySessionLogs.userAction='Cancel' AND userID=$1) AS T1			
            JOIN Boards as T2
            ON T2.boardID = T1.boardID
            WHERE T2.isBoardDeleted=FALSE) AS T3
        GROUP BY T3.boardName
        ORDER BY T3.boardName;
        `, [loggedInUser], (err, data) => {
            if (err) throw err;
            const boardNames = [];
            const daysSinceLastSession = [];
            const boardsData = data.rows;
            boardsData.forEach(boardData => {
                const numberOfDays = Math.floor((Date.now() - boardData.lastsessiondate) / (1000 * 3600 * 24));
                boardNames.push(boardData.boardname);
                daysSinceLastSession.push(numberOfDays);
            });
            res.json({ boardNames: boardNames, daysSinceLastSession: daysSinceLastSession });
        });
    });

app.route('/pausesByBoards')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.user.id;

        pool.query(`
        SELECT T3.SessionID, T3.pauseCount FROM (
            SELECT StudySessionLogs.SessionID, StudySessionLogs.userAction, T2.createdAt,
            COUNT(StudySessionLogs.userAction) AS pauseCount FROM StudySessionLogs
            INNER JOIN StudySessions AS T2
            ON StudySessionLogs.SessionID = T2.SessionID
            WHERE StudySessionLogs.userAction = 'Pause' AND StudySessionLogs.userID=$1
            GROUP BY StudySessionLogs.SessionID, StudySessionLogs.userAction, T2.createdAt
            ORDER BY createdAt DESC
            LIMIT 10) As T3
        ORDER BY T3.createdAt ASC
        `, [loggedInUser], (err, data) => {
            if (err) throw err;

            const lastTenSessions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const pausesCount = [];
            const pauseCountByBoards = data.rows;
            pauseCountByBoards.forEach(pauseCountByBoard => {
                pausesCount.push(pauseCountByBoard.pausecount);
            });
            res.json({ lastTenSessions: lastTenSessions, pausesCount: pausesCount });
        });
    });

app.route('/leaderboard')
    .get(isUserAuthenticated, (req, res) => {
        const loggedInUser = req.user.id;

        pool.query(`
        SELECT T6.*, T7.firstName, T7.lastName, T7.email, T7.userImage  FROM (SELECT T5.userID, SUM(T5.TimeStudied) AS boardStudyTime FROM (
            SELECT T4.userID, T4.isBoardDeleted, T3.TimeStudied FROM (
                SELECT T1.*, T2.sessionDuration, (T2.sessionDuration - T1.sessionDurationRemaining) AS TimeStudied FROM (
                    SELECT * FROM StudySessionLogs 
                    WHERE StudySessionLogs.userAction='Cancel') AS T1
               LEFT JOIN StudySessions As T2
               ON T1.sessionID = T2.sessionId) AS T3
            INNER JOIN Boards AS T4
            ON T4.boardID = T3.boardID) AS T5
            WHERE T5.isBoardDeleted=FALSE
        GROUP BY T5.userID
        ORDER BY boardStudyTime DESC) AS T6
        INNER JOIN Users AS T7
        ON T6.userID = T7.userID;
    `, (err, results) => {
            if (err) throw err;

            // // Generates fake data
            // results = [];
            // for (let i = 0; i < 100; i++) {
            //     const user = {
            //         userID: faker.datatype.uuid(),
            //         boardStudyTime: faker.datatype.number(),
            //         firstName: faker.name.firstName(),
            //         lastName: faker.name.lastName(),
            //         email: faker.internet.email(),
            //         userImage: faker.image.avatar()
            //     };
            //     results.push(user);
            // }

            // const myself = {
            //     userID: '12345',
            //     boardStudyTime: 459,
            //     firstName: 'John',
            //     lastName: 'Dude',
            //     email: 'john.dude@outlook.com',
            //     userImage: 'https://lh3.googleusercontent.com'
            // };
            // results.push(myself);
            // console.log(results);

            // function dynamicSort(property) {
            //     var sortOrder = 1;
            //     if (property[0] === '-') {
            //         sortOrder = -1;
            //         property = property.substr(1);
            //     }
            //     return function (a, b) {
            //         /* next line works with strings and numbers, 
            //          * and you may want to customize it to your needs
            //          */
            //         var result = (a[property] > b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            //         return result * sortOrder;
            //     };
            // }
            // results = results.sort(dynamicSort('boardStudyTime'));
            let rank;
            const users = results.rows;
            if (users === []) {
                rank = 0;
            } else {
                const isUserFound = user => user.userid === loggedInUser;
                rank = users.findIndex(isUserFound);
            }

            const userRank = ordinalSuffixOf(rank + 1);

            res.render('pages/leaderboard', { results: users, userRank: userRank });
        });
    });

app.listen(port, () => console.log(`Listening on port http://localhost:${port}.`));