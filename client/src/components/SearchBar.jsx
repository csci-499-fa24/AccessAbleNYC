import React, { useState, useEffect, useRef} from 'react';
import '../style/Search.css';
import { useTheme } from './ThemeContext';

const SearchBar = ({ onSearch }) => {       
    // , clearSearch
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [name, setName] = useState('');
    const [searchLoc, setSearchLoc] = useState({})
    const [isLocSelected, setIsLocSelected] = useState(false); 
    const searchRef = useRef(null);
    const {theme} = useTheme();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setName(decodedToken.name);
        }
    }, []);

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
            onSearch('', {});
        }
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        onSearch(searchTerm, searchLoc);
        setIsLocSelected(true);
    };

    const handleLocationSelection = (result) => {
        setSearchTerm(result.Name);
        onSearch(result.Name, result);
        setSearchLoc(result);
        setSearchResults([]);
        setIsLocSelected(true);
    };

    useEffect(() => {
        if (isLocSelected) {
            setSearchResults([]);
            setSearchLoc({});
            setIsLocSelected(false);
            //setSearchTerm(''); Removed; allows location name to remain in search bar once a location from the dropdown is selected
        }}, [isLocSelected]);

    const handleClickOut = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
            setSearchResults([]); 
        }
        };
    
        useEffect(() => {
             document.addEventListener('mousedown', handleClickOut);
        return () => {document.removeEventListener('mousedown', handleClickOut); };
        }, []);

    return (
        <div ref ={searchRef} className="search-bar">
            {/* <div className="greeting-message">Welcome, {name}</div> */}
            <div className="search-message">Explore an Accessible NYC
            </div>
            <form className="d-flex" onSubmit={handleSearchSubmit}>
                <input
                    className={`form-control me-2 ${theme === 'dark' ? 'dark-mode-input' : ''}`}
                    type="search"
                    placeholder="Search places . . ."
                    aria-label="Search"
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{ borderRadius: '20px' }}
                />
                <button className="btn btn-outline-success custom-b" type="submit" >
                    Search
                </button>
            </form>
            {searchResults.length > 0 && (
                <div className="dropdown-menu show position-absolute">
                    {searchResults.map((result, index) => (
                        <button key={index} className="dropdown-item" onClick={() => handleLocationSelection(result)}>
                            {result.Name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;