import { User, SalesCompany, DecisionMaker, MatchRequest } from '../types';

export class MockDataStore {
  private static users: Map<string, User> = new Map();
  private static salesCompanies: Map<string, SalesCompany> = new Map();
  private static decisionMakers: Map<string, DecisionMaker> = new Map();
  private static matchRequests: Map<string, MatchRequest> = new Map();

  static init() {
    // サンプルユーザーを追加
    const sampleUsers = [
      {
        id: 'user-sales-1',
        email: 'sales@example.com',
        password: '$2b$10$rQ8XaVuIZIbUdaOFXuFZReWvAXQfYXJKU.vGZjjBjJPsV.GrKJHjO', // password: 'sales123'
        userType: 'sales_company' as const,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-dm-1',
        email: 'dm@example.com',
        password: '$2b$10$rQ8XaVuIZIbUdaOFXuFZReWvAXQfYXJKU.vGZjjBjJPsV.GrKJHjO', // password: 'dm123'
        userType: 'decision_maker' as const,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
    });

    // サンプル営業会社プロフィール
    const sampleSalesCompany = {
      id: 'sc-1',
      userId: 'user-sales-1',
      companyName: '株式会社セールスソリューション',
      industry: 'IT・テクノロジー',
      description: '最新のCRMソリューションを提供し、営業効率を向上させます。',
      website: 'https://sales-solution.com',
      employees: 50,
      targetIndustries: ['製造業', '小売業', 'サービス業'],
      services: ['CRM導入', '営業研修', 'データ分析'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.salesCompanies.set(sampleSalesCompany.id, sampleSalesCompany);

    // サンプル決裁者プロフィール
    const sampleDecisionMaker = {
      id: 'dm-1',
      userId: 'user-dm-1',
      firstName: '田中',
      lastName: '太郎',
      position: '代表取締役',
      companyName: '株式会社テックコーポレーション',
      industry: 'IT・テクノロジー',
      companySize: '101-500名',
      interests: ['CRM', 'データ分析', '営業効率化'],
      budget: '100万円〜500万円',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.decisionMakers.set(sampleDecisionMaker.id, sampleDecisionMaker);
  }

  // User operations
  static findUserByEmail(email: string): User | null {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  static findUserById(id: string): User | null {
    return this.users.get(id) || null;
  }

  static createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Sales Company operations
  static findSalesCompanyByUserId(userId: string): SalesCompany | null {
    for (const company of this.salesCompanies.values()) {
      if (company.userId === userId) return company;
    }
    return null;
  }

  static createSalesCompany(companyData: Omit<SalesCompany, 'id' | 'createdAt' | 'updatedAt'>): SalesCompany {
    const id = `sc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const company: SalesCompany = {
      id,
      ...companyData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.salesCompanies.set(id, company);
    return company;
  }

  static findSalesCompaniesByIndustry(industry: string): SalesCompany[] {
    return Array.from(this.salesCompanies.values()).filter(
      company => company.industry === industry || company.targetIndustries.includes(industry)
    );
  }

  // Decision Maker operations
  static findDecisionMakerByUserId(userId: string): DecisionMaker | null {
    for (const maker of this.decisionMakers.values()) {
      if (maker.userId === userId) return maker;
    }
    return null;
  }

  static createDecisionMaker(makerData: Omit<DecisionMaker, 'id' | 'createdAt' | 'updatedAt'>): DecisionMaker {
    const id = `dm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const maker: DecisionMaker = {
      id,
      ...makerData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.decisionMakers.set(id, maker);
    return maker;
  }

  static findDecisionMakersByIndustry(industry: string): DecisionMaker[] {
    return Array.from(this.decisionMakers.values()).filter(
      maker => maker.industry === industry
    );
  }

  // Match Request operations
  static createMatchRequest(requestData: Omit<MatchRequest, 'id' | 'createdAt' | 'updatedAt'>): MatchRequest {
    const id = `mr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const request: MatchRequest = {
      id,
      ...requestData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.matchRequests.set(id, request);
    return request;
  }

  static findMatchRequestsBySalesCompanyId(salesCompanyId: string): MatchRequest[] {
    return Array.from(this.matchRequests.values()).filter(
      request => request.salesCompanyId === salesCompanyId
    );
  }

  static findMatchRequestsByDecisionMakerId(decisionMakerId: string): MatchRequest[] {
    return Array.from(this.matchRequests.values()).filter(
      request => request.decisionMakerId === decisionMakerId
    );
  }

  static updateMatchRequestStatus(id: string, status: 'accepted' | 'rejected'): MatchRequest | null {
    const request = this.matchRequests.get(id);
    if (request) {
      request.status = status;
      request.updatedAt = new Date().toISOString();
      return request;
    }
    return null;
  }
}

// Initialize mock data
MockDataStore.init();