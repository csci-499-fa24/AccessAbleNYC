import React, { useState } from 'react';
import '../style/Search.css';

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

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

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        onSearch(searchTerm);
    };

    const handleLocationSelection = (location) => {
        setSearchTerm(location); //location rather name location.name; allows the search bar to be autofilled with the name of the location the user selects
        onSearch(location);
        setSearchResults([]);
    };


    return (
        <div className="search-bar">
            <form className="d-flex" onSubmit={handleSearchSubmit}>
                <input
                    className="form-control me-2"
                    type="search"
                    placeholder="Search"
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
                        <button key={index} className="dropdown-item" onClick={() => handleLocationSelection(result.Name)}>
                            {result.Name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
