const mongoose = require('mongoose');

const phoneRegex = /^(\d{2,3})-\d{5,}$/;

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    required: true
  },
  number: {
    type: String,
    minlength: 8, // загальна мінімальна довжина
    required: true,
    validate: {
      validator: function(v) {
        return phoneRegex.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  }
});

module.exports = mongoose.model('Person', personSchema);
