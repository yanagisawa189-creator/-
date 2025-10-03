import { getDB } from '../config/database';
import { SalesCompany } from '../types';

export class SalesCompanyModel {
  static async create(companyData: Omit<SalesCompany, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesCompany> {
    const db = getDB();
    const query = `
      INSERT INTO sales_companies (user_id, company_name, industry, description, website, employees, target_industries, services)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      companyData.userId,
      companyData.companyName,
      companyData.industry,
      companyData.description,
      companyData.website,
      companyData.employees,
      companyData.targetIndustries,
      companyData.services
    ]);
    
    return this.mapDbRowToSalesCompany(result.rows[0]);
  }

  static async findByUserId(userId: string): Promise<SalesCompany | null> {
    const db = getDB();
    const query = 'SELECT * FROM sales_companies WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    
    return result.rows.length > 0 ? this.mapDbRowToSalesCompany(result.rows[0]) : null;
  }

  static async findById(id: string): Promise<SalesCompany | null> {
    const db = getDB();
    const query = 'SELECT * FROM sales_companies WHERE id = $1';
    const result = await db.query(query, [id]);
    
    return result.rows.length > 0 ? this.mapDbRowToSalesCompany(result.rows[0]) : null;
  }

  static async findByIndustry(industry: string): Promise<SalesCompany[]> {
    const db = getDB();
    const query = 'SELECT * FROM sales_companies WHERE industry = $1 OR $1 = ANY(target_industries)';
    const result = await db.query(query, [industry]);
    
    return result.rows.map(row => this.mapDbRowToSalesCompany(row));
  }

  static async update(id: string, updateData: Partial<SalesCompany>): Promise<SalesCompany | null> {
    const db = getDB();
    const setClause = Object.keys(updateData)
      .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
      .map((key, index) => `${this.camelToSnake(key)} = $${index + 2}`)
      .join(', ');
    
    if (setClause.length === 0) return null;
    
    const query = `
      UPDATE sales_companies 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updateData).filter((_, index) => {
      const key = Object.keys(updateData)[index];
      return key !== 'id' && key !== 'createdAt' && key !== 'updatedAt';
    })];
    
    const result = await db.query(query, values);
    
    return result.rows.length > 0 ? this.mapDbRowToSalesCompany(result.rows[0]) : null;
  }

  private static mapDbRowToSalesCompany(row: any): SalesCompany {
    return {
      id: row.id,
      userId: row.user_id,
      companyName: row.company_name,
      industry: row.industry,
      description: row.description,
      website: row.website,
      employees: row.employees,
      targetIndustries: row.target_industries || [],
      services: row.services || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}