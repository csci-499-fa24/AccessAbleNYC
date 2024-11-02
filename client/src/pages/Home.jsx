import React, { useState, useEffect, useRef } from 'react';
import '../style/Home.css';
import NavBar from '../components/NavBar.jsx';
import MapComponent from '../components/MapComponent'; 
import Toast from 'react-bootstrap/Toast';
import SearchBar from '../components/SearchBar';
import { useLocation } from 'react-router-dom';

// Homepage which is the main page the user lands on
function Home() {
    const [name, setName] = useState('');
    const [locations, setLocations] = useState([]);
    const [nearbyLocations, setNearbyLocations] = useState([]);
    const [showNoLocation, setShowNoLocation] = useState(false); // State to show no location to render
    const effectRan = useRef(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const [userCoord, setUserCoord] = useState({ lat: null, lon:  null});
    const [destination, setDestination] = useState({ lat: null, lon:  null});
    
    //user selected locations
    const handleSearch = (searchTerm) => {
        setSelectedLocation(searchTerm);
    };

    useEffect(() => {
        if (effectRan.current) return;
        effectRan.current = true;
        
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setName(decodedToken.name);
        }

        if(params.get('lat') && params.get('lon')){
            setDestination({lat: params.get('lat'), lon: params.get('lon')});
        }

        // Fetch all locations
        fetch(`${import.meta.env.VITE_PORT}/locations`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error fetching locations');
                }
                return response.json();
            })
            .then((data) => {
                setLocations(data);
                console.log('Locations data:', data);
            })
            .catch((error) => {
                console.error('Error fetching locations:', error);
            });

        // Fetch nearby locations using geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserCoord({lat: latitude, lon: longitude});
                    console.log('User Coordinates: ', { latitude, longitude });

                    fetch(`${import.meta.env.VITE_PORT}/locations/nearby?lat=${latitude}&lon=${longitude}`)
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error('Error fetching nearby locations');
                            }
                            return response.json();
                        })
                        .then((data) => {
                            setNearbyLocations(data);
                            console.log('Nearby Locations:', data);
                        })
                        .catch((error) => {
                            console.error('Error fetching nearby locations:', error);
                        });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }

        setSelectedLocation(params.get('location'));
    }, []);

    useEffect(() => {
        if ((!locations || locations.length === 0) && (!nearbyLocations || nearbyLocations.length === 0)) {
            setShowNoLocation(true);
        } else {
            setShowNoLocation(false);
        }
    }, [locations, nearbyLocations]);

    return (
        <div>
            <NavBar />
            <SearchBar onSearch={handleSearch} />
            {/* Pass locations and nearbyLocations to the MapComponent */}
            
            <MapComponent 
                locations={locations} 
                nearbyLocations={nearbyLocations} 
                selectedLocation={selectedLocation}
                userCoord = {userCoord}
                destination={destination}
            />

            <Toast 
                onClose={() => setShowNoLocation(false)} 
                show={showNoLocation} 
                delay={3000} 
                autohide 
                className="toast-bottom-right" 
                bg='danger'
            >
                <Toast.Header>
                    <strong className="me-auto">Alert</strong>
                </Toast.Header>
                <Toast.Body>No locations to load</Toast.Body>
            </Toast>
        </div>
    );
}

export default Home;
