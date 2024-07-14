import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import { createRequire } from 'module';
const require=createRequire(import.meta.url);
require('dotenv').config();
import { config as dotenvConfig } from "dotenv";
import Amadeus from "amadeus";
dotenvConfig();

const app = express();
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
    res.send('The server is working fine and running on port 8000s');
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

    // Check if the response body is valid JSON
    let responseBody;
    try {
      responseBody = JSON.parse(response.body);
    } catch (parseError) {
      console.error("Error parsing response body:", parseError);
      return res.status(500).json({
        error: "Invalid response format from Amadeus API"
      });
    }

    res.json(responseBody);
  } catch (error) {
    console.error("Error fetching flight dates:", error);
    res.status(500).json({
      error: "Failed to fetch flight dates",
      message: error.message // Additional error message for more context
    });
  }
});

// Nearest Airport 
// {{base_url}}/airport?latitude=22.8056&longitude=86.2039
// It fetches the nearest airport from that location manually
// without navigator function in frontend

app.get("/airport", async (req, res) => {
  const { longitude, latitude } = req.query;

  // Validate the presence of longitude and latitude
  if (!longitude || !latitude) {
    return res.status(400).json({
      error: "Longitude and latitude are required"
    });
  }

  // Validate that longitude and latitude are numbers
  const lon = parseFloat(longitude);
  const lat = parseFloat(latitude);

  if (isNaN(lon) || isNaN(lat)) {
    return res.status(400).json({
      error: "Longitude and latitude must be valid numbers"
    });
  }

  try {
    const response = await amadeus.referenceData.locations.airports.get({
      longitude: lon,
      latitude: lat
    });

    // Check if the response body is a valid JSON
    let responseBody;
    try {
      responseBody = JSON.parse(response.body);
    } catch (parseError) {
      return res.status(500).json({
        error: "Failed to parse response from Amadeus API"
      });
    }

    res.json(responseBody);
  } catch (error) {
    console.error("Error fetching nearest airport:", error);

    // Handle specific errors from Amadeus API
    if (error.response) {
      return res.status(error.response.statusCode || 500).json({
        error: error.response.body || "Failed to fetch nearest airport"
      });
    }

    res.status(500).json({
      error: "Failed to fetch nearest airport"
    });
  }
});

// Nearest Airport 
// {{base_url}}/airport
// It fetches the nearest airport from that location automatically
// Using navigator function in frontend
app.post("/airport", async (req, res) => {
  const { longitude, latitude } = req.body; // Extract longitude and latitude from request body
  console.log("longitude",longitude);
  console.log("latitude=",latitude);

  // Validate the presence of longitude and latitude
  if (!longitude || !latitude) {
    return res.status(400).json({
      error: "Longitude and latitude are required"
    });
  }

  // Validate that longitude and latitude are numbers
  const lon = parseFloat(longitude);
  const lat = parseFloat(latitude);

  if (isNaN(lon) || isNaN(lat)) {
    return res.status(400).json({
      error: "Longitude and latitude must be valid numbers"
    });
  }

  try {
    const response = await amadeus.referenceData.locations.airports.get({
      longitude: lon,
      latitude: lat
    });

    // Check if the response body is a valid JSON
    let responseBody;
    try {
      responseBody = JSON.parse(response.body);
    } catch (parseError) {
      return res.status(500).json({
        error: "Failed to parse response from Amadeus API"
      });
    }

    res.json(responseBody);
  } catch (error) {
    console.error("Error fetching nearest airport:", error);

    // Handle specific errors from Amadeus API
    if (error.response) {
      return res.status(error.response.statusCode || 500).json({
        error: error.response.body || "Failed to fetch nearest airport"
      });
    }

    res.status(500).json({
      error: "Failed to fetch nearest airport"
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


app.get("/monthlyFlightCharges", async (req, res) => {
  // console.time();
  const startTime = Date.now();
  const { origin, destination, month } = req.query;

  if (!origin || !destination || !month) {
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime} ms`);
    return res.status(400).json({
      error: "Missing 'origin', 'destination', or 'month' query parameter"
    });
  }

  const [year, monthNum] = month.split('-');
  
  // Validate the month format
  if (!/^\d{4}-\d{2}$/.test(month)) {
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime} ms`);
    return res.status(400).json({
      error: "Invalid 'month' format. Please use 'YYYY-MM'."
    });
  }

  const numDays = new Date(year, monthNum, 0).getDate();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  // Check if the requested month is in the future
  if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(monthNum) < currentMonth)) {
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime} ms`);
    return res.status(400).json({
      error: "The requested month is in the past. Please request a future month."
    });
  }

  const aggregatedResults = [];

  try {
    for (let day = 1; day <= numDays; day++) {
      const date = `${year}-${monthNum.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      // Skip past dates if the requested month is the current month
      if (parseInt(year) === currentYear && parseInt(monthNum) === currentMonth && day < currentDay) {
        continue;
      }
console.time("executed");
      const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: date,
        adults: 1
      });
console.timeEnd("executed");
      const flightOffers = response.data;

      if (flightOffers && flightOffers.length > 0) {
        const minFare = flightOffers.reduce((min, offer) => {
          const price = parseFloat(offer.price.total);
          return price < min ? price : min;
        }, Infinity);

        // Ensure minFare is not Infinity (no offers case)
        if (minFare !== Infinity) {
          aggregatedResults.push({ date, minFare });
        }
      }
    }

    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime} ms`);

    res.json({
      month: month,
      origin: origin,
      destination: destination,
      fares: aggregatedResults
    });
  } catch (error) {
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime} ms`);

    console.error("Error fetching flight offers:", error);
    res.status(500).json({
      error: "Failed to fetch flight offers",
      message: error.message
    });
  }
});



// // // Start the server

const PORT = process.env.port || 8080;
app.listen(PORT, () => {
    console.log(`> App running on port ${PORT} ...`);
});