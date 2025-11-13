const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
// ...тут інші маршрути та middleware...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
