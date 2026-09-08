const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true }, // user1_user2
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    clientMessageId: { type: String, index: true },
    attachments: [{
      name: String,
      type: String, // mimetype (image/jpeg, application/pdf, etc.)
      size: Number, // file size in bytes
      data: String, // base64 encoded file data
      url: String, // optional: URL if stored externally
      _id: false
    }],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate messages when client provides a stable clientMessageId
messageSchema.index({ sender: 1, receiver: 1, clientMessageId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Message", messageSchema);
