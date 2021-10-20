import pool from '../database/db_init.js';

function findOrCreate(profile, callback) {
    pool.query(
        'SELECT userID FROM Users WHERE userID=$1',
        [profile.id],
        (err, results) => {
            if (err) throw err;

            const isUserFound = results.rowCount === 1;

            if (!isUserFound) {
                pool.query(
                    'INSERT INTO Users (userID, firstName, lastName, email, userImage) VALUES($1, $2, $3, $4, $5)',
                    [
                        profile.id,
                        profile.name.givenName,
                        profile.name.familyName,
                        profile.emails[0].value,
                        profile.photos[0].value,
                    ],
                    (err) => {
                        if (err) throw err;
                        return callback(null, profile);
                    }
                );
            }
            return callback(null, profile);
        }
    );
}

export default findOrCreate;
