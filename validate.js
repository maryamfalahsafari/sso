'use strict';

const config = require('./config');
const db = require('./db');
const utils = require('./utils');
const process = require('process');

const validate = Object.create(null);
const suppressTrace = process.env.OAUTHRECIPES_SURPRESS_TRACE === 'true';


validate.logAndThrow = (msg) => {
  if (!suppressTrace) {
    console.trace(msg);
  }
  throw new Error(msg);
};


validate.user = (user, password) => {
  validate.userExists(user);
  if (user.password !== password) {
    validate.logAndThrow('User password does not match');
  }
  return user;
};

validate.userExists = (user) => {
  if (user == null) {
    validate.logAndThrow('User does not exist');
  }
  return user;
};


validate.client = (client, clientSecret) => {
  validate.clientExists(client);
  if (client.clientSecret !== clientSecret) {
    validate.logAndThrow('Client secret does not match');
  }
  return client;
};


validate.clientExists = (client) => {
  if (client == null) {
    validate.logAndThrow('Client does not exist');
  }
  return client;
};

validate.token = (token, accessToken, callback) => {
  var temp = utils.verifyToken(accessToken);

  // token is a user token
  if (token.userID != null) {
    return db.users.find(token.userID, (err, user) => {
      callback(null, validate.userExists(user))
    });
  }
  // token is a client token
  return db.clients.find(token.clientID, (err, client) => {
    callback(null, validate.clientExists(client))

  })
};


validate.refreshToken = (token, refreshToken, client) => {
  utils.verifyToken(refreshToken);
  if (client.id !== token.clientID) {
    validate.logAndThrow('RefreshToken clientID does not match client id given');
  }
  return token;
};


validate.authCode = (code, authCode, client, redirectURI) => {
  utils.verifyToken(code);
  if (client.id !== authCode.clientID) {
    validate.logAndThrow('AuthCode clientID does not match client id given');
  }
  if (redirectURI !== authCode.redirectURI) {
    validate.logAndThrow('AuthCode redirectURI does not match redirectURI given');
  }
  return authCode;
};


validate.isRefreshToken = ({ scope }) => scope != null && scope.indexOf('offline_access') === 0;


validate.generateRefreshToken = ({ userId, clientID, scope }) => {
  const refreshToken = utils.createToken({ sub: userId, exp: config.refreshToken.expiresIn });
  return db.refreshTokens.save(refreshToken, userId, clientID, scope)
    .then(() => refreshToken);
};

validate.generateToken = ({ userID, clientID, scope }) => {
  const token = utils.createToken({ sub: userID, exp: config.token.expiresIn });
  const expiration = config.token.calculateExpirationDate();
  return db.accessTokens.save(token, expiration, userID, clientID, scope)
    .then(() => token);
};

validate.generateTokens = (authCode) => {
  if (validate.isRefreshToken(authCode)) {
    return Promise.all([
      validate.generateToken(authCode),
      validate.generateRefreshToken(authCode),
    ]);
  }
  return Promise.all([validate.generateToken(authCode)]);
};


validate.tokenForHttp = token =>
  new Promise((resolve, reject) => {
    try {
      utils.verifyToken(token);
    } catch (err) {
      const error = new Error('invalid_token');
      error.status = 400;
      reject(error);
    }
    resolve(token);
  });

validate.tokenExistsForHttp = (token) => {
  if (token == null) {
    const error = new Error('invalid_token');
    error.status = 400;
    throw error;
  }
  return token;
};



validate.clientExistsForHttp = (client) => {
  if (client == null) {
    const error = new Error('invalid_token');
    error.status = 400;
    throw error;
  }
  return client;
};

module.exports = validate;
