const mongoose = require('mongoose')
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI, { family: 4 });

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url =   `mongodb+srv://maks:${password}@cluster0.ca1kyqr.mongodb.net/?appName=Cluster0`;

mongoose.set('strictQuery', false)
mongoose.connect(url, { family: 4 })

const noteSchema = new mongoose.Schema({
  content: String,
  important: Boolean,
})

const Note = mongoose.model('Note', noteSchema)

const note = new Note({
  content: 'HTML is easy',
  important: true,
})

note.save().then(result => {
  console.log('note saved!')
  mongoose.connection.close()
})

