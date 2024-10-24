import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Def custom icons for each location type
const beachIconUrl = '/assets/beach.png';
const playgroundIconUrl = '/assets/playground.png';
const signalIconUrl = '/assets/signal.png';
const subwayIconUrl = '/assets/subway.png';
const restroomIconUrl = '/assets/restroom.png';

// Create Leaflet icons for specific location types
const beachIcon = L.icon({
    iconUrl: beachIconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

const playgroundIcon = L.icon({
    iconUrl: playgroundIconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

const signalIcon = L.icon({
    iconUrl: signalIconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

const subwayIcon = L.icon({
    iconUrl: subwayIconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

const restroomIcon = L.icon({
    iconUrl: restroomIconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

// Function to select the correct icon based on the location type
const getIconByLocationType = (type) => {
    switch (type) {
        case 'beach':
            return beachIcon;
        case 'playground':
            return playgroundIcon;
        case 'pedestrian_signal':
            return signalIcon;
        case 'subway_stop':
            return subwayIcon;
        case 'restroom':
            return restroomIcon;
        default:
            return L.icon({
                iconUrl: '',  // No image URL, broken image icon
                iconSize: [30, 30],  
                iconAnchor: [15, 30],  
                popupAnchor: [0, -30],  
            });
    }
};

// Function to calculate the center of nearby locations
const calculateCenter = (nearbyLocations, selectedLocation) => {
    if (selectedLocation) {
            return [selectedLocation.lat, selectedLocation.lon];
        }
    

    if (nearbyLocations.length === 0) {
        // Default to NYC center if no nearby locations are available
        return [40.7128, -74.0060];
    }

    let totalLat = 0;
    let totalLon = 0;

    nearbyLocations.forEach(location => {
        totalLat += location.lat || location.latitude;
        totalLon += location.lon || location.longitude;
    });

    return [
        totalLat / nearbyLocations.length,
        totalLon / nearbyLocations.length
    ];
};

// This component updates the map's center when nearby locations change
const MapCenterUpdater = ({ nearbyLocations, selectedLocation}) => {
    const map = useMap(); 
    useEffect(() => {
        if (selectedLocation && selectedLocation.lat && selectedLocation.lon) {
            // Check selected location
            const newCenter = [selectedLocation.lat, selectedLocation.lon];
            map.setView(newCenter, 13); // Center map on the selected location
        } else {
            const newCenter = calculateCenter(nearbyLocations);
        map.setView(newCenter);  // Update the map's center
        }
    }, [nearbyLocations, selectedLocation, map]);

    return null;
};

const MapComponent = ({ locations, nearbyLocations = [], selectedLocation }) => {
    const [filter, setFilter] = useState('all');  // State for filtering location types
    const [showNearby, setShowNearby] = useState(true);  // Default to showing nearby locations

    useEffect(() => {
        selectedLocation ? setShowNearby(false) : setShowNearby(true);
    }, [selectedLocation]);

    // Determine the locations to show based on the showNearby state
    const locationsToShow = showNearby ? nearbyLocations : locations;

    // Filter the locations based on the selected filter (e.g., playground, beach, etc.)
    const filteredLocations = selectedLocation
    ? locationsToShow.filter(location => location.Name === selectedLocation)
    : filter === 'all'
        ? locationsToShow
        : locationsToShow.filter(location => location.location_type === filter);

    return (
        <div>
            {/* Dropdown filter to choose which location type to display */}
            <div>
                <label htmlFor="filter">Filter by Location Type: </label>
                <select 
                    id="filter" 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="playground">Playgrounds</option>
                    <option value="pedestrian_signal">Pedestrian Signals</option>
                    <option value="beach">Beaches</option>
                    <option value="subway_stop">Subway Stops</option>
                    <option value="restroom">Restrooms</option>
                </select>

                {/* Checkbox to toggle between showing all or nearby locations */}
                <label htmlFor="showNearby" style={{ marginLeft: '10px' }}>
                    <input
                        id="showNearby"
                        type="checkbox"
                        checked={showNearby}
                        onChange={() => setShowNearby(!showNearby)}
                    />
                    Show Nearby Locations Only
                </label>
            </div>

            <MapContainer center={[40.7128, -74.0060]} zoom={13} style={{ height: '75vh', width: '100vw' }}>
                {/* Add OpenStreetMap tile layer */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* This component will update the map center when nearbyLocations changes */}
                <MapCenterUpdater nearbyLocations={nearbyLocations} selectedLocation={selectedLocation}  />

                {/* Render Markers for filtered locations */}
                {filteredLocations.map((location, index) => {
                    const lat = location.lat || location.latitude;
                    const lon = location.lon || location.longitude;

                    if (lat && lon) {
                        return (
                            <Marker 
                                key={index} 
                                position={[lat, lon]} 
                                icon={getIconByLocationType(location.location_type)}
                            >
                               <Popup>
                                    {/* Display different information based on the location_type */}
                                    {location.location_type === 'beach' && (
                                        <div>
                                            <strong>{location.Name || 'Unnamed Beach'}</strong><br />
                                            <strong>Location:</strong> {location.Location}<br />
                                            <strong>Accessible:</strong> {location.Accessible}<br />
                                            <strong>Barbecue Allowed:</strong> {location.Barbecue_Allowed}<br />
                                            <strong>Concession Stand:</strong> {location.Concession_Stand}<br />
                                            <strong>Description:</strong> <div dangerouslySetInnerHTML={{ __html: location.Description }}></div><br />
                                            <strong>Directions:</strong> <div dangerouslySetInnerHTML={{ __html: location.Directions }}></div>
                                        </div>
                                    )}
                                    {location.location_type === 'subway_stop' && (
                                        <div>
                                            <strong>{location.Name || 'Unnamed Subway Station'}</strong><br />
                                            <strong>Location:</strong> {location.Location}<br />
                                            <strong>ADA Status:</strong> {location.ADA_Status}<br />
                                            <strong>Lines:</strong> {location.line}<br />
                                            <strong>Accessible:</strong> {location.Accessible}<br />
                                        </div>
                                    )}
                                    {location.location_type === 'restroom' && (
                                        <div>
                                            <strong>{location.facility_name || 'Unnamed Restroom'}</strong><br />
                                            <strong>Location:</strong> {location.Location}<br />
                                            <strong>Operator:</strong> {location.operator}<br />
                                            <strong>Hours of Operation:</strong> {location.hours_of_operation}<br />
                                            <strong>Status:</strong> {location.status}<br />
                                            <strong>Accessible:</strong> {location.Accessible ? 'Yes' : 'No'}<br />
                                        </div>
                                    )}
                                    {location.location_type === 'playground' && (
                                        <div>
                                            <strong>{location.Name || 'Unnamed Playground'}</strong><br />
                                            <strong>Location:</strong> {location.Location}<br />
                                            <strong>Accessible:</strong> {location.Accessible}<br />
                                            <strong>Sensory-Friendly:</strong> {location['Sensory-Friendly'] === 'Y' ? 'Yes' : 'No'}<br />
                                            <strong>ADA Accessible Comfort Station:</strong> {location.ADA_Accessible_Comfort_Station}<br />
                                        </div>
                                    )}
                                    {location.location_type === 'pedestrian_signal' && (
                                        <div>
                                            <strong>{location.Location || 'Unnamed Pedestrian Signal'}</strong><br />
                                            <strong>Borough:</strong> {location.borough}<br />
                                            <strong>Installation Date:</strong> {new Date(location.date_insta).toLocaleDateString()}<br />
                                            <strong>FEMA Flood Zone:</strong> {location.femafldt}<br />
                                            <strong>Accessible:</strong> {location.Accessible}<br />
                                        </div>
                                    )}
                                    {/* For unknown location types */}
                                    {location.location_type !== 'beach' &&
                                    location.location_type !== 'subway_stop' &&
                                    location.location_type !== 'restroom' &&
                                    location.location_type !== 'playground' &&
                                    location.location_type !== 'pedestrian_signal' && (
                                        <div>
                                            <strong>{location.Name || 'Unnamed Location'}</strong><br />
                                            <strong>Location:</strong> {location.Location}<br />
                                            <strong>Type:</strong> {location.location_type}<br />
                                            <strong>Accessible:</strong> {location.Accessible}<br />
                                        </div>
                                    )}
                                </Popup>
                            </Marker>
                        );
                    }
                    return null;  // Skip the marker if location coordinates are not available
                })}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
