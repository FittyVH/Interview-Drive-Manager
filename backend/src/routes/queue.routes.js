const express = require('express');
const queueRouter = express.Router();

const queueController = require('../controllers/queue.controller')
const authMiddleware = require('../middlewares/auth.middleware');

queueRouter.post('/:driveId/add', authMiddleware.authUser, authMiddleware.authorizeRoles("admin"), queueController.addStudentToQueue)
queueRouter.post('/:roomId/next', authMiddleware.authUser, authMiddleware.authorizeRoles("interviewer"), queueController.completeInterviewAndNext)

queueRouter.get('/:driveId/get', authMiddleware.authUser, queueController.getDriveQueue)

module.exports = queueRouter