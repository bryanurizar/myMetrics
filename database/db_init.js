const mysql = require('mysql');

module.exports.connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

module.exports.connection.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('Database successfully connected.');

    // creates database
    module.exports.connection.query('CREATE DATABASE IF NOT EXISTS todoDB', (err, result) => {
        if (err) throw err;
        console.log('Database created: ' + result);
    });

    //creates the user table
    module.exports.connection.query('CREATE TABLE IF NOT EXISTS Users (userID INT NOT NULL AUTO_INCREMENT, firstName CHAR(255) NOT NULL, lastName CHAR(255) NOT NULL, email CHAR(255) NOT NULL, password CHAR(32) NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  PRIMARY KEY (userID))', err => {
        if (err) throw err;
        console.log('Table created.');
    });

    // Creates the todo lists table
    module.exports.connection.query('CREATE TABLE IF NOT EXISTS TodoLists (todoListID INT NOT NULL AUTO_INCREMENT, todoListDescription CHAR(255), isTodoListDeleted BOOLEAN DEFAULT FALSE, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, userID INT, PRIMARY KEY (todoListID), FOREIGN KEY (userID) REFERENCES Users(userID))', err => {
        if (err) throw err;
        console.log('Table created.');
    });

    // Creates the todos table
    module.exports.connection.query('CREATE TABLE IF NOT EXISTS Todos (todoID INT NOT NULL AUTO_INCREMENT, todoDescription CHAR(255), isTodoCompleted BOOLEAN DEFAULT FALSE,  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, userID INT, todoListID INT, PRIMARY KEY (todoID), FOREIGN KEY (userID) REFERENCES Users(userID), FOREIGN KEY (todoListID) REFERENCES TodoLists(todoListID))', err => {
        if (err) throw err;
        console.log('Table created.');
    });

    // // Creates the todos table
    // module.exports.connection.query('ALTER TABLE Todos ADD COLUMN isOnTargetList BOOLEAN DEFAULT FALSE AFTER isTodoCompleted', err => {
    //     if (err) throw err;
    //     console.log('Table created.');
    // });
});