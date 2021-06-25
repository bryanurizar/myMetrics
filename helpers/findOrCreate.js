import connection from '../database/db_init.js';

function findOrCreate(profile, callback) {
    connection.query('SELECT userID FROM Users WHERE userID=?', profile.id, (err, results) => {
        if (err) throw err;

        const isUserFound = results.length === 1;

        if (!isUserFound) {
            connection.query('INSERT INTO Users (userID, firstName, lastName, email, userImage) VALUES(?, ?, ?, ?, ?)', [profile.id, profile.name.givenName, profile.name.familyName, profile.emails[0].value, profile.photos[0].value], (err) => {
                if (err) throw err;
                return callback(null, profile);
            });
        }
        return callback(null, profile);
    });
}

export default findOrCreate;