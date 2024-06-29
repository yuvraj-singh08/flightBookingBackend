import { getAvailableFlights, getData, getFlightPrice } from "../utils/flights.js";


const getDateOnly = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // Month is zero-based
    const day = date.getDate();
    return new Date(year, month, day);
  };
  
export async function flightsQuerry(req, res) {
    try {
        const { from, to, cabinPref, passengerQuantity, departureDate } = req.body;
        console.log(departureDate);
        const newDate = new Date(departureDate);
        console.log(newDate);
        const dateString = newDate.toISOString().slice(0, 10);
        const response = await getAvailableFlights({ from, to, cabinPref, passengerQuantity, dateString })
        const segments = response.KIU_AirAvailRS.OriginDestinationInformation[0].OriginDestinationOptions[0].OriginDestinationOption;
        const flights = getData(segments);
        // const price = await getFlightPrice(flights);
        return res.json(flights)
    } catch (error) {
        res.json({ error: error.message })
    }
}