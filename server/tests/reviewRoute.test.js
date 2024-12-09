import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import reviewroute from '../routes/review.route.js'; 
import review from '../models/review.model.js'

process.env.SECRET_ACCESS_TOKEN = 'test_secret';

const app = express();
app.use(express.json());
app.use(reviewroute);

jest.mock('mongoose', () => {
  const originalMongoose = jest.requireActual('mongoose');
  return {
    ...originalMongoose,
    Types: {
      ObjectId: {
        isValid: jest.fn()
      }
    }
  };
});

jest.mock('../models/review.model.js', () => {
    return {
        create: jest.fn(),
        aggregate: jest.fn(),
        findByIdAndDelete: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn()
    };
});

describe('Test Review Routes', () => {
  const validToken = jwt.sign({ id: 'testuser' }, process.env.SECRET_ACCESS_TOKEN);
  const invalidToken = 'invalid_token';
  const locationId = '000000';
  const invalidLocationId = 'invalidLocationId';
  const reviewId = '99'
  const mockreview= {
        locationId,
        userId: 'testuser',
        rating: 4,
        review: 'mock review'
  }

  beforeEach(() => {
    review.findOne.mockResolvedValue(null);
    mongoose.Types.ObjectId.isValid.mockReturnValue(true); 
  });

  test('POST /review/:locationId - User not authenticated', async () => {
    const res = await request(app)
      .post(`/review/${locationId}`)
      .send(mockreview);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'User not authenticated' });
});



test('POST /review/:locationId - Invalid or expired token', async () => {
  const res = await request(app)
    .post(`/review/${locationId}`)
    .set('Authorization', `Bearer ${invalidToken}`)
    .send(mockreview);
  expect(res.status).toBe(401);
  expect(res.body).toEqual({ success: false, message: 'Invalid or expired token' });
});

  test('POST /review/:locationId - Invalid Location ID', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const res = await request(app)
      .post(`/review/${invalidLocationId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send(mockreview);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Invalid Location' });
  });

  test('GET /review/:locationId - Invalid Location ID', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const res = await request(app)
      .get(`/review/${invalidLocationId}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Invalid Location' });
  });

  test('POST Invalid rating review', async () => { 
    const error = new Error('Review validation failed: rating: Rating must be at least 1, review: Path `review` is required.'); 
    
    review.create.mockRejectedValue(error);

    const res = await request(app) 
        .post(`/review/${locationId}`) 
        .set('Authorization', `Bearer ${validToken}`) 
        .send(mockreview); 
    
        expect(res.status).toBe(500); 
        expect(res.body).toEqual({ success: false, message: error.message }); });

  test('POST Review server error', async () => {
      const error = new Error('Internal Server Error');

      review.create.mockRejectedValue(error);  

      const res = await request(app)
        .post(`/review/${locationId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({mockreview});
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, message: 'Internal Server Error' });
  });


  test('POST review Successful', async () => {
      review.create.mockResolvedValue(mockreview);

      const res = await request(app)
        .post(`/review/${locationId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(mockreview);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ 
        success: true, 
        rating: 4,
        review: mockreview });

  });

  test('POST Duplicate review', async () => { 
      review.findOne.mockResolvedValue(mockreview); 

      const res = await request(app) 
        .post(`/review/${locationId}`) 
        .set('Authorization', `Bearer ${validToken}`) 
        .send(mockreview);

      expect(res.status).toBe(409); 
      expect(res.body).toEqual({ success: false, message: 'User already posted review to this location' });
  });


/*
test('GET Reviews success', async () => {         
  review.find.mockResolvedValue(mockreview); 
  const res = await request(app).get(`/review/${locationId}`);

  expect(res.status).toBe(200); 
  expect(res.body).toEqual({ success: true, reviews: mockreview }); });
*/

  test('GET Invalid Location ID', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const res = await request(app).get(`/rating/${invalidLocationId}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Invalid Location' });
  });


    
  test('GET Invalid Location ID', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      const res = await request(app)
        .get(`/rating/${invalidLocationId}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: 'Invalid Location' });
  });
  
  
  
  test('PUT Review not found', async () => {
    jwt.verify = jest.fn().mockReturnValue({ id: 111 });

    review.findOne.mockResolvedValue(null);

    const res = await request(app)
      .put(`/review/${locationId}/${reviewId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        rating: 4,
        review: 'update'
      });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Review not found' });
  });

  test('DELETE Review not found or not authorized', async () => {
    jwt.verify = jest.fn().mockReturnValue({ id: 111 });

    review.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app)
      .delete(`/review/${locationId}/${reviewId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Review not found or not authorized to delete this review' });
  });


  test('DELETE Successful delete', async () => {
    jwt.verify = jest.fn().mockReturnValue({ id: 111 });
    review.findByIdAndDelete.mockResolvedValue(mockreview);

    const res = await request(app)
      .delete(`/review/${locationId}/${reviewId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Review deleted successfully' });
  });

});
