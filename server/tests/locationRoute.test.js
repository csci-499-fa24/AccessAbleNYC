import request from 'supertest';
import express from 'express';
import locationRoutes from '../routes/location.route.js';
import Location from '../models/location.model.js';
 
jest.mock('../models/location.model.js');
 
const app = express();
app.use(express.json());  
app.use(locationRoutes);  

describe('Location Routes', () => {

    describe('GET /locations', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        
        it('returns status code 200 and a list of locations', async () => {
            Location.find.mockResolvedValue([{ name: 'Location 1' }, { name: 'Location 2' }]);

            const response = await request(app).get('/locations');
            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body).toEqual([{ name: 'Location 1' }, { name: 'Location 2' }]);
            console.log('Response:', response.body); 
            console.log('Response:', response.statusCode);   
        });

        it('returns status code 404 if no locations are found', async () => {
            Location.find.mockResolvedValue([]);

            const response = await request(app).get('/locations');
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe('No locations found');
            console.log('Response:', response.body);
            console.log('Response:', response.statusCode);
        });
    });
});




