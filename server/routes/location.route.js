import express from 'express';
import Location from '../models/location.model.js';

const router = express.Router();

// Route to fetch all locations
router.get('/locations', async (req, res) => {
    try {
        const locations = await Location.find({}); 

        if (!locations || locations.length === 0) {
            return res.status(404).json({ message: 'No locations found' });
        }

        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations', error });
    }
});

// Route to fetch locations near the user's coordinates
router.get('/locations/nearby', async (req, res) => {
    const { lat, lon, distance = 2000 } = req.query; // Default set to 2000 meters

    // Validate that lat and lon are provided
    if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    try {
        const latNumber = parseFloat(lat);
        const lonNumber = parseFloat(lon);

        // Query for documents with lat/lon fields
        // $ symbol for MongoDB query operations 
        const nearbyLocations = await Location.find({
            lat: { $exists: true },
            lon: { $exists: true },
            // Calculate the Euclidean distance (Haversine approximation in degrees)
            //sqrt( (lat1 - lat2)^2 + (lon1 - lon2)^2 ) < (distance / 111320)
            $expr: {
                $lt: [
                    {
                        $sqrt: {
                            $add: [
                                // (lat1 - lat2)^2
                                { $pow: [{ $subtract: [{ $toDouble: "$lat" }, latNumber] }, 2] },
                                 // (lon1 - lon2)^2
                                { $pow: [{ $subtract: [{ $toDouble: "$lon" }, lonNumber] }, 2] }
                            ]
                        }
                    },
                    distance / 111320  // Convert distance from meters to degrees
                ]
            }
        });

        if (!nearbyLocations || nearbyLocations.length === 0) {
            return res.status(404).json({ message: 'No nearby locations found' });
        }

        res.status(200).json(nearbyLocations);
    } catch (error) {
        console.error('Error fetching nearby locations:', error);
        res.status(500).json({ message: 'Error fetching nearby locations', error });
    }
});

router.get('/filter', async (req, res) => {
    try {
        const { location_type, accessible, sensory_friendly, bathrooms, borough, restroom_type, station_line, ada_accessible_comfort_station, boardwalk, operator, ada_status, changing_station} = req.query;

        let filter = {};

        if (location_type){
            filter.location_type = location_type;
        }

        if (location_type==='playground'){
            if(accessible){
                filter.Accessible = accessible;
            }
            if(sensory_friendly){
                filter["Sensory-Friendly"] = sensory_friendly;
            }
            if(ada_accessible_comfort_station){
                filter["ADA_Accessible_Comfort_Station"] = ada_accessible_comfort_station;
            }
        }
        else if(location_type==='beach'){
            if(accessible){
                filter.Accessible = accessible;
            }
            if(bathrooms){
                filter.Bathrooms = bathrooms;
            }
            if(boardwalk){
                filter.Boardwalk = boardwalk;
            }
        }
        else if(location_type==='pedestrian_signal'){
            if(accessible){
                filter.Accessible = accessible;
            }
            if(borough){
                filter.borough = borough;
            }
        }
        else if(location_type==='restroom'){
            if(accessible){
                filter.Accessible = accessible;
            }
            if(restroom_type){
                filter.restroom_type = restroom_type;
            }
            if(operator){
                filter.operator = operator;
            }
            if(changing_station){
                filter.changing_stations = changing_station;
            }
        }
        else if(location_type==='restroom'){
            if(accessible){
                filter.Accessible = accessible;
            }
            if(station_line){
                filter.station_line = station_line;
            }
            if(ada_status){
                filter.ADA_Status = ada_status;
            }
        }
        else{
            return res.status(400).json({ message: "Invalid location type" });
        }

        const locations = await Location.find(filter); 

        if (!locations || locations.length === 0) {
            return res.status(404).json({ message: 'No locations found' });
        }

        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations', error });
    }
});

export default router;
