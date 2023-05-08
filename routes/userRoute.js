const express = require('express');
const { registerUser, loginUser, logoutUser, forgotPassword, resetPassword, getUserDetails, updateUserPassword, updateUserProfile, getAllUsers, getSingleUser, updateUser, deleteUser } = require('../controllers/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authentication');
const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/logout', logoutUser);

router.post('/password/forgot', forgotPassword);

router.put('/password/reset/:token', resetPassword);

router.get('/myaccount', isAuthenticatedUser, getUserDetails);

router.put('/password/update', isAuthenticatedUser, updateUserPassword);

router.put('/myaccount/update', isAuthenticatedUser, updateUserProfile);

router.get('/admin/users', isAuthenticatedUser,  authorizeRoles("admin"), getAllUsers);

router.get('/admin/user/:id', isAuthenticatedUser,  authorizeRoles("admin"), getSingleUser);

router.put('/admin/account/update/:id', isAuthenticatedUser,  authorizeRoles("admin"), updateUser);

router.delete('/admin/user/delete/:id', isAuthenticatedUser,  authorizeRoles("admin"), deleteUser);


module.exports = router;