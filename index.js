require('dotenv').config();
const express = require('express');
const app = express();
const sessionRoutes = require('./routes/sessionRoutes');
require('./db'); // Establish MongoDB connection
const admin = require('./firebase');

// Middleware to parse JSON bodies
app.use(express.json());
console.log(admin.messaging());

// Use the session routes for all endpoints
app.use('/', sessionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
