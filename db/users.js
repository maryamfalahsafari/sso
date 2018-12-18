'use strict';

const users = [{
  id: '1',
  username: 'bob',
  password: 'secret',
  name: 'Bob Smith',
}, {
  id: '2',
  username: 'joe',
  password: 'password',
  name: 'Joe Davis',
}];


exports.find = (id, callback) => {
  callback(null, users[0]);
};


exports.findByUsername = username =>
  Promise.resolve(users.find(user => user.username === username));
