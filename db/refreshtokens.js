'use strict';

const jwt = require('jsonwebtoken');

/**
 * Tokens in-memory data structure which stores all of the refresh tokens
 */
let tokens = Object.create(null);

/**
 * Returns a refresh token if it finds one, otherwise returns null if one is not found.
 */
exports.find = (token) => {
  try {
    const id = jwt.decode(token).jti;
    return Promise.resolve(tokens[id]);
  } catch (error) {
    return Promise.resolve(undefined);
  }
};

/**
 * Saves a refresh token, user id, client id, and scope. Note: The actual full refresh token is
 * never saved.  Instead just the ID of the token is saved.  In case of a database breach this
 * prevents anyone from stealing the live tokens.
 */
exports.save = (token, userID, clientID, scope) => {
  const id = jwt.decode(token).jti;
  tokens[id] = { userID, clientID, scope };
  return Promise.resolve(tokens[id]);
};

/**
 * Deletes a refresh token
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
 * Removes all refresh tokens.
 */
exports.removeAll = () => {
  const deletedTokens = tokens;
  tokens              = Object.create(null);
  return Promise.resolve(deletedTokens);
};
