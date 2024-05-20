const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const secretKey = "your_jwt_secret_key";

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Authenticater", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", userSchema);

// Task Schema and Model
const taskSchema = new mongoose.Schema({
  username: String,
  text: String,
  priority: String,
});
const Task = mongoose.model("Task", taskSchema);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send("User registered successfully");
  } catch (error) {
    res.status(400).send("Error registering user");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send("Invalid username or password");
  }
  const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
  res.json({ token });
});

app.get("/tasks", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Access denied");

  const token = authHeader.split(" ")[1];
  try {
    const { username } = jwt.verify(token, secretKey);
    const tasks = await Task.find({ username });
    res.json({ tasks });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

app.post("/tasks", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Access denied");

  const token = authHeader.split(" ")[1];
  try {
    const { username } = jwt.verify(token, secretKey);
    const { text, priority } = req.body;
    const task = new Task({ username, text, priority });
    await task.save();
    res.status(201).send("Task added");
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
