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

//creates the user table
pool.query(
    `CREATE TABLE IF NOT EXISTS users (
                userID VARCHAR(255) NOT NULL,
                firstName VARCHAR(255) NOT NULL,
                lastName VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                userImage VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                PRIMARY KEY (userID))`,
    err => {
        if (err) throw err;
        console.log('User table created.');
    });

// Creates the board table
pool.query(
    `CREATE TABLE IF NOT EXISTS boards (
                boardID VARCHAR(12) NOT NULL, 
                boardName VARCHAR(255) NOT NULL, 
                isBoardDeleted BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                boardPosition SERIAL NOT NULL,
                userID VARCHAR(255),
                PRIMARY KEY (boardID),
                FOREIGN KEY (userID) REFERENCES users(userID))`,
    err => {
        if (err) throw err;
        console.log('Board table created.');
    });

// Creates the lists table
pool.query(
    `CREATE TABLE IF NOT EXISTS lists (
                listID VARCHAR(12) NOT NULL,
                listName VARCHAR(255),
                isListDeleted BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                listPosition SERIAL NOT NULL,
                userID VARCHAR(255),
                boardID VARCHAR(12) NOT NULL,
                PRIMARY KEY (listID),
                FOREIGN KEY (userID) REFERENCES users(userID),
                FOREIGN KEY (boardID) REFERENCES boards(boardID))`,
    err => {
        if (err) throw err;
        console.log('Lists table created.');
    });

// Creates the items table
pool.query(
    `CREATE TABLE IF NOT EXISTS items (
                itemID VARCHAR(12) NOT NULL,
                itemName VARCHAR(255),
                isItemDeleted BOOLEAN DEFAULT FALSE,
                isItemCompleted BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                isOnTargetList BOOLEAN DEFAULT FALSE,
                itemPosition SERIAL NOT NULL,
                userID VARCHAR(255),
                listID VARCHAR(12),
                boardID VARCHAR(12) NOT NULL,
                PRIMARY KEY (itemID),
                FOREIGN KEY (userID) REFERENCES users(userID),
                FOREIGN KEY (listID) REFERENCES lists(listID),
                FOREIGN KEY (boardID) REFERENCES boards(boardID))`,
    err => {
        if (err) throw err;
        console.log('Items table created.');
    });

// Creates the study sessions
pool.query(
    `CREATE TABLE IF NOT EXISTS studysessions (
                sessionID VARCHAR(12) NOT NULL,
                sessionDuration INTEGER NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                userID VARCHAR(255),
                isSessionPageVisited VARCHAR(12) DEFAULT FALSE,
                boardID VARCHAR(12) NOT NULL,
                PRIMARY KEY(sessionID),
                FOREIGN KEY (boardID) REFERENCES boards(boardID),
                FOREIGN KEY (userID) REFERENCES users(userID))`,
    err => {
        if (err) throw err;
        console.log('Study Sessions table created.');
    });

// Creates the study session logs table
pool.query(
    `CREATE TABLE IF NOT EXISTS studysessionlogs (
                logID SERIAL NOT NULL,
                sessionDurationRemaining INTEGER NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                userAction VARCHAR(12) NOT NULL,
                sessionID VARCHAR(12) NOT NULL,
                userID VARCHAR(255),
                boardID VARCHAR(12) NOT NULL,
                PRIMARY KEY(logID),
                FOREIGN KEY (sessionID) REFERENCES studysessions(sessionID),
                FOREIGN KEY (boardID) REFERENCES boards(boardID),
                FOREIGN KEY (userID) REFERENCES users(userID))`,
    err => {
        if (err) throw err;
        console.log('Study Session Logs table created.');
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


export default pool;