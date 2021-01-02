require('dotenv').config();
const express = require('express');
const db = require('./database/db_init');

//RSA private / public key generated
// const { generateKeyPairSync } = require('crypto');
// const { publicKey, privateKey } = generateKeyPairSync('rsa', {
//     modulusLength: 4096,
//     publicKeyEncoding: {
//         type: 'spki',
//         format: 'pem'
//     },
//     privateKeyEncoding: {
//         type: 'pkcs8',
//         format: 'pem',
//         cipher: 'aes-256-cbc',
//         passphrase: 'top secret'
//     }
// });

// console.log(publicKey);
// console.log(privateKey);

// JWT implementation
// const JwtStrategy = require('passport-jwt').Strategy;
// const ExtractJwt = require('passport-jwt').ExtractJwt;

// const opts = {
//     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//     secretOrKey: process.env.JWT_SECRET
// };

// passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
//     User.findOne({ id: jwt_payload.sub }, function (err, user) {
//         if (err) {
//             return done(err, false);
//         }
//         if (user) {
//             return done(null, user);
//         } else {
//             return done(null, false);
//             or you could create a new account
//         }
//     });
// }));

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}));
app.set('view engine', 'ejs');

app.route('/')
    .get((req, res) => {
        db.connection.query('SELECT todoDescription FROM Todos WHERE isTodoCompleted=0', (err, results) => {
            if (err) throw err;
            console.log('Todos read from database');
            res.render('home', { results: results });
        });
    })
    .post((req, res) => {
        const todoDescription = req.body.todoDescription;

        db.connection.query('INSERT INTO Todos (todoDescription) VALUES (?)', todoDescription, err => {
            if (err) throw err;
            console.log('Todo inserted into database.');
            res.redirect('/');
        });
    })
    .put((req, res) => {
        const originalTodo = req.body.originalTodo;
        const updatedTodo = req.body.updatedTodo;
        const completedTodo = req.body.completedTodo;

        if (completedTodo) {
            db.connection.query('UPDATE Todos SET isTodoCompleted=1 WHERE todoDescription=?', completedTodo, err => {
                if (err) throw err;
                console.log('Todo updated from database.');
            });

        } else {
            db.connection.query('UPDATE Todos SET todoDescription=? WHERE todoDescription=?', [updatedTodo, originalTodo], err => {
                if (err) throw err;
                console.log('Todo updated from database.');
            });
        }
        res.redirect(303, '/');
    })
    .delete((req, res) => {
        const todoDescription = req.body.todoDescription;

        db.connection.query('DELETE FROM Todos WHERE todoDescription=?', todoDescription, err => {
            if (err) throw err;
            console.log('Todo deleted from database.');
        });
        res.redirect(303, '/');
    });

app.route('/completed')
    .get((req, res) => {
        res.render('completed');
    });


app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        console.log(req.body);
        res.redirect('/');
    });

app.listen(port, () => console.log(`Listening on port ${port}.`));