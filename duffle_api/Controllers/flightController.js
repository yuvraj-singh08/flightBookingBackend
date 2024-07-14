import { Duffel } from '@duffel/api';
import dotenv from 'dotenv';
dotenv.config();
const duffel = new Duffel({
  token: process.env.token,
});

// controller to get offer request details by ID
export async function getOfferRequestById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Parameter "id" is required');
    }

    const offerRequest = await duffel.offerRequests.get(id);
    res.status(200).json(offerRequest);
  } catch (error) {
    console.error('Error fetching offer request:', error);
    res.status(400).json({ error: error });
  }
}

// controller to list offer requests with pagination parameters
export async function listOfferRequests(req, res) {
  try {
    const { after, before, limit } = req.query;

    if (!after && !before) {
      throw new Error('Parameters "after" or "before" are required');
    }

    const query = {
      after,
      before,
      limit: limit ? parseInt(limit, 10) : 1
    };

    const offerRequests = await duffel.offerRequests.list(query);
    res.status(200).json(offerRequests);
  } catch (error) {
    console.error('Error fetching offer requests:', error);
    res.status(400).json({ error: error});
  }
}

// controller to create an offer request
export async function createOfferRequest(req, res) {
  try {
    const offerRequestData = req.body;

    if (!offerRequestData) {
      throw new Error('Request body is required');
    }

    const createdOfferRequest = await duffel.offerRequests.create(offerRequestData);
    res.status(201).json(createdOfferRequest);
  } catch (error) {
    console.error('Error creating offer request:', error);
    res.status(400).json({ error: error });
  }
}

// controller to update an offer request
export async function updateOfferRequestById(req, res) {
  try {
    const { offerId } = req.params;
    const updateData = req.body;

    if (!offerId) {
      throw new Error('Parameter "offerId" is required');
    }

    const updatedOffer = await duffel.offers.update(offerId, updateData);
    res.status(200).json(updatedOffer);
  } catch (error) {
    console.error('Error updating offer request:', error.message);
    res.status(400).json({ error: error.message });
  }
}
// controller to list offers with pagination and filtering
export async function listOffers(req, res) {
  try {
    const { after, before, limit, offer_request_id, sort, max_connections } = req.query;

    if (!after && !before && !offer_request_id) {
      throw new Error('Parameters "after" or "before" or  "request id" are required');
    }

    const query = {
      after,
      before,
      limit: limit ? parseInt(limit, 10) : 1,
      offer_request_id,
      sort,
      max_connections: max_connections ? parseInt(max_connections, 10) : 0
    };

    const offers = await duffel.offers.list(query);
    res.status(200).json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(400).json({ error: error });
  }
}

// controller to get a single offer by ID
export async function getSingleOffer(req, res) {
  try {
    const { id } = req.params;
    const { return_available_services } = req.query;

    if (!id && !return_available_services) {
      throw new Error('Parameter "id" or "return_available_services" is required');
    }

    const offer = await duffel.offers.get(id, {
      return_available_services: return_available_services === 'true'
    });

    res.status(200).json(offer);
  } catch (error) {
    console.error('Error fetching single offer:', error.message);
    res.status(400).json({ error: error.message });
  }
}

// Controller function to get an order by ID
export async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Parameter "id" is required');
    }

    const order = await duffel.orders.get(id);
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error.message);
    res.status(400).json({ error: error.message });
  }
}
export async function addServiceOrder(req, res) {
  try {
      const orderId = req.params.id;
      
      const { paymentType, currency, amount, services } = req.body;

      const orderData = {
          "payment": {
              "type": paymentType,
              "currency": currency,
              "amount": amount
          },
          "add_services": services
      };

      const createdOrder = await duffel.orders.create(orderId, orderData);

      res.status(201).json(createdOrder);
  } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
  }
}

export async function getOrder(req, res) {
  try {
      const orderId = req.params.id;
      const order = await duffel.orders.get(orderId);
      // Check if order exists
      if (!order) {
          return res.status(404).json({ error: 'Order not found' });
      }

      // Send the order details as response
      res.status(200).json(order);
  } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
  }
}

export async function updateOrder (req, res)  {
  try {
      const orderId = req.params.id;

      // Data received from request body or query parameters
      const { customerPrefs, paymentIntentId } = req.body;

      const updateData = {
          "metadata": {
              "customer_prefs": customerPrefs,
              "payment_intent_id": paymentIntentId
          }
      };

      // Call Duffel API to update the order
      const updatedOrder = await duffel.orders.update(orderId, updateData);

      // Send updated order details as response
      res.status(200).json(updatedOrder);
  } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Failed to update order' });
  }
};

export async function listOrders  (req, res) {
  try {
      // Extract query parameters from request
      const {
          after,
          before,
          limit,
          booking_reference,
          offer_id,
          awaiting_payment,
          sort,
          owner_id,
          origin_id,
          destination_id,
          passenger_name,
          requires_action
      } = req.query;

      // Construct query object based on received parameters
      const queryObject = {
          "after": after,
          "before": before,
          "limit": parseInt(limit) || 10, // Default limit to 10 if not provided
          "booking_reference": booking_reference,
          "offer_id": offer_id,
          "awaiting_payment": awaiting_payment === 'true', // Convert string to boolean
          "sort": sort,
          "owner_id[]": owner_id ? owner_id.split(',') : [],
          "origin_id[]": origin_id ? origin_id.split(',') : [],
          "destination_id[]": destination_id ? destination_id.split(',') : [],
          "passenger_name[]": passenger_name ? passenger_name.split(',') : [],
          "requires_action": requires_action === 'true' // Convert string to boolean
      };

      // Call Duffel API to fetch orders with dynamic query parameters
      const orders = await duffel.orders.get(queryObject);

      // Send fetched orders as JSON response
      res.status(200).json(orders);
  } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Controller function to create an order
export async function createOrder(req, res) {

  const {users,type,services,selected_offers,payments,passengers,metadata} = req.body;
  try {
    const orderData = {
      users,
      type,
      services,
      selected_offers,
      payments,
      passengers,
      metadata
    };
    console.log(orderData);

    const createdOrder = await duffel.orders.create(orderData);

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ error: error });
  }
}
export async function createPayment (req, res)  {
  try {
      // Extract payment details from request body
      const { type, currency, amount, order_id } = req.body;

      // Construct payment data object
      const paymentData = {
          payment: {
              type: type || undefined, 
              currency: currency || "GBP",
              amount: amount || undefined
          },
          order_id
      };

      const createdPayment = await duffel.payments.create(paymentData);

      res.status(201).json(createdPayment);
  } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment' });
  }
};

// Controller function to get a seat map by ID
export async function getSeatMap(req, res) {
  try {
    const { offer_id } = req.params;
    const query = {offer_id};

    if (!offer_id) {
      throw new Error('Parameter "id" is required');
    }

    const seatMap = await duffel.seatMaps.get(query);
    res.status(200).json(seatMap);
  } catch (error) {
    console.error('Error fetching seat map:', error.message);
    res.status(400).json({ error: error.message });
  }
}
// Controller function to list cancellation orders with pagination
export async function listCancelOrder(req, res) {
  try {
    const { after, before, limit, order_id } = req.query;

    if (!order_id) {
      throw new Error('Parameter "order_id" is required');
    }

    const query = {
      after,
      before,
      limit: parseInt(limit) || 1,
      order_id
    };

    const cancellations = await duffel.orderCancellations.list(query);
    res.status(200).json(cancellations);
  } catch (error) {
    console.error('Error fetching cancellation orders:', error.message);
    res.status(400).json({ error: error.message });
  }
}
// Controller function to initiate cancellation of an order
export async function pendingOrderCancellation(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      throw new Error('Parameter "id" is required');
    }

    const cancellationResponse = await duffel.orderCancellations.pending(id);
    res.status(200).json(cancellationResponse);
  } catch (error) {
    console.error('Error initiating order cancellation:', error.message);
    res.status(400).json({ error: error.message });
  }
}
// Controller function to confirm cancellation of an order
export async function confirm_order_cancellations(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      throw new Error('Parameter "id" is required');
    }

    const confirmationResponse = await duffel.orderCancellations.confirm(id);
    res.status(200).json(confirmationResponse);
  } catch (error) {
    console.error('Error confirming order cancellation:', error.message);
    res.status(400).json({ error: error.message });
  }
}
// Controller function to get order cancellation details by ID
export async function getOrderCancellationsById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Parameter "id" is required');
    }

    const cancellationDetails = await duffel.orderCancellations.get(id);
    res.status(200).json(cancellationDetails);
  } catch (error) {
    console.error('Error fetching order cancellation details:', error.message);
    res.status(400).json({ error: error.message });
  }
}


export async function orderChangeRequestsById (req, res)  {
  const { id } = req.params;
  if(!id)
  {
    return res.status(400).json({error:"id required"});
  }

  try {
    const orderChangeRequest = await duffel.orderChangeRequests.get(id);
    res.status(200).json(orderChangeRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
// Controller function to retrieve change requests for an order
export async function orderChangeRequests(req, res)  {
  const { slices, private_fares, order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }
  if(!slices && !private_fares)
  {
    return res.status(400).json({error:"slices or  private_fares are required"});
  }

  try {
    const changeRequest = await duffel.orderChangeRequests.create({
      slices: slices,
      private_fares: private_fares,
      order_id: order_id
    });

    res.status(200).json(changeRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function  OrderChangeOffersByid (req, res) {
  const { id } = req.params;
  if(!id)
  {
    return res.status(400).json({error:"id required"});
  }

  try {
    const orderChangeOffers = await duffel.orderChangeOffers.get(id);
    res.status(200).json(orderChangeOffers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


// Controller function to change offers for an order
export async function OrderChangeOffers  (req, res) {
  const { after, before, limit, order_change_request_id, sort, max_connections } = req.query;

  try {
    const orderChangeOffers = await duffel.orderChangeOffers.list({
      after: after,
      before: before,
      limit: limit ? parseInt(limit) :1,
      order_change_request_id: order_change_request_id,
      sort: sort,
      max_connections: max_connections ? parseInt(max_connections) : 0
    });

    res.status(200).json(orderChangeOffers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// API controller to confirm an order change
export async function confirmOrderChange (req, res)  {
  const { orderChangeId, paymentType, currency, amount } = req.body;

  try {
    // Construct payment data object
    const paymentData = {
      type: paymentType,
      currency: currency,
      amount: amount
    };

    // Make the API call to confirm the order change
    const response = await duffel.orderChanges.confirm(orderChangeId, {
      payment: paymentData
    });

    res.status(200).json({ message: 'Order change confirmed', response });
  } catch (error) {
    console.error('Error confirming order change:', error.message);
    res.status(400).json({ error: error.message });
  }
}

export async function createPendingOrderChange(req, res)  {
  const { selected_order_change_offer } = req.body;

  try {
    // Make the API call to create the order change
    const response = await duffel.orderChanges.create({
      selected_order_change_offer
    });

    res.status(201).json({ message: 'Order change created', response });
  } catch (error) {
    console.error('Error creating order change:', error.message);
    res.status(400).json({ error: error.message });
  }
}

export async function orderChangeById (req, res)  {
  const { id } = req.params;

  try {
    // Make the API call to get the order change by ID
    const orderChange = await duffel.orderChanges.get(id);

    if (!orderChange) {
      return res.status(404).json({ error: 'Order change not found' });
    }

    res.status(200).json(orderChange);
  } catch (error) {
    console.error('Error fetching order change:', error.message);
    res.status(400).json({ error: error.message });
  }
}
