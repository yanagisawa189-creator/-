import { MatchRequestModel } from '../models/MatchRequest';
import { SalesCompanyModel } from '../models/SalesCompany';
import { DecisionMakerModel } from '../models/DecisionMaker';

describe('Matching System', () => {
  describe('MatchRequestModel', () => {
    const mockMatchRequest = {
      salesCompanyId: 'sales-123',
      decisionMakerId: 'dm-123',
      message: 'We would like to discuss a potential partnership.',
      status: 'pending' as const
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create a match request', async () => {
      const mockCreate = jest.spyOn(MatchRequestModel, 'create').mockResolvedValue({
        id: 'match-123',
        ...mockMatchRequest,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await MatchRequestModel.create(mockMatchRequest);

      expect(mockCreate).toHaveBeenCalledWith(mockMatchRequest);
      expect(result.message).toBe(mockMatchRequest.message);
      expect(result.status).toBe('pending');
    });

    test('should update match request status', async () => {
      const mockUpdate = jest.spyOn(MatchRequestModel, 'updateStatus').mockResolvedValue({
        id: 'match-123',
        ...mockMatchRequest,
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await MatchRequestModel.updateStatus('match-123', 'accepted');

      expect(mockUpdate).toHaveBeenCalledWith('match-123', 'accepted');
      expect(result?.status).toBe('accepted');
    });

    test('should check for existing requests', async () => {
      const mockCheck = jest.spyOn(MatchRequestModel, 'checkExistingRequest').mockResolvedValue({
        id: 'match-123',
        ...mockMatchRequest,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await MatchRequestModel.checkExistingRequest('sales-123', 'dm-123');

      expect(mockCheck).toHaveBeenCalledWith('sales-123', 'dm-123');
      expect(result?.salesCompanyId).toBe('sales-123');
      expect(result?.decisionMakerId).toBe('dm-123');
    });
  });

  describe('Search Functionality', () => {
    test('should find decision makers by industry', async () => {
      const mockDecisionMakers = [
        {
          id: 'dm-1',
          userId: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          position: 'CEO',
          companyName: 'Tech Corp',
          industry: 'Technology',
          companySize: '100-500',
          interests: ['Software', 'AI'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockFind = jest.spyOn(DecisionMakerModel, 'findByIndustry').mockResolvedValue(mockDecisionMakers);

      const result = await DecisionMakerModel.findByIndustry('Technology');

      expect(mockFind).toHaveBeenCalledWith('Technology');
      expect(result).toHaveLength(1);
      expect(result[0].industry).toBe('Technology');
    });

    test('should find sales companies by industry', async () => {
      const mockSalesCompanies = [
        {
          id: 'sc-1',
          userId: 'user-1',
          companyName: 'Sales Solutions Inc',
          industry: 'Technology',
          description: 'We provide cutting-edge sales solutions',
          website: 'https://example.com',
          employees: 50,
          targetIndustries: ['Technology', 'Finance'],
          services: ['Sales Training', 'CRM'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockFind = jest.spyOn(SalesCompanyModel, 'findByIndustry').mockResolvedValue(mockSalesCompanies);

      const result = await SalesCompanyModel.findByIndustry('Technology');

      expect(mockFind).toHaveBeenCalledWith('Technology');
      expect(result).toHaveLength(1);
      expect(result[0].industry).toBe('Technology');
    });
  });
});