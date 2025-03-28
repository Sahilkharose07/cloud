const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const routes = require("./routes/api/v1/index");
const connectDB = require("./db/mongoosedb");

const app = express();

// Connect to MongoDB
connectDB()
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1); 
  });

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Built-in middleware to parse JSON
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true })); // Handle URL-encoded data if needed

// API routes
app.use("/api/v1", routes);

// Ensure services directory exists
const servicesDir = path.join(process.cwd(), "services");
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir);
  console.log("Created services directory");
}

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
