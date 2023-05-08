const express = require('express')
const router = express.Router();
const { newOrder, getSingleOrder, myOrders, getAllOrders, updateOrder, deleteOrder } = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authentication');


router.route('/order/new').post(isAuthenticatedUser, newOrder);

router.route('/order/:id').get(isAuthenticatedUser, getSingleOrder);

router.route('/my/orders').get(isAuthenticatedUser, myOrders);

router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);

router.route('/admin/order/update/:id').put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder);

router.route('/admin/order/delete/:id').delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);



module.exports = router;