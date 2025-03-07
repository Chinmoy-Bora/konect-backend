const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = "mongodb+srv://obhimanimon100:eDhhJYb6F4bvNjLm@konect100.i5afw.mongodb.net/?retryWrites=true&w=majority&appName=konect100";

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Exit process on failure
  }
};

// Event listeners for better debugging
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected! Trying to reconnect...");
  connectDB();
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected!");
});

// Call the connect function
connectDB();

module.exports = mongoose;

