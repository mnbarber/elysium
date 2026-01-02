const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware hit for:', req.path);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No authentication token, access denied' });
    }

    console.log('Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, user ID:', decoded.userId);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth;