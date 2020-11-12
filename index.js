'use strict';

const client = require('./dist/client');
const dnsclient = require('./dist/dnsclient');
const context = require('./dist/context');
const numuri = require('./dist/numuri');

module.exports = {
  DoHResolver: dnsclient.DoHResolver,
  createDnsClient: dnsclient.createDnsClient,
  createClient: client.createClient,
  parseNumUri: numuri.parseNumUri,
  createDefaultCallbackHandler: client.createDefaultCallbackHandler,
  CallbackHandler: client.CallbackHandler,
  Location: dnsclient.Location
};
