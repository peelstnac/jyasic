const express = require('express');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const { v4: uuidv4 } = require('uuid');

app.use(express.static(__dirname + '/public'));
server.listen(process.env.PORT || 3000);

app.get('/', (req, res) => {
    app.sendFile(__dirname + '/public/index.html');
});


