import connection from '../database/db_init.js';

function findById(id, callback) {
    connection.query(
        'SELECT userID FROM Users WHERE userID=?, id',
        (err, results) => {
            if (err) throw err;
            const isUserFound = results.length === 1;

            if (!isUserFound) {
                console.log('User not found in db');
            } else {
                console.log('User found in db');
                return callback(null, results);
            }
        }
    );
}

export default findById;
