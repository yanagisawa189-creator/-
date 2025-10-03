export interface User {
  id: string;
  email: string;
  password: string;
  userType: 'sales_company' | 'decision_maker';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesCompany {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  description: string;
  website?: string;
  employees: number;
  targetIndustries: string[];
  services: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionMaker {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  position: string;
  companyName: string;
  industry: string;
  companySize: string;
  interests: string[];
  budget?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchRequest {
  id: string;
  salesCompanyId: string;
  decisionMakerId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  userType: 'sales_company' | 'decision_maker';
}