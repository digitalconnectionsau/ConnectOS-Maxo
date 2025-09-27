import bcrypt from 'bcryptjs';
import { getDatabase } from './database';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
}

export async function createUser(
  username: string,
  email: string,
  password: string,
  fullName?: string,
  role: string = 'admin'
): Promise<User> {
  const db = await getDatabase();
  
  // Hash the password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  const result = await db.query(`
    INSERT INTO users (username, email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, email, full_name, role, is_active, last_login, created_at
  `, [username, email, passwordHash, fullName || null, role]);
  
  return result.rows[0];
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  const db = await getDatabase();
  
  const result = await db.query(`
    SELECT id, username, email, password_hash, full_name, role, is_active, last_login, created_at
    FROM users 
    WHERE (username = $1 OR email = $1) AND is_active = true
  `, [username]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  // Update last login
  await db.query(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP 
    WHERE id = $1
  `, [user.id]);
  
  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDatabase();
  
  const result = await db.query(`
    SELECT id, username, email, full_name, role, is_active, last_login, created_at
    FROM users 
    WHERE id = $1 AND is_active = true
  `, [id]);
  
  return result.rows[0] || null;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDatabase();
  
  const result = await db.query(`
    SELECT id, username, email, full_name, role, is_active, last_login, created_at
    FROM users 
    ORDER BY created_at DESC
  `);
  
  return result.rows;
}

export async function updateUserPassword(
  id: number,
  newPassword: string
): Promise<boolean> {
  const db = await getDatabase();
  
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  
  const result = await db.query(`
    UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [passwordHash, id]);
  
  return (result.rowCount || 0) > 0;
}

export async function deactivateUser(id: number): Promise<boolean> {
  const db = await getDatabase();
  
  const result = await db.query(`
    UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [id]);
  
  return (result.rowCount || 0) > 0;
}