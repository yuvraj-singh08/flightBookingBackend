import { getAvailableFlights, getData, getFlightPrice } from "../utils/flights.js";

export async function flightsQuerry(req, res) {
    try {
        const { from, to, cabinPref, passengerQuantity } = req.body;
        const response = await getAvailableFlights({ from, to, cabinPref, passengerQuantity })
        const segments = response.KIU_AirAvailRS.OriginDestinationInformation[0].OriginDestinationOptions[0].OriginDestinationOption;
        const flights = getData(segments);
        // const price = await getFlightPrice(flights);
        return res.json(flights)
    } catch (error) {
        res.json({ error: error.message })
    }
}