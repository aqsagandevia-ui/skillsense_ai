// Role-based authorization middleware
module.exports = {
  requireRole: (role) => (req, res, next) => {
    try {
      if (!req.user || !req.user.role) return res.status(401).json({ msg: 'Unauthorized' });
      // allow admin to bypass specific role checks
      if (req.user.role === 'admin') return next();
      if (req.user.role !== role) return res.status(403).json({ msg: 'Forbidden: insufficient role' });
      return next();
    } catch (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
  }
};
