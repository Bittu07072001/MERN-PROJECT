exports.socketHandler = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      onlineUsers.set(userId.toString(), socket.id);
      io.emit('userOnline', userId);
    });

    socket.on('trackOrder', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('joinAdmin', () => {
      socket.join('admin');
    });

    // Real-time chat between buyer & seller
    socket.on('joinChat', ({ userId, receiverId }) => {
      const roomId = [userId, receiverId].sort().join('_');
      socket.join(`chat_${roomId}`);
    });

    socket.on('leaveChat', ({ userId, receiverId }) => {
      const roomId = [userId, receiverId].sort().join('_');
      socket.leave(`chat_${roomId}`);
    });

    socket.on('typing', ({ senderId, receiverId }) => {
      socket.to(`user_${receiverId}`).emit('typing', { senderId });
    });

    socket.on('stopTyping', ({ senderId, receiverId }) => {
      socket.to(`user_${receiverId}`).emit('stopTyping', { senderId });
    });

    socket.on('markRead', ({ conversationId, userId }) => {
      socket.to(`chat_${conversationId}`).emit('messagesRead', { conversationId, userId });
    });

    socket.on('disconnect', () => {
      onlineUsers.forEach((sid, uid) => {
        if (sid === socket.id) {
          onlineUsers.delete(uid);
          io.emit('userOffline', uid);
        }
      });
      console.log('❌ Socket disconnected:', socket.id);
    });
  });
};
