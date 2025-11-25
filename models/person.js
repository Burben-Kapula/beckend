const mongoose = require('mongoose')

const personSchema = new mongoose.Schema({
  content: { type: String, required: true, minlength: 5 },
  important: Boolean
})

personSchema.set('toJSON', {
  transform: (doc, obj) => {
    obj.id = obj._id.toString()
    delete obj._id
    delete obj.__v
  }
})

module.exports = mongoose.model('Person', personSchema)
