const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Public
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/resetPassword", userController.resetPassword);

// Logged in account
router.patch('/updateprofile', authenticate, authorize('customer', 'admin'), userController.updateProfile);
router.delete('/deleteprofile', authenticate, authorize('customer', 'admin'), userController.deleteProfile);

module.exports = router;
