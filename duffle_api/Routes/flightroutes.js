import express from 'express';
import * as controllers from '../Controllers/flightController.js';

const router = express.Router();

// Define routes and their corresponding controller functions
router.get('/offer-requests/:id', controllers.getOfferRequestById);
router.get('/offer-requests', controllers.listOfferRequests);
router.post('/offer-requests', controllers.createOfferRequest);
router.put('/offer-requests/:offerId', controllers.updateOfferRequestById);

router.get('/offers/:id', controllers.getSingleOffer);
router.get('/offers', controllers.listOffers);

router.get('/orders/:id', controllers.getOrderById);
router.post('/orders/:id/add-services', controllers.addServiceOrder);
router.get('/orders/:id', controllers.getOrder);
router.put('/orders/:id', controllers.updateOrder);
router.post('/orders', controllers.createOrder);
router.post('/payments', controllers.createPayment);

router.get('/seat-maps/:offer_id', controllers.getSeatMap);

router.get('/cancel-orders', controllers.listCancelOrder);
router.post('/cancel-orders/pending', controllers.pendingOrderCancellation);
router.post('/cancel-orders/confirm', controllers.confirm_order_cancellations);
router.get('/cancel-orders/:id', controllers.getOrderCancellationsById);

router.get('/order-change-requests/:id', controllers.orderChangeRequestsById);
router.post('/order-change-requests', controllers.orderChangeRequests);
router.get('/order-change-offers/:id', controllers.OrderChangeOffersByid);
router.get('/order-change-offers', controllers.OrderChangeOffers);
router.post('/order-change-confirm', controllers.confirmOrderChange);
router.post('/order-change-create', controllers.createPendingOrderChange);
router.get('/order-change/:id', controllers.orderChangeById);

export default router;

