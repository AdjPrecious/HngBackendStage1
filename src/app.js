const express = require('express');
const cors = require('cors');
const profileRoutes = require('./routes/profiles');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use(express.json());

app.use('/api/profiles', profileRoutes);

app.use(errorHandler);

module.exports = app;
