import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import { createRequire } from 'module';
const require=createRequire(import.meta.url);
require('dotenv').config();
import { config as dotenvConfig } from "dotenv";
import Amadeus from "amadeus";
import { createServer } from 'http';
import { Server } from 'socket.io';
dotenvConfig();

const app = express();
const server = http.createServer(app);
let confirmOrder = "";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("> DB connection successful ... ");
    });

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

app.get('/', (req, res) => {
    res.send('The server is working fine and running on port 8000s'); // Replace with your desired response
});

// If you are directing using this endpoint in your browser then the endpoint will be /citySearch?keyword="your_keyword
// for example /citySearch?keyword=BOG

app.get("/citySearch", async (req, res) => {
    console.log(req.query);
    const { keywords } = req.query.keyword;
  
    if (!keywords) {
      return res.status(400).json({
        error: "Missing 'keyword' query parameter"
      });
    }
  
    try {
      const response = await amadeus.referenceData.locations.get({
        keyword:keywords,
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
  
  // if usimg directly on the browser use this example synatx 
  // http://localhost:2800/date?departure=2024-06-30&arrival=2024-07-01&locationDeparture=BOG&locationArrival=CCS

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

app.post("/flightprice", async (req, res) => {
  res.json(req.body);
  const { inputFlight } = req.body;

  try {
    const responsePricing = await amadeus.shopping.flightOffers.pricing.post({
      data: {
        type: "flight-offers-pricing",
        flightOffers: inputFlight
      }
    });
    res.json(JSON.parse(responsePricing.body));
  } catch (err) {
    res.json(err);
  }
});

app.post("/flightprice", async function (req, res) {
    let inputFlight;
    res.json(req.body);
    inputFlight = req.body;
    console.log(req.body);
  
    const responsePricing = await amadeus.shopping.flightOffers.pricing
      .post(
        JSON.stringify({
          data: {
            type: "flight-offers-pricing",
            flightOffers: inputFlight,
          },
        })
      )
      .catch((err) => console.log(err));
  
    try {
      res.json(JSON.parse(responsePricing.body));
    } catch (err) {
      res.json(err);
    }
  });

app.get("/flightcreateorderget", (req, res) => {
  res.send(JSON.stringify(confirmOrder));
});

app.post("/combinedFlightSearch", async (req, res) => {
  try {
    const { from, to, departureDate } = req.body;
    const amadeusResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: departureDate,
      adults: "1",
    });

    const kiuResponse = await axios.get('http://kiu-api.com/flights', {
      params: {
        from: from,
        to: to,
        departureDate: departureDate,
      }
    });

    const amadeusFlights = JSON.parse(amadeusResponse.body);
    const kiuFlights = kiuResponse.data;

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