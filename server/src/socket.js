module.exports = io => {
  io.on('connection', socket => {
    socket.on('create or join', roomId => {
      socket.leave(socket.room);
      socket.join(roomId);
      const numClients = io.sockets.adapter.rooms[roomId].length;
      console.log(`${numClients} clients connected in room ${roomId}`);
      if (numClients > 2) {
        // Trying to join a full room
        socket.leave(roomId);
        socket.emit('full room', roomId);
        return;
      }
      // const numClients = io.sockets.server.engine.clientsCount;
      if (numClients == 1) {
        socket.username = 'host';
        socket.emit('created', roomId);
        console.log('emitted create');
      } else {
        socket.username = 'client';
        socket.emit('joined', roomId);
      }
    });
    socket.on('ready', roomId => {
      console.log('ready ' + roomId);
      socket.to(roomId).emit('announce', {
        message: 'New client in the room'
      });
      socket.to(roomId).emit('ready', roomId);
    });
    socket.on('candidate', msg => {
      // console.log('candidate');
      socket.to(msg.roomId).emit('candidate', msg);
    });
    socket.on('offer', msg => {
      console.log('offer');
      socket.to(msg.roomId).emit('offer', msg.sdp);
    });
    socket.on('answer', msg => {
      console.log('answer');
      socket.to(msg.roomId).emit('answer', msg.sdp);
    });

    socket.on('send', msg => {
      console.log(msg);
      io.in(msg.roomId).emit('comment', {
        text: msg.text,
        userId: msg.userId
      });
    });

    socket.on('identity', msg => {
      console.log(msg.user.id + ' identified themselves');
      socket.to(msg.roomId).emit('identity', msg.user);
    });

    // Called when a user closes the connection
    socket.on('disconnecting', reason => {
      console.log(
        socket.username + ' disconnected from ' + Object.values(socket.rooms)[1]
      );
      // socket.to(Object.values(socket.rooms)[1]).emit('disconnect')
      io.in(Object.values(socket.rooms)[1]).emit('disconnect');
      console.log(reason);
      // socket.leave(socket.room)
    });
  });
};
