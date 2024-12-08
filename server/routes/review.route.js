import express from 'express';
import Location from '../models/location.model.js';
import Review from '../models/review.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const router = express.Router();

const authenticateUser = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);  
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};


router.post('/review/:locationId', authenticateUser, async (req, res) => {
    const { locationId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user ? req.user.id : null;  

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(locationId)){
        return res.status(404).json({success: false, message: 'Invalid Location'});
    }

    try {
        const existingReview = await Review.findOne({ locationId, userId });
        if (existingReview) {
            return res.status(409).json({ success: false, message: "User already posted review to this location" });
        }
        const newReview = await Review.create({ locationId, userId, rating, review });
        res.status(201).json({ success: true, rating: rating, review: newReview });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.get('/review/:locationId', async (req, res) => {
    const { locationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(locationId)){
        return res.status(404).json({success: false, message: 'Invalid Location'});
    }

    try {
        const reviews = await Review.find({ locationId })
        .populate('userId','name') 
        .select(' rating review date');

        console.log(reviews[0]);
        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ success: false, message: 'No reviews found for this location' });
        }

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/rating/:locationId', async (req, res) => {
    const { locationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(locationId)){
        return res.status(404).json({success: false, message: 'Invalid Location'});
    }

    try {
        const result = await Review.aggregate([
            { $match: { locationId: new mongoose.Types.ObjectId(locationId) } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
        ]);
    
        if (result.length <= 0){
            return res.status(404).json({ success: false, message: 'No ratings found for this location' });
        }

        res.status(200).json({ success: true, averageRating: result[0].averageRating });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/review/:locationId/:reviewId', authenticateUser, async (req, res) => {
    const { locationId, reviewId } = req.params;
    const userId = req.user ? req.user.id : null;  

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    try {
        
        const review = await Review.findByIdAndDelete(reviewId, {
            conditions: { userId, locationId }
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found or not authorized to delete this review' });
        }

        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.put('/review/:locationId/:reviewId', authenticateUser, async (req, res) => {
    const { locationId, reviewId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user ? req.user.id : null; 

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    try {
        const existingReview = await Review.findOne({ 
            _id: reviewId,
            locationId: locationId, 
            userId: userId
        });

        if (!existingReview) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        existingReview.rating = rating || existingReview.rating;
        existingReview.review = review || existingReview.review;

        await existingReview.save();

        res.status(200).json({ success: true, review: existingReview });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;