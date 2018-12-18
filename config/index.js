'use strict';

exports.token = {
  expiresIn               : 60 * 60,
  calculateExpirationDate : () => new Date(Date.now() + (this.token.expiresIn * 1000)),
};

exports.refreshToken = {
  expiresIn : 52560000,
};


exports.db = {
  timeToCheckExpiredTokens : 3600,
};

exports.session = {
  maxAge : 3600000 * 24 * 7 * 52,
  secret : 'A Secret That Should Be Changed', // TODO: You need to change this secret to something that you choose for your secret
};
