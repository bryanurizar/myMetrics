import connection from '../database/db_init.js';

function findById(id, callback) {
    connection.query(
        'SELECT userID FROM Users WHERE userID=?, id',
        (err, results) => {
            console.log('in the findbyid functino');
            if (err) throw err;
            const isUserFound = results.length === 1;

            if (!isUserFound) {
                console.log('user not found in db');
            } else {
                console.log('user found in db');
                return callback(null, results);
            }
        }
    );
}

export default findById;
