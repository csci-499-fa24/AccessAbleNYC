import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Def custom icons for each location type
const beachIconUrl = '/assets/beach-100.png';
const playgroundIconUrl = '/assets/playground-100.png';
const signalIconUrl = '/assets/traffic-light-100.png';
const subwayIconUrl = '/assets/subway-100.png';
const restroomIconUrl = '/assets/restroom-100.png';

// Bounds for the map to stay within NYC
const nycBounds = [
    [39, -75],  // Even more southwest
    [42, -70]  // Even more northeast
];

// Function to select the correct icon based on the location type
const getIconByLocationType = (type, iconSize) => {
    // Create Leaflet icons for specific location types
    const beachIcon = L.icon({
        iconUrl: beachIconUrl,
        iconSize: iconSize,
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });

    const playgroundIcon = L.icon({
        iconUrl: playgroundIconUrl,
        iconSize: iconSize,
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });

    const signalIcon = L.icon({
        iconUrl: signalIconUrl,
        iconSize: iconSize,
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });

    const subwayIcon = L.icon({
        iconUrl: subwayIconUrl,
        iconSize: iconSize,
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });

    const restroomIcon = L.icon({
        iconUrl: restroomIconUrl,
        iconSize: iconSize,
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });

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
                iconSize: iconSize,  
                iconAnchor: [15, 30],  
                popupAnchor: [0, -30],  
            });
    }
};

// Function to calculate the center of nearby locations
const calculateCenter = (nearbyLocations) => {
    console.log("calculateCenter called")
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

const RoutingMachine = ({start, routeTo}) => {
    const map = useMap();
    const routingControlRef = useRef(null);
    useEffect(() => {
        if (start.lat!=null && start.lon!=null && routeTo.lat!=null && routeTo.lon!=null){
            if (!routingControlRef.current) {
                routingControlRef.current = L.Routing.control({
                waypoints: [
                    L.latLng(start.lat, start.lon),
                    L.latLng(routeTo.lat, routeTo.lon)
                ],
                routeWhileDragging: false,
                }).addTo(map);
            } 
        }
    }, [map, start, routeTo]);
  
    return null;
};

// This component updates the map's center when nearby locations change
const MapCenterUpdater = ({ nearbyLocations, selectedLocation}) => {
    console.log("MapCenterUpdater called")
    const map = useMap();

    useEffect(() => {
        if (selectedLocation[0] && (selectedLocation[0].lat || selectedLocation[0].latitude) && (selectedLocation[0].lon || selectedLocation[0].longitude)) {
            // Check selected location
            console.log("selectedLocation[0]: ", selectedLocation[0]);
            const newCenter = [selectedLocation[0].lat || selectedLocation[0].latitude, selectedLocation[0].lon || selectedLocation[0].longitude];
            map.setView(newCenter); // Center map on the selected location
        } else {
            console.log("nearbyLocations: ", nearbyLocations);
            const newCenter = calculateCenter(nearbyLocations);
            map.setView(newCenter);  // Update the map's center
        }
    }, [nearbyLocations, selectedLocation, map]);
    return null;
};

const MapComponent = ({ locations, nearbyLocations = [], selectedLocation , userCoord, destination}) => {
    const [filter, setFilter] = useState('all');  // State for filtering location types
    const [showNearby, setShowNearby] = useState(true);  // Default to showing nearby location

    const [userId, setUserId] = useState('');
    const [iconSize, setIconSize] = useState([35, 35]);
   
    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setUserId(decodedToken.id);
        }
    }, []);

    const handleAddLocation1 = (locationId) => {
        if (!userId) {
            alert('User ID is not set. Please Log in first.');
            return;
        }
        const userQuery = { locationId: locationId };
   
        fetch(`${import.meta.env.VITE_PORT}/${userId}/addFavoriteLocation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userQuery)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert('Unable to add location: ' + data.message);
            }
        })
        .catch(error => {
            alert('Error: ' + error);
        });
    };

    // DynamicMarker component to rescale the marker accordingly to the zoom of the map
    const DynamicMarker = ({ position, locationType, children }) => {
        const map = useMap();

        useEffect(() => {
            const handleZoom = () => {
                const newSize = Math.max(30, map.getZoom() * 3);
                setIconSize([newSize, newSize]);
            };

            map.on('zoom', handleZoom);
            return () => map.off('zoom', handleZoom);
        }, [map]);

        return (
            <Marker position={position} icon={getIconByLocationType(locationType, iconSize)} >
                {children}
            </Marker>
        );
    };

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

            <MapContainer 
            center={[40.7128, -74.0060]} 
            zoom={13} 
            maxBounds={nycBounds} 
            maxBoundsViscosity={1.0}
            style={{ height: '75vh', width: '100vw' }}>
                {/* Add OpenStreetMap tile layer */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* This component will update the map center when nearbyLocations changes */}
                <MapCenterUpdater nearbyLocations={nearbyLocations} selectedLocation={filteredLocations}  />
                <RoutingMachine start={userCoord} routeTo={destination}/>
                {/* Render Markers for filtered locations */}
                {filteredLocations.map((location, index) => {
                    const lat = location.lat || location.latitude;
                    const lon = location.lon || location.longitude;

                    if (lat && lon) {
                        return (
                            // <DynamicMarker 
                            //     key={index} 
                            //     position={[lat, lon]} 
                            //     locationType={location.location_type}
                            // >
                             <Marker 
                                key={index} 
                                position={[lat, lon]} 
                                icon={getIconByLocationType(location.location_type, iconSize)}
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
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                            </div>

                                            
                                        </div>
                                    )}
                                    {location.location_type === 'subway_stop' && (
                                        <div>
                                            <strong>{location.Name || 'Unnamed Subway Station'}</strong><br />
                                            <strong>Location:</strong> {location.Location}<br />
                                            <strong>ADA Status:</strong> {location.ADA_Status}<br />
                                            <strong>Lines:</strong> {location.line}<br />
                                            <strong>Accessible:</strong> {location.Accessible}<br />
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                            </div>

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
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                            </div>

                                        </div>
                                    )}
                                    {location.location_type === 'playground' && (
                                        <div>
                                            <strong>{location.Name || 'Unnamed Playground'}</strong><br />
                                            <strong>Location:</strong> {location.Location}<br />
                                            <strong>Accessible:</strong> {location.Accessible}<br />
                                            <strong>Sensory-Friendly:</strong> {location['Sensory-Friendly'] === 'Y' ? 'Yes' : 'No'}<br />
                                            <strong>ADA Accessible Comfort Station:</strong> {location.ADA_Accessible_Comfort_Station}<br />
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                            </div>

                                        </div>
                                    )}
                                    {location.location_type === 'pedestrian_signal' && (
                                        <div>
                                            <strong>{location.Location || 'Unnamed Pedestrian Signal'}</strong><br />
                                            <strong>Borough:</strong> {location.borough}<br />
                                            <strong>Installation Date:</strong> {new Date(location.date_insta).toLocaleDateString()}<br />
                                            <strong>FEMA Flood Zone:</strong> {location.femafldt}<br />
                                            <strong>Accessible:</strong> {location.Accessible}<br />
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                            </div>

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
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                            </div>

                                        </div>
                                    )}
                                </Popup>
                            {/* </DynamicMarker>  */}
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
