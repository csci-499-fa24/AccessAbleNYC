import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import '../style/Home.css';
import NavBar from '../components/NavBar.jsx';
import MapComponent from '../components/MapComponent';
import FilterSideBar from '../components/FilterSideBar.jsx';
import Toast from 'react-bootstrap/Toast';
import SearchBar from '../components/SearchBar';
import { useLocation } from 'react-router-dom';
import { Button, Modal } from 'react-bootstrap';

function Home() {
    const [name, setName] = useState('');
    const [locations, setLocations] = useState([]);
    const [nearbyLocations, setNearbyLocations] = useState([]);
    const [showNoLocation, setShowNoLocation] = useState(false);
    const [showCookieNotification, setShowCookieNotification] = useState(false);
    const [showCookieConsent, setShowCookieConsent] = useState(false);
    const effectRan = useRef(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const [startCoord, setStartCoord] = useState({ lat: null, lon: null });
    const [destination, setDestination] = useState({ lat: null, lon: null });
    const [filterCriteria, setFilterCriteria] = useState({});
    const [showFilter, setShowFilter] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchLoc, setSearchLoc] = useState({});

    const handleFilterToggle = () => setShowFilter(!showFilter);
    const handleFilterChange = (newCriteria) => {
        setFilterCriteria(newCriteria);
        setSelectedLocation('');
        setSearchTerm('');
        setSearchLoc({});
    };

    const handleSearch = (searchTerm, location) => {
        setSelectedLocation(searchTerm);
        setSearchTerm(searchTerm);
        setFilterCriteria({});
        setSearchLoc(location);
    };

    const handleAcceptCookies = () => {
        localStorage.setItem('cookiesAccepted', 'true');
        setShowCookieConsent(false);
        setShowCookieNotification(true);
    };

    const handleDeclineCookies = () => {
        setShowCookieConsent(false);
    };

    useEffect(() => {
        const cookiesAccepted = localStorage.getItem('cookiesAccepted');
        if (!cookiesAccepted) {
            setShowCookieConsent(true);
        }
    }, []);

    useEffect(() => {
        if (params.get('lat') && params.get('lon') && params.get('preflat') && params.get('preflon')) {
            setDestination({ lat: params.get('lat'), lon: params.get('lon') });
            setStartCoord({ lat: params.get('preflat'), lon: params.get('preflon') });
        } else if (params.get('lat') && params.get('lon')) {
            setDestination({ lat: params.get('lat'), lon: params.get('lon') });
            const storedLocation = Cookies.get('location');
            if (storedLocation) {
                const { latitude, longitude } = JSON.parse(storedLocation);
                setStartCoord({ lat: latitude, lon: longitude });
                console.log("Using cached location from cookies");
                setShowCookieNotification(true);
            } else if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setStartCoord({ lat: latitude, lon: longitude });
 
 
                        // Call API to set the cookie on the server side
                        fetch('/api/set-location', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ latitude, longitude }),
                        })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                console.log("Location successfully saved on server");
                            } else {
                                console.error("Error saving location on server:", data.error);
                            }
                        })
                        .catch((error) => {
                            console.error("Network error:", error);
                        });
                    },
                    (error) => {
                        console.error("Geolocation error:", error.message);
                    }
                );
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        }
    }, [location.search]);

    useEffect(() => {
        if (effectRan.current) return;
        effectRan.current = true;
 
 
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setName(decodedToken.name);
        }
 
 
        fetch(`${import.meta.env.VITE_PORT}/locations`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error fetching locations");
                }
                return response.json();
            })
            .then((data) => {
                setLocations(data);
                console.log("Locations data:", data);
            })
            .catch((error) => {
                console.error("Error fetching locations:", error);
            });
 
 
        const storedLocation = Cookies.get('location');
        if (storedLocation) {
            const { latitude, longitude } = JSON.parse(storedLocation);
            fetch(`${import.meta.env.VITE_PORT}/locations/nearby?lat=${latitude}&lon=${longitude}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Error fetching nearby locations");
                    }
                    return response.json();
                })
                .then((data) => {
                    setNearbyLocations(data);
                    console.log("Nearby Locations:", data);
                })
                .catch((error) => {
                    console.error("Error fetching nearby locations:", error);
                });
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setStartCoord({ lat: latitude, lon: longitude });
                    fetch(`${import.meta.env.VITE_PORT}/locations/nearby?lat=${latitude}&lon=${longitude}`)
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Error fetching nearby locations");
                            }
                            return response.json();
                        })
                        .then((data) => {
                            setNearbyLocations(data);
                            console.log("Nearby Locations:", data);
                        })
                        .catch((error) => {
                            console.error("Error fetching nearby locations:", error);
                        });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
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

    // Uncomment the following function and button in the return section to reset cookie consent for testing
    /* <-remove this whole line & line 244
    const handleResetConsent = () => {
        localStorage.removeItem('cookiesAccepted');
        setShowCookieConsent(true);
    };
    /**/

    return (
        <div>
            <NavBar />
            <SearchBar 
                onSearch={handleSearch} 
                searchTerm={searchTerm} 
                searchLoc ={searchLoc} />
                {/* clearSearch={clearSearch} */}
            <Button variant="secondary" className="filter-button" onClick={handleFilterToggle}>
                Filter By
            </Button>
            

            <FilterSideBar show={showFilter} handleClose={handleFilterToggle} onFilterChange={handleFilterChange} />
            <MapComponent
                locations={locations}
                nearbyLocations={nearbyLocations}
                selectedLocation={selectedLocation}
                userCoord={startCoord}
                destination={destination}
                filterCriteria={filterCriteria}
                searchLoc={searchLoc}
                ///* clearSearch={clearSearch} */
            />
            <Toast onClose={() => setShowCookieNotification(false)} show={showCookieNotification} delay={3000} autohide className="toast-bottom-right" bg="info">
                <Toast.Header>
                    <strong className="me-auto">Location Info</strong>
                </Toast.Header>
                <Toast.Body>Using cached location from cookies.</Toast.Body>
            </Toast>
            <Toast onClose={() => setShowNoLocation(false)} show={showNoLocation} delay={3000} autohide className="toast-bottom-right" bg="danger">
                <Toast.Header>
                    <strong className="me-auto">Alert</strong>
                </Toast.Header>
                <Toast.Body>No locations to load</Toast.Body>
            </Toast>
            <Modal show={showCookieConsent} onHide={handleDeclineCookies}>
                <Modal.Header closeButton>
                    <Modal.Title>Cookie Consent</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    This website uses cookies to enhance your experience. Do you consent to the use of cookies?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleDeclineCookies}>Decline</Button>
                    <Button variant="primary" onClick={handleAcceptCookies}>Accept</Button>
                </Modal.Footer>
            </Modal>

            {/* Uncomment the button below for testing cookie consent reset */}
            {/* Remove this whole line and line 193
            <Button variant="warning" onClick={handleResetConsent} style={{ marginTop: '10px' }}>
                Reset Cookie Consent
            </Button>
            {/**/}
            
            
        </div>
    );
}

export default Home;
