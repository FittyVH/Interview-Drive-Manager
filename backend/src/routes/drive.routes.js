const express = require('express');
const driveRouter = express.Router();

const driveController = require('../controllers/drive.controller');
const authMiddleware = require('../middlewares/auth.middleware');

driveRouter.post('/create', authMiddleware.authUser, authMiddleware.authorizeRoles("admin"), driveController.createDrive);
driveRouter.post('/join', authMiddleware.authUser, authMiddleware.authorizeRoles("interviewer"), driveController.joinDrive)
driveRouter.post('/:driveId/assign', authMiddleware.authUser, authMiddleware.authorizeRoles("admin"), driveController.assignInterviewer)

module.exports = driveRouter;