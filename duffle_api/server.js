import express from 'express';
import dotenv from 'dotenv';
import bodyParser from "body-parser";
import flightroutes from "./Routes/flightroutes.js";
import { Duffel } from "@duffel/api";
dotenv.config();
const app = express();
app.use(express.json());
const port = 8000;
app.use('/api', flightroutes);
const duffel = new Duffel({
      token: process.env.token,
    })

app.use(bodyParser.json());

app.listen(port, (err, res) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Server is up and running on port " + port);
    }
});


// app.post('/create-offer-request', async (req, res) => {
//   try {
//     const offerRequestData = req.body;

//     const offerRequest = await duffel.offerRequests.create(offerRequestData);
//     res.status(200).json(offerRequest);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/get-offer/:id', async (req, res) => {
//     try {
//       const { id } = req.params; // Get the offer ID from the URL parameters
//       const offer = await duffel.offers.get(id, {
//         return_available_services: true,
//       });
//       res.status(200).json(offer);
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });

// //   app.post('/create-order', async (req, res) => {
// //     try {
// //       const orderData = req.body; // Accept request body from the client
  
// //       const order = await duffel.orders.create(orderData);
// //       res.status(200).json(order);
// //     } catch (error) {
// //       res.status(500).json({ error: error });
// //     }
// //   });



//   app.post('/create-order', async (req, res) => {
//     try {
  
//       const order = await duffel.orders.create({
//         "users": [
//           "icu_00009htyDGjIfajdNBZRlw"  
//         ],
//         "type": "instant",  
//         "services": [
//           {
//             "quantity": 1,
//             "id": "ase_00009hj8USM7Ncg31cB123"  
//           }
//         ],
//         "selected_offers": [
//           "off_00009htyDGjIfajdNBZRlw"  
//         ],
//         "payments": [
//           {
//             "type": "balance",  
//             "currency": "GBP",  
//             "amount": "30.20"  
//           }
//         ],
//         "passengers": [
//           {
//             "user_id": "icu_00009htyDGjIfajdNBZRlw",
//             "title": "mrs",  
//             "phone_number": "+442080160509",  
//             "infant_passenger_id": "pas_00009hj8USM8Ncg32aTGHL",
//             "identity_documents": [
//               {
//                 "unique_identifier": "19KL56147",  
//                 "type": "passport",  
//                 "issuing_country_code": "GB",  // Issuing country code
//                 "expires_on": "2025-04-25"  // Expiry date of the document
//               }
//             ],
//             "id": "pas_00009hj8USM7Ncg31cBCLL",  // Passenger ID
//             "given_name": "Amelia",  // Passenger's given name
//             "gender": "f",  // Passenger's gender
//             "family_name": "Earhart",  // Passenger's family name
//             "email": "amelia@duffel.com",  // Passenger's email address
//             "born_on": "1987-07-24"  // Passenger's date of birth
//           }
//         ],
//         "metadata": {
//           "payment_intent_id": "pit_00009htYpSCXrwaB9DnUm2"  // Optional metadata
//         }
//       }).then(order => {
//         console.log('Order created:', order);
//       }).catch(error => {
//         console.error('Error creating order:', error);
//       });
      
//       res.status(200).json(order);
//     } catch (error) {
//       res.status(500).json({ error: error });
//     }
//   });



