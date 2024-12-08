import mongoose from 'mongoose';

// Define the schema for the 'all_locations' collection in MongoDB  //final_locations
const locationSchema = new mongoose.Schema({
    location_type: { 
        type: String 
    },
    name: { 
        type: String 
    },
    lat: { 
        type: Number 
    },
    lon: { 
        type: Number 
    },
    latitude: {
        type: Number 
    },

    longitude: {
        type: Number 
    }
    // more can be added
});

const Location = mongoose.model('all_locations', locationSchema);
//change to final_locations
export default Location;
