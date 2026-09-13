const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String }, // legacy direct-chat room key: user1_user2
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    content: { type: String, default: "" },
    text: String,
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    clientMessageId: { type: String, index: true },
    attachments: [{
      name: String,
      type: String,
      size: Number,
      data: String,
      url: String,
      _id: false,
    }],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, clientMessageId: 1 }, { unique: true, sparse: true });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1, group: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });
messageSchema.index({ recipients: 1, group: 1, isRead: 1 });

module.exports = mongoose.model("Message", messageSchema);
