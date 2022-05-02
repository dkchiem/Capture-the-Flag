const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const path = require('path');

let parties = [
  { id: 123456, players: ['123456', '123456'] },
  { id: 123457, players: ['123456', '123456'] },
];

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('pages/home');
});

app.get('/game', (req, res) => {
  res.render('pages/index', { parties });
});

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  console.log('New client has connected with id:', socket.id);

  socket.on('newPlayer', (player) => {
    console.log('New player:', player);
    socket.broadcast.emit('newPlayer', player);
  });

  socket.on('createRoom', (room) => {
    const roomID = Math.floor(100000 + Math.random() * 900000).toString();
    socket.join(room);
    console.log(socket);
    parties.push({ id: roomID, players: [socket.id] });
  });

  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} has disconnected`);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
