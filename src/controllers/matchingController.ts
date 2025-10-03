import { Response } from 'express';
import { MatchRequestModel } from '../models/MatchRequest';
import { SalesCompanyModel } from '../models/SalesCompany';
import { DecisionMakerModel } from '../models/DecisionMaker';
import { AuthRequest } from '../types';

export const searchDecisionMakers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.userType !== 'sales_company') {
      return res.status(403).json({ error: 'Access restricted to sales companies' });
    }

    const { industry, interests } = req.query;

    let decisionMakers;

    if (industry) {
      decisionMakers = await DecisionMakerModel.findByIndustry(industry as string);
    } else if (interests) {
      const interestArray = Array.isArray(interests) ? interests as string[] : [interests as string];
      decisionMakers = await DecisionMakerModel.findByInterests(interestArray);
    } else {
      return res.status(400).json({ error: 'Please provide industry or interests for search' });
    }

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

    const salesCompanies = await SalesCompanyModel.findByIndustry(industry as string);

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

    const salesCompany = await SalesCompanyModel.findByUserId(req.user.id);
    if (!salesCompany) {
      return res.status(404).json({ error: 'Sales company profile not found' });
    }

    const decisionMaker = await DecisionMakerModel.findById(decisionMakerId);
    if (!decisionMaker) {
      return res.status(404).json({ error: 'Decision maker not found' });
    }

    const existingRequest = await MatchRequestModel.checkExistingRequest(
      salesCompany.id,
      decisionMakerId
    );

    if (existingRequest && existingRequest.status === 'pending') {
      return res.status(409).json({ error: 'Match request already pending' });
    }

    const matchRequest = await MatchRequestModel.create({
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

    const matchRequest = await MatchRequestModel.findById(requestId);
    if (!matchRequest) {
      return res.status(404).json({ error: 'Match request not found' });
    }

    const decisionMaker = await DecisionMakerModel.findByUserId(req.user.id);
    if (!decisionMaker || decisionMaker.id !== matchRequest.decisionMakerId) {
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    }

    if (matchRequest.status !== 'pending') {
      return res.status(409).json({ error: 'Match request already responded to' });
    }

    const updatedRequest = await MatchRequestModel.updateStatus(requestId, status);

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
      const salesCompany = await SalesCompanyModel.findByUserId(req.user.id);
      if (!salesCompany) {
        return res.status(404).json({ error: 'Sales company profile not found' });
      }
      matchRequests = await MatchRequestModel.findBySalesCompanyId(salesCompany.id);
    } else if (req.user.userType === 'decision_maker') {
      const decisionMaker = await DecisionMakerModel.findByUserId(req.user.id);
      if (!decisionMaker) {
        return res.status(404).json({ error: 'Decision maker profile not found' });
      }
      matchRequests = await MatchRequestModel.findByDecisionMakerId(decisionMaker.id);
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    res.json({ matchRequests });
  } catch (error) {
    console.error('Get match requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};