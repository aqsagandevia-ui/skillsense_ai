import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import socket, { isSocketConnected, onSocketConnected } from "../socket";
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';

// API Base URL - use empty string for relative URLs
const API_URL = "";

export default function Chat() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { mentorId } = useParams();
  
  // Use auth context instead of localStorage for consistent user state
  const { user: currentUser, loading: authLoading } = useAuth();
  const token = localStorage.getItem("token");
  
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [attachments, setAttachments] = useState([]); // Store selected file attachments
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const unreadCountsFetchRef = useRef(false);
  const messageIdsRef = useRef(new Set());
  const fileInputRef = useRef(null);


  // Redirect if not logged in (wait for auth to finish)
  useEffect(() => {
    if (authLoading) return;
    if (!token || !currentUser) {
      navigate("/login");
    }
  }, [token, currentUser, navigate, authLoading]);

  // Auto-select mentor if passed from URL params or state
  useEffect(() => {
    if (conversations.length === 0) return;
    
    // Priority 1: Check URL parameter (from /chat/:mentorId)
    if (mentorId) {
      const mentorConversation = conversations.find(c => c.user?._id === mentorId);
      
      if (mentorConversation) {
        setSelectedUser(mentorConversation.user);
      } else {
        // Fetch mentor details if not in conversations
        fetch(`/api/users/${mentorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data._id) {
              setSelectedUser(data);
            }
          })
          .catch(err => console.error("Error fetching mentor:", err));
      }
    }
    // Priority 2: Check state (from Link with state prop)
    else if (state?.mentor) {
      const mentorIdFromState = state.mentor._id || state.mentor.id;
      const mentorConversation = conversations.find(c => c.user?._id === mentorIdFromState);
      
      if (mentorConversation) {
        setSelectedUser(mentorConversation.user);
      } else {
        const userObject = {
          _id: mentorIdFromState,
          name: state.mentor.name || 'Unknown',
          photo: state.mentor.photo,
          email: state.mentor.email,
          isOnline: false,
          skills: state.mentor.skills || [],
          ...state.mentor
        };
        setSelectedUser(userObject);
      }
    }
  }, [mentorId, state?.mentor, conversations, token]);

  // Track socket connection status
  useEffect(() => {
    setSocketConnected(isSocketConnected());
    
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // Initialize socket listeners
  useEffect(() => {
    if (authLoading) return;
    if (!token || !currentUser) return;

    if (socketConnected) {
      socket.emit("user_online", currentUser._id);
    } else {
      onSocketConnected(() => {
        if (currentUser) {
          socket.emit("user_online", currentUser._id);
        }
      });
    }

    const normalizeId = (v) => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (typeof v === 'object' && v._id) return String(v._id);
      return String(v);
    };

    const handleReceiveMessage = (data) => {
      console.log("📨 Received message event:", data);
      
      const senderId = normalizeId(data.sender) || normalizeId(data.sender?._id) || normalizeId(data.from);
      const receiverId = normalizeId(data.receiver) || normalizeId(data.receiver?._id) || normalizeId(data.to);
      
      // Use _id for deduplication if available
      const messageId = data._id ? String(data._id) : null;
      if (messageId && messageIdsRef.current.has(messageId)) {
        console.log("⏭️  Skipping duplicate message:", messageId);
        return;
      }

      // If server returned a clientMessageId, reconcile pending optimistic message
      const cId = data.clientMessageId;
      if (cId) {
        setMessages(prev => {
          // Find pending message with same clientMessageId
          const idx = prev.findIndex(m => m.clientMessageId === cId && m.isPending);
          if (idx !== -1) {
            // Replace pending message with server message
            const next = [...prev];
            next[idx] = {
              _id: data._id,
              sender: { _id: data.sender?._id || senderId, name: data.sender?.name || "User", photo: data.sender?.photo },
              receiver: { _id: data.receiver?._id || receiverId },
              text: data.text,
              createdAt: data.createdAt,
              isRead: data.isRead,
              clientMessageId: cId
            };
            if (data._id) messageIdsRef.current.add(data._id.toString());
            return next;
          }

          // Otherwise, fallthrough to conditional add below
          return prev;
        });
      }

      if (data._id) messageIdsRef.current.add(String(data._id));

      setMessages(prev => {
        // Check if message matches current conversation
        const selId = selectedUser?._id ? String(selectedUser._id) : null;
        const isFromSelected = senderId && selId && senderId === selId;
        const isToSelected = receiverId && selId && receiverId === selId;

        console.log("🔍 Checking message relevance:", {
          senderId,
          receiverId,
          selectedUserId: selectedUser?._id,
          isFromSelected,
          isToSelected
        });

        // Only add message if it's related to the selected user
        if (selectedUser && (isFromSelected || isToSelected)) {
          // If a pending message with same clientMessageId was already replaced above, avoid adding duplicate
          if (cId && prev.some(m => m.clientMessageId === cId && !m.isPending)) {
            return prev;
          }

          console.log("✅ Adding message to conversation");
          return [...prev, {
            _id: String(data._id),
            sender: {
              _id: senderId,
              name: data.sender?.name || (data.fromName || "User"),
              photo: data.sender?.photo
            },
            receiver: { _id: receiverId },
            text: data.text,
            createdAt: data.createdAt,
            isRead: data.isRead,
            clientMessageId: cId
          }];
        }

        console.log("⏭️  Message not relevant to current conversation");
        return prev;
      });
    };

    const handleMessageReceived = (data) => {
      // This event is for when messages are received and user needs unread count update
      
      const senderId = normalizeId(data.from) || normalizeId(data.from?._id);
      
      // Update unread count for this user (only if not currently viewing this chat)
      if (String(selectedUser?._id) !== String(senderId)) {
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
      }
      
      // Update conversations list with new message
      if (data.message) {
        setConversations(prev => {
          // Check if conversation already exists
          const existingConv = prev.find(c => c.user?._id === senderId);
          
          if (existingConv) {
            // Update existing conversation
            return prev.map(conv => 
              String(conv.user?._id) === String(senderId)
                ? {
                    ...conv,
                    lastMessage: data.message.text,
                    lastMessageTime: data.message.createdAt,
                    unreadCount: String(selectedUser?._id) === String(senderId) ? 0 : (conv.unreadCount || 0) + 1
                  }
                : conv
            ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
          } else {
            // Create new conversation entry
            const newConv = {
              user: { ...data.message.sender, _id: String(data.message.sender?._id || data.message.sender) },
              lastMessage: data.message.text,
              lastMessageTime: data.message.createdAt,
              unreadCount: 1
            };
            return [newConv, ...prev];
          }
        });
      }
    };

    const handleUnreadCountsUpdate = (counts) => {
      setUnreadCounts(counts);
    };

    const handleUserTyping = (data) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        setIsTyping(data.isTyping);
      }
    };

    const handleUserStatusChange = ({ userId, isOnline }) => {
      setAvailableUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, isOnline } : u
      ));
      setConversations(prev => prev.map(c => 
        c.user?._id === userId ? { ...c, user: { ...c.user, isOnline } } : c
      ));
    };

    const handleConversationUpdated = ({ lastMessage, lastMessageTime }) => {
      if (selectedUser) {
        setConversations(prev => 
          prev.map(c => 
            c.user?._id === selectedUser._id 
              ? { ...c, lastMessage, lastMessageTime }
              : c
          )
        );
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_received", handleMessageReceived);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_status_change", handleUserStatusChange);
    socket.on("unread_counts_update", handleUnreadCountsUpdate);
    socket.on("conversation_updated", handleConversationUpdated);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_received", handleMessageReceived);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_status_change", handleUserStatusChange);
      socket.off("unread_counts_update", handleUnreadCountsUpdate);
      socket.off("conversation_updated", handleConversationUpdated);
    };
  }, [token, currentUser, socketConnected, selectedUser]);


  // Add selected user to conversations if not already there (for new chats)
  useEffect(() => {
    if (selectedUser && (!conversations.find(c => c.user?._id === selectedUser._id))) {
      // Only add if it's a brand new conversation (no messages)
      if (messages.length === 0) {
        setConversations(prev => [
          {
            user: selectedUser,
            lastMessage: "No messages yet",
            lastMessageTime: new Date()
          },
          ...prev
        ]);
      }
    }
  }, [selectedUser, conversations, messages]);

  // Join chat room when user is selected
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const joinChat = () => {
      socket.emit("join_chat", { 
        receiverId: selectedUser._id 
      });
    };

    if (socketConnected) {
      joinChat();
    } else {
      onSocketConnected(() => {
        if (currentUser) {
          joinChat();
        }
      });
    }
  }, [selectedUser, currentUser, socketConnected]);

  // Fetch conversations
  useEffect(() => {
    if (!token) return;
    
    const fetchConversations = async () => {
      try {
        console.log('🔄 Fetching conversations...');
        const res = await fetch(`${API_URL}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch conversations`);
        }
        
        const data = await res.json();
        console.log('📋 Conversations fetched:', data.length);
        console.log('📋 First conversation sample:', data[0]);
        
        // Ensure all conversations have proper user structure
        const processedConversations = (data || []).map(conv => {
          if (!conv.user?._id) {
            console.warn('⚠️  Conversation missing user._id:', conv);
          }
          return {
            ...conv,
            user: {
              ...conv.user,
              skills: conv.user?.skills || [],
              isOnline: conv.user?.isOnline || false
            }
          };
        });
        
        setConversations(processedConversations);
        
        // Build unread counts from conversations
        const counts = {};
        processedConversations.forEach(conv => {
          if (conv.unreadCount > 0) {
            counts[conv.user._id] = conv.unreadCount;
          }
        });
        setUnreadCounts(counts);
        
      } catch (err) {
        console.error("❌ Error fetching conversations:", err);
        setConversations([]);
      }
    };

    fetchConversations();
    
    // Refresh conversations every 20 seconds
    const interval = setInterval(fetchConversations, 20000);
    return () => clearInterval(interval);
  }, [token]);

  // Refresh unread counts periodically
  useEffect(() => {
    if (!token || !currentUser) return;

    // Fetch unread counts on init
    if (!unreadCountsFetchRef.current) {
      unreadCountsFetchRef.current = true;
      
      const fetchUnreadCounts = async () => {
        try {
          const res = await fetch(`${API_URL}/api/messages/unread-counts`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.ok) {
            const counts = await res.json();
            setUnreadCounts(counts);
          }
        } catch (err) {
          console.error("Error fetching unread counts:", err);
        }
      };
      
      fetchUnreadCounts();
    }

    // Request unread counts from socket server
    if (socketConnected) {
      socket.emit("request_unread_counts", currentUser._id);
    }
  }, [token, currentUser, socketConnected]);


  // Initialize available users from conversations only (no separate fetch)
  useEffect(() => {
    if (conversations.length > 0) {
      const users = conversations.map(c => c.user).filter(u => u && u._id);
      setAvailableUsers(users);
      setIsLoading(false);
    } else {
      setAvailableUsers([]);
      setIsLoading(false);
    }
  }, [conversations]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (!token || !selectedUser) {
      console.log('⏭️  Skipping message fetch - no token or user selected');
      return;
    }
    
    // Clear message IDs ref when switching users
    messageIdsRef.current.clear();
    
    const userId = selectedUser._id || selectedUser.id;
    
    console.log("🔍 Selected user object:", selectedUser);
    console.log("🔍 Extracted userId:", userId);
    
    if (!userId) {
      console.error("❌ Selected user does not have a valid ID. User object:", selectedUser);
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        console.log('📥 Fetching messages for user:', userId);
        
        const res = await fetch(`${API_URL}/api/messages/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          console.error('❌ Messages fetch failed:', res.status, res.statusText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('✅ Messages fetched:', data ? data.length : 0);
        
        // Ensure all messages have proper structure with populated sender/receiver
        const processedMessages = (data || []).map(msg => {
          const msgId = msg._id ? String(msg._id) : null;
          if (msgId) {
            messageIdsRef.current.add(msgId);
          }

          const sender = msg.sender ? { ...msg.sender, _id: String(msg.sender._id || msg.sender) } : { _id: String(msg.sender?._id || msg.sender || ''), name: 'User', photo: null };
          const receiver = msg.receiver ? { ...msg.receiver, _id: String(msg.receiver._id || msg.receiver) } : { _id: String(msg.receiver?._id || msg.receiver || '') };

          return {
            ...msg,
            _id: msgId,
            sender,
            receiver,
            createdAt: msg.createdAt || new Date().toISOString()
          };
        });
        
        setMessages(processedMessages);
        
        // Mark messages as read
        try {
          await fetch(`${API_URL}/api/messages/mark-read/${userId}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (readErr) {
          console.error("Error marking messages as read:", readErr);
        }
        
        // Clear unread count for this user
        setUnreadCounts(prev => ({
          ...prev,
          [userId]: 0
          
        }));
        
        setLoadingMessages(false);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
        setMessages([]);
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [token, selectedUser]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const safeEmit = (event, data) => {
    if (socketConnected) {
      socket.emit(event, data);
    } else {
      onSocketConnected(() => {
        socket.emit(event, data);
      });
    }
  };

  // Handle file selection from input
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      // Check file size (limit to 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large (max 10MB)`);
        continue;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        const newAttachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
          preview: file.type.startsWith('image/') ? base64Data : null
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.onerror = () => {
        toast.error(`Failed to read file "${file.name}"`);
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment from preview
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedUser) {
      console.warn("Cannot send: message and attachments empty or no user selected");
      return;
    }

    const messageText = newMessage.trim();
    const receiverId = selectedUser._id || selectedUser.id;

    if (!receiverId) {
      console.error("Cannot send message: no valid receiverId", selectedUser);
      return;
    }

    try {
      const chatId = [currentUser._id, receiverId].sort().join("_");

      // Generate clientMessageId to allow server-side dedupe and idempotent saves
      const clientMessageId = `${currentUser._id}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

      // Create optimistic pending message locally
      const pendingMessage = {
        _id: clientMessageId,
        sender: { _id: currentUser._id, name: currentUser.name, photo: currentUser.photo },
        receiver: { _id: receiverId },
        text: messageText,
        attachments: attachments.length > 0 ? attachments.map(({ preview, ...rest }) => rest) : [],
        createdAt: new Date().toISOString(),
        isRead: false,
        clientMessageId,
        isPending: true
      };

      // Add pending message immediately
      setMessages(prev => [...prev, pendingMessage]);

      console.log("📤 Sending message via socket to:", receiverId, { clientMessageId, attachmentCount: attachments.length });

      // Emit via socket (server uses authenticated socket.userId)
      safeEmit("send_message", {
        receiverId: receiverId,
        message: messageText,
        attachments: attachments.map(({ preview, ...rest }) => rest), // Strip preview before sending
        chatId: chatId,
        clientMessageId
      });

      // Clear input and attachments
      setNewMessage("");
      setAttachments([]);
      
      safeEmit("stop_typing", {
        receiverId: receiverId
      });
      
      // Update conversations last message
      setConversations(prev => {
        const existing = prev.find(c => c.user?._id === receiverId);
        if (existing) {
          return prev.map(c => 
            c.user?._id === receiverId 
              ? { 
                  ...c, 
                  lastMessage: messageText, 
                  lastMessageTime: new Date().toISOString() 
                }
              : c
          ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        }
        return [{ user: selectedUser, lastMessage: messageText, lastMessageTime: new Date().toISOString(), unreadCount: 0 }, ...prev];
      });
      
      // Emit conversation update
      safeEmit("conversation_update", {
        senderId: currentUser._id,
        receiverId: receiverId,
        lastMessage: messageText,
        lastMessageTime: new Date().toISOString()
      });
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedUser && currentUser) {
      safeEmit("typing", {
        receiverId: selectedUser._id
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        safeEmit("stop_typing", {
          receiverId: selectedUser._id
        });
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectUser = (user) => {
    console.log("👤 Selecting user:", user);
    
    if (!user || !user._id) {
      console.error("❌ Cannot select user - invalid user object:", user);
      toast.error("Invalid user. Please try again.");
      return;
    }
    
    setSelectedUser(user);
    setShowNewChat(false);
    setSearchTerm("");
    setIsTyping(false);
    
    // Clear unread count immediately
    setUnreadCounts(prev => ({ ...prev, [user._id]: 0 }));
    
    // Update conversations to remove unread badge
    setConversations(prev => 
      prev.map(c => 
        c.user?._id === user._id 
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  };

  const filteredUsers = availableUsers.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeString = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return "Yesterday";
    return d.toLocaleDateString();
  };

  const formatMessageTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Not logged in view
  if (!token || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative overflow-hidden bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center max-w-md border border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl"></div>
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-6 transition-transform">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Welcome to SkillSwap</h2>
            <p className="text-white/60 mb-8">Please login to access your messages and connect with other learners</p>
            <button 
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold hover:scale-105"
            >
              Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Sidebar - Conversations */}
      <div className="w-96 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="font-bold text-2xl text-white">Messages</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                <div className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-xs text-white/70">{socketConnected ? 'Online' : 'Offline'}</span>
              </div>
              <button
                onClick={() => setShowNewChat(true)}
                className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200/50">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* User Profile Mini */}
        <div className="p-4 border-b border-slate-200/50 bg-slate-50/50">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm">
            {currentUser?.photo ? (
              <img
                src={currentUser?.photo}
                alt={currentUser?.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-500">Your Profile</p>
            </div>
            <button 
              onClick={() => navigate("/profile")}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-500 mt-4 text-sm">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium mb-1">No conversations yet</p>
              <p className="text-slate-400 text-sm mb-4">Start chatting with other learners</p>
              <button 
                onClick={() => setShowNewChat(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm font-medium"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user?._id}
                onClick={() => selectUser(conv.user)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50/80 transition-all border-b border-slate-100/50 ${
                  selectedUser?._id === conv.user?._id ? "bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  {conv.user?.photo ? (
                    <img
                      src={conv.user?.photo}
                      alt={conv.user?.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xl shadow-md">
                      👤
                    </div>
                  )}
                  {conv.user?.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-3 border-white rounded-xl"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-slate-900 truncate">{conv.user?.name}</h4>
                    <span className="text-xs text-slate-400 flex-shrink-0 bg-slate-100 px-2 py-1 rounded-full">
                      {getTimeString(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate flex items-center gap-2">
                    {conv.lastMessage?.length > 40 ? `${conv.lastMessage.substring(0, 40)}...` : conv.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      {conv.user?.skills?.slice(0, 2).map(s => s.name).join(", ") || "SkillSwap User"}
                    </span>
                  </div>
                </div>
                {unreadCounts[conv.user?._id] > 0 && (
                  <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCounts[conv.user?._id]}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-slate-200/50 bg-slate-50/50">
          <div className="flex gap-2">
            <button 
              onClick={() => navigate("/matches")}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-sm font-medium text-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Matches
            </button>
            <button 
              onClick={() => navigate("/browse")}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-sm font-medium text-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse
            </button>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-xl text-white">Your Conversations</h3>
                </div>
                <button 
                  onClick={() => setShowNewChat(false)} 
                  className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">No conversations yet</p>
                    <p className="text-slate-400 text-sm">Start by selecting a user from your conversations</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        selectUser(user);
                        setShowNewChat(false);
                      }}
                      className="w-full p-4 flex items-center gap-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-2xl transition-all group"
                    >
                      <div className="relative">
                        {user.photo ? (
                          <img
                            src={user.photo}
                            alt={user.name}
                            className="w-14 h-14 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                          </div>
                        )}
                        {user.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-3 border-white rounded-xl"></span>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{user.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.skills?.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {skill.name || skill}
                            </span>
                          ))}
                          {(!user.skills || user.skills.length === 0) && (
                            <span className="text-xs text-slate-400">No skills</span>
                          )}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 transition-all">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center gap-4 shadow-sm">
              <button 
                onClick={() => setSelectedUser(null)}
                className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="relative">
                <img
                  src={selectedUser.photo || `https://i.pravatar.cc/40?u=${selectedUser._id}`}
                  alt={selectedUser.name}
                  className="w-14 h-14 rounded-2xl object-cover shadow-md"
                />
                {selectedUser.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-3 border-white rounded-xl"></span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900">{selectedUser.name}</h3>
                <p className="text-sm">
                  {selectedUser.isOnline ? (
                    <span className="text-green-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </span>
                  ) : (
                    <span className="text-slate-400">Offline</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 hover:bg-slate-100 rounded-xl transition-colors" title="View Profile">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button className="p-3 hover:bg-slate-100 rounded-xl transition-colors" title="More Options">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-semibold text-lg mb-1">No messages yet</p>
                  <p className="text-slate-400 text-sm">Start the conversation by sending a message!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id;
                  const showAvatar = !isMe && (index === 0 || messages[index - 1]?.sender?._id !== msg.sender?._id);
                  
                  return (
                    <div key={msg._id || msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                      <div className={`flex gap-2 max-w-[75%] ${isMe ? "flex-row-reverse" : ""}`}>
                        {!isMe && (
                          <div className="flex-shrink-0">
                            {showAvatar ? (
                              <img
                                src={selectedUser.photo || `https://i.pravatar.cc/40?u=${selectedUser._id}`}
                                alt={selectedUser.name}
                                className="w-10 h-10 rounded-xl object-cover shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10"></div>
                            )}
                          </div>
                        )}
                        <div className={`${isMe ? "order-1" : "order-2"}`}>
                          <div className={`px-5 py-3.5 rounded-3xl shadow-sm ${
                            isMe 
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md" 
                              : "bg-white text-slate-900 rounded-bl-md border border-slate-200"
                          }`}>
                            {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                            
                            {/* Attachments Display */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className={`mt-3 flex flex-wrap gap-2 ${msg.text ? "border-t border-current border-opacity-20 pt-3" : ""}`}>
                                {msg.attachments.map((attachment, idx) => {
                                  const isImage = attachment.type?.startsWith('image/');
                                  return (
                                    <div key={idx} className={`relative ${isImage ? 'max-w-xs' : ''}`}>
                                      {isImage ? (
                                        // Image attachment
                                        <a href={attachment.data} download={attachment.name} title={attachment.name}>
                                          <img 
                                            src={attachment.data} 
                                            alt={attachment.name} 
                                            className="max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                          />
                                        </a>
                                      ) : (
                                        // File attachment
                                        <a 
                                          href={attachment.data} 
                                          download={attachment.name}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                            isMe 
                                              ? "bg-white/20 hover:bg-white/30" 
                                              : "bg-slate-100 hover:bg-slate-200"
                                          } transition-colors`}
                                          title={`Download ${attachment.name}`}
                                        >
                                          <svg className={`w-5 h-5 flex-shrink-0 ${isMe ? 'text-white' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-4-4m4 4l4-4" />
                                          </svg>
                                          <div className="text-left">
                                            <p className={`text-xs font-medium truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>{attachment.name}</p>
                                            <p className={`text-xs ${isMe ? 'text-white/70' : 'text-slate-500'}`}>{(attachment.size / 1024).toFixed(1)} KB</p>
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 mt-2 ${isMe ? "justify-end" : "justify-start"}`}>
                            <p className={`text-xs text-slate-400`}>
                              {formatMessageTime(msg.createdAt)}
                            </p>
                            {isMe && (
                              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <div className="flex gap-2 items-end">
                    <img
                      src={selectedUser.photo || `https://i.pravatar.cc/40?u=${selectedUser._id}`}
                      alt={selectedUser.name}
                      className="w-10 h-10 rounded-xl object-cover shadow-sm"
                    />
                    <div className="bg-white px-5 py-4 rounded-3xl rounded-bl-md shadow-sm border border-slate-200">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-6 py-4">
              {/* Attachment Preview */}
              {attachments.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="relative bg-white border border-slate-200 rounded-lg p-2 max-w-xs">
                      {attachment.preview ? (
                        // Image preview
                        <div className="relative">
                          <img src={attachment.preview} alt={attachment.name} className="h-16 w-16 object-cover rounded" />
                          <button
                            onClick={() => removeAttachment(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors text-xs font-bold"
                            title="Remove attachment"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        // File preview (non-image)
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">{attachment.name}</p>
                            <p className="text-xs text-slate-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="flex-shrink-0 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Remove attachment"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-2.5 border border-slate-200 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 hover:bg-slate-200 rounded-xl transition-colors" 
                  title="Add attachments"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Select files to attach"
                />
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-2 py-2 bg-transparent focus:outline-none text-slate-900 placeholder-slate-400"
                />
                
                <button 
                  onClick={handleSend}
                  disabled={!newMessage.trim() && attachments.length === 0}
                  className="p-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
            <div className="text-center max-w-md px-6">
              <div className="w-28 h-28 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-6 transition-transform">
                <svg className="w-14 h-14 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-3">Welcome to Messages</h3>
              <p className="text-slate-500 mb-8 text-lg">Connect with other learners and start sharing skills</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowNewChat(true)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-xl hover:shadow-purple-500/30 transition-all font-semibold hover:scale-105"
                >
                  Start New Chat
                </button>
                <button
                  onClick={() => navigate("/matches")}
                  className="px-8 py-4 bg-white text-slate-700 rounded-2xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all font-semibold"
                >
                  View Matches
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}