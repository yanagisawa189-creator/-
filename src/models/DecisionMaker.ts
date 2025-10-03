import { getDB } from '../config/database';
import { DecisionMaker } from '../types';

export class DecisionMakerModel {
  static async create(makerData: Omit<DecisionMaker, 'id' | 'createdAt' | 'updatedAt'>): Promise<DecisionMaker> {
    const db = getDB();
    const query = `
      INSERT INTO decision_makers (user_id, first_name, last_name, position, company_name, industry, company_size, interests, budget)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      makerData.userId,
      makerData.firstName,
      makerData.lastName,
      makerData.position,
      makerData.companyName,
      makerData.industry,
      makerData.companySize,
      makerData.interests,
      makerData.budget
    ]);
    
    return this.mapDbRowToDecisionMaker(result.rows[0]);
  }

  static async findByUserId(userId: string): Promise<DecisionMaker | null> {
    const db = getDB();
    const query = 'SELECT * FROM decision_makers WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    
    return result.rows.length > 0 ? this.mapDbRowToDecisionMaker(result.rows[0]) : null;
  }

  static async findById(id: string): Promise<DecisionMaker | null> {
    const db = getDB();
    const query = 'SELECT * FROM decision_makers WHERE id = $1';
    const result = await db.query(query, [id]);
    
    return result.rows.length > 0 ? this.mapDbRowToDecisionMaker(result.rows[0]) : null;
  }

  static async findByIndustry(industry: string): Promise<DecisionMaker[]> {
    const db = getDB();
    const query = 'SELECT * FROM decision_makers WHERE industry = $1';
    const result = await db.query(query, [industry]);
    
    return result.rows.map(row => this.mapDbRowToDecisionMaker(row));
  }

  static async findByInterests(interests: string[]): Promise<DecisionMaker[]> {
    const db = getDB();
    const query = 'SELECT * FROM decision_makers WHERE interests && $1';
    const result = await db.query(query, [interests]);
    
    return result.rows.map(row => this.mapDbRowToDecisionMaker(row));
  }

  static async update(id: string, updateData: Partial<DecisionMaker>): Promise<DecisionMaker | null> {
    const db = getDB();
    const setClause = Object.keys(updateData)
      .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
      .map((key, index) => `${this.camelToSnake(key)} = $${index + 2}`)
      .join(', ');
    
    if (setClause.length === 0) return null;
    
    const query = `
      UPDATE decision_makers 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updateData).filter((_, index) => {
      const key = Object.keys(updateData)[index];
      return key !== 'id' && key !== 'createdAt' && key !== 'updatedAt';
    })];
    
    const result = await db.query(query, values);
    
    return result.rows.length > 0 ? this.mapDbRowToDecisionMaker(result.rows[0]) : null;
  }

  private static mapDbRowToDecisionMaker(row: any): DecisionMaker {
    return {
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      position: row.position,
      companyName: row.company_name,
      industry: row.industry,
      companySize: row.company_size,
      interests: row.interests || [],
      budget: row.budget,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}