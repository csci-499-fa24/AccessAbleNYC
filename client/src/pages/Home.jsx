import React, { useState, useEffect, useRef } from 'react';
import '../style/Home.css';
import NavBar from '../components/NavBar.jsx';
import MapComponent from '../components/MapComponent'; 
import Toast from 'react-bootstrap/Toast';
import SearchBar from '../components/SearchBar'

// Homepage which is the main page the user lands on
function Home() {
    const [name, setName] = useState('');
    const [locations, setLocations] = useState([]);
    const [nearbyLocations, setNearbyLocations] = useState([]);
    const [showNoLocation, setShowNoLocation] = useState(false); // State to show no location to render
    const effectRan = useRef(false);
    const [selectedLocation, setSelectedLocation] = useState('');

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
            <h1>Welcome, {name}</h1>
            <SearchBar onSearch={handleSearch} />
            {/* Pass locations and nearbyLocations to the MapComponent */}
            
            <MapComponent 
                locations={locations} 
                nearbyLocations={nearbyLocations} 
                selectedLocation={selectedLocation}
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
