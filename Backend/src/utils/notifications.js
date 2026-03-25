const { Notification } = require("../models/Notification");
const { getIO } = require("./socket");

function formatNotification(notification) {
  return {
    id: notification._id,
    type: notification.type,
    module: notification.module,
    title: notification.title,
    message: notification.message,
    linkPage: notification.linkPage,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    postId: notification.post || null,
    replyId: notification.reply || null,
    taskId: notification.task || null,
    resourceId: notification.resource || null,
  };
}

async function createNotification(payload) {
  const notification = await Notification.create(payload);
  const io = getIO();

  if (io) {
    io.to(`user:${payload.user}`).emit("notification:new", formatNotification(notification));
  }

  return notification;
}

module.exports = {
  createNotification,
  formatNotification,
};
