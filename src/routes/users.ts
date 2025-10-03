import { Router } from 'express';
import { createProfile, getProfile, updateProfile } from '../controllers/mockUserController';
import { authenticateToken } from '../middleware/auth';

export const userRoutes = Router();

userRoutes.use(authenticateToken);

userRoutes.post('/profile', createProfile);
userRoutes.get('/profile', getProfile);
userRoutes.put('/profile', updateProfile);