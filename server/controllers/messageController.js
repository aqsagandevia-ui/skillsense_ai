const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");
const socketServer = require("../socket");

// Helper function to convert string to ObjectId
const toObjectId = (id) => {
  if (!id) return id;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text, attachments = [] } = req.body;
    
    // Create unique chatId for the conversation
    const chatId = [req.user.id, receiverId].sort().join("_");
    
    const message = new Message({
      chatId,
      sender: toObjectId(req.user.id),
      receiver: toObjectId(receiverId),
      text: text || "",
      attachments: attachments && attachments.length > 0 ? attachments : [],
      isRead: false
    });
    
    await message.save();
    
    // Populate sender info for the response
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name photo")
      .populate("receiver", "name photo");
    
    // Emit via socket if available so realtime clients receive the message
    try {
      const io = socketServer.getIO && socketServer.getIO();
      const roomId = [req.user.id, receiverId].sort().join("_");

      // Normalize populated message into a plain JS object with string ids
      const messageData = {
        _id: populatedMessage._id.toString(),
        sender: {
          _id: populatedMessage.sender._id.toString(),
          name: populatedMessage.sender.name,
          photo: populatedMessage.sender.photo
        },
        receiver: {
          _id: populatedMessage.receiver._id.toString(),
          name: populatedMessage.receiver.name,
          photo: populatedMessage.receiver.photo
        },
        text: populatedMessage.text,
        attachments: populatedMessage.attachments || [],
        createdAt: populatedMessage.createdAt,
        isRead: populatedMessage.isRead
      };

      if (io) {
        io.to(roomId).emit("receive_message", messageData);
        io.to(`user_${receiverId}`).emit("message_received", { from: req.user.id, message: messageData });
      }
    } catch (emitErr) {
      console.error("Error emitting message via socket:", emitErr.message);
    }

    res.json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get messages with a specific user
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { skip = 0, limit = 50 } = req.query;
    
    const chatId = [req.user.id, userId].sort().join("_");
    
    // Fetch messages with pagination
    const messages = await Message.find({ chatId })
      .populate("sender", "name photo")
      .populate("receiver", "name photo")
      .sort({ createdAt: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    // Mark messages as read (only the fetched messages to avoid N+1)
    if (messages.length > 0) {
      const messageIds = messages.map(m => m._id);
      
      await Message.updateMany(
        { _id: { $in: messageIds }, receiver: toObjectId(req.user.id), isRead: false },
        { isRead: true }
      );
    }
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all conversations (list of users the current user has chatted with)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = 50; // Limit conversations to prevent memory issues
    
    console.log('[GET CONVERSATIONS] Starting for user:', userId);
    
    if (!userId) {
      console.error('[GET CONVERSATIONS] Invalid userId:', userId);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Convert string userId to ObjectId
    const userObjectId = toObjectId(userId);
    
    // Use aggregation pipeline to efficiently get last message per conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userObjectId }, { receiver: userObjectId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $project: {
          text: 1,
          createdAt: 1,
          sender: 1,
          receiver: 1,
          otherUserId: {
            $cond: [
              { $eq: ["$sender", userObjectId] },
              "$receiver",
              "$sender"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$otherUserId",
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          otherUserId: { $first: "$otherUserId" }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: "users",
          localField: "otherUserId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 1,
          "user._id": 1,
          "user.name": 1,
          "user.photo": 1,
          "user.email": 1,
          "user.role": 1,
          "user.bio": 1,
          "user.skills": 1,
          "user.isOnline": 1,
          lastMessage: 1,
          lastMessageTime: 1
        }
      }
    ]);
    
    console.log('[GET CONVERSATIONS] Found conversations:', conversations.length);
    
    if (conversations.length === 0) {
      console.log('[GET CONVERSATIONS] No messages found, returning empty');
      return res.json([]);
    }
    
    // Get unread counts for each conversation in a single query
    const unreadData = await Message.aggregate([
      {
        $match: {
          receiver: userObjectId,
          isRead: false,
          sender: {
            $in: conversations.map(c => c._id)
          }
        }
      },
      {
        $group: {
          _id: "$sender",
          unreadCount: { $sum: 1 }
        }
      }
    ]);
    
    // Map unread counts by sender ID
    const unreadMap = {};
    unreadData.forEach(item => {
      unreadMap[item._id.toString()] = item.unreadCount;
    });
    
    // Add unread counts to conversations
    const result = conversations.map(conv => ({
      user: conv.user,
      lastMessage: conv.lastMessage || "(no text)",
      lastMessageTime: conv.lastMessageTime,
      unreadCount: unreadMap[conv._id.toString()] || 0
    }));
    
    console.log('[GET CONVERSATIONS] Returning conversations:', result.length);
    res.json(result);
  } catch (err) {
    console.error('[GET CONVERSATIONS] Unexpected error:', err.message, err.stack);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
};

// Get unread counts for all conversations
exports.getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Convert string userId to ObjectId
    const userObjectId = toObjectId(userId);
    
    // Use aggregation to get unread counts efficiently
    const unreadData = await Message.aggregate([
      {
        $match: {
          receiver: userObjectId,
          isRead: false
        }
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const unreadCounts = {};
    unreadData.forEach(item => {
      unreadCounts[item._id.toString()] = item.count;
    });
    
    res.json(unreadCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { fromUserId } = req.params;
    const userId = req.user.id;
    
    // Convert string userIds to ObjectIds
    const fromUserObjectId = toObjectId(fromUserId);
    const userObjectId = toObjectId(userId);
    
    const result = await Message.updateMany(
      { 
        sender: fromUserObjectId,
        receiver: userObjectId,
        isRead: false 
      },
      { isRead: true }
    );
    
    res.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};