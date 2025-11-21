const mongoose = require('mongoose');

if (process.argv.length < 3) {
  console.log('give password as argument');
  process.exit(1);
}

const password = process.argv[2];
const url = `mongodb+srv://maks:${password}@cluster0.ca1kyqr.mongodb.net/phonebook?retryWrites=true&w=majority`;

mongoose.set('strictQuery', false);
mongoose.connect(url, { family: 4 });

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});

const Person = mongoose.model('Person', personSchema);

// Додає одного юзера (заміни на свої дані або параметри!)
const person = new Person({
  name: 'Arto Hellas',
  number: '040-123456',
});

person.save()
  .then(result => {
    console.log('person saved!');
    mongoose.connection.close();
  })
  .catch(error => {
    console.log('Error saving:', error);
    mongoose.connection.close();
  });


  const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    required: true
  },
  number: String,
});


const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
