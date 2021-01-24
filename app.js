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
    .get((_, res) => {
        res.render('landing');
    });

app.route('/dashboard')
    .get((_, res) => {
        res.render('pages/dashboard');
    });

app.route('/board')
    .get((_, res) => {
        db.connection.query('SELECT todoID, todoDescription FROM Todos WHERE isTodoCompleted=0', (err, results) => {
            if (err) throw err;
            console.log('Todos read from database');
            res.render('pages/board', { results: results });
        });
    })
    .post((req, res) => {
        const todoDescription = req.body.todoDescription;

        db.connection.query('INSERT INTO Todos (todoDescription) VALUES (?)', todoDescription, err => {
            if (err) throw err;
            console.log('Todo inserted into database.');
            res.redirect('pages/board');
        });
    })
    .put((req, res) => {
        const updatedTodo = req.body.updatedTodo;
        const completedTodoId = Number(req.body.compltedTodoId);
        const editedTodoId = Number(req.body.editedTodoId);

        if (completedTodoId) {
            db.connection.query('UPDATE Todos SET isTodoCompleted=1 WHERE todoID=?', completedTodoId, err => {
                if (err) throw err;
                console.log('Todo updated from database.');
            });
        } else {
            db.connection.query('UPDATE Todos SET todoDescription=? WHERE todoID=?', [updatedTodo, editedTodoId], err => {
                if (err) throw err;
                console.log('Todo updated from database.');
            });
        }
        res.redirect(303, 'pages/board');
    })
    .delete((req, res) => {
        const todoId = Number(req.body.id);

        db.connection.query('DELETE FROM Todos WHERE todoId=?', todoId, err => {
            if (err) throw err;
            console.log('Todo deleted from database.');
        });
        res.redirect(303, 'pages/board');
    });

app.route('/completed')
    .get((_, res) => {
        res.render('completed');
    });


app.route('/login')
    .get((_, res) => {
        res.render('login');
    })
    .post((req, res) => {
        console.log(req.body);
        res.redirect('/board');
    });

app.listen(port, () => console.log(`Listening on port ${port}.`));