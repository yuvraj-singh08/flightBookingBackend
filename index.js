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
app.post('/flightprice', async (req, res) => {
  try {
    // Perform flight offers search
    const flightOffersSearchResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: 'MAD',
      destinationLocationCode: 'ATH',
      departureDate: '2024-07-09',
      adults: 1
    });

    // Extract relevant data for flight pricing
    const flightOffer = flightOffersSearchResponse.data[0]; // Assuming data structure matches

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
});// Endpoint to get confirmed order
app.get("/flightcreateorderget", (req, res) => {
  res.send(JSON.stringify(confirmOrder));
});


// Endpoint to getFlight Cheapest Date Search
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


// Combined flight search endpoint
app.post("/combinedFlightSearch", async (req, res) => {
  try {
    const { from, to, departureDate } = req.body;

    // Example of Axios request with SSL certificate bypass
    const kiuResponse = await axios.get('https://kiu-api.com/flights', {
      params: {
        from: from,
        to: to,
        departureDate: departureDate,
      },
      // SSL certificate bypass configuration
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    });

    // Handle responses as needed
    const kiuFlights = kiuResponse.data;

    // Example Amadeus request
    const amadeusResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: departureDate,
      adults: "1",
    });

    const amadeusFlights = JSON.parse(amadeusResponse.body);

    // Return combined flights
    const combinedFlights = {
      amadeus: amadeusFlights,
      kiu: kiuFlights,
    };
    res.json(combinedFlights);
  } catch (error) {
    console.error("Error in combined flight search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`> App running on port ${PORT} ...`);
});

