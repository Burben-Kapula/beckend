// app.js

function validatePerson(req, res, next) {
  const { name, number } = req.body;
  if (!name || typeof name !== 'string' || name.length < 3) {
    return res.status(400).json({ error: 'Name must be at least 3 characters long' });
  }
  const numberPattern = /^\d{3}-\d{8}$/;
  if (!numberPattern.test(number)) {
    return res.status(400).json({ error: 'Number must match 000-00000000' });
  }
  next();
}

// Один маршрут із middleware
app.post('/api/persons', validatePerson, async (req, res) => {
  const { name, number } = req.body;
  const person = new Person({ name, number });
  const savedPerson = await person.save();
  res.status(201).json(savedPerson);
});
