import React, {useState, useEffect} from 'react';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";

function App() {
    return(
        <Router>
           <Routes>
                <Route path='/' element={<Home/>}/>
                <Route path='/login' element={<Login/>}/>
                <Route path='/register' element={<Register/>}/>
            </Routes> 
        </Router>
    )
}

export default App;