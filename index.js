



const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

const morgan = require('morgan');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, { family: 4 });

const Person = require('./models/person'); // <-- Тепер модель Person

app.use(morgan('tiny'));
app.use(express.json());

// GET ALL persons
app.get('/api/persons', (req, res) => {
  Person.find({})
    .then(persons => {
      res.json(persons);
    })
    .catch(error => {
      res.status(500).json({ error: 'server error' });
    });
});

// GET person by id
app.get('/api/persons/:id', (req, res) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch(error => {
      res.status(400).json({ error: 'malformatted id' });
    });
});

// DELETE person by id
app.delete('/api/persons/:id', (req, res) => {
  Person.findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch(error => {
      res.status(400).json({ error: 'malformatted id' });
    });
      console.log('DELETE:', req.params.id);
});

// POST (add new person)
app.post('/api/persons', (req, res) => {
  const body = req.body;
  if (!body.name || !body.number) {
    return res.status(400).json({ error: 'name or number missing' });
  }
  const person = new Person({
    name: body.name,
    number: body.number
  });
  person.save()
    .then(savedPerson => {
      res.status(201).json(savedPerson);
    })
    .catch(error => {
      res.status(500).json({ error: 'server error' });
    });
});

app.get('/', (req, res) => {
  res.send('Phonebook API working!');
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
