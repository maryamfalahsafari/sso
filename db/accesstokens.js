'use strict';

const jwt = require('jsonwebtoken');
var redis = require("redis");
var client = redis.createClient(6379, 'localhost');

exports.find = (token, callback) => {
  const id = jwt.decode(token).jti;
  client.select(4, function (err, data) {
    if (err)
      callback(err, null);
    else {
      client.get(id, (err, data) => {
        console.log('find access token', data);
        if (err)
          callback(err, null);
        else callback(null, JSON.parse(data));
      });
    }
  });

};


exports.save = (token, expirationDate, userID, clientID, scope, callback) => {
  console.log('save access token');
  const id = jwt.decode(token).jti;
  client.select(4, function (err, data) {
    if (err)
      callback(err, null);
    else {
      client.set(id, JSON.stringify({ userID, expirationDate, clientID, scope }), (err, data) => {
        if (err)
          callback(err, null);
        else callback(null, data);
      });
    }
  });

};

/**
 * Deletes/Revokes an access token by getting the ID and removing it from the storage.
 */
exports.delete = (token) => {
  try {
    const id = jwt.decode(token).jti;
    const deletedToken = tokens[id];
    delete tokens[id];
    return Promise.resolve(deletedToken);
  } catch (error) {
    return Promise.resolve(undefined);
  }
};

/**
 * Removes expired access tokens. It does this by looping through them all and then removing the
 * expired ones it finds.
 */
exports.removeExpired = () => {
  const keys    = Object.keys(tokens);
  const expired = keys.reduce((accumulator, key) => {
    if (new Date() > tokens[key].expirationDate) {
      const expiredToken = tokens[key];
      delete tokens[key];
      accumulator[key] = expiredToken; // eslint-disable-line no-param-reassign
    }
    return accumulator;
  }, Object.create(null));
  return Promise.resolve(expired);
};

/**
 * Removes all access tokens.
 */
exports.removeAll = () => {
  const deletedTokens = tokens;
  tokens              = Object.create(null);
  return Promise.resolve(deletedTokens);
};
