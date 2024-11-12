import request from 'supertest';
import express from 'express';
import userRoute from '../routes/user.route.js';
import User from '../models/users.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Location from '../models/location.model.js';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
app.use("/", userRoute);

jest.mock('../models/users.model.js');
jest.mock('../models/location.model.js');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('User Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /register', () => {
        it('should send a 201 response status when a new user is created', async () => {
            bcrypt.hash.mockResolvedValue('hashedPassword');
            User.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({
                    name: 'example',
                    email: 'hehe@gmail.com',
                    password: 'hashedPassword'
                })
            }));

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
                save: jest.fn().mockRejectedValue({code: 11000})
            }));

            const res = await request(app).post("/register").send({
                name: 'example',
                email: 'hehe@gmail.com',
                password: 'example'
            });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /login', () => {
        it('should return JWT token on successful login', async () => {
            const mockUser = {
                _id: 'userId',
                name: 'Test User',
                email: 'test@test.com',
                password: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mockToken');

            const res = await request(app).post("/login").send({
                email: 'test@test.com',
                password: 'password123'
            });

            expect(res.status).toBe(200);
            expect(res.body.token).toBe('mockToken');
        });

        it('should return 400 if user not found', async () => {
            User.findOne.mockResolvedValue(null);

            const res = await request(app).post("/login").send({
                email: 'nonexistent@test.com',
                password: 'password123'
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /:id', () => {
        it('should return user data for valid ID', async () => {
            const mockUser = {
                _id: 'validId',
                name: 'Test User',
                email: 'test@test.com'
            };

            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            User.findById.mockResolvedValue(mockUser);

            const res = await request(app).get('/validId');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockUser);
        });

        it('should return 404 for invalid ID', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);

            const res = await request(app).get('/invalidId');

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /:id/password', () => {
        it('should update password successfully', async () => {
            const mockUser = {
                _id: 'validId',
                password: 'oldHashedPassword'
            };

            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            User.findById.mockResolvedValue(mockUser);
            bcrypt.compare.mockImplementation((password, hash) => {
                return password === 'currentPassword';
            });
            bcrypt.hash.mockResolvedValue('newHashedPassword');
            User.findByIdAndUpdate.mockResolvedValue({ password: 'newHashedPassword' });

            const res = await request(app).put('/validId/password').send({
                currentPassword: 'currentPassword',
                newPassword: 'newPassword'
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('PUT /:id/addFavoriteLocation', () => {
        it('should add location to favorites', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            const mockUser = {
                favoriteLocations: [],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);

            const res = await request(app).put('/validId/addFavoriteLocation').send({
                locationId: 'validLocationId'
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 400 if location already in favorites', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            const mockUser = {
                favoriteLocations: ['validLocationId'],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);

            const res = await request(app).put('/validId/addFavoriteLocation').send({
                locationId: 'validLocationId'
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /:id/suggestLocations', () => {
        it('should return suggested locations', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            const mockCurrentUser = {
                _id: 'userId',
                favoriteLocations: ['loc1', 'loc2']
            };
            const mockOtherUsers = [{
                favoriteLocations: ['loc1', 'loc3', 'loc4']
            }];
            const mockLocations = [
                { _id: 'loc3', name: 'Location 3' },
                { _id: 'loc4', name: 'Location 4' }
            ];

            User.findById.mockResolvedValue(mockCurrentUser);
            User.find.mockResolvedValue(mockOtherUsers);
            Location.find.mockResolvedValue(mockLocations);

            const res = await request(app).get('/userId/suggestLocations');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.suggestedLocations).toEqual(mockLocations);
        });

        it('should return 404 for invalid user id', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);

            const res = await request(app).get('/invalidId/suggestLocations');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /:id', () => {
        it('should delete user successfully', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            User.findById.mockResolvedValue({
                password: 'hashedPassword'
            });
            bcrypt.compare.mockResolvedValue(true);
            User.findByIdAndDelete.mockResolvedValue(true);

            const res = await request(app).delete('/validId').send({
                password: 'correctPassword'
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 400 for incorrect password', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            User.findById.mockResolvedValue({
                password: 'hashedPassword'
            });
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app).delete('/validId').send({
                password: 'wrongPassword'
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
    
    describe('POST /', () => {
        it('should create a new user successfully', async () => {
            jest.clearAllMocks();
            const mockUser = {
                name: 'New User',
                email: 'newuser@test.com'
            };

            const mockSavedUser = { 
                ...mockUser,
                _id: 'mockId',
                save: jest.fn()
            };
    
            User.mockImplementation(() => mockSavedUser);
    
            mockSavedUser.save.mockResolvedValue(mockSavedUser);
    
            const res = await request(app).post('/').send(mockUser);
    
            expect(res.status).toBe(201);
            expect(res.body).toEqual({
                success: true,
                data: expect.objectContaining({
                    name: mockUser.name,
                    email: mockUser.email
                })
            });
        });
    
        it('should return 400 if required fields are missing', async () => {
            const res = await request(app).post('/').send({});
            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: 'Please provide all fields'
            });
        });
    
        it('should return 500 if server error occurs', async () => {
            const mockUser = {
                name: 'New User',
                email: 'newuser@test.com'
            };
    
            const mockSavedUser = {
                ...mockUser,
                save: jest.fn().mockRejectedValue(new Error('Database error'))
            };
    
            User.mockImplementation(() => mockSavedUser);
    
            const res = await request(app).post('/').send(mockUser);
            expect(res.status).toBe(500);
            expect(res.body).toEqual({
                success: false,
                message: 'Server Error'
            });
        });
    });
    
    describe('PUT /:id/email', () => {
        it('should update email successfully', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            const mockUser = {
                name: 'Test User',
                email: 'old@test.com',
                password: 'hashedPassword'
            };
            User.findById.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            User.findOne.mockResolvedValue(null);
            User.findByIdAndUpdate.mockResolvedValue({
                ...mockUser,
                email: 'new@test.com'
            });
    
            const res = await request(app).put('/validId/email').send({
                password: 'correctPassword',
                newEmail: 'new@test.com'
            });
    
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    
        it('should return 400 if new email is same as current', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            const mockUser = {
                email: 'test@test.com',
                password: 'hashedPassword'
            };
            User.findById.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
    
            const res = await request(app).put('/validId/email').send({
                password: 'correctPassword',
                newEmail: 'test@test.com'
            });
    
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    
        it('should return 400 if email already in use', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            const mockUser = {
                email: 'old@test.com',
                password: 'hashedPassword'
            };
            User.findById.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            User.findOne.mockResolvedValue({ email: 'new@test.com' });
    
            const res = await request(app).put('/validId/email').send({
                password: 'correctPassword',
                newEmail: 'new@test.com'
            });
    
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
    
    describe('PUT /:id/deleteFavoriteLocation', () => {
        it('should remove location from favorites', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            
            const mockUser = {
                favoriteLocations: ['locationId'],
                pull: jest.fn(),
                save: jest.fn().mockResolvedValue(true)
            };
            
            mockUser.favoriteLocations.pull = jest.fn();
            
            User.findById.mockResolvedValue(mockUser);
    
            const res = await request(app).put('/validId/deleteFavoriteLocation').send({
                locationId: 'locationId'
            });
    
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    
        it('should return 404 if location not in favorites', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            const mockUser = {
                favoriteLocations: [],
                save: jest.fn().mockResolvedValue(true),
                pull: jest.fn()
            };
            User.findById.mockResolvedValue(mockUser);
    
            const res = await request(app).put('/validId/deleteFavoriteLocation').send({
                locationId: 'nonexistentLocation'
            });
    
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });
    
    describe('GET /:id/favoriteLocations', () => {
        it('should return user favorite locations', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            const mockUser = {
                favoriteLocations: ['loc1', 'loc2']
            };
            const mockLocations = [
                { _id: 'loc1', name: 'Location 1' },
                { _id: 'loc2', name: 'Location 2' }
            ];
            
            User.findById.mockResolvedValue(mockUser);
            Location.findById.mockImplementation((id) => {
                return Promise.resolve(mockLocations.find(loc => loc._id === id));
            });
    
            const res = await request(app).get('/validId/favoriteLocations');
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.locations).toEqual(mockLocations);
        });
    
        it('should return 500 if error occurs', async () => {
            mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
            User.findById.mockRejectedValue(new Error('Database error'));
    
            const res = await request(app).get('/validId/favoriteLocations');
            
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });

})

// fetch user test
describe('GET /users', () => {

    it('should return all users with status 200', async () => {
        User.find = jest.fn().mockResolvedValue([
            { name: 'User1', email: 'user1@example.com' },
            { name: 'User2', email: 'user2@example.com' },
        ]);


    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    });

    it('should return 500 if there is error fecthing users',async()=>{
        User.find=jest.fn().mockRejectedValue(new Error('Error'));
        
        
        const res=await request(app).get('/users');
        
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('server error');
    });

});

//get user by id 
/*describe('GET /users/:id', () => {
   

    it('should return a user when a valid id is provided', async () => {
        const user = { _id: userId, name: 'user1', email: 'user1@example.com' };
        User.findById.mockResolvedValue(user);

        const res = await request(app).get(`/users/${userId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(user);
    });

})



// fetch user test
describe('GET /users', () => {

    it('should return all users with status 200', async () => {
        User.find = jest.fn().mockResolvedValue([
            { name: 'User1', email: 'user1@example.com' },
            { name: 'User2', email: 'user2@example.com' },
        ]);


    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    });

    it('should return 500 if there is error fecthing users',async()=>{
        User.find=jest.fn().mockRejectedValue(new Error('Error'));
        
        
        const res=await request(app).get('/users');
        
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('server error');
    });

});

//get user by id 
/*describe('GET /users/:id', () => {
   

    it('should return a user when a valid id is provided', async () => {
        const user = { _id: userId, name: 'user1', email: 'user1@example.com' };
        User.findById.mockResolvedValue(user);

        const res = await request(app).get(`/users/${userId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(user);
    });

    it('should return 404 for invalid id', async () => {
        const invalidId = ''; 

        User.findById.mockResolvedValue(null); 

        const res = await request(app).get(`/users/${invalidId}`);
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid User Id');
    });

    it('should return 500 if there is an error fetching the user', async () => {
        const userId = validId;
        
        User.findById.mockRejectedValue(new Error('Server Error'));

        const res = await request(app).get(`/users/${userId}`);
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Server Error');
    });
});
*/

//add a user test. 
describe('POST /', () => {

    /*
    it('should create a new user and return 201 status', async () => {
        const newUser = { name: 'User111', email: 'User@example.com' };

        User.save = jest.fn().mockResolvedValue(newUser);

        
        const res = await request(app).post('/').send(newUser);
        console.log('Response:', res.body);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(newUser.name);
        expect(res.body.data.email).toBe(newUser.email);
    });
    */


    it('should return 400 when required fields are missing',async()=>{

        const newUser={name: '',email:''};

        const res=await request(app).post('/').send(newUser);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Please provide all fields');
    })

    it('should return 500 if there is an error while saving user',async()=>{

        const newUser= {name:'User',email:'User@example.com'};

        User.mockImplementation(()=>({
            save:jest.fn().mockRejectedValue(new Error('Server Error')),
        }));

        const res=await request(app).post('/').send(newUser);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Server Error');
    })
});

