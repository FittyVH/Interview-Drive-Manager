const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const driveRoutes = require('./routes/drive.routes');
app.use('/api/drive', driveRoutes);

module.exports = app;