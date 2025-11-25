const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
  .then(() => console.log('connected to MongoDB'))
  .catch((error) => console.error('error connecting to MongoDB:', error.message));

const Person = require('./models/person');

app.get('/api/persons', async (req, res) => {
  const persons = await Person.find({});
  res.json(persons);
});

app.post('/api/persons', async (req, res) => {
  const { name, number } = req.body;
  const person = new Person({ name, number });
  const savedPerson = await person.save();
  res.status(201).json(savedPerson);
});

app.delete('/api/persons/:id', async (req, res) => {
  try {
    await Person.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});


app.use((req, res) => {
  res.status(404).json({ error: 'unknown endpoint' });
});

module.exports = app;
