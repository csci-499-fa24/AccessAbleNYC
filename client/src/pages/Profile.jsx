import React, {useState, useEffect} from 'react';
import NavBar from '../components/NavBar.jsx';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import ListGroup from 'react-bootstrap/ListGroup';
import '../style/Profile.css'
import Button from 'react-bootstrap/Button';
import Toast from 'react-bootstrap/Toast';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';


//user profile
function Profile() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [userId, setUserId] = useState('');
    const [joinDatePart, setJoinDatePart] = useState('');
    const [favoriteLocations, setFavoriteLocations] = useState([]);
    const [showToastError, setShowToastError] = useState(false);
    const [showToastSuccess, setShowToastSuccess] = useState(false);
    const [message, setMessage] = useState('');
    const [lastUpdatedDatePart, setLastUpdatedDatePart] = useState('');
    const[changeEmailModalOpen,setChangeEmailModalOpen]=useState(false);
    const[changePasswordModalOpen,setChangePasswordModalOpen]=useState(false);
    const[deleteAccountModalOpen,setDeleteAccountModalOpen]=useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchId, setSearchId] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();
    const [suggestLocations, setSuggestLocations] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setName(decodedToken.name);
            setEmail(decodedToken.email);
            setUserId(decodedToken.id);
            setJoinDate(decodedToken.joined);
            const joinDatePart = decodedToken.joined.match(/^\d{4}-\d{2}-\d{2}/)[0];
            setJoinDatePart(joinDatePart);
            const lastUpdatedDatePart = decodedToken.updated.match(/^\d{4}-\d{2}-\d{2}/)[0];
            setLastUpdatedDatePart(lastUpdatedDatePart);
        }

        if (userId){
            fetch(`${import.meta.env.VITE_PORT}/${userId}/favoriteLocations`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error fetching favorite locations');
                }
                return response.json();
            })
            .then((data) => {
                setFavoriteLocations(data.locations);
                console.log('Favorite locations data:', data.locations);
            })
            .catch((error) => {
                console.error('Error fetching favorite locations:', error);
            });
        }
    }, [userId, showToastSuccess]);


    useEffect(() => {
        if (userId){
            fetch(`${import.meta.env.VITE_PORT}/${userId}/suggestLocations`)
            .then((response)=>{
                if(!response.ok){
                    throw new Error('Error fetching suggested locations');
                }

                return response.json();
            })
            .then(data=> {
                setSuggestLocations(data.suggestedLocations);
            })
            .catch((error) => {
                console.error('Error fetching suggest locations:', error);
            });
        }
},[userId]);



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

    const handleAddLocation = (event) => {
        const userQuery = {locationId:searchId};
        event.preventDefault();
        fetch(`${import.meta.env.VITE_PORT}/${userId}/addFavoriteLocation`,{
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userQuery)
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                setSearchTerm('');
                setShowToastSuccess(true);
                setMessage(data.message);
            } else {
                setSearchTerm('');
                setShowToastError(true);
                setMessage('Unable to add location: '+ data.message);
            }
        })
        .catch(error => {
            setSearchTerm('');
            setShowToastError(true);
            setMessage('Error: '+ error);
        });
    };

    const handleAddLocation1 = (locationId) => {
        const userQuery = { locationId: locationId };
        fetch(`${import.meta.env.VITE_PORT}/${userId}/addFavoriteLocation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userQuery)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setShowToastSuccess(true);
                setMessage(data.message);
              
            
            } else {
                setShowToastError(true);
                setMessage('Unable to add location: ' + data.message);
            }
        })
        .catch(error => {
            setShowToastError(true);
            setMessage('Error: ' + error);
        });
    };

    const handleLocationSelection = (location) => {
        setSearchId(location._id);
        setSearchTerm(location.Name); 
        setSearchResults([]);
    };

    const handleDeleteFavoriteLocation = (locationId) => {
        const userQuery = {locationId: locationId};
        
        fetch(`${import.meta.env.VITE_PORT}/${userId}/deleteFavoriteLocation`,{
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(userQuery)
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                setShowToastSuccess(true);
                setMessage(data.message);
            } else {
                setShowToastError(true);
                setMessage('Unable to delete location: '+ data.message);
            }
        })
        .catch(error => {
            setShowToastError(true);
            setMessage('Error: '+ error);
        });
    };

    const handleShow = (selectedLocation) => {
        navigate(`/?location=${selectedLocation}`);
    };

    const handlePathTo = (destination) => {
        navigate(`/?lat=${destination.lat || destination.latitude}&lon=${destination.lon || destination.longitude}`);
    };
    
    return (
        <div>
            <NavBar/>
            <Container>
                <Row className='rowAdj'>
                    <Col><h1>Hello, {name}</h1></Col>
                    <Col xs={5}>
                        <Row>
                            <Col><small>User Id: {userId}</small></Col>
                        </Row>
                        <Row>
                            <Col><small>Joined: {joinDatePart}</small></Col>
                        </Row>
                    </Col>
                </Row>
                <Tabs
                defaultActiveKey="profile"
                id="uncontrolled-tab-example"
                className="mb-3 rowAdj"
                >
                    <Tab eventKey="profile" title="Profile">
                        <div className="d-flex align-items-center justify-content-between my-3">
                            <p className="mb-0 mr-2">Your Favorite Locations:</p>
                            <Form className="d-flex" onSubmit={handleAddLocation}>
                                <Form.Control
                                type="search"
                                placeholder="Search"
                                className="me-2"
                                aria-label="Search"
                                value={searchTerm}
                                style={{ borderRadius: '20px' }}
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
                                <Button variant="outline-success" className='addButton' style={{ borderRadius: '20px' }} type="submit">Add Location</Button>
                            </Form>
                        </div>
                        <ListGroup className="scrollable-list">
                            {favoriteLocations.map((location, index) => (
                                <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                    {location.facility_name || location.Name || location.ntaname || 'No Name'}
                                    <div>
                                        <Button variant="outline-success" onClick={() => handleShow(location.Name)}>Show</Button>
                                        <Button variant="outline-success" className='marginbutton' onClick={() => handlePathTo(location)}>Path to</Button>
                                        <Button variant="outline-danger" className='marginbutton' onClick={() => handleDeleteFavoriteLocation(location._id)}>Delete</Button>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>

                        <div className="spacing"></div> 
                        
                        {suggestLocations.length > 0 && (
                            <h2 className="suggestions-header">Suggested Locations Based on Favorites</h2>
                        )}
                        <ListGroup className="scrollable-list">
                                {suggestLocations.length>0?(
                                    suggestLocations.map((location,index)=>(
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                            {location.facility_name||location.Name||'No Name'}
                                            <div className="d-flex gap-2"> 
                                                <Button variant="outline-success" onClick={() => handleShow(location.Name)}>Show</Button>
                                                <Button variant="outline-success" className='marginbutton' onClick={() => handlePathTo(location)}>Path to</Button>
                                                <Button variant="outline-success" className="marginbutton" onClick={() => handleAddLocation1(location._id)}
                                                    >Add
                                                </Button>
                                            </div>
                                        </ListGroup.Item>

                                    ))
                                ):(
                                
                                <ListGroup.Item>No suggested locations available</ListGroup.Item>
                                )}
                        </ListGroup>
                    
                    </Tab>

                    <Tab eventKey="account" title="Account">
                        <Row>
                            <Col className="d-flex justify-content-between align-items-center px-4 my-3"><p>Change Account Email (<b>{email}</b>):</p><Button variant="outline-primary" className='custom-width' onClick={() => setChangeEmailModalOpen(true)}>Change</Button></Col>
                        </Row>
                        <Row>
                            <Col className="d-flex justify-content-between align-items-center px-4 my-1"><p>Change Account Password:</p><Button variant="outline-primary" className='custom-width' onClick={() => setChangePasswordModalOpen(true)}>Change</Button></Col>
                        </Row>
                        <Row>
                            <Col className="d-flex justify-content-between align-items-center px-4 my-3"><p>Delete Account:</p><Button variant="outline-danger" className='custom-width' onClick={() => setDeleteAccountModalOpen(true)}>Delete</Button></Col>
                        </Row>
                        <Row>
                            <Col className="d-flex justify-content-between align-items-center px-4"><small>Last Updated: {lastUpdatedDatePart}</small></Col>
                        </Row>
                    </Tab>
                    <Tab eventKey="settings" title="Settings">
                        Tab content for Settings
                    </Tab>
                </Tabs>
            </Container>
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
            <ChangeEmailModal
            show={changeEmailModalOpen}
            onHide={() => setChangeEmailModalOpen(false)}
            userid={userId}
            />
            <ChangePasswordModal
            show={changePasswordModalOpen}
            onHide={() => setChangePasswordModalOpen(false)}
            userid={userId}
            />
            <DeleteAccountModal
            show={deleteAccountModalOpen}
            onHide={() => setDeleteAccountModalOpen(false)}
            userid={userId}
            />
        </div>
    );
}

function ChangeEmailModal(props) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [showToastError, setShowToastError] = useState(false);
    const [message, setMessage] = useState('');
    const { userid } = props;
    const navigate = useNavigate();

    const handleChangeEmail = (event) => {
        event.preventDefault();

        const userQuery = {password: currentPassword, newEmail: newEmail};
        
        fetch(`${import.meta.env.VITE_PORT}/${userid}/email`,{
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userQuery)
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.removeItem('token');
                navigate('/Login');
            } else {
                setMessage(data.message);
                setShowToastError(true);
            }
        })
        .catch(error => {
            setMessage('Error: '+ error);
            setShowToastError(true);
        });
    };

    return (
        <div>
            <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                Change Email
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex justify-content-center">
                <Form onSubmit={handleChangeEmail}>
                    <Form.Group className="mb-3 label" controlId="formGroupCurrentPassword">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control type="password" placeholder="Enter Current Password" onChange={(e) => setCurrentPassword(e.target.value)}/>
                    </Form.Group>
                    <Form.Group className="mb-3 label" controlId="formGroupNewEmail">
                        <Form.Label>New Email</Form.Label>
                        <Form.Control type="email" placeholder="Enter New Email" onChange={(e) => setNewEmail(e.target.value)}/>
                    </Form.Group>
                    <div className="d-flex justify-content-center">
                        <Button variant="primary" type="submit">Change Email</Button>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Close</Button>
            </Modal.Footer>
            </Modal>
            <Toast onClose={() => setShowToastError(false)} show={showToastError} delay={3000} className="toast-bottom-right" bg='danger' autohide>
                <Toast.Header>
                    <strong className="me-auto">Alert</strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
        </div>
    );
}

function ChangePasswordModal(props) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showToastError, setShowToastError] = useState(false);
    const [message, setMessage] = useState('');
    const { userid } = props;
    const navigate = useNavigate();

    const handleChangePassword = (event) => {
        event.preventDefault();

        const userQuery = {currentPassword: currentPassword, newPassword: newPassword};
        
        fetch(`${import.meta.env.VITE_PORT}/${userid}/password`,{
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userQuery)
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.removeItem('token');
                navigate('/Login');
            } else {
                setMessage(data.message);
                setShowToastError(true);
            }
        })
        .catch(error => {
            setMessage('Error: '+ error);
            setShowToastError(true);
        });
    };

    return (
        <div>
            <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                Change Password
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex justify-content-center">
                <Form onSubmit={handleChangePassword}>
                    <Form.Group className="mb-3 label" controlId="formGroupCurrentPassword">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control type="password" placeholder="Enter Current Password" onChange={(e) => setCurrentPassword(e.target.value)}/>
                    </Form.Group>
                    <Form.Group className="mb-3 label" controlId="formGroupNewEmail">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control type="new password" placeholder="Enter New Password" onChange={(e) => setNewPassword(e.target.value)}/>
                    </Form.Group>
                    <div className="d-flex justify-content-center">
                        <Button variant="primary" type="submit">Change Password</Button>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Close</Button>
            </Modal.Footer>
            </Modal>
            <Toast onClose={() => setShowToastError(false)} show={showToastError} delay={3000} className="toast-bottom-right" bg='danger' autohide>
                <Toast.Header>
                    <strong className="me-auto">Alert</strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
        </div>
    );
}

function DeleteAccountModal(props) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [showToastError, setShowToastError] = useState(false);
    const [message, setMessage] = useState('');
    const { userid } = props;
    const navigate = useNavigate();

    const handleChangeEmail = (event) => {
        event.preventDefault();

        const userQuery = {password: currentPassword};
        
        fetch(`${import.meta.env.VITE_PORT}/${userid}`,{
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userQuery)
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.removeItem('token');
                navigate('/Login');
            } else {
                setMessage(data.message);
                setShowToastError(true);
            }
        })
        .catch(error => {
            setMessage('Error: '+ error);
            setShowToastError(true);
        });
    };

    return (
        <div>
            <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                Delete Account
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex justify-content-center">
                <Form onSubmit={handleChangeEmail}>
                    <Form.Group className="mb-3 label" controlId="formGroupCurrentPassword">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control type="password" placeholder="Enter Current Password" onChange={(e) => setCurrentPassword(e.target.value)}/>
                    </Form.Group>
                    <div className="d-flex justify-content-center">
                        <Button variant="danger" type="submit">Delete Account</Button>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Close</Button>
            </Modal.Footer>
            </Modal>
            <Toast onClose={() => setShowToastError(false)} show={showToastError} delay={3000} className="toast-bottom-right" bg='danger' autohide>
                <Toast.Header>
                    <strong className="me-auto">Alert</strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
        </div>
    );
}

export default Profile;