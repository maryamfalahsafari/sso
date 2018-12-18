'use strict';
var redis = require("redis");
var client = redis.createClient(6379, 'localhost');


exports.find = (id, callback) => {
  client.select(6, function (err, data) {
    if (err)
      callback(err, null);
    else {
      client.get(id, (err, data) => {
        if (err)
          callback(err, null);
        else callback(null, JSON.parse(data));
      });
    }
  });
}

exports.findByClientId = (clientId, callback) => {
  client.select(5, function (err, data) {
    if (err)
      callback(err, null);
    else {
      client.get(clientId, (err, data) => {
        if (err)
          callback(err, null);
        else callback(null, JSON.parse(data));
      });
    }
  });
}
