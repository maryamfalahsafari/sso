'use strict';


const config = require('./config');
const db = require('./db');
const login = require('connect-ensure-login');
const oauth2orize = require('oauth2orize');
const passport = require('passport');
const utils = require('./utils');
const validate = require('./validate');

// create OAuth 2.0 server
const server = oauth2orize.createServer();

const expiresIn = { expires_in: config.token.expiresIn };


server.grant(oauth2orize.grant.token((client, user, ares, done) => {
  const token = utils.createToken({ sub: user.id, exp: config.token.expiresIn });
  const expiration = config.token.calculateExpirationDate();

  db.accessTokens.save(token, expiration, user.id, client.id, client.scope, (err, data) => {
    if (err)
      done(err);
    else done(null, token, expiresIn);

  })
}));


server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
  db.users.findByUsername(username)
    .then(user => validate.user(user, password))
    .then(user => validate.generateTokens({ scope, userID: user.id, clientID: client.id }))
    .then((tokens) => {
      if (tokens === false) {
        return done(null, false);
      }
      if (tokens.length === 1) {
        return done(null, tokens[0], null, expiresIn);
      }
      if (tokens.length === 2) {
        return done(null, tokens[0], tokens[1], expiresIn);
      }
      throw new Error('Error exchanging password for tokens');
    })
    .catch(() => done(null, false));
}));


server.exchange(oauth2orize.exchange.clientCredentials((client, scope, done) => {
  const token = utils.createToken({ sub: client.id, exp: config.token.expiresIn });
  const expiration = config.token.calculateExpirationDate();
  db.accessTokens.save(token, expiration, null, client.id, scope, (err, data) => {
    if (err)
      done(err);
    else done(null, token, null, expiresIn);

  });
}));

/**
 * Exchange the refresh token for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id from the token
 * request for verification.  If this value is validated, the application issues an access
 * token on behalf of the client who authorized the code
 */
server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, scope, done) => {
  db.refreshTokens.find(refreshToken)
    .then(foundRefreshToken => validate.refreshToken(foundRefreshToken, refreshToken, client))
    .then(foundRefreshToken => validate.generateToken(foundRefreshToken))
    .then(token => done(null, token, null, expiresIn))
    .catch(() => done(null, false));
}));


exports.authorization = [
  login.ensureLoggedIn(),
  server.authorization((clientID, redirectURI, scope, done) => {
    db.clients.findByClientId(clientID, (err, client) => {
      console.log('NNNNNNNNNNNNNNNNNNNNNNNNN', clientID)
      if (client) {
        client.scope = scope;
      }
      return done(null, client, redirectURI);
    });
  }), (req, res, next) => {
    db.clients.findByClientId(req.query.client_id, (err, client) => {
      if (err) {
        console.log('mmmmmmmmmmmmmmmmmmmmm', req.query.client_id);
        res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client })

      } else if (client != null && client.trustedClient && client.trustedClient === true) {
        server.decision({ loadTransaction: false }, (serverReq, callback) => {
          callback(null, { allow: true });
        })(req, res, next);
      } else {
        console.log('mmmmmmmmmmmmmmmmmmmdddddddmm', req.oauth2.client);

        res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
      }
    });
  }];


exports.decision = [
  login.ensureLoggedIn(),
  server.decision(),
];


exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler(),
];



server.serializeClient((client, done) => done(null, client.id));

server.deserializeClient((id, done) => {
  db.clients.find(id, (err, client) => {
    console.log(client);
    if (err)
      done(err);
    else {
      done(null, client)
    }
  });
});

