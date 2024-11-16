import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authenticate = async (req, res, next) => {
  // Get the token from cookies or Authorization header
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
  
  // If no token is provided, return an error
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch the user from the database based on the decoded token's ID
    const user = await User.findById(decoded.id).select('-password');
    
    // If no user is found, return an error
    if (!user) {
      return res.status(401).json({ error: 'User not found. Authentication failed.' });
    }

    // Attach the user to the request object for further use
    req.user = user;
    next();  // Proceed to the next middleware or route handler
  } catch (error) {
    // Handle token verification or other errors
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
  }
};

export default authenticate;
