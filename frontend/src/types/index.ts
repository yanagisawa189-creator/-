export interface User {
  id: string;
  email: string;
  userType: 'sales_company' | 'decision_maker';
  isVerified: boolean;
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
}

export interface MatchRequest {
  id: string;
  salesCompanyId: string;
  decisionMakerId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userType: 'sales_company' | 'decision_maker') => Promise<void>;
  logout: () => void;
  loading: boolean;
}