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
import ordinalSuffixOf from './helpers/ordinalSuffix.js';
import { Duration } from 'luxon';

const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(
    express.json({
        type: ['application/json', 'text/plain'],
    })
);

app.use(cors());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    findById(id, done);
});

app.route('/guest').get((req, res) => {
    req.session.guest = {
        id: '1',
        name: { givenName: 'Guest', familyName: 'Guest' },
    };
    res.redirect('/dashboard');
});

// Home route
app.route('/').get((req, res) => {
    const isUserLoggedIn = req.user;
    isUserLoggedIn ? res.redirect('/dashboard') : res.render('pages/landing');
});

// Auth routes
app.route('/login').get((req, res) => {
    const isGuestLoggedIn = req.session.guest;
    isGuestLoggedIn ? req.session.destroy() : null;

    const isUserLoggedIn = req.user;
    isUserLoggedIn ? res.redirect('/dashboard') : res.render('pages/login');
});

app.route('/auth/google').get(
    passport.authenticate('google', {
        Scope: ['userinfo.profile', 'userinfo.email'],
    })
);

app.route('/auth/google/callback').get(
    passport.authenticate('google', { failureredirect: '/login' }),
    function (req, res) {
        req.session.user = req.user;
        res.redirect('/dashboard');
    }
);

app.route('/logout').get((req, res) => {
    req.session.destroy(function (err) {
        if (err) throw err;
        res.redirect('/');
    });
});

// Dashboard route
app.route('/dashboard')
    .get(isUserAuthenticated, (req, res) => {
        let loggedInUserId;
        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        pool.query(
            'SELECT boardID, boardName, boardposition FROM Boards WHERE userID=$1 AND isBoardDeleted=FALSE ORDER BY boardposition',
            [loggedInUserId],
            (err, results) => {
                if (err) throw err;
                res.setHeader('Cache-Control', 'no-store');
                res.render('pages/dashboard', {
                    user: req.session.guest || req.user,
                    results: results.rows,
                });
            }
        );
    })
    .patch(isUserAuthenticated, (req, res) => {
        const boardData = req.body;
        boardData.forEach((board) => {
            pool.query(
                'UPDATE Boards SET boardposition=$1 WHERE boardId=$2',
                [board.boardRank, board.boardId],
                (err) => {
                    if (err) throw err;
                }
            );
        });
        res.end();
    });

// Board routes
app.route('/boards')
    .get(isUserAuthenticated, async (req, res) => {
        let loggedInUserId;
        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        pool.query(
            'SELECT boardName, boardId FROM Boards WHERE userid=$1 AND isBoardDeleted=false',
            [loggedInUserId],
            (err, result) => {
                if (err) throw err;
                res.send(result.rows);
            }
        );
    })
    .patch(isUserAuthenticated, (req, res) => {
        const listData = req.body;
        listData.forEach((list) => {
            pool.query(
                'UPDATE Lists SET listposition=$1 WHERE listId=$2',
                [list.listRank, list.listId],
                (err) => {
                    if (err) throw err;
                }
            );
        });
        res.end();
    })
    .post(isUserAuthenticated, (req, res) => {
        const newBoardId = nanoid();
        const newBoardName = req.body.newBoardName;
        const newBoardRank = req.body.newBoardRank;

        let loggedInUserId;
        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        pool.query(
            'INSERT INTO Boards (boardID, boardName, boardPosition, userID) VALUES($1, $2, $3, $4)',
            [newBoardId, newBoardName, newBoardRank, loggedInUserId],
            (err) => {
                if (err) throw err;
                console.log('New board inserted into Boards table');
                res.json({ newBoardId: newBoardId });
            }
        );
    });

app.route('/boards/:boardId/:boardName')
    .get(isUserAuthenticated, async (req, res) => {
        const currentBoardId = req.params.boardId;

        let loggedInUserId;
        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await client.query(
                'UPDATE Items SET isOnTargetList=FALSE WHERE userID=$1 AND isOnTargetList=True',
                [loggedInUserId]
            );

            const boardNames = await client.query(
                'SELECT * FROM BOARDS WHERE userID=$1 AND isBoardDeleted=False ORDER BY boardName',
                [loggedInUserId]
            );

            const lists = await client.query(
                'SELECT * FROM Lists WHERE userID=$1 AND boardID=$2 ORDER BY listPosition',
                [loggedInUserId, currentBoardId]
            );

            const items = await client.query(
                'SELECT * FROM Items WHERE isItemCompleted=FALSE AND userID=$1 ORDER BY itemposition',
                [loggedInUserId]
            );

            await client.query('COMMIT');
            res.setHeader('Cache-Control', 'no-store');
            res.render('pages/board', {
                currentBoardId: currentBoardId,
                boards: boardNames.rows,
                lists: lists.rows,
                items: items.rows,
            });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    })
    .patch(isUserAuthenticated, (req, res) => {
        const boardId = req.body.boardId;
        const updatedBoardName = req.body.updatedBoardName;

        if (!updatedBoardName) {
            pool.query(
                'UPDATE Boards SET isBoardDeleted=True WHERE BoardID=$1',
                [boardId],
                (err) => {
                    if (err) throw err;
                    console.log('Board marked as deleted');
                }
            );
        } else {
            pool.query(
                'UPDATE Boards SET boardName=$1 WHERE BoardID=$2',
                [updatedBoardName, boardId],
                (err) => {
                    if (err) throw err;
                    console.log('Board name updated');
                }
            );
        }
        res.json(res.statusCode);
    });

// Items routes
app.route('/items')
    .post(isUserAuthenticated, (req, res) => {
        let loggedInUserId;
        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        const itemName = req.body.itemName;
        const listId = req.body.listId;
        const itemId = nanoid();
        const boardId = req.body.boardId;

        pool.query(
            'INSERT INTO Items (itemID, itemName, listID, userID, boardID) VALUES ($1, $2, $3, $4, $5)',
            [itemId, itemName, listId, loggedInUserId, boardId],
            (err) => {
                if (err) throw err;
                console.log('Item inserted into database.');
                res.json({ itemId: itemId });
            }
        );
    })
    .patch(isUserAuthenticated, (req, res) => {
        const targetListItems = req.body;
        const studySessionId = nanoid();

        for (let i = 0; i < targetListItems.length; i++) {
            pool.query(
                'UPDATE Items SET isOnTargetList=True WHERE itemID=$1',
                [targetListItems[i]],
                (err) => {
                    if (err) throw err;
                }
            );
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
                pool.query(
                    'UPDATE Items SET isItemCompleted=True WHERE itemID=$1',
                    [completedItemId],
                    (err) => {
                        if (err) throw err;
                        console.log('Item updated from database.');
                    }
                );
                break;
            case !!editedItemId:
                pool.query(
                    'UPDATE Items SET itemName=$1 WHERE itemID=$2',
                    [updatedItemDescription, editedItemId],
                    (err) => {
                        if (err) throw err;
                        console.log('Item updated from database.');
                    }
                );
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

        pool.query(
            'DELETE FROM Items WHERE itemId=$1',
            [deletedItemId],
            (err) => {
                if (err) throw err;
                console.log('Item deleted from database.');
            }
        );
        res.send('Item deleted');
    });

async function updateRank(rankData) {
    const { previousCardId, movedCardId, nextCardId, dropListId } = rankData;
    const client = await pool.connect();
    const {
        rows: [{ itemposition: movedCardRank }],
    } = await client.query('SELECT itemposition FROM items WHERE itemid=$1', [
        movedCardId,
    ]);

    if (previousCardId && nextCardId) {
        try {
            const {
                rows: [{ itemposition: previousCardRank }],
            } = await client.query(
                'SELECT itemposition FROM items WHERE itemid=$1',
                [previousCardId]
            );
            const {
                rows: [{ itemposition: nextCardRank }],
            } = await client.query(
                'SELECT itemposition FROM items WHERE itemid=$1',
                [nextCardId]
            );

            if (movedCardRank < previousCardRank) {
                await client.query(
                    'UPDATE items SET itemposition=itemposition - 1 WHERE itemposition<=$1',
                    [previousCardRank]
                );
                await client.query(
                    'UPDATE items SET itemposition=$1 WHERE itemid=$2',
                    [previousCardRank, movedCardId]
                );
            } else if (movedCardRank > nextCardRank) {
                await client.query(
                    'UPDATE items SET itemposition=itemposition + 1 WHERE itemposition>=$1',
                    [nextCardRank]
                );
                await client.query(
                    'UPDATE items SET itemposition=$1 WHERE itemid=$2',
                    [nextCardRank, movedCardId]
                );
            }

            await client.query('UPDATE items SET listid=$1 WHERE itemid=$2', [
                dropListId,
                movedCardId,
            ]);
            await client.query('COMMIT');
        } catch (err) {
            if (err) throw err;
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    } else if (previousCardId) {
        try {
            await client.query('BEGIN');
            const {
                rows: [{ itemposition: previousCardRank }],
            } = await client.query(
                'SELECT itemposition FROM items WHERE itemid=$1',
                [previousCardId]
            );

            if (movedCardRank < previousCardRank) {
                await client.query(
                    'UPDATE items SET itemposition=itemposition - 1 WHERE itemposition <=$1',
                    [previousCardRank]
                );
                await client.query(
                    'UPDATE items SET itemposition=$1 WHERE itemid=$2',
                    [previousCardRank, movedCardId]
                );
            }

            await client.query('UPDATE items SET listid=$1 WHERE itemid=$2', [
                dropListId,
                movedCardId,
            ]);
            await client.query('COMMIT');
        } catch (err) {
            if (err) throw err;
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    } else if (nextCardId) {
        try {
            await client.query('BEGIN');
            const {
                rows: [{ itemposition: nextCardRank }],
            } = await client.query(
                'SELECT itemposition FROM items WHERE itemid=$1',
                [nextCardId]
            );

            if (movedCardRank > nextCardRank) {
                await client.query(
                    'UPDATE items SET itemposition=itemposition + 1 WHERE itemposition >=$1',
                    [nextCardRank]
                );
                await client.query(
                    'UPDATE items SET itemposition=$1 WHERE itemid=$2',
                    [nextCardRank, movedCardId]
                );
            }

            await client.query('UPDATE items SET listid=$1 WHERE itemid=$2', [
                dropListId,
                movedCardId,
            ]);
            await client.query('COMMIT');
        } catch (err) {
            if (err) throw err;
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    } else {
        try {
            await client.query('UPDATE items SET listid=$1 WHERE itemid=$2', [
                dropListId,
                movedCardId,
            ]);
            await client.query('COMMIT');
        } catch (err) {
            if (err) throw err;
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    }
}

app.route('/lists').post(isUserAuthenticated, (req, res) => {
    const listName = req.body.listName;
    const boardId = req.body.boardId;
    const listRank = req.body.listRank;
    const listId = nanoid();

    let loggedInUserId;
    req.session.guest
        ? (loggedInUserId = req.session.guest.id)
        : (loggedInUserId = req.user.id);

    pool.query(
        'INSERT INTO Lists (listID, listName, listposition, userID, boardId) VALUES ($1, $2, $3, $4, $5)',
        [listId, listName, listRank, loggedInUserId, boardId],
        (err) => {
            if (err) throw err;
            res.json({ listId: listId });
        }
    );
});

app.route('/lists/:listId')
    .post(isUserAuthenticated, (req, res) => {
        const newList = req.body.newList;

        let loggedInUserId;
        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        pool.query(
            'INSERT INTO Lists (listDescription, userID) VALUES ($1, $2)',
            [newList, loggedInUserId],
            (err) => {
                if (err) throw err;
                console.log('Item inserted into database.');
                res.redirect('board');
            }
        );
    })
    .patch(isUserAuthenticated, async (req, res) => {
        const loggedInUserId = req.user.id;
        const listId = req.body.id;
        const listName = req.body.name;
        const newBoardId = req.body.movedToBoardId;
        const movedListId = req.body.movedListId;

        if (movedListId) {
            const client = await pool.connect();
            await client.query('BEGIN');
            try {
                let lastListPosition = await client.query(
                    'SELECT listposition FROM Lists ORDER BY listposition DESC LIMIT 1'
                );

                lastListPosition = lastListPosition.rows[0].listposition;

                await client.query(
                    'UPDATE Items SET boardId=$1 WHERE listid=$2',
                    [newBoardId, movedListId]
                );
                await client.query(
                    'UPDATE Lists SET boardId=$1, listposition=$2 WHERE listid=$3',
                    [newBoardId, lastListPosition + 1, movedListId]
                );
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
            console.log('List moved to other board');
        }

        pool.query(
            'UPDATE Lists SET listName=$1 WHERE listId=$2 AND userID=$3',
            [listName, listId, loggedInUserId],
            (err) => {
                if (err) throw err;
                console.log('List name updated in database.');
                res.send('List name updated.');
            }
        );
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

app.route('/focus-session')
    .post(isUserAuthenticated, async (req, res) => {
        const studySessionId = req.body.sessionID;
        const sessionDuration = req.body.sessionDuration;
        const boardId = req.body.boardId;

        let loggedInUserId;
        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        pool.query(
            'INSERT INTO StudySessions (sessionID, sessionDuration, userID, boardID, isSessionPageVisited) VALUES ($1, $2, $3, $4, false) RETURNING *',
            [studySessionId, sessionDuration, loggedInUserId, boardId],
            (err, result) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
                console.log('Focus Session Page Created');
                res.json({ result: result.rows });
            }
        );
    })
    .patch(isUserAuthenticated, (req, res) => {
        const studySessionId = req.body.sessionId;
        const sessionDuration = Math.round(
            3600 * req.body.hours + 60 * req.body.minutes
        );
        const sessionDurationExtension = Math.round(
            3600 * req.body.extendHours + 60 * req.body.extendMinutes
        );

        if (sessionDurationExtension) {
            pool.query(
                'UPDATE StudySessions SET sessionDuration=sessionDuration+$1 WHERE sessionId=$2',
                [sessionDurationExtension, studySessionId],
                (err) => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                }
            );
        }

        if (sessionDuration) {
            pool.query(
                'UPDATE StudySessions SET sessionDuration=$1 WHERE sessionId=$2',
                [sessionDuration, studySessionId],
                (err) => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                    console.log('Focus Session Created');
                }
            );
        }

        res.json({});
    });

app.route('/focus-session/:studySessionId')
    .get(isUserAuthenticated, async (req, res) => {
        const studySessionId = req.params.studySessionId;
        let loggedInUserId;
        let isSessionPageVisited;

        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        try {
            pool.query(
                'SELECT * FROM StudySessions WHERE sessionID=$1',
                [studySessionId],
                (err, result) => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                    isSessionPageVisited = result.rows[0].issessionpagevisited;
                }
            );

            const targetItems = await pool.query(
                'SELECT * FROM ITEMS WHERE isOnTargetList=True AND userid=$1 ORDER BY createdAt',
                [loggedInUserId]
            );
            const status = {
                items: targetItems.rows,
                isSessionPageVisited: isSessionPageVisited,
            };
            res.setHeader('Cache-Control', 'no-store');

            await pool.query(
                'UPDATE StudySessions SET isSessionPageVisited=TRUE  WHERE sessionID=$1',
                [studySessionId]
            );
            res.render('pages/focus-session', { status: status });
        } catch (err) {
            console.error(err);
        }
    })
    .post(isUserAuthenticated, (req, res) => {
        const studySessionDuration =
            (req.body.hours || 0) * 3600 +
            (req.body.minutes || 0) * 60 +
            (req.body.seconds || 0) +
            (req.body.milliseconds || 0) / 1000;
        const boardId = req.body.boardId;
        const sessionId = req.params.studySessionId;
        const userAction = req.body.userAction;

        let loggedInUserId;
        req.session.guest
            ? (loggedInUserId = req.session.guest.id)
            : (loggedInUserId = req.user.id);

        pool.query(
            'INSERT INTO STUDYSESSIONLOGS (sessionDurationRemaining, userAction, sessionID, userID, boardID) VALUES ($1, $2, $3, $4, $5)',
            [
                studySessionDuration,
                userAction,
                sessionId,
                loggedInUserId,
                boardId,
            ],
            (err) => {
                if (err) throw err;
                console.log('User action added to study session log');
            }
        );
        res.json({});
    });

app.route('/analytics').get(isUserAuthenticated, (req, res) => {
    res.render('pages/analytics');
});

app.route('/profile').get(isUserAuthenticated, (req, res) => {
    res.render('pages/profile');
});

app.route('/itemCountChart').get(isUserAuthenticated, (req, res) => {
    let loggedInUserId;
    req.session.guest
        ? (loggedInUserId = req.session.guest.id)
        : (loggedInUserId = req.user.id);

    pool.query(
        `
        SELECT Boards.boardName, COUNT(*) as itemCount FROM Items 
        INNER JOIN Boards 
        ON Items.boardID = Boards.boardID  
        WHERE Items.isItemCompleted=FALSE AND Items.userID=$1 AND isBoardDeleted=FALSE
        GROUP BY boards.boardName
        ORDER BY itemCount DESC;
        `,
        [loggedInUserId],
        (err, data) => {
            if (err) throw err;
            const boardNames = [];
            const itemCount = [];
            const itemCountResults = data.rows;
            for (let i = 0; i < itemCountResults.length; i++) {
                boardNames.push(itemCountResults[i].boardname);
                itemCount.push(itemCountResults[i].itemcount);
            }
            res.json({ boardNames: boardNames, itemCount: itemCount });
        }
    );
});

app.route('/studyTimeByBoardsChart').get(isUserAuthenticated, (req, res) => {
    let loggedInUserId;
    req.session.guest
        ? (loggedInUserId = req.session.guest.id)
        : (loggedInUserId = req.user.id);

    pool.query(
        `
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
        `,
        [loggedInUserId],
        (err, data) => {
            if (err) throw err;
            const boardNames = [];
            const boardStudyTime = [];
            const boardsData = data.rows;
            boardsData.forEach((boardData) => {
                boardNames.push(boardData.boardname);
                boardStudyTime.push(boardData.boardstudytime / (60 * 60));
            });
            res.json({
                boardNames: boardNames,
                boardStudyTime: boardStudyTime,
            });
        }
    );
});

app.route('/daysSinceLastSession').get(isUserAuthenticated, (req, res) => {
    let loggedInUserId;
    req.session.guest
        ? (loggedInUserId = req.session.guest.id)
        : (loggedInUserId = req.user.id);

    pool.query(
        `
        SELECT T3.boardName, MAX(T3.createdAt) AS LastSessionDate FROM (
	        SELECT T1.*, T2.boardName, T2.isBoardDeleted FROM (
		        SELECT StudySessionLogs.LogId, StudySessionLogs.boardID, StudySessionLogs.createdAt FROM StudySessionLogs 
			    WHERE StudySessionLogs.userAction='Cancel' AND userID=$1) AS T1			
            JOIN Boards as T2
            ON T2.boardID = T1.boardID
            WHERE T2.isBoardDeleted=FALSE) AS T3
        GROUP BY T3.boardName
        ORDER BY T3.boardName;
        `,
        [loggedInUserId],
        (err, data) => {
            if (err) throw err;
            const boardNames = [];
            const daysSinceLastSession = [];
            const boardsData = data.rows;
            boardsData.forEach((boardData) => {
                const numberOfDays = Math.floor(
                    (Date.now() - boardData.lastsessiondate) /
                        (1000 * 3600 * 24)
                );
                boardNames.push(boardData.boardname);
                daysSinceLastSession.push(numberOfDays);
            });
            res.json({
                boardNames: boardNames,
                daysSinceLastSession: daysSinceLastSession,
            });
        }
    );
});

app.route('/pausesByBoards').get(isUserAuthenticated, (req, res) => {
    let loggedInUserId;
    req.session.guest
        ? (loggedInUserId = req.session.guest.id)
        : (loggedInUserId = req.user.id);

    pool.query(
        `
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
        `,
        [loggedInUserId],
        (err, data) => {
            if (err) throw err;

            const lastTenSessions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const pausesCount = [];
            const pauseCountByBoards = data.rows;
            pauseCountByBoards.forEach((pauseCountByBoard) => {
                pausesCount.push(pauseCountByBoard.pausecount);
            });
            res.json({
                lastTenSessions: lastTenSessions,
                pausesCount: pausesCount,
            });
        }
    );
});

app.route('/leaderboard').get(isUserAuthenticated, (req, res) => {
    let loggedInUserId;
    req.session.guest
        ? (loggedInUserId = req.session.guest.id)
        : (loggedInUserId = req.user.id);

    pool.query(
        `
        SELECT T6.*, T7.firstName, T7.lastName, T7.email, T7.userImage FROM (SELECT T5.userID, SUM(T5.TimeStudied) AS boardStudyTime FROM (
            SELECT T4.userID, T4.isBoardDeleted, T3.TimeStudied FROM (
                SELECT T1.*, T2.sessionDuration, (T2.sessionDuration - T1.sessionDurationRemaining) AS TimeStudied FROM (
                    SELECT * FROM StudySessionLogs 
                    WHERE StudySessionLogs.userAction='Cancel') AS T1
               LEFT JOIN StudySessions As T2
               ON T1.sessionID = T2.sessionId) AS T3
            INNER JOIN Boards AS T4
            ON T4.boardID = T3.boardID) AS T5
        GROUP BY T5.userID
        ORDER BY boardStudyTime DESC) AS T6
        INNER JOIN Users AS T7
        ON T6.userID = T7.userID
        ORDER BY boardStudyTime DESC;
    `,
        (err, results) => {
            if (err) throw err;
            let rank;

            const users = results.rows.map((user) => {
                return {
                    userid: user.userid,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    userimage: user.userimage,
                    boardstudytime: Duration.fromMillis(
                        user.boardstudytime * 1000
                    ).toFormat('hh:mm:ss'),
                };
            });

            if (users === []) {
                rank = 0;
            } else {
                const isUserFound = (user) => user.userid === loggedInUserId;
                rank = users.findIndex(isUserFound);
            }

            const userRank = ordinalSuffixOf(rank + 1);

            res.render('pages/leaderboard', {
                results: users,
                userRank: userRank,
            });
        }
    );
});

app.listen(port, () =>
    console.log(`Listening on port http://localhost:${port}.`)
);
