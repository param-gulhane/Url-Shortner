const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());
const urlRoutes = require('./routes/shortUrl');
const authRoutes = require('./routes/auth');

app.use('/api',urlRoutes);
const MONGODB_URI =
  'mongodb+srv://paramgulhane:paramgulhane@cluster0.7dcbg.mongodb.net/url';

app.use('/auth', authRoutes);

mongoose.connect(MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
})
.then(() => app.listen(3030))
.catch(err => console.error('MongoDB connection error:', err));

// mongodb+srv://paramgulhane:paramgulhane@cluster0.7dcbg.mongodb.net/url
// mongodb+srv:// mongodb+srv://paramgulhane:paramgulhane@cluster0.7dcbg.mongodb.net/url?retryWrites=true&w=majority&appName=Cluster0