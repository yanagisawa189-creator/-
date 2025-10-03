import { Response } from 'express';
import { MockDataStore } from '../storage/mockData';
import { AuthRequest } from '../types';

export const searchDecisionMakers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.userType !== 'sales_company') {
      return res.status(403).json({ error: 'Access restricted to sales companies' });
    }

    const { industry } = req.query;

    if (!industry) {
      return res.status(400).json({ error: 'Please provide industry for search' });
    }

    const decisionMakers = MockDataStore.findDecisionMakersByIndustry(industry as string);

    res.json({
      decisionMakers: decisionMakers.map(dm => ({
        id: dm.id,
        firstName: dm.firstName,
        lastName: dm.lastName,
        position: dm.position,
        companyName: dm.companyName,
        industry: dm.industry,
        companySize: dm.companySize,
        interests: dm.interests
      }))
    });
  } catch (error) {
    console.error('Search decision makers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchSalesCompanies = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.userType !== 'decision_maker') {
      return res.status(403).json({ error: 'Access restricted to decision makers' });
    }

    const { industry } = req.query;

    if (!industry) {
      return res.status(400).json({ error: 'Please provide industry for search' });
    }

    const salesCompanies = MockDataStore.findSalesCompaniesByIndustry(industry as string);

    res.json({
      salesCompanies: salesCompanies.map(sc => ({
        id: sc.id,
        companyName: sc.companyName,
        industry: sc.industry,
        description: sc.description,
        website: sc.website,
        employees: sc.employees,
        services: sc.services
      }))
    });
  } catch (error) {
    console.error('Search sales companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMatchRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.userType !== 'sales_company') {
      return res.status(403).json({ error: 'Access restricted to sales companies' });
    }

    const { decisionMakerId, message } = req.body;

    if (!decisionMakerId || !message) {
      return res.status(400).json({ error: 'Decision maker ID and message are required' });
    }

    const salesCompany = MockDataStore.findSalesCompanyByUserId(req.user.id);
    if (!salesCompany) {
      return res.status(404).json({ error: 'Sales company profile not found' });
    }

    const matchRequest = MockDataStore.createMatchRequest({
      salesCompanyId: salesCompany.id,
      decisionMakerId,
      message,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Match request sent successfully',
      matchRequest
    });
  } catch (error) {
    console.error('Send match request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const respondToMatchRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.userType !== 'decision_maker') {
      return res.status(403).json({ error: 'Access restricted to decision makers' });
    }

    const { requestId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }

    const updatedRequest = MockDataStore.updateMatchRequestStatus(requestId, status);
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Match request not found' });
    }

    res.json({
      message: `Match request ${status} successfully`,
      matchRequest: updatedRequest
    });
  } catch (error) {
    console.error('Respond to match request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMatchRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let matchRequests;

    if (req.user.userType === 'sales_company') {
      const salesCompany = MockDataStore.findSalesCompanyByUserId(req.user.id);
      if (!salesCompany) {
        return res.status(404).json({ error: 'Sales company profile not found' });
      }
      matchRequests = MockDataStore.findMatchRequestsBySalesCompanyId(salesCompany.id);
    } else if (req.user.userType === 'decision_maker') {
      const decisionMaker = MockDataStore.findDecisionMakerByUserId(req.user.id);
      if (!decisionMaker) {
        return res.status(404).json({ error: 'Decision maker profile not found' });
      }
      matchRequests = MockDataStore.findMatchRequestsByDecisionMakerId(decisionMaker.id);
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    res.json({ matchRequests });
  } catch (error) {
    console.error('Get match requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};