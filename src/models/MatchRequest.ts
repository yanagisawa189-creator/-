import { getDB } from '../config/database';
import { MatchRequest } from '../types';

export class MatchRequestModel {
  static async create(requestData: Omit<MatchRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<MatchRequest> {
    const db = getDB();
    const query = `
      INSERT INTO match_requests (sales_company_id, decision_maker_id, message, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      requestData.salesCompanyId,
      requestData.decisionMakerId,
      requestData.message,
      requestData.status
    ]);
    
    return this.mapDbRowToMatchRequest(result.rows[0]);
  }

  static async findById(id: string): Promise<MatchRequest | null> {
    const db = getDB();
    const query = 'SELECT * FROM match_requests WHERE id = $1';
    const result = await db.query(query, [id]);
    
    return result.rows.length > 0 ? this.mapDbRowToMatchRequest(result.rows[0]) : null;
  }

  static async findBySalesCompanyId(salesCompanyId: string): Promise<MatchRequest[]> {
    const db = getDB();
    const query = 'SELECT * FROM match_requests WHERE sales_company_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [salesCompanyId]);
    
    return result.rows.map(row => this.mapDbRowToMatchRequest(row));
  }

  static async findByDecisionMakerId(decisionMakerId: string): Promise<MatchRequest[]> {
    const db = getDB();
    const query = 'SELECT * FROM match_requests WHERE decision_maker_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [decisionMakerId]);
    
    return result.rows.map(row => this.mapDbRowToMatchRequest(row));
  }

  static async findByStatus(status: string): Promise<MatchRequest[]> {
    const db = getDB();
    const query = 'SELECT * FROM match_requests WHERE status = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [status]);
    
    return result.rows.map(row => this.mapDbRowToMatchRequest(row));
  }

  static async updateStatus(id: string, status: 'pending' | 'accepted' | 'rejected'): Promise<MatchRequest | null> {
    const db = getDB();
    const query = `
      UPDATE match_requests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
    
    return result.rows.length > 0 ? this.mapDbRowToMatchRequest(result.rows[0]) : null;
  }

  static async checkExistingRequest(salesCompanyId: string, decisionMakerId: string): Promise<MatchRequest | null> {
    const db = getDB();
    const query = `
      SELECT * FROM match_requests 
      WHERE sales_company_id = $1 AND decision_maker_id = $2 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await db.query(query, [salesCompanyId, decisionMakerId]);
    
    return result.rows.length > 0 ? this.mapDbRowToMatchRequest(result.rows[0]) : null;
  }

  private static mapDbRowToMatchRequest(row: any): MatchRequest {
    return {
      id: row.id,
      salesCompanyId: row.sales_company_id,
      decisionMakerId: row.decision_maker_id,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}