import { getDB } from '../config/database';
import { User } from '../types';

export class UserModel {
  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const db = getDB();
    const query = `
      INSERT INTO users (email, password, user_type, is_verified)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userData.email,
      userData.password,
      userData.userType,
      userData.isVerified
    ]);
    
    return this.mapDbRowToUser(result.rows[0]);
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = getDB();
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    
    return result.rows.length > 0 ? this.mapDbRowToUser(result.rows[0]) : null;
  }

  static async findById(id: string): Promise<User | null> {
    const db = getDB();
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    
    return result.rows.length > 0 ? this.mapDbRowToUser(result.rows[0]) : null;
  }

  static async updateVerificationStatus(id: string, isVerified: boolean): Promise<User | null> {
    const db = getDB();
    const query = `
      UPDATE users 
      SET is_verified = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await db.query(query, [isVerified, id]);
    
    return result.rows.length > 0 ? this.mapDbRowToUser(result.rows[0]) : null;
  }

  private static mapDbRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      userType: row.user_type,
      isVerified: row.is_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}