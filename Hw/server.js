var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var app = express();

app.use(function (req, res, next) {
    var log = `URL: ${req.url}, Time: ${new Date().toLocaleString()}\n`;
    fs.appendFile('logger.txt', log, function (err) {
        if (err) throw err;
    });
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/register', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/submit-register', function (req, res) {
    const { userId, password, confirmPassword, name, address, country, zipCode, email, sex, language, about } = req.body;

    if (password === confirmPassword) {
        const newUser = {
            userId,
            password,
            name,
            address,
            country,
            zipCode,
            email,
            sex,
            language: Array.isArray(language) ? language.join(', ') : language,
            about
        };

        fs.readFile('users.json', 'utf8', (err, data) => {
            if (err) {
                return res.redirect('/register?message=error');
            }

            const users = JSON.parse(data || "[]");
            const userExists = users.some(u => u.userId === userId || u.email === email);

            if (userExists) {
                res.redirect('/register?message=exists');
            } else {
                users.push(newUser);

                fs.writeFile('users.json', JSON.stringify(users, null, 2), err => {
                    if (err) throw err;
                    res.redirect('/register?message=success');
                });
            }
        });
    } else {
        res.redirect('/register?message=mismatch');
    }
});

app.get('/welcome', function (req, res) {
    const { login } = req.query;
    res.send(`Welcome, ${login}`);
});

app.post('/submit-login', function (req, res) {
    const { login, password } = req.body;

    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            return res.redirect('/login?message=error');
        }

        const users = JSON.parse(data || "[]");
        const user = users.find(u => u.userId === login && u.password === password);

        if (user) {
            res.redirect(`/welcome?login=${login}`);
        } else {
            res.redirect('/login?message=error');
        }
    });
});


app.use(function (req, res) {
    res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

app.listen(8080, function () {
    console.log('Server running on port 8080');
});
