import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { Server } from 'socket.io';  // Correct import for socket.io
import http from 'http';  // Import http to create server
import errorHandler from './middleware/errorHandler.js';
import paymentRoutes from './routes/paymentRoutes.js'; 
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import imageRoutes from './routes/imageRoutes.js';  

dotenv.config();

const app = express();
const server = http.createServer(app);  // Create an HTTP server

// Initialize Socket.io with the server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',  // Adjust this based on your frontend's URL
    credentials: true
  }
});

// Example: Handling WebSocket connection
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
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

const PORT = process.env.PORT || 7100;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));  // Start the server with Socket.io
