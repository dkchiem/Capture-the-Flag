const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/home.html');
});

app.get('/party-select', (req, res) => {
  res.sendFile(__dirname + '/party-select.html');
});

app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/game.html');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  console.log('New client has connected with id:', socket.id);
  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} has disconnected`);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
