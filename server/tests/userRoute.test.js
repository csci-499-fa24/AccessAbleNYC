import request from 'supertest'
import express from 'express';
import userRoute from '../routes/user.route.js'; // Adjust the path if necessary
import User from '../models/users.model.js';
import bcrypt from 'bcrypt';

// Create an Express application for testing
const app = express();
app.use(express.json());
app.use("", userRoute);

jest.mock('../models/users.model.js')
jest.mock('bcrypt');

describe('POST /register', () => {
    it('should send a 201 response status when a new user is created', async () => {
        const res = await request(app).post("/register").send({
            name: 'example',
            email: 'hehe@gmail.com',
            password: 'example'
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });
    it('should send a 400 response status if any of the fields are missing', async () => {
        const res = await request(app).post("/register").send({
            name: '',
            email: '',
            password: ''
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
    it('should send a 409 response status if the email are duplicates', async () => {
        User.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue({ code: 11000 })
        }));
            

        const res = await request(app).post("/register").send({
            name: 'example',
            email: 'hehe@gmail.com',
            password: 'example'
        });
        console.log('Response:', res.body); 
        console.log('Response:', res.statusCode); 
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);

    });
})