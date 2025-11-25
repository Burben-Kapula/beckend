const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true, minlength: 5 },
  important: Boolean
});

noteSchema.set('toJSON', {
  transform: (doc, obj) => {
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
  }
});

module.exports = mongoose.model('Note', noteSchema);
