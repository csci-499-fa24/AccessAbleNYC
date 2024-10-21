import React, { useState } from 'react';
import '../style/Footer.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom';

function AboutUsModal(props) {
    return (
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
        <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
            About Us
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h4>Who Are We?</h4>
            <p>
            Hunter College students.
            </p>
            <h4>What is AccessAble NYC?</h4>
            <p>
            AccessAble NYC is a web application designed to improve accessibility for individuals with disabilities by helping them find accessible locations across New York City. 
            Our goal is to provide an easy-to-use, interactive platform that empowers people with mobility challenges to navigate the city.
            </p>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
        </Modal>
    );
}

function EmailModal(props) {
    return (
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
        <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
            Contact Information
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h4>Email us at:</h4>
            <p>
            accessablenyc@gmail.com
            </p>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
        </Modal>
    );
}

function PhoneModal(props) {
    return (
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
        <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
            Contact Information
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h4>Phone:</h4>
            <p>
            N/A
            </p>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
        </Modal>
    );
}

function HelpFAQModal(props) {
    return (
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
        <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
            Help & FAQs
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h4>Who can use this app?</h4>
            <p>
            The app is targeted towards people with special needs, as well as their family and friends, providing them with valuable information on accessible locations in NYC.
            </p>
            <h4>How do I navigate the interactive map?</h4>
            <p>
            You can zoom in and out on the map to view different areas of NYC. Click on the markers to see more details about each location, including accessibility features 
            and hours of operation.
            </p>
            <h4>Where does the data come from?</h4>
            <p>
            Our data is sourced from NYC Open Data, which provides public datasets on accessible facilities in the city. We regularly update our platform to ensure that the 
            information is current and reliable.
            </p>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
        </Modal>
    );
}


const Footer = () => {
    const[aboutUsModalOpen,setAboutUsModalOpen]=useState(false);
    const[emailModalOpen,setEmailModalOpen]=useState(false);
    const[phoneModalOpen,setPhoneModalOpen]=useState(false);
    const[helpFAQOpen,setHelpFAQOpen]=useState(false);

    return (
            <footer>
                <h1 className='footer-container'>AccessAble NYC.</h1>
                <div className='footer-container'>
                    <p className='footer-title'>Website</p>
                    <a href="#" onClick={() => setAboutUsModalOpen(true)} className='footer-items'>About us</a>
                    <Link to="/" className='footer-items'>Home</Link>
                </div>

                <div className='footer-container'>
                    <p className='footer-title'>Contact</p>
                    <a href="#" onClick={() => setEmailModalOpen(true)} className='footer-items'>Email</a>
                    <a href="#" onClick={() => setPhoneModalOpen(true)} className='footer-items'>Phone</a>
                </div>

                <div className='footer-container'>
                    <p className='footer-title'>More</p>
                    <Link to='/feedback' className='footer-items'>Feedback</Link>
                    <a href="#" onClick={() => setHelpFAQOpen(true) } className='footer-items'>Help/FAQs</a>
                </div>
                <AboutUsModal
                show={aboutUsModalOpen}
                onHide={() => setAboutUsModalOpen(false)}
                />
                <EmailModal
                    show={emailModalOpen}
                    onHide={() => setEmailModalOpen(false)}
                />
                <PhoneModal
                    show={phoneModalOpen}
                    onHide={() => setPhoneModalOpen(false)}
                />
                <HelpFAQModal
                    show={helpFAQOpen}
                    onHide={() => setHelpFAQOpen(false)}
                />
            </footer>
    );
};

export default Footer;
//comment for testing
