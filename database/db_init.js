import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql';

export const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD
});

connection.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('Database connection initiated.');

    // creates database
    connection.query('CREATE DATABASE IF NOT EXISTS myMetricsDB', (err) => {
        if (err) throw err;
        console.log('Database created successfully.');
    });

    connection.query('USE myMetricsDB', err => {
        if (err) throw err;
        console.log('Use myMetricsDB.');
    });

    //creates the user table
    connection.query(
        `CREATE TABLE IF NOT EXISTS Users (
            userID CHAR(255) NOT NULL,
            firstName CHAR(255) NOT NULL,
            lastName CHAR(255) NOT NULL,
            email CHAR(255) NOT NULL,
            userImage CHAR(255),
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (userID))`,
        err => {
            if (err) throw err;
            console.log('User table created.');
        });

    // Creates the board table
    connection.query(
        `CREATE TABLE IF NOT EXISTS Boards (
            boardID CHAR(12) NOT NULL, 
            boardName CHAR(255) NOT NULL, 
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            userID CHAR(255),
            PRIMARY KEY (boardID),
            FOREIGN KEY (userID) REFERENCES Users(userID))`,
        err => {
            if (err) throw err;
            console.log('Board table created.');
        });

    // Creates the lists table
    connection.query(
        `CREATE TABLE IF NOT EXISTS Lists (
            listID CHAR(12) NOT NULL,
            listName CHAR(255),
            isListDeleted BOOLEAN DEFAULT FALSE,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    connection.query(
        `CREATE TABLE IF NOT EXISTS Items (
            itemID CHAR(12) NOT NULL,
            itemName CHAR(255),
            isItemCompleted BOOLEAN DEFAULT FALSE,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            isOnTargetList BOOLEAN DEFAULT FALSE,
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
    connection.query(
        `CREATE TABLE IF NOT EXISTS StudySessions (
            sessionID CHAR(12) NOT NULL,
            sessionDuration INT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            userID CHAR(255),
            boardID CHAR(12) NOT NULL,
            PRIMARY KEY(sessionID),
            FOREIGN KEY (boardID) REFERENCES Boards(boardID),
            FOREIGN KEY (userID) REFERENCES Users(userID))`,
        err => {
            if (err) throw err;
            console.log('Study Sessions table created.');
        });

    // Creates the study session logs table
    connection.query(
        `CREATE TABLE IF NOT EXISTS StudySessionLogs (
            logID INT NOT NULL AUTO_INCREMENT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
});

