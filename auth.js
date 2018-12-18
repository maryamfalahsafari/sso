'use strict';

const db = require('./db');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { BasicStrategy } = require('passport-http');
const { Strategy: ClientPasswordStrategy } = require('passport-oauth2-client-password');
const { Strategy: BearerStrategy } = require('passport-http-bearer');
const validate = require('./validate');


passport.use(new LocalStrategy((username, password, done) => {
  db.users.findByUsername(username)
    .then(user => validate.user(user, password))
    .then(user => done(null, user))
    .catch(() => done(null, false));
}));


passport.use(new BasicStrategy((clientId, clientSecret, done) => {
  console.log('BasicStrategy', clientId);
  db.clients.findByClientId(clientId, (err, client) => {
    if (err)
      done(null, false);
    else {
      done(null, validate.client(client, clientSecret));
    }
  });
}));


passport.use(new ClientPasswordStrategy((clientId, clientSecret, done) => {
  console.log('ClientPasswordStrategy', clientId);

  db.clients.findByClientId(clientId, (err, client) => {
    if (err) {
      done(null, false)
    } else {
      done(null, validate.client(client, clientSecret))
    }
  });
}));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 *
 * To keep this example simple, restricted scopes are not implemented, and this is just for
 * illustrative purposes
 */
passport.use(new BearerStrategy((accessToken, done) => {
  console.log('BearerStrategy');
  db.accessTokens.find(accessToken, (err, token) => {
    if (err)
      done(null, false);
    else {
      validate.token(token, accessToken, (err, data) => {
        if (err)
          done(null, false);
        else done(null, data, { scope: '*' });
      })
    }
  });



}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.users.find(id, (err, user) => {
    if (err)
      done(err);
    else done(null, user)
  });
});
