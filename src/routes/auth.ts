import { Router } from 'express';
import { register, login, verifyToken } from '../controllers/mockAuthController';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/verify', verifyToken);