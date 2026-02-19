// models/blog.js
const mongoose = require('mongoose');
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

const blogSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    minlength: 3
  },
  content: { 
    type: String, 
    required: true 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId,  // Посилання на Person
    ref: 'Person',
    required: true
  },
  // **НОВИЙ**: Масив лайків (ID користувачів)
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  }],
  // **НОВИЙ**: Масив дізлайків (ID користувачів)
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  }],
  // **НОВИЙ**: Масив коментарів
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    },
    text: {
      type: String,
      required: true,
      minlength: 1
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Налаштування JSON відповіді
blogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('Blog', blogSchema);
