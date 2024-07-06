import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios"; // Import Axios
import { createRequire } from 'module';
const require=createRequire(import.meta.url);
require('dotenv').config();
import { config as dotenvConfig } from "dotenv";
import Amadeus from "amadeus";
import https from 'https'; // Import https module for custom https agent
dotenvConfig();

const app = express();
const server = http.createServer(app);
let confirmOrder = "";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

// Root route
app.get('/', (req, res) => {
    res.send('The server is working fine and running on port 8000s'); // Replace with your desired response
});

// City search endpoint
//http://localhost:8000/citySearch?keyword=del

app.get("/citySearch", async (req, res) => {
    console.log(req.query);
    const { keyword } = req.query;
  
    if (!keyword) {
      return res.status(400).json({
        error: "Missing 'keyword' query parameter"
      });
    }
  
    try {
      const response = await amadeus.referenceData.locations.get({
        keyword: keyword,
        subType: "CITY,AIRPORT"
      });
  
      res.json(JSON.parse(response.body));
    } catch (error) {
      console.error("Error fetching city search:", error);
      res.status(500).json({
        error: "Failed to fetch city search"
      });
    }
});


// Flight offers search by date endpoint
//http://localhost:8000/date?departure=2024-07-10
//&arrival=2024-07-15&locationDeparture=JFK&locationArrival=LAX

app.get("/date", async (req, res) => {
  const { departure, arrival, locationDeparture, locationArrival } = req.query;

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: locationDeparture,
      destinationLocationCode: locationArrival,
      departureDate: departure,
      adults: "1"
    });

    res.json(JSON.parse(response.body));
  } catch (err) {
    console.error("Error fetching flight offers:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Flight offers search by date (POST version) endpoint
app.post("/date", async (req, res) => {
  console.log(req.body);
  const { departure, arrival, locationDeparture, locationArrival } = req.body;


  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: locationDeparture,
      destinationLocationCode: locationArrival,
      departureDate: departure,
      adults: "1"
    });
    res.json(JSON.parse(response.body));
  } catch (err) {
    res.json(err);
  }
});

//Flight Offer Price by flightprice (post) endpoint 
// The body will have departure, arrival, locationDeparture, locationArrival

app.post('/flightprice', async (req, res) => {

  console.log("Body =",req.body);

  const { departure, arrival, locationDeparture, locationArrival } = req.body;
  try {
    // Perform flight offers search
    const flightOffersSearchResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: locationDeparture,
      destinationLocationCode: locationArrival,
      departureDate: departure,
      adults: 1
    });
    // const flightOffer = flightOffersSearchResponse.data[0]; // This method will select the first offer always
    // The below mentioned method will select the lowest price from the flight offer search

    const flightOffer = flightOffersSearchResponse.data.reduce((min, offer) => offer.price < min.price ? offer : min);

    // Perform flight pricing
    const flightPricingResponse = await amadeus.shopping.flightOffers.pricing.post(
      JSON.stringify({
        'data': {
          'type': 'flight-offers-pricing',
          'flightOffers': [flightOffer]
        }
      }), { include: 'credit-card-fees,detailed-fare-rules' }
    );

    // Send response back to client
    res.json(flightPricingResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for flight create orders using book-flight (post) method 
app.post('/book-flight', async (req, res) => {
  const { origin, destination, departureDate, adults, traveler } = req.body;

  try {
    // Perform flight offers search
    const flightOffersResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: adults
    });

    // Extract the first flight offer from the search response
    const firstFlightOffer = flightOffersResponse.data[0];

    // Perform flight offers pricing
    const pricingResponse = await amadeus.shopping.flightOffers.pricing.post(
      JSON.stringify({
        "data": {
          "type": "flight-offers-pricing",
          "flightOffers": [firstFlightOffer]
        }
      })
    );

    // Extract the priced flight offer
    const pricedFlightOffer = pricingResponse.data.flightOffers[0];

    // Perform flight booking
    const bookingResponse = await amadeus.booking.flightOrders.post(
      JSON.stringify({
        'data': {
          'type': 'flight-order',
          'flightOffers': [pricedFlightOffer],
          'travelers': [traveler]
        }
      })
    );

    // Send the booking response back to the client
    res.json(bookingResponse.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get confirmed orders
app.get("/flightcreateorderget", (req, res) => {
  res.send(JSON.stringify(confirmOrder));
});


// Endpoint to getFlight Cheapest Date Search
// example {{base_url}}/flightDates?origin=MAD&destination=MUC
// It fetches the price of flights  around(full week) that date 
app.get("/flightDates", async (req, res) => {
  console.log(req.query);
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({
      error: "Missing 'origin' or 'destination' query parameter"
    });
  }

  try {
    const response = await amadeus.shopping.flightDates.get({
      origin: origin,
      destination: destination
    });

    res.json(JSON.parse(response.body));
  } catch (error) {
    console.error("Error fetching flight dates:", error);
    res.status(500).json({
      error: "Failed to fetch flight dates"
    });
  }
});

// Nearest Airport 
// {{base_url}}/airport?latitude=22.8056&longitude=86.2039
// It fetches the nearest airport from that location
app.get("/airport", async (req, res) => {

  const {longitude,latitude}=req.query;
  try {
    
    const response = await amadeus.referenceData.locations.airports.get({
      longitude : longitude,
      latitude  : latitude
    })

    res.json(JSON.parse(response.body));
  } catch (error) {
    console.error("Error fetching nearest airport:", error);
    res.status(500).json({
      error: "Failed to fetch nearest airport "
    });
  }
});

// It fetches the status of the flight 
// {{base_url}}/Status?carrierCode=AZ&flightNumber=319&scheduleDepartureDate=2024-07-08
app.get("/Status", async (req, res) => {

  const { carrierCode, flightNumber,scheduleDepartureDate } = req.query;

  if (!carrierCode || !flightNumber || !scheduleDepartureDate) {
    return res.status(400).json({
      error: "Missing 'carrierCode' or 'flightNumber' or 'scheduleDepartureDate' query parameter"
    });
  }

  try {
    const response = await amadeus.schedule.flights.get({
      carrierCode: carrierCode,
      flightNumber: flightNumber,
      scheduledDepartureDate: scheduleDepartureDate
    })

    res.json(JSON.parse(response.body));
  } catch (error) {
    console.error("Error fetching flight status:", error);
    res.status(500).json({
      error: "Failed to fetch flight status"
    });
  }
});

//This endpoint is the mixture of flight-offer-search , flight offer price , flight create orders

app.post('/book-cheapest-flight', async (req, res) => {
  const { origin, destination, departureDate, adults, traveler } = req.body;

  try {
    // Step 1: Perform flight offers search
    const flightOffersResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: adults
    });

    // Step 2: Find the cheapest flight offer
    const cheapestFlightOffer = flightOffersResponse.data.reduce((min, offer) => {
      return offer.price.total < min.price.total ? offer : min;
    }, flightOffersResponse.data[0]);

    // Step 3: Perform flight offers pricing for the cheapest offer
    const pricingResponse = await amadeus.shopping.flightOffers.pricing.post(
      JSON.stringify({
        "data": {
          "type": "flight-offers-pricing",
          "flightOffers": [cheapestFlightOffer]
        }
      })
    );

    // Step 4: Perform flight booking with the priced flight offer
    const bookingResponse = await amadeus.booking.flightOrders.post(
      JSON.stringify({
        'data': {
          'type': 'flight-order',
          'flightOffers': [pricingResponse.data.flightOffers[0]],
          'travelers': [traveler]
        }
      })
    );

    // Send the booking response back to the client
    res.json(bookingResponse.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Combined flight search endpoint of amadeus and kiu 




const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`> App running on port ${PORT} ...`);
});

