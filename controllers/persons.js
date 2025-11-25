const personsRouter = require('express').Router();
const Person = require('../models/person');

personsRouter.get('/', async (req, res) => {
  const persons = await Person.find({});
  res.json(persons);
});
personsRouter.post('/', async (req, res) => {
  const { name, number } = req.body;
  const person = new Person({ name, number });
  const saved = await person.save();
  res.status(201).json(saved);
});

module.exports = personsRouter;
