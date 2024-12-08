import mongoose from "mongoose";

const reviewSchema= new mongoose.Schema({
    locationId:{
        type: mongoose.Schema.Types.ObjectId,
        required:true
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must be at most 5'],
        validate: {
            validator: function(v) {
                return Number.isInteger(v) && v >= 1 && v <= 5;
            },
            message: props => `${props.value} is not a valid rating!`
        }
    },

    date:{
        type: Date,
        default: Date.now
    },
    
    review:{
        type: String,
        required:true
    }

    
},
    {
        timestamps:true
    }
);


const Review= mongoose.model('Review', reviewSchema);

export default Review;