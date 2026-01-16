const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = optionalAuth;