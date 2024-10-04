import React, {useState, useEffect} from 'react';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Feedback from './pages/Feedback.jsx';
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Footer from "./Footer.jsx";
function App() {
    return(
        //Creates routes to other pages
        <Router>
           <Routes>
                <Route path='/' element={<Home/>}/>
                <Route path='/login' element={<Login/>}/>
                <Route path='/register' element={<Register/>}/>
                <Route path='/profile' element={<Profile/>}/>
                <Route path='/feedback' element={<Feedback/>}/>
            </Routes> 
            <Footer />
        </Router>
    )
}

export default App;