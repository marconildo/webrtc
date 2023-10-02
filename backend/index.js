require('colors');

const express = require('express');
const http = require('http');
const IO = require('socket.io');

const config = require('./config');
const signallingServer = require("./src/server.js");

const app = express();
const server = http.createServer(app);

const io = IO(server, {
	cors: { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*" },
});
io.sockets.on("connection", signallingServer);

const listen = () => server.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`.green);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Specified port unavailable, retrying in 10 seconds...'.red);
    setTimeout(() => {
      server.close();
      server.listen(config.port);
    }, config.retryAfter);
  }
});

listen();