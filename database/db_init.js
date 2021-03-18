const mysql = require('mysql');

module.exports.connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD
});

module.exports.connection.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('Database successfully connected.');

    // creates database
    module.exports.connection.query('CREATE DATABASE IF NOT EXISTS myMetricsDB', (err, result) => {
        if (err) throw err;
        console.log('Database created: ' + result);
    });

    module.exports.connection.query('USE myMetricsDB', err => {
        if (err) throw err;
        console.log('myMetricsDB being used.');
    });

    //creates the user table
    module.exports.connection.query(
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
    module.exports.connection.query(
        `CREATE TABLE IF NOT EXISTS Boards (
            boardID CHAR(12) NOT NULL, 
            boardName CHAR(255) NOT NULL, 
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
            PRIMARY KEY (boardID), 
            FOREIGN KEY (userID) REFERENCES Users(userID))`,
        err => {
            if (err) throw err;
            console.log('Board table created.');
        });

    // Creates the todo lists table
    module.exports.connection.query(
        `CREATE TABLE IF NOT EXISTS TodoLists (
            todoListID INT NOT NULL AUTO_INCREMENT, 
            todoListDescription CHAR(255), 
            isTodoListDeleted BOOLEAN DEFAULT FALSE, 
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
            userID CHAR(255), PRIMARY KEY (todoListID), 
            FOREIGN KEY (userID) REFERENCES Users(userID), 
            FOREIGN KEY (boardID) REFERENCES Boards(boardID))`,
        err => {
            if (err) throw err;
            console.log('TodoLists table created.');
        });

    // Creates the todos table
    module.exports.connection.query(
        `CREATE TABLE IF NOT EXISTS Todos (
            todoID INT NOT NULL AUTO_INCREMENT, 
            todoDescription CHAR(255), 
            isTodoCompleted BOOLEAN DEFAULT FALSE,  
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
            userID CHAR(255), todoListID INT, PRIMARY KEY (todoID), 
            FOREIGN KEY (userID) REFERENCES Users(userID), 
            FOREIGN KEY (todoListID) REFERENCES TodoLists(todoListID), 
            FOREIGN KEY (boardID) REFERENCES Boards(boardID))`,
        err => {
            if (err) throw err;
            console.log('Todos table created.');
        });
});