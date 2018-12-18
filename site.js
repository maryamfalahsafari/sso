'use strict';

const login = require('connect-ensure-login');
const passport = require('passport');


exports.index = (req, res) => {

  res.render('index');

};

exports.loginForm = (req, res) => {
  res.render('login');
};

exports.login = [
  passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' }),
];

exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

exports.account = [
  login.ensureLoggedIn(),
  (req, res) => {
    res.render('account', { user: req.user });
  },
];
