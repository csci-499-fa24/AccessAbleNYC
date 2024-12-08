import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import ttServices from '@tomtom-international/web-sdk-services';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Toast from 'react-bootstrap/Toast';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';
import '../style/MapComponent.css';
import ReviewSideBar from './ReviewSideBar';

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

const RoutingMachine = ({ start, routeTo, trafficSignals }) => {
    const map = useMap();
    const routingLayerRef = useRef(null); 
    const closeControlRef = useRef(null); 
    const instructionControlRef = useRef(null);

    const clearAllRoutesAndButton = () => {
        console.log("Clearing all routes and button...");

        // Remove the active route layer
        if (routingLayerRef.current) {
            map.removeLayer(routingLayerRef.current);
            routingLayerRef.current = null;
        }

        // Remove the "Close Route" button
        if (closeControlRef.current) {
            map.removeControl(closeControlRef.current);
            closeControlRef.current = null;
        }

        if (instructionControlRef.current) {
            map.removeControl(instructionControlRef.current);
            instructionControlRef.current = null;
        }
    };

    const getClosestTrafficSignal = (currentLocation, trafficSignals, finalLocation) => {
        let closestSignal = null;
        let minDistance = Infinity;

        trafficSignals.forEach((signal) => {
            const signalLatLng = L.latLng(signal.latitude, signal.longitude);
            const currentLatLng = L.latLng(currentLocation.lat || currentLocation.latitude, currentLocation.lon || currentLocation.longitude);
            const finalLatLng = L.latLng(finalLocation.lat, finalLocation.lon);

            const distanceToSignal = map.distance(currentLatLng, signalLatLng);
            const distanceSignalToFinal = map.distance(signalLatLng, finalLatLng);
            const distanceCurrentToFinal = map.distance(currentLatLng, finalLatLng);

            if (distanceToSignal < minDistance && distanceSignalToFinal < distanceCurrentToFinal) {
                minDistance = distanceToSignal;
                closestSignal = signal;
            }
        });

        return { closestSignal, minDistance };
    };

    const formatInstructions = (instructions) => {
        return instructions.map((step, index) => {
            const { maneuver, street, travelTimeInSeconds, turnAngleInDecimalDegrees } = step;
            let formattedStep = `${index + 1}. `;
            if (maneuver) formattedStep += `${maneuver}`;
            if (street) formattedStep += ` onto ${street}`;
            if (travelTimeInSeconds) formattedStep += ` (${Math.ceil(travelTimeInSeconds / 60)} min)`;
            if (turnAngleInDecimalDegrees) formattedStep += ` [Turn angle: ${turnAngleInDecimalDegrees.toFixed(1)}°]`;

            return formattedStep;
        });
    };

    const displayInstructions = (instructions) => {
        const formattedInstructions = formatInstructions(instructions);

        console.log("Formatted Instructions:", formattedInstructions);
        if (instructionControlRef.current) {
            map.removeControl(instructionControlRef.current);
        }

        instructionControlRef.current = L.control({ position: "bottomleft" });
        instructionControlRef.current.onAdd = () => {
            const div = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom instructions-box");
            div.style.backgroundColor = "#fff";
            div.style.padding = "10px";
            div.style.maxHeight = "200px";
            div.style.overflowY = "auto";
            div.style.fontSize = "12px";

            div.innerHTML = formattedInstructions.length
                ? formattedInstructions.map((step) => `<p>${step}</p>`).join("")
                : "<p>No instructions available.</p>";
            return div;
        };
        instructionControlRef.current.addTo(map);
    };

    const handleRouteAndButton = (geojson, instructions) => {
        console.log("Handling route and button...");

        // Clear existing layers and controls
        clearAllRoutesAndButton();

        // Create and add the new route layer
        routingLayerRef.current = L.geoJSON(geojson, {
            style: { color: "blue", weight: 4 },
        }).addTo(map);

       
        displayInstructions(instructions);

        closeControlRef.current = L.control({ position: "topright" });
        closeControlRef.current.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.innerHTML = 'Close Route';
            div.style.backgroundColor = '#ff4040';
            div.style.color = '#fff';
            div.style.padding = '5px';
            div.style.cursor = 'pointer';
            div.style.fontSize = '14px';
            div.onclick = clearAllRoutesAndButton;
            return div;
        };
        closeControlRef.current.addTo(map);
    };

    useEffect(() => {
        if (!start?.lat || !start?.lon || !routeTo?.lat || !routeTo?.lon) {
            console.error("Invalid start or routeTo coordinates:", start, routeTo);
            return;
        }

        console.log("Starting route calculation...");
            clearAllRoutesAndButton();
            let current = start;
            let visitedSignals = new Set();
            const waypoints = [{ point: [start.lon, start.lat] }];

            while (true) {
                const { closestSignal, minDistance } = getClosestTrafficSignal(current, trafficSignals, routeTo);
                const totalDistance = map.distance(
                    L.latLng(current.lat || current.latitude, current.lon || current.longitude),
                    L.latLng(routeTo.lat, routeTo.lon)
                );

                if (!closestSignal || visitedSignals.has(closestSignal) || minDistance >= totalDistance) {
                    waypoints.push({ point: [routeTo.lon, routeTo.lat] });
                    break;
                }

                waypoints.push({ point: [closestSignal.longitude, closestSignal.latitude] });
                visitedSignals.add(closestSignal);
                current = closestSignal;
            }

            console.log("Waypoints for route:", waypoints);
            ttServices.services
                .calculateRoute({
                    key: import.meta.env.VITE_TOMTOM_API_KEY,
                    locations: waypoints.map((wp) => wp.point.join(",")).join(":"),
                    travelMode: "pedestrian",
                    instructionsType: "coded",
                })
                .then((response) => {
                    const geojson = response.toGeoJson();
                    const instructions = response?.routes?.[0]?.guidance?.instructions || [];
            
                    if (!instructions.length) {
                        console.warn("No instructions found in the API response. Displaying the route only.");
                    }
            
                    handleRouteAndButton(geojson, instructions);
                })
                .catch((error) => {
                    console.error("Error fetching TomTom route:", error);
                    clearAllRoutesAndButton();
                });

        return () => clearAllRoutesAndButton(); 
    }, [map, start, routeTo, trafficSignals]);

    return null;
};


//zooms out only when a new filler is applied. Otherwise, keeps zoom level, even when a icon is clicked.
const MapCenterUpdater = ({ nearbyLocations,  searchLoc, showNearby, setMarkerLoc, markerLoc}) => { 
    const map = useMap();
    
    useEffect(() => {
        //THIS PART IS FOR CENTERING ON FILTER CHANGE, WHICH WE DONT WANT
        //let newCenter;
        // let sellat = (selectedLocation?.lat ?? selectedLocation?.latitude   ?? (selectedLocation[0]?.lat || selectedLocation[0]?.latitude)  );
        // let sellon = (selectedLocation?.lon ?? selectedLocation?.longitude  ?? (selectedLocation[0]?.lon || selectedLocation[0]?.longitude) );
        // console.log('selectedLocation:', selectedLocation);
        // console.log('sellat:', sellat);
        // console.log('sellon:', sellon);

        // if ((selectedLocation.length >0 &&selectedLocation.length <4000) && (sellat && sellon)) {
        //     newCenter = [sellat, sellon]; ;
        // }
        // else if (searchLoc && sCenter){
        //     newCenter = [slat, slon];
        // }
   
        // if (newCenter) {
        //     map.setView(newCenter, map.getZoom());
        //}
        //SEARCH CENTERING && nearby (NEED TESTING)
        let slat = (searchLoc?.lat ?? searchLoc?.latitude  );
        let slon = (searchLoc?.lon ?? searchLoc?.longitude );

        if (markerLoc){
            map.setView(markerLoc, map.getZoom());
            setTimeout(() => setMarkerLoc(null), 300); 
            return
        }
        else if (showNearby==true && nearbyLocations.length > 0  && Object.keys(searchLoc).length === 0 && (map.getZoom()<14) && !markerLoc  ) {  
            map.setView(calculateCenter(nearbyLocations), map.getZoom());
            return
        }
        else if (slat && slon){    
            map.setView([slat, slon], map.getZoom());
            return
        }
     
   
    }, [ nearbyLocations, showNearby, searchLoc, markerLoc, setMarkerLoc, map]);   

    return null;
};



const MapComponent = ({ locations, nearbyLocations = [], selectedLocation , userCoord, destination, filterCriteria, searchLoc}) => {
    const [showNearby, setShowNearby] = useState(true);  // Default to showing nearby location
    const [showToastError, setShowToastError] = useState(false);
    const [showToastSuccess, setShowToastSuccess] = useState(false);
    const [message, setMessage] = useState('');
    const [directionModalOpen,setDirectionModalOpen]=useState(false);
    const [recentlyOpened, setRecentlyOpened] = useState('');
    const [showPopdesc, setShowPopDesc] = useState({}); const toggleDescription = (id) => { setShowPopDesc((prev) => ({ ...prev, [id]: !prev[id] })); };

    const [userId, setUserId] = useState('');
    const [iconSize, setIconSize] = useState([35, 35]);
    const { theme } = useTheme();

    const [locationRating, setLocationRating] = useState('-');
    const [showReview, setShowReview] = useState(false);

    const handleReviewToggle = () => setShowReview(!showReview);
    const [markerLoc, setMarkerLoc] = useState(null);

    //Dark Mode for Map Component
    useEffect(() => {
        const mapContainer = document.getElementById('map');
        if(theme === 'dark') {
            mapContainer.classList.add('map-dark-mode');
        }
        else {
            mapContainer.classList.remove('map-dark-mode')
        }
    }, [theme]);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setUserId(decodedToken.id);
        }
    }, []);

    const handleAddLocation1 = (locationId) => {
        if (!userId) {
            setMessage('User ID is not set. Please Log in first.');
            setShowToastError(true);
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
                setMessage(data.message);
                setShowToastSuccess(true);
            } else {
                setMessage('Unable to add location: ' + data.message);
                setShowToastError(true);
            }
        })
        .catch(error => {
            setMessage('Error: ' + error);
            setShowToastError(true);
        });
    };

    useEffect(() => {
        if (selectedLocation) {
            setShowNearby(false);
        }
    }, [selectedLocation]);

    const handleNearbyToggle = () => {
        setShowNearby(prevShowNearby => !prevShowNearby);
        if (!showNearby) {
            setSearchTerm('');
            setSearchLoc({});
        }
    };

    // Filter locations based on the criteria
    const filteredNearbyLocations = nearbyLocations.filter(location =>
        Object.keys(filterCriteria).every(key => !filterCriteria[key] || location[key] === filterCriteria[key])
    );

    const filteredLocations = locations.filter(location =>
        Object.keys(filterCriteria).every(key => !filterCriteria[key] || location[key] === filterCriteria[key])
    );

    // Determine locations to show based on the selected filter and nearby toggle
    const locationsToShow = showNearby
        ? (selectedLocation ? filteredNearbyLocations.filter(loc => loc.Name === selectedLocation) : filteredNearbyLocations)
        : (selectedLocation ? filteredLocations.filter(loc => loc.Name === selectedLocation) : filteredLocations);

    const handleGetAccessibleRating = (locationId) => {
        fetch(`${import.meta.env.VITE_PORT}/rating/${locationId}`)
        .then((response) => {
            if (!response.ok) {
                setLocationRating('-');
                throw new Error('Error fetching location accesiblity rating');
            }
            return response.json();
        })
        .then((data) => {
            setLocationRating(data.averageRating);
            console.log('Location rating:', data.averageRating);
        })
        .catch((error) => {
            setLocationRating('-');
            console.error('Error fetching location accesiblity rating:', error);
        });
    };
 
    return (
        <div>
            <ReviewSideBar show={showReview} handleClose={handleReviewToggle} location={recentlyOpened} rating={locationRating}/>
            {/* Checkbox to toggle between showing all or nearby locations */}
            <label htmlFor="showNearby" style={{ marginLeft: '42%', marginTop: '5px', marginBottom: '0px' }} >
                    <input
                        id="showNearby"
                        type="checkbox"
                        // className={`${theme}`}
                        checked={showNearby}
                        onChange={handleNearbyToggle}
                    />
                    {/* onChange={() => setShowNearby(!showNearby)} */}
                    Show Nearby Locations Only
            </label>
            <MapContainer 
            id = 'map'
            center={[40.7128, -74.0060]} 
            zoom={13} 
            maxBounds={nycBounds} 
            maxBoundsViscosity={1.0}
            style={{ height: '71vh', width: '100vw' }}>
                {/* Add OpenStreetMap tile layer */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* This component will update the map center when nearbyLocations changes */}
                <MapCenterUpdater 
                nearbyLocations={nearbyLocations} 
                // selectedLocation={selectedLocation ? [selectedLocation] : filteredLocations}
                showNearby={showNearby}
                searchLoc={searchLoc}
                markerLoc={markerLoc}
                setMarkerLoc={setMarkerLoc}
                />
                <RoutingMachine start={userCoord} routeTo={destination} trafficSignals={locations.filter(loc => loc.location_type === "pedestrian_signal")}/>
                {/* Render Markers for filtered locations */}
                {locationsToShow.map((location, index) => {
                    const lat = location.lat || location.latitude;
                    const lon = location.lon || location.longitude;

                    if (lat && lon) {
                        return (
                             <Marker 
                                key={index} 
                                position={[lat, lon]} 
                                icon={getIconByLocationType(location.location_type, iconSize)}
                                eventHandlers={{
                                    click: () => {
                                        console.log(location._id);
                                        setMarkerLoc([lat, lon])
                                        setRecentlyOpened(location);
                                        handleGetAccessibleRating(location._id);
                                    }
                                }}
                               >
                               <Popup className={`main-popup ${theme === 'dark' ? 'dark-mode' : ''}`}>
                                    {/* Display different information based on the location_type */}
                                    {location.location_type === 'beach' && (
                                        <div className={`info-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
                                            <div>
                                                <strong>{location.Name || 'Unnamed Beach'}</strong><br />
                                                <strong>Accessiblity Rating:</strong> {(Math.round(locationRating* 10) / 10) || '-'}<br />
                                                <strong>Location:</strong> {location.Location}<br />
                                                <strong>Accessible:</strong> {location.Accessible}<br />
                                                <strong>Barbecue Allowed:</strong> {location.Barbecue_Allowed}<br />
                                                <strong>Concession Stand:</strong> {location.Concession_Stand}<br />
                                                {showPopdesc[location._id] && (
                                                    <><strong>Description:</strong>
                                                    <div dangerouslySetInnerHTML={{ __html: location.Description }}></div></>
                                                )}
                                                <a href="#" onClick={() => toggleDescription(location._id)}>
                                                    {showPopdesc[location._id] ? 'Hide Description' : 'Show Description'}
                                                </a><br /> <br />
                                                <div dangerouslySetInnerHTML={{ __html: location.Directions }}></div> 
                                            </div>

                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setDirectionModalOpen(true)}>
                                                    Directions
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setShowReview(true)}>
                                                    Reviews
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {location.location_type === 'subway_stop' && (
                                        <div className={`info-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
                                            <div>
                                                <strong>{location.Name || 'Unnamed Subway Station'}</strong><br />
                                                <strong>Accessiblity Rating:</strong> {(Math.round(locationRating* 10) / 10) || '-'}<br />
                                                <strong>Location:</strong> {location.Location}<br />
                                                <strong>ADA Status:</strong> {location.ADA_Status}<br />
                                                <strong>Lines:</strong> {location.line}<br />
                                                <strong>Accessible:</strong> {location.Accessible}<br />
                                            </div>
                                            
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setDirectionModalOpen(true)}>
                                                    Directions
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setShowReview(true)}>
                                                    Reviews
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {location.location_type === 'restroom' && (
                                        <div className={`info-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
                                            <div>
                                                <strong>{location.Name || 'Unnamed Restroom'}</strong><br />
                                                <strong>Accessiblity Rating:</strong> {(Math.round(locationRating* 10) / 10) || '-'}<br />
                                                <strong>Location:</strong> {location.Location}<br />
                                                <strong>Operator:</strong> {location.operator}<br />
                                                <strong>Hours of Operation:</strong> {location.hours_of_operation}<br />
                                                <strong>Status:</strong> {location.status}<br />
                                                <strong>Accessible:</strong> {location.Accessible ? 'Yes' : 'No'}<br />
                                            </div>
                                            
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setDirectionModalOpen(true)}>
                                                    Directions
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setShowReview(true)}>
                                                    Reviews
                                                </button>
                                            </div>

                                        </div>
                                    )}
                                    {location.location_type === 'playground' && (
                                        <div className={`info-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
                                            <div>
                                                <strong>{location.Name || 'Unnamed Playground'}</strong><br />
                                                <strong>Accessiblity Rating:</strong> {(Math.round(locationRating* 10) / 10) || '-'}<br />
                                                <strong>Location:</strong> {location.Location}<br />
                                                <strong>Accessible:</strong> {location.Accessible}<br />
                                                <strong>Sensory-Friendly:</strong> {location['Sensory-Friendly'] === 'Y' ? 'Yes' : 'No'}<br />
                                                <strong>ADA Accessible Comfort Station:</strong> {location.ADA_Accessible_Comfort_Station}<br />
                                            </div>
                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setDirectionModalOpen(true)}>
                                                    Directions
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setShowReview(true)}>
                                                    Reviews
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {location.location_type === 'pedestrian_signal' && (
                                        <div className={`info-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
                                            <div>
                                                <strong>{location.Name || 'Unnamed Pedestrian Signal'}</strong><br />
                                                <strong>Accessiblity Rating:</strong> {(Math.round(locationRating* 10) / 10) || '-'}<br />
                                                <strong>Borough:</strong> {location.borough}<br />
                                                <strong>Installation Date:</strong> {new Date(location.date_insta).toLocaleDateString()}<br />
                                                <strong>FEMA Flood Zone:</strong> {location.femafldt}<br />
                                                <strong>Accessible:</strong> {location.Accessible}<br />
                                            </div>

                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setDirectionModalOpen(true)}>
                                                    Directions
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setShowReview(true)}>
                                                    Reviews
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
                                        <div className={`info-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
                                            <div>
                                                <strong>{location.Name || 'Unnamed Location'}</strong><br />
                                                <strong>Accessiblity Rating:</strong> {(Math.round(locationRating* 10) / 10) || '-'}<br />
                                                <strong>Location:</strong> {location.Location}<br />
                                                <strong>Type:</strong> {location.location_type}<br />
                                                <strong>Accessible:</strong> {location.Accessible}<br />
                                            </div>

                                            <div className="button-container">
                                                <button className="add-favorite-button" onClick={() => handleAddLocation1(location._id)}>
                                                    Add to Favorite
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setDirectionModalOpen(true)}>
                                                    Directions
                                                </button>
                                                <button className="add-favorite-button" onClick={() => setShowReview(true)}>
                                                    Reviews
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
            <Toast onClose={() => setShowToastSuccess(false)} show={showToastSuccess} delay={3000} className="toast-bottom-right" bg='success' autohide>
                <Toast.Header>
                    <strong className="me-auto">Alert</strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
            <Toast onClose={() => setShowToastError(false)} show={showToastError} delay={3000} className="toast-bottom-right" bg='danger' autohide>
                <Toast.Header>
                    <strong className="me-auto">Alert</strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
            <DirectionModal
            show={directionModalOpen}
            onHide={() => setDirectionModalOpen(false)}
            final = {recentlyOpened}
            />
        </div>
    );
};

function DirectionModal(props) {
    const [showToastError, setShowToastError] = useState(false);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();
    const {theme} = useTheme();

    const handlePathTo = (start, destination) => {
        if (start){
            navigate(`/?lat=${destination.lat || destination.latitude}&lon=${destination.lon || destination.longitude}&preflat=${start.lat || start.latitude}&preflon=${start.lon || start.longitude}`);
        }
        else{
            navigate(`/?lat=${destination.lat || destination.latitude}&lon=${destination.lon || destination.longitude}`);
        }
        props.onHide();
        setSearchTerm('');
        setSearch('');
    };

    const handleSearch = async (event) => {
        setSearchTerm(event.target.value);
        if (event.target.value) {
            try {
                const response = await fetch(`${import.meta.env.VITE_PORT}/search?type=${event.target.value}`);
                if (!response.ok) {
                    throw new Error('Error fetching locations');
                }
                const data = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleLocationSelection = (location) => {
        setSearch(location);
        setSearchTerm(location.Name); 
        setSearchResults([]);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if(!searchTerm){
            setMessage("Error: Please provide an input location");
            setShowToastError(true);
            return;
        }
        handlePathTo(search, props.final);
    };

    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header className={theme === 'dark' ? "d-flex-dark-mode" : "d-flex"} closeButton>
                <Modal.Title className={theme === 'dark' ? "d-flex-dark-mode" : "d-flex"}>
                    Directions
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className={theme === 'dark' ? "d-flex-dark-mode" : "d-flex"}>
                <Form className={theme === 'dark' ? "d-flex-dark-mode" : "d-flex"} onSubmit={handleSubmit}>
                    <Form.Control className={theme === 'dark' ? "me-2 search-input-dark-mode" : 'me-2 search-input'}
                        type="search"
                        placeholder="Search a starting point"
                        aria-label="Search"
                        value={searchTerm}
                        style={{ borderRadius: '20px'}}
                        onChange={handleSearch}
                    />
                    {searchResults.length > 0 && (
                        <div className="add-dropdown-menu show position-absolute">
                            {searchResults.map((result, index) => (
                                <button key={index} className="dropdown-item" onClick={() => handleLocationSelection(result)}>
                                    {result.Name}
                                </button>
                            ))}
                        </div>
                    )}
                    <Button variant="outline-primary" className='addButton' style={{ borderRadius: '20px' }} onClick={() => setSearchTerm('Your Location')}>Your Location</Button>
                    <Button variant="outline-success" className='addButton' style={{ borderRadius: '20px' }} type="submit">Accessible Walking Route</Button>
                </Form>
            </Modal.Body>
            <Modal.Footer className={theme === 'dark' ? "d-flex-dark-mode" : "d-flex"}>
                <Button onClick={props.onHide}>Close</Button>
            </Modal.Footer>
            <Toast onClose={() => setShowToastError(false)} show={showToastError} delay={3000} className="toast-bottom-right" bg='danger' autohide>
                <Toast.Header>
                    <strong className="me-auto">Alert</strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
        </Modal>
    );
}

export default MapComponent;
