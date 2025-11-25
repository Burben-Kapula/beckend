const mongoose = require('mongoose')

const personSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3 },
  number: { type: String, required: true, minlength: 3 }
})

personSchema.set('toJSON', {
  transform: (doc, obj) => {
    obj.id = obj._id.toString()
    delete obj._id
    delete obj.__v
  }
})

module.exports = mongoose.model('Person', personSchema)
