const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ msg: "No token" });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both 'id' (regular login) and 'userId' (google login)
    req.user = {
      id: decoded.id || decoded.userId,
      role: decoded.role
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token", error: err.message });
  }
};