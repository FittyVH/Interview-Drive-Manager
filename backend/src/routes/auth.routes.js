const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

authRouter.post('/register', authController.registerUserController);

module.exports = authRouter;