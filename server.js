const express = require("express");
const mongoose = require("mongoose");

const app = express();
const port = 6000;

const mongoURL = "mongodb+srv://pradhanprabhu28:rg5r5J8CNDGKYAEi@cluster0.aosy7.mongodb.net/myDatabase?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Optional: Avoids long connection delays
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");

    // Start the server only after successful database connection
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
