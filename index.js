import express from "express";
import cors from 'cors';
import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config({ path: ".env" });
import AppError from "./utils/error.js";
import axiosInstance from "./utils/axios.js";
import xml2js from "xml2js";
import flightQuerryRoutes from "./routes/flightQueryRoutes.js"

const app = express();
app.use(express.json());
app.use(cors());


mongoose
    .connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("> DB connection successful ... ");
    });


app.use("/flights", flightQuerryRoutes);


const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`> App running on port ${PORT} ...`);
});
