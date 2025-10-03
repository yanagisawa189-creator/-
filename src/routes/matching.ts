import { Router } from 'express';
import {
  searchDecisionMakers,
  searchSalesCompanies,
  sendMatchRequest,
  respondToMatchRequest,
  getMatchRequests
} from '../controllers/mockMatchingController';
import { authenticateToken, requireUserType } from '../middleware/auth';

export const matchingRoutes = Router();

matchingRoutes.use(authenticateToken);

matchingRoutes.get('/search/decision-makers', requireUserType('sales_company'), searchDecisionMakers);
matchingRoutes.get('/search/sales-companies', requireUserType('decision_maker'), searchSalesCompanies);
matchingRoutes.post('/request', requireUserType('sales_company'), sendMatchRequest);
matchingRoutes.put('/request/:requestId/respond', requireUserType('decision_maker'), respondToMatchRequest);
matchingRoutes.get('/requests', getMatchRequests);