import e from "express";
import * as fligtsController from "../controllers/flightsQuerry.js";
const router = e.Router();

router.post("/query", fligtsController.flightsQuerry);

export default router;