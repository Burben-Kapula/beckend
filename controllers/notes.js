const notesRouter = require('express').Router();
const Note = require('../models/note');

notesRouter.get('/', async (req, res) => {
  const notes = await Note.find({});
  res.json(notes);
});

notesRouter.post('/', async (req, res) => {
  const { content, important } = req.body;
  const note = new Note({ content, important });
  const saved = await note.save();
  res.status(201).json(saved);
});

module.exports = notesRouter;
