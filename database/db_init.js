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

    module.exports.connection.query('CREATE DATABASE IF NOT EXISTS todoDB', (err, result) => {
        if (err) throw err;
        console.log('Database created: ' + result);
    });

    module.exports.connection.query('CREATE TABLE IF NOT EXISTS todos (id INT AUTO_INCREMENT PRIMARY KEY, todo CHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)', err => {
        if (err) throw err;
        console.log('Table created.');
    });
});