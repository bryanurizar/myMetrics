import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

pool.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('Database connection initiated.');
});

// // creates database
// pool.query('CREATE DATABASE IF NOT EXISTS myMetricsDB', (err) => {
//     if (err) throw err;
//     console.log('Database created successfully.');
// });

// pool.query('USE myMetricsDB', err => {
//     if (err) throw err;
//     console.log('Use myMetricsDB.');
// });

//creates the user table
pool.query(
    `CREATE TABLE IF NOT EXISTS Users (
            userID CHAR(255) NOT NULL,
            firstName CHAR(255) NOT NULL,
            lastName CHAR(255) NOT NULL,
            email CHAR(255) NOT NULL,
            userImage CHAR(255),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            PRIMARY KEY (userID))`,
    err => {
        if (err) throw err;
        console.log('User table created.');
    });

// Creates the board table
pool.query(
    `CREATE TABLE IF NOT EXISTS Boards (
            boardID CHAR(12) NOT NULL, 
            boardName CHAR(255) NOT NULL, 
            isBoardDeleted BOOLEAN DEFAULT FALSE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            boardPosition SERIAL NOT NULL,
            userID CHAR(255),
            PRIMARY KEY (boardID),
            FOREIGN KEY (userID) REFERENCES Users(userID))`,
    err => {
        if (err) throw err;
        console.log('Board table created.');
    });

// Creates the lists table
await pool.query(
    `CREATE TABLE IF NOT EXISTS Lists (
            listID CHAR(12) NOT NULL,
            listName CHAR(255),
            isListDeleted BOOLEAN DEFAULT FALSE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            listPosition SERIAL NOT NULL,
            userID CHAR(255),
            boardID CHAR(12) NOT NULL,
            PRIMARY KEY (listID),
            FOREIGN KEY (userID) REFERENCES Users(userID),
            FOREIGN KEY (boardID) REFERENCES Boards(boardID))`,
    err => {
        if (err) throw err;
        console.log('Lists table created.');
    });

// Creates the items table
await pool.query(
    `CREATE TABLE IF NOT EXISTS Items (
            itemID CHAR(12) NOT NULL,
            itemName CHAR(255),
            isItemDeleted BOOLEAN DEFAULT FALSE,
            isItemCompleted BOOLEAN DEFAULT FALSE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            isOnTargetList BOOLEAN DEFAULT FALSE,
            itemPosition SERIAL NOT NULL,
            userID CHAR(255),
            listID CHAR(12),
            boardID CHAR(12) NOT NULL,
            PRIMARY KEY (itemID),
            FOREIGN KEY (userID) REFERENCES Users(userID),
            FOREIGN KEY (listID) REFERENCES Lists(listID),
            FOREIGN KEY (boardID) REFERENCES Boards(boardID))`,
    err => {
        if (err) throw err;
        console.log('Items table created.');
    });

// Creates the study sessions
await pool.query(
    `CREATE TABLE IF NOT EXISTS StudySessions (
            sessionID CHAR(12) NOT NULL,
            sessionDuration INTEGER NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            userID CHAR(255),
            isSessionPageVisited CHAR(12) DEFAULT FALSE,
            boardID CHAR(12) NOT NULL,
            PRIMARY KEY(sessionID),
            FOREIGN KEY (boardID) REFERENCES Boards(boardID),
            FOREIGN KEY (userID) REFERENCES Users(userID))`,
    err => {
        if (err) throw err;
        console.log('Study Sessions table created.');
    });

// Creates the study session logs table
await pool.query(
    `CREATE TABLE IF NOT EXISTS StudySessionLogs (
            logID SERIAL NOT NULL,
            sessionDurationRemaining INTEGER NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            userAction CHAR(12) NOT NULL,
            sessionID CHAR(12) NOT NULL,
            userID CHAR(255),
            boardID CHAR(12) NOT NULL,
            PRIMARY KEY(logID),
            FOREIGN KEY (sessionID) REFERENCES StudySessions(sessionID),
            FOREIGN KEY (boardID) REFERENCES Boards(boardID),
            FOREIGN KEY (userID) REFERENCES Users(userID))`,
    err => {
        if (err) throw err;
        console.log('Study Session Logs table created.');
    });

export default pool;