// models/person.js
const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,   // мінімум 3 символи
    required: true  // обов’язкове поле
  },
  number: {
    type: String,
    minlength: 8,   // мінімум 8 символів (або свою вимогу)
    required: true  // обов’язкове поле
  }
});

module.exports = mongoose.model('Person', personSchema);
