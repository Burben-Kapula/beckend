// Імпортуємо mongoose для роботи з MongoDB
const mongoose = require('mongoose');

// Перевіряємо чи передано пароль як аргумент командного рядка
if (process.argv.length < 3) {
  console.log('give password as argument');
  process.exit(1);
}

// Отримуємо пароль з аргументів командного рядка
const password = process.argv[2];
// Формуємо URL підключення до MongoDB Atlas
const url = `mongodb+srv://maks:${password}@cluster0.ca1kyqr.mongodb.net/phonebook?retryWrites=true&w=majority`;

// Встановлюємо режим строгих запитів
mongoose.set('strictQuery', false);

// **ДОДАНО**: Логування перед підключенням
console.log('🔌 Connecting to MongoDB...');

// Підключаємось до MongoDB Atlas
mongoose.connect(url, { family: 4 })
  .then(() => {
    // **ДОДАНО**: Детальна інформація про підключення
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📦 Database name:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('📊 Collections:');
    
    // Виводимо список всіх колекцій в БД
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log(collections.map(c => `  - ${c.name}`).join('\n'));
    console.log(''); // Порожній рядок для красивого виводу
    
    // Створюємо схему з усіма полями як у твоєму app.js
    const personSchema = new mongoose.Schema({
      name: { type: String, required: true, minlength: 2 },
      email: { type: String, required: true, unique: true },
      passwordHash: { type: String, required: true }
    });
    
    // Створюємо модель
    const Person = mongoose.model('Person', personSchema);
    
    // **ОНОВЛЕНО**: Створюємо тестового користувача з усіма полями
    const testPerson = new Person({
      name: 'Test User',
      email: `test${Date.now()}@test.com`, // Унікальний email
      passwordHash: 'fakehash123' // В реальності тут має бути bcrypt.hash()
    });
    
    console.log('💾 Saving test person...');
    return testPerson.save();
  })
  .then(savedPerson => {
    // Виводимо збережені дані
    console.log('✅ Person saved successfully!');
    console.log('📄 Saved data:', {
      id: savedPerson._id,
      name: savedPerson.name,
      email: savedPerson.email
    });
    console.log('');
    
    // Перевіряємо чи реально в БД
    const Person = mongoose.model('Person');
    return Person.find({});
  })
  .then(allPersons => {
    console.log(`📋 Total persons in database: ${allPersons.length}`);
    console.log('All persons:');
    allPersons.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.email})`);
    });
    
    // Закриваємо з'єднання
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('👋 Connection closed');
    process.exit(0);
  })
  .catch(error => {
    // Детальна інформація про помилку
    console.error('❌ ERROR:', error.message);
    console.error('Error details:', error);
    mongoose.connection.close();
    process.exit(1);
  });
