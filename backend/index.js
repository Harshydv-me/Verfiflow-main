// Load environment variables FIRST before anything else
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware setup - MUST come before routes
app.use(cors({
  origin: "*",
  methods: "GET,POST,PATCH,DELETE,PUT",
  allowedHeaders: "Content-Type, Authorization"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Importing routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');

// Routes middleware - mount routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);

// Ensure uploads directory exists and serve it statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Root route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Veriflow API Server is running', status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Connecting to database
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URL:', process.env.MONGO_URL ? 'Set' : 'NOT SET');

    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 60000, // Increase timeout to 60 seconds
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
    });
    console.log("✓ Connected to MongoDB database successfully");
  } catch (err) {
    console.error("✗ Error connecting to database:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

// Starting the server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`✓ Server is running on port ${PORT}`);
    console.log(`✓ API endpoints available at: http://localhost:${PORT}/api`);
    console.log(`✓ Auth endpoints: http://localhost:${PORT}/api/auth/login`);
    console.log(`✓ Auth endpoints: http://localhost:${PORT}/api/auth/register`);
  });
};

startServer();