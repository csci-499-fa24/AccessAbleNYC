import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, Row, Col, Container,ProgressBar, Modal, Card} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useTheme } from './ThemeContext';
import '../style/ReviewSideBar.css';
import Toast from 'react-bootstrap/Toast';
import { useNavigate } from 'react-router-dom';

const StarRating = ({ rating }) => {
    const starTotal = 5;
    const starPercentage = (rating / starTotal) * 100;

    return (
        <div className="star-rating">
            <div className="stars-outer">
                <div className="stars-inner" style={{ width: `${starPercentage}%` }}></div>
            </div>
        </div>
    );
};

const ReviewSideBar = ({ show, handleClose, location, rating}) => {
    const navigate = useNavigate();
    const [writeReviewOpen,setWriteReviewOpen]=useState(false);
    const [editReviewOpen,setEditReviewOpen]=useState(false);
    const [isAuthenticated,setIsAuthenticated] = useState(false);
    const { theme } = useTheme();
    const [reviewLength, setReviewLength] = useState(0);
    const [fiveStarReviews, setFiveStarReviews] = useState(0);
    const [fourStarReviews, setFourStarReviews] = useState(0);
    const [threeStarReviews, setThreeStarReviews] = useState(0);
    const [twoStarReviews, setTwoStarReviews] = useState(0);
    const [oneStarReviews, setOneStarReviews] = useState(0);
    const [name, setName] = useState('');
    const [userId, setUserId] = useState(0);
    const [userReview, setUserReview] = useState({});
    const [locationReviews, setLocationReviews] = useState([]);
    const [showToastError, setShowToastError] = useState(false);
    const [showToastSuccess, setShowToastSuccess] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setUserId(decodedToken.id);
            setName(decodedToken.name);
        }
    }, []);

    useEffect(() => {
        if (!location._id) return;

        fetch(`${import.meta.env.VITE_PORT}/review/${location._id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error fetching location accessibility rating');
                }
                return response.json();
            })
            .then((data) => {
                const reviews = data.reviews;
                setLocationReviews(reviews);
                setReviewLength(reviews.length);

                if (isAuthenticated){
                    const matchedReview = reviews.find((review)=>{
                        return String(review.userId._id) === String(userId) || String(review.userId) === String(userId) ;
                    })

                    setUserReview(matchedReview);
                }
                
                const fiveStar = reviews.filter((review) => review.rating === 5).length;
                const fourStar = reviews.filter((review) => review.rating === 4).length;
                const threeStar = reviews.filter((review) => review.rating === 3).length;
                const twoStar = reviews.filter((review) => review.rating === 2).length;
                const oneStar = reviews.filter((review) => review.rating === 1).length;

                setFiveStarReviews((fiveStar / reviews.length) * 100);
                setFourStarReviews((fourStar / reviews.length) * 100);
                setThreeStarReviews((threeStar / reviews.length) * 100);
                setTwoStarReviews((twoStar / reviews.length) * 100);
                setOneStarReviews((oneStar / reviews.length) * 100);
            })
            .catch((error) => {
                console.error('Error fetching location reviews:', error);
                setReviewLength(0);
                setFiveStarReviews(0);
                setFourStarReviews(0);
                setThreeStarReviews(0);
                setTwoStarReviews(0);
                setOneStarReviews(0);
                setLocationReviews([]);
                setUserReview({});
            });
    }, [location, rating, editReviewOpen, showToastSuccess, writeReviewOpen]);

    const handleDeleteReview = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`${import.meta.env.VITE_PORT}/review/${location._id}/${userReview._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Replace with your actual auth token
                }
            });
    
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
    
            const data = await response.json();
            setMessage('Review deleted successfully');
            setShowToastSuccess(true);
        } catch (error) {
            setMessage('Error deleting review:', error);
            setShowToastError(true);
        }
    };

    return (
        <Offcanvas
            show={show}
            onHide={handleClose}
            placement="end"
            className={theme === 'dark' ? 'sidebar-dark' : ''}
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>{location.Name || location.Location || location.facility_name}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
            <Container className='ratingContainer'>
                <Row className='ratingTitle'>Accessibility Rating</Row>
                <Row className='ratingInfo'>
                    <Col xs={8}>
                        <div className="progress-container">
                            <span>5</span> <ProgressBar variant="warning" now={fiveStarReviews} className='barwidth'/>
                        </div>
                        <div className="progress-container">
                            <span>4</span> <ProgressBar variant="warning" now={fourStarReviews} className='barwidth'/>
                        </div>
                        <div className="progress-container">
                            <span>3</span> <ProgressBar variant="warning" now={threeStarReviews} className='barwidth'/>
                        </div>
                        <div className="progress-container">
                            <span>2</span> <ProgressBar variant="warning" now={twoStarReviews} className='barwidth'/>
                        </div>
                        <div className="progress-container">
                            <span>1</span> <ProgressBar variant="warning" now={oneStarReviews} className='barwidth'/>
                        </div>
                    </Col>
                    <Col xs={4} className='ratingOverview'>
                        <p className='rating'>{(Math.round(rating * 10) / 10) || '-'}</p>
                        <div>
                            <StarRating rating={rating} />
                        </div>
                        <p className='reviewAmount'>{reviewLength} reviews</p>
                    </Col>
                </Row>
                <Row>
                    <Col className='reviewButtonContainer'>
                    {isAuthenticated ? (
                        <Button variant="outline-primary" className='ratingButton' onClick={() => setWriteReviewOpen(true)}>Write a review</Button>
                        ) : (
                        <Button variant="outline-primary" className='ratingButton' onClick={() => navigate('/login')}>Login to review</Button>
                    )}
                    </Col>
                </Row> 
                {userReview && userReview.rating && userReview.review ? (
                    <Card border="secondary" className='userReviews'>
                    <Card.Header className='d-flex justify-content-between align-items-center'>
                      <span>Your Review:</span>
                      <div>
                        <Button variant="outline-secondary" className='me-2' onClick={() => setEditReviewOpen(true)}>Edit</Button>
                        <Button variant="outline-danger" onClick={handleDeleteReview}>Delete</Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div className='userReview'>
                        <span>Accessibility Rating: </span><StarRating rating={userReview.rating}></StarRating>
                      </div>
                      <Card.Text>
                        {userReview.review}
                      </Card.Text>
                    </Card.Body>
                  </Card>                  
                    ) : null}
                {locationReviews.map((review, index) => (
                    <Card key={index} border="secondary" className='userReviews'>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                    <span>{review.userId.name}</span>
                    <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                        {new Date(review.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        })}
                    </span>
                    </Card.Header>
                    <Card.Body>
                        <div className='userReview'>
                            <span>Accessibility Rating: </span><StarRating rating={review.rating}></StarRating>
                        </div>
                        <Card.Text>
                            {review.review}
                        </Card.Text>
                    </Card.Body>
                </Card>                
                ))}
            </Container>
            </Offcanvas.Body>
            <WriteReviewModal
            show={writeReviewOpen}
            onHide={() => setWriteReviewOpen(false)}
            location = {location}
            userName = {name}
            />
            {userReview ? (
            <EditReviewModal
                show={editReviewOpen}
                onHide={() => setEditReviewOpen(false)}
                location={location}
                username={name}
                reviewid={userReview._id}
            />
            ) : null}
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
        </Offcanvas>
    );
};

function WriteReviewModal(props) {
    const [rating, setRating] = useState(0);
    const [userReview, setUserReview] = useState('');
    const [showToastError, setShowToastError] = useState(false);
    const [showToastSuccess, setShowToastSuccess] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');
        const userQuery = {rating: rating, review: userReview};
        
        try {
            const response = await fetch(`${import.meta.env.VITE_PORT}/review/${props.location._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Replace with your actual auth token
                },
                body: JSON.stringify(userQuery)
            });
    
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
    
            const data = await response.json();
            setRating(0);
            setUserReview('');
            setMessage('Review posted successfully');
            setShowToastSuccess(true);
        } catch (error) {
            setMessage('Error posting review:', error);
            setShowToastError(true);
        }
    };

    return (
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
        <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
            {props.location.Name || props.location.Location || props.location.facility_name}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Name: <span style={{ fontWeight: 'bold' }}>{props.userName}</span></p>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formGroupRating">
                    <Form.Label>Accessibility Rating</Form.Label>
                    <div className="star-rating-user">
                        {[...Array(5)].map((star, index) => {
                            const ratingValue = index + 1;

                            return (
                                <label key={index}>
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={ratingValue}
                                        onClick={() => setRating(ratingValue)}
                                        style={{ display: 'none' }}
                                    />
                                    <div
                                        className="star-user"
                                        style={{
                                            color: ratingValue <= rating ? "#ffc107" : "#e4e5e9",
                                            fontSize: "2em",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ★
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formGroupReview">
                    <Form.Label>Accessiblity Review</Form.Label>
                    <Form.Control as="textarea" type="review" value={userReview} placeholder="Share your experience on how accessible this location is" style={{ height: '200px' }} onChange={(e) => setUserReview(e.target.value)}/>
                </Form.Group>
                <div className="d-flex justify-content-center">
                    <Button variant="primary" type="submit" style={{ width: '150px' }}>Post</Button>
                </div>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
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
        </Modal>
    );
}

function EditReviewModal(props) {
    const [rating, setRating] = useState(0);
    const [userReview, setUserReview] = useState('');
    const [showToastError, setShowToastError] = useState(false);
    const [showToastSuccess, setShowToastSuccess] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');
        const userQuery = {rating: rating, review: userReview};
        
        try {
            const response = await fetch(`${import.meta.env.VITE_PORT}/review/${props.location._id}/${props.reviewid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Replace with your actual auth token
                },
                body: JSON.stringify(userQuery)
            });
    
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
    
            const data = await response.json();
            setRating(0);
            setUserReview('');
            setMessage('Review changed successfully');
            setShowToastSuccess(true);
        } catch (error) {
            setMessage('Error changing review:', error);
            setShowToastError(true);
        }
    };

    return (
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
        <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
            Edit review for {props.location.Name || props.location.Location || props.location.facility_name}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Name: <span style={{ fontWeight: 'bold' }}>{props.username}</span></p>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formGroupRating">
                    <Form.Label>Accessibility Rating</Form.Label>
                    <div className="star-rating-user">
                        {[...Array(5)].map((star, index) => {
                            const ratingValue = index + 1;

                            return (
                                <label key={index}>
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={ratingValue}
                                        onClick={() => setRating(ratingValue)}
                                        style={{ display: 'none' }}
                                    />
                                    <div
                                        className="star-user"
                                        style={{
                                            color: ratingValue <= rating ? "#ffc107" : "#e4e5e9",
                                            fontSize: "2em",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ★
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formGroupReview">
                    <Form.Label>Accessiblity Review</Form.Label>
                    <Form.Control as="textarea" type="review" value={userReview} placeholder="Share your experience on how accessible this location is" style={{ height: '200px' }} onChange={(e) => setUserReview(e.target.value)}/>
                </Form.Group>
                <div className="d-flex justify-content-center">
                    <Button variant="primary" type="submit" style={{ width: '150px' }}>Post</Button>
                </div>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
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
        </Modal>
    );
}

export default ReviewSideBar;