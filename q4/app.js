// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const Student = require('./models/Student');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/studentdb', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware for JWT verification
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
};

// Routes
app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => res.render('login'));

app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashedPassword });
  res.redirect('/login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.send('Invalid username or password');
  }

  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

app.get('/dashboard', authenticateToken, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// CRUD Routes for Student
app.get('/students', authenticateToken, async (req, res) => {
  const students = await Student.find();
  res.render('students/index', { students });
});

app.get('/students/create', authenticateToken, (req, res) => res.render('students/create'));

app.post('/students', authenticateToken, async (req, res) => {
  const { name, age, email } = req.body;
  await Student.create({ name, age, email });
  res.redirect('/students');
});

app.get('/students/:id', authenticateToken, async (req, res) => {
  const student = await Student.findById(req.params.id);
  res.render('students/show', { student });
});

app.get('/students/:id/edit', authenticateToken, async (req, res) => {
  const student = await Student.findById(req.params.id);
  res.render('students/edit', { student });
});

app.post('/students/:id', authenticateToken, async (req, res) => {
  const { name, age, email } = req.body;
  await Student.findByIdAndUpdate(req.params.id, { name, age, email });
  res.redirect('/students');
});

app.post('/students/:id/delete', authenticateToken, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/students');
});

// Start Server
app.listen(8000, () => console.log('Server started on port 3000'));
