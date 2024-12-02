import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { Server } from 'socket.io';
import http from 'http';
import errorHandler from './middleware/errorHandler.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import imageRoutes from './routes/imageRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Environment variables
const PORT = process.env.PORT || 7100;
const FRONTEND_ORIGINS = [
  'http://localhost:3000', 
  'https://tech-e-website-frontend.vercel.app'
];

// Initialize Socket.io with the server
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGINS, // Allow multiple origins
    credentials: true,       // Allow cookies to be passed with WebSocket connections
  },
});

// Example: Handling WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({
  origin: FRONTEND_ORIGINS,  // Allow multiple origins
  credentials: true,        // Allow cookies with HTTP requests
}));
app.use(cookieParser());
app.use(helmet());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Use routes
app.use('/user', authRoutes);
app.use('/login', loginRoutes);
app.use('/contact', contactRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/images', imageRoutes);

// Custom error handling middleware
app.use(errorHandler);

// Start the server with Socket.io
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend origins allowed: ${FRONTEND_ORIGINS.join(', ')}`);
});
