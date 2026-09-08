import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create socket with improved configuration
// Attach auth token on handshake for server-side verification
const getAuth = () => {
  try {
    const token = localStorage.getItem('token');
    return token ? { token } : {};
  } catch (e) {
    return {};
  }
};

const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  forceNew: false,
  auth: getAuth()
});

// Connection status tracking with callbacks
let isConnected = false;
let _reconnectAttempts = 0;
const connectionCallbacks = [];
let userOnlineEmitted = false; // Track if we already emitted user_online

// Register a callback to be called when connection is established
export const onSocketConnected = (callback) => {
  if (isConnected) {
    callback();
  } else {
    connectionCallbacks.push(callback);
  }
};

// Process queued callbacks
const processConnectionCallbacks = () => {
  connectionCallbacks.forEach(cb => cb());
  connectionCallbacks.length = 0; // Clear callbacks
};

// Emit user online status when connected
socket.on("connect", () => {
  console.log("🔌 Socket connected:", socket.id);
  isConnected = true;
  _reconnectAttempts = 0;
  
  // Process any pending connection callbacks
  processConnectionCallbacks();
  
  // Only emit user_online once per connection
  const userData = localStorage.getItem("user");
  if (userData && !userOnlineEmitted) {
    try {
      const user = JSON.parse(userData);
      if (user._id) {
        socket.emit("user_online", user._id);
        userOnlineEmitted = true;
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }
});

// Handle disconnection
socket.on("disconnect", (reason) => {
  userOnlineEmitted = false; // Allow re-emission on reconnect
  console.log("🔌 Socket disconnected:", reason);
  isConnected = false;
});

// Handle connection errors
socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
  _reconnectAttempts++;
});

// Handle reconnection
socket.on("reconnect", (attemptNumber) => {
  console.log(`🔌 Socket reconnected after ${attemptNumber} attempts`);
  isConnected = true;
  
  // Process any pending connection callbacks
  processConnectionCallbacks();
  
  // Re-emit user online status
  const userData = localStorage.getItem("user");
  if (userData && !userOnlineEmitted) {
    try {
      const user = JSON.parse(userData);
      if (user._id) {
        // Update auth token if it may have changed
        socket.auth = getAuth();
        socket.connect();
        socket.emit("user_online", user._id);
        userOnlineEmitted = true;
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }
});

// Handle reconnection attempts
socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`🔄 Reconnection attempt ${attemptNumber}`);
  _reconnectAttempts = attemptNumber;
});

// Handle reconnection failure
socket.on("reconnect_failed", () => {
  console.error("❌ Socket reconnection failed after all attempts");
});

// Listen for user status changes - only log once to prevent spam
let lastStatusChange = {};
socket.on("user_status_change", (data) => {
  // Only log if this is different from the last change for this user
  const key = `${data.userId}_${data.isOnline}`;
  if (lastStatusChange[key] !== true) {
    console.log("User status changed:", data);
    window.dispatchEvent(new CustomEvent("userStatusChange", { detail: data }));
    lastStatusChange[key] = true;
  }
});

// Listen for incoming messages for debugging
socket.on("receive_message", (data) => {
  console.log("📥 Received message:", data);
});

// Helper function to check connection status
export const isSocketConnected = () => isConnected;

// Helper function to get socket instance
export const getSocket = () => socket;

// Helper function to force reconnection
export const reconnectSocket = () => {
  if (!isConnected) {
    socket.connect();
  }
};

export default socket;