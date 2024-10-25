// app.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const User = require('./models/User');
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('uploads'));

// Set up file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Rename files to avoid duplicates
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    // Only allow certain file types
    const fileTypes = /jpeg|jpg|png|pdf/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed!'));
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/register', upload.array('files', 5), async (req, res) => {
  try {
    const { name, email } = req.body;
    const files = req.files.map(file => file.filename); // Store file paths

    // Create and save the user
    const user = new User({ name, email, files });
    await user.save();
    res.send('User registered successfully');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Route to list all files
app.get('/files', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users.map(user => ({ name: user.name, files: user.files })));
  } catch (error) {
    res.status(500).send('Error retrieving files');
  }
});

// Route to download a file
app.get('/download/:filename', (req, res) => {
  const filepath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filepath, err => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

// Start the server
app.listen(3000, () => console.log('Server running on port 3000'));
