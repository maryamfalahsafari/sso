'use strict';

const bodyParser     = require('body-parser');
const client         = require('./client');
const cookieParser   = require('cookie-parser');
const config         = require('./config');
const db             = require('./db');
const express        = require('express');
const expressSession = require('express-session');
const fs             = require('fs');
const https          = require('https');
const oauth2         = require('./oauth2');
const passport       = require('passport');
const path           = require('path');
const site           = require('./site');
const user           = require('./user');

var redis   = require("redis");
var redis_client  = redis.createClient();
var redisStore = require('connect-redis')(expressSession);

// Express configuration
const app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());

// Session Configuration
app.use(expressSession({
  saveUninitialized : true,
  resave            : true,
  secret            : config.session.secret,
  store             : new redisStore({ host: 'localhost', port: 6379, client: redis_client,ttl :  260}),
  key               : 'authorization.sid',
  cookie            : { maxAge: config.session.maxAge },
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./auth');

app.get('/',        site.index);
app.get('/login',   site.loginForm);
app.post('/login',  site.login);
app.get('/logout',  site.logout);
app.get('/account', site.account);

app.get('/dialog/authorize',           oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);
app.post('/oauth/token',               oauth2.token);

app.get('/api/userinfo',   user.info);
app.get('/api/clientinfo', client.info);

app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  if (err) {
    if (err.status == null) {
      console.error('Internal unexpected error from:', err.stack);
      res.status(500);
      res.json(err);
    } else {
      res.status(err.status);
      res.json(err);
    }
  } else {
    next();
  }
});

setInterval(() => {
  db.accessTokens.removeExpired()
  .catch(err => console.error('Error trying to remove expired tokens:', err.stack));
}, config.db.timeToCheckExpiredTokens * 1000);

// TODO: Change these for your own certificates.  This was generated through the commands:
// openssl genrsa -out privatekey.pem 2048
// openssl req -new -key privatekey.pem -out certrequest.csr
// openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
const options = {
  key  : fs.readFileSync(path.join(__dirname, 'certs/privatekey.pem')),
  cert : fs.readFileSync(path.join(__dirname, 'certs/certificate.pem')),
};

https.createServer(options, app).listen(3000);
console.log('OAuth 2.0 Authorization Server started on port 3000');
