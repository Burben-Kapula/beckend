const express = require('express');
const app = express();
const morgan = require('morgan');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, { family: 4 });

const Person = require('./models/person');

app.use(morgan('tiny'));
app.use(express.json());


// GET ALL
app.get('/api/persons', (req, res) => {
  Person.find({})
    .then(persons => {
      res.json(persons);
    })
    .catch(error => {
      res.status(500).json({ error: 'server error' });
    });
});


// GET by id
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


// DELETE by id
app.delete('/api/persons/:id', (req, res) => {
  Person.findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch(error => {
      res.status(400).json({ error: 'malformatted id' });
    });
});


// POST (add new)
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


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
