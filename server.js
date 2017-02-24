'use strict';

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const staticFile = require('connect-static-file');
var users = [];

app.use('/index.js', staticFile(__dirname + '/assets/js/index.js'));
app.use('/index.css', staticFile(__dirname + '/assets/css/index.css'));

app.get('/', function(req, res) {
    res.sendfile('assets/html/chat.html');
});

io.on('connection', function(socket) {
    socket.join('chat');

    socket.on('setUsername', function(data) {
        var user = {
            id  : socket.id,
            name: data
        };
        if (users.indexOf(user.name) > -1 && user.name !== 'Anonymous') {
            socket.emit('userExists', 'Username: ' + user.name + ' already exists.');
        } else {
            users.push(user);
            socket.emit('userSet', {id: user.id, username: user.name});
            io.sockets.emit('updateUserList', users);
        }
    });

    socket.on('msg', function(data) {
        io.sockets.emit('newmsg', data);
    });

    socket.on('updateName', function(data) {
        users.map(function(obj, index) {
            if (obj.name === data.old) {
                obj.name = data.new;
            }
        }).filter(isFinite)[0];
        io.sockets.emit('updateUserList', users);
    });

    socket.on('exit', function(data) {
        socket.emit('updateUserList', users);

        var i = users.map(function(obj, index) {
            if (obj.id === data.id) {
                return index;
            }
        }).filter(isFinite)[0];
        users.splice(i, 1);
        setTimeout( function() {
            io.sockets.emit('updateUserList', users);
            socket.disconnect();
        }, 500);
    });
});
http.listen(3000, function() {
  console.log('listening on localhost:3000');
});