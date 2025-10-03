import { Response } from 'express';
import { SalesCompanyModel } from '../models/SalesCompany';
import { DecisionMakerModel } from '../models/DecisionMaker';
import { AuthRequest } from '../types';

export const createProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userType, id: userId } = req.user;

    if (userType === 'sales_company') {
      const {
        companyName,
        industry,
        description,
        website,
        employees,
        targetIndustries,
        services
      } = req.body;

      if (!companyName || !industry || !description) {
        return res.status(400).json({ error: 'Company name, industry, and description are required' });
      }

      const existingProfile = await SalesCompanyModel.findByUserId(userId);
      if (existingProfile) {
        return res.status(409).json({ error: 'Profile already exists' });
      }

      const profile = await SalesCompanyModel.create({
        userId,
        companyName,
        industry,
        description,
        website,
        employees: parseInt(employees) || 0,
        targetIndustries: targetIndustries || [],
        services: services || []
      });

      res.status(201).json({
        message: 'Sales company profile created successfully',
        profile
      });

    } else if (userType === 'decision_maker') {
      const {
        firstName,
        lastName,
        position,
        companyName,
        industry,
        companySize,
        interests,
        budget
      } = req.body;

      if (!firstName || !lastName || !position || !companyName || !industry) {
        return res.status(400).json({ 
          error: 'First name, last name, position, company name, and industry are required' 
        });
      }

      const existingProfile = await DecisionMakerModel.findByUserId(userId);
      if (existingProfile) {
        return res.status(409).json({ error: 'Profile already exists' });
      }

      const profile = await DecisionMakerModel.create({
        userId,
        firstName,
        lastName,
        position,
        companyName,
        industry,
        companySize,
        interests: interests || [],
        budget
      });

      res.status(201).json({
        message: 'Decision maker profile created successfully',
        profile
      });
    } else {
      res.status(400).json({ error: 'Invalid user type' });
    }
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userType, id: userId } = req.user;

    if (userType === 'sales_company') {
      const profile = await SalesCompanyModel.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json({ profile });
    } else if (userType === 'decision_maker') {
      const profile = await DecisionMakerModel.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json({ profile });
    } else {
      res.status(400).json({ error: 'Invalid user type' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userType, id: userId } = req.user;

    if (userType === 'sales_company') {
      const profile = await SalesCompanyModel.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const updatedProfile = await SalesCompanyModel.update(profile.id, req.body);
      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } else if (userType === 'decision_maker') {
      const profile = await DecisionMakerModel.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const updatedProfile = await DecisionMakerModel.update(profile.id, req.body);
      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } else {
      res.status(400).json({ error: 'Invalid user type' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};