import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { User } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const SQLITE_DB_FILE = path.join(DATA_DIR, 'users.db');
const LEGACY_DB_FILE = path.join(DATA_DIR, 'db.json');
export const JM_DB_FILE = path.join(process.cwd(), 'jm.db');

export interface StoredUserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  salt: string;
  role: 'customer' | 'admin';
  created_at: number;
  last_login_at?: number | null;
  status: 'active' | 'suspended';
  ref_password?: string | null;
}

export interface UserAuditRow {
  id: string;
  user_id: string;
  identifier: string;
  success: number;
  timestamp: number;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface DatabaseInfo {
  engine: string;
  filePath: string;
  sizeBytes: number;
  totalUsers: number;
  totalLogins: number;
  hashingAlgorithm: string;
  status: string;
}

// Cryptographic Password Hashing: PBKDF2 with SHA-512 and 10,000 iterations
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  // Support both 10,000 iterations and legacy 1,000 iterations
  const checkNew = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  if (checkNew === hash) return true;

  const checkLegacy = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkLegacy === hash;
}

class UserDatabaseService {
  private db: DatabaseSync;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    this.db = new DatabaseSync(SQLITE_DB_FILE);
    this.initSchema();
    this.seedInitialUsers();
    this.syncJmDbFile();
  }

  private initSchema(): void {
    // 1. Users credentials table in SQLite
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        created_at INTEGER NOT NULL,
        last_login_at INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        ref_password TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

      CREATE TABLE IF NOT EXISTS login_audit (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        identifier TEXT NOT NULL,
        success INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON login_audit(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON login_audit(timestamp);
    `);

    // Ensure ref_password column exists if table existed previously
    try {
      this.db.exec('ALTER TABLE users ADD COLUMN ref_password TEXT');
    } catch {}
  }

  // Seed default admin and demo user, plus import from legacy db.json if needed
  private seedInitialUsers(): void {
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    const result = countStmt.get() as { count: number };

    // If empty or if migrating from legacy db.json
    if (result.count === 0) {
      console.log('[UserDatabase] Initializing fresh users table in SQLite...');
      
      // Default Admin
      const adminSalt = generateSalt();
      const adminHash = hashPassword('admin123', adminSalt);
      this.insertUserDirect({
        id: 'usr-admin-01',
        name: 'JM Administrator',
        email: 'admin@jmenterprises.com',
        phone: '8747991688',
        password_hash: adminHash,
        salt: adminSalt,
        role: 'admin',
        created_at: Date.now() - 86400000 * 30,
        last_login_at: Date.now(),
        status: 'active',
        ref_password: 'admin123',
      });
    }

    // Populate known reference password for admin if missing
    try {
      this.db.exec(`
        UPDATE users SET ref_password = 'admin123' WHERE id = 'usr-admin-01' AND (ref_password IS NULL OR ref_password = '');
      `);
    } catch {}

    // Check if legacy db.json has users not yet in SQLite
    try {
      if (fs.existsSync(LEGACY_DB_FILE)) {
        const raw = fs.readFileSync(LEGACY_DB_FILE, 'utf-8');
        const legacyData = JSON.parse(raw);
        if (legacyData.users && Array.isArray(legacyData.users)) {
          for (const u of legacyData.users) {
            const exists = this.findUserById(u.id);
            if (!exists) {
              const guessedPwd = u.id === 'usr-admin-01' ? 'admin123' : (u.name?.toLowerCase().replace(/\s+/g, '') + '123' || 'customer123');
              this.insertUserDirect({
                id: u.id,
                name: u.name || 'Customer',
                email: (u.email || '').toLowerCase(),
                phone: u.phone || '',
                password_hash: u.passwordHash,
                salt: u.salt,
                role: u.role || 'customer',
                created_at: u.createdAt || Date.now(),
                last_login_at: null,
                status: 'active',
                ref_password: guessedPwd,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('[UserDatabase] Migration warning:', err);
    }
  }

  private insertUserDirect(u: StoredUserRow): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, salt, role, created_at, last_login_at, status, ref_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      u.id,
      u.name,
      u.email.toLowerCase(),
      u.phone,
      u.password_hash,
      u.salt,
      u.role,
      u.created_at,
      u.last_login_at || null,
      u.status || 'active',
      u.ref_password || null
    );
  }

  // Generate and synchronize the readable jm.db reference file
  public syncJmDbFile(): void {
    try {
      const stmt = this.db.prepare(`
        SELECT id, name, email, phone, role, ref_password, password_hash, salt, created_at, last_login_at, status
        FROM users
        ORDER BY created_at ASC
      `);
      const users = stmt.all() as any[];

      const nowStr = new Date().toISOString();
      const lines: string[] = [];

      lines.push('-- ====================================================================');
      lines.push('-- JM ENTERPRISES - USER CREDENTIALS & PASSWORDS DATABASE (jm.db)');
      lines.push('-- Store: JM Enterprises (Stationery, Xerox, Printout & Digital Center)');
      lines.push(`-- Last Updated: ${nowStr}`);
      lines.push(`-- Total Active Accounts: ${users.length}`);
      lines.push('-- File: jm.db');
      lines.push('-- Description: Reference database storing all User IDs, Accounts & Passwords');
      lines.push('-- ====================================================================');
      lines.push('');
      lines.push('/*');
      lines.push('+---------------------------------------------------------------------------------------------------------------------------------------+');
      lines.push('|                                        JM.DB - QUICK REFERENCE CREDENTIALS TABLE                                                      |');
      lines.push('+----------------------+----------------------+---------------------------+------------+--------------------+-----------------+--------+');
      lines.push('| USER ID              | NAME                 | EMAIL / PHONE             | ROLE       | PASSWORD (REF)     | CREATED DATE    | STATUS |');
      lines.push('+----------------------+----------------------+---------------------------+------------+--------------------+-----------------+--------+');

      for (const u of users) {
        const idCol = String(u.id).padEnd(20).slice(0, 20);
        const nameCol = String(u.name || '').padEnd(20).slice(0, 20);
        const contact = u.email || u.phone || '';
        const contactCol = String(contact).padEnd(25).slice(0, 25);
        const roleCol = String(u.role || '').toUpperCase().padEnd(10).slice(0, 10);
        const pwdCol = String(u.ref_password || '********').padEnd(18).slice(0, 18);
        const dateCol = new Date(u.created_at || Date.now()).toISOString().slice(0, 10).padEnd(15);
        const statusCol = String(u.status || 'active').padEnd(6).slice(0, 6);
        lines.push(`| ${idCol} | ${nameCol} | ${contactCol} | ${roleCol} | ${pwdCol} | ${dateCol} | ${statusCol} |`);
      }

      lines.push('+----------------------+----------------------+---------------------------+------------+--------------------+-----------------+--------+');
      lines.push('*/');
      lines.push('');
      lines.push('-- --------------------------------------------------------------------');
      lines.push('-- SQL SCHEMA & TABLE CREATION');
      lines.push('-- --------------------------------------------------------------------');
      lines.push('CREATE TABLE IF NOT EXISTS user_credentials (');
      lines.push('    id TEXT PRIMARY KEY,');
      lines.push('    name TEXT NOT NULL,');
      lines.push('    email TEXT,');
      lines.push('    phone TEXT,');
      lines.push('    role TEXT NOT NULL DEFAULT \'customer\',');
      lines.push('    password TEXT NOT NULL,          -- Reference password');
      lines.push('    password_hash TEXT NOT NULL,     -- PBKDF2-HMAC-SHA512');
      lines.push('    salt TEXT NOT NULL,              -- 16-byte cryptographic salt');
      lines.push('    created_at INTEGER NOT NULL,');
      lines.push('    last_login_at INTEGER,');
      lines.push('    status TEXT NOT NULL DEFAULT \'active\'');
      lines.push(');');
      lines.push('');
      lines.push('-- --------------------------------------------------------------------');
      lines.push('-- SQL DATA INSERT STATEMENTS FOR ALL USER CREDENTIALS');
      lines.push('-- --------------------------------------------------------------------');

      for (const u of users) {
        lines.push(`INSERT OR REPLACE INTO user_credentials (id, name, email, phone, role, password, password_hash, salt, created_at, last_login_at, status)`);
        lines.push(`VALUES (`);
        lines.push(`    ${JSON.stringify(u.id)},`);
        lines.push(`    ${JSON.stringify(u.name)},`);
        lines.push(`    ${JSON.stringify(u.email || '')},`);
        lines.push(`    ${JSON.stringify(u.phone || '')},`);
        lines.push(`    ${JSON.stringify(u.role || 'customer')},`);
        lines.push(`    ${JSON.stringify(u.ref_password || '********')}, -- Plaintext Password for Reference`);
        lines.push(`    ${JSON.stringify(u.password_hash || '')},`);
        lines.push(`    ${JSON.stringify(u.salt || '')},`);
        lines.push(`    ${u.created_at || Date.now()},`);
        lines.push(`    ${u.last_login_at ? u.last_login_at : 'NULL'},`);
        lines.push(`    ${JSON.stringify(u.status || 'active')}`);
        lines.push(`);`);
        lines.push('');
      }

      lines.push('-- --------------------------------------------------------------------');
      lines.push('-- JSON SNAPSHOT FOR QUICK PARSING & API EXPORT');
      lines.push('-- --------------------------------------------------------------------');
      lines.push('/* JSON_DATA_START');
      lines.push(JSON.stringify(users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        password: u.ref_password || '********',
        created_at: u.created_at,
        created_date: new Date(u.created_at).toISOString(),
        last_login_at: u.last_login_at,
        status: u.status
      })), null, 2));
      lines.push('JSON_DATA_END */');

      const content = lines.join('\n');
      fs.writeFileSync(JM_DB_FILE, content, 'utf-8');
      
      const copyInData = path.join(DATA_DIR, 'jm.db');
      fs.writeFileSync(copyInData, content, 'utf-8');
    } catch (err) {
      console.error('[UserDatabase] Error generating jm.db file:', err);
    }
  }

  // Create new user with credential hashing
  public createUser(params: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: 'customer' | 'admin';
  }): User {
    const salt = generateSalt();
    const passwordHash = hashPassword(params.password, salt);
    const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const role = params.role || 'customer';
    const createdAt = Date.now();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPhone = params.phone.trim();

    this.insertUserDirect({
      id,
      name: params.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password_hash: passwordHash,
      salt,
      role,
      created_at: createdAt,
      last_login_at: createdAt,
      status: 'active',
      ref_password: params.password,
    });

    this.syncJmDbFile();

    return {
      id,
      name: params.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role,
      createdAt,
    };
  }

  // Find user by identifier (email, phone, or 'admin')
  public findUserByEmailOrPhone(query: string): StoredUserRow | undefined {
    const q = query.trim().toLowerCase();
    
    // Check if query is 'admin' for master access
    if (q === 'admin') {
      const adminStmt = this.db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
      const admin = adminStmt.get() as StoredUserRow | undefined;
      if (admin) return admin;
    }

    const stmt = this.db.prepare(`
      SELECT * FROM users 
      WHERE lower(email) = ? OR phone = ? OR id = ?
      LIMIT 1
    `);
    return stmt.get(q, query.trim(), query.trim()) as StoredUserRow | undefined;
  }

  // Find user by ID
  public findUserById(id: string): StoredUserRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    return stmt.get(id) as StoredUserRow | undefined;
  }

  // Update last login timestamp
  public updateLastLogin(id: string): void {
    const stmt = this.db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?');
    stmt.run(Date.now(), id);
  }

  // Record audit log for login attempt
  public recordLoginAudit(
    userId: string,
    identifier: string,
    success: boolean,
    ip?: string,
    userAgent?: string
  ): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO login_audit (id, user_id, identifier, success, timestamp, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        identifier,
        success ? 1 : 0,
        Date.now(),
        ip || null,
        userAgent || null
      );
    } catch (err) {
      console.error('[UserDatabase] Audit log error:', err);
    }
  }

  // Get recent audit logs
  public getRecentAuditLogs(limit: number = 30): UserAuditRow[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, user_id, identifier, success, timestamp, ip_address, user_agent
        FROM login_audit
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      return stmt.all(limit) as unknown as UserAuditRow[];
    } catch (err) {
      console.error('[UserDatabase] Error fetching audit logs:', err);
      return [];
    }
  }

  // Get all users (sanitized, no passwordHash)
  public getAllUsers(): (User & { lastLoginAt?: number | null; status: string })[] {
    const stmt = this.db.prepare(`
      SELECT id, name, email, phone, role, created_at as createdAt, last_login_at as lastLoginAt, status
      FROM users
      ORDER BY created_at DESC
    `);
    return stmt.all() as any[];
  }

  // Delete user by ID
  public deleteUser(id: string): boolean {
    const user = this.findUserById(id);
    if (user && user.id === 'usr-admin-01') {
      throw new Error('Cannot delete primary Administrator account.');
    }
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(id);
    if (info.changes > 0) {
      this.syncJmDbFile();
      return true;
    }
    return false;
  }

  // Clear all registered users, preserving primary administrator account
  public clearRegisteredUsers(): { removedCount: number } {
    try {
      const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin' AND id != 'usr-admin-01'");
      const countResult = countStmt.get() as { count: number };
      const removedCount = countResult?.count || 0;

      // Delete registered non-admin users from SQLite
      const deleteUsersStmt = this.db.prepare("DELETE FROM users WHERE role != 'admin' AND id != 'usr-admin-01'");
      deleteUsersStmt.run();

      // Delete login audit events for non-admin accounts
      const deleteAuditStmt = this.db.prepare("DELETE FROM login_audit WHERE user_id != 'usr-admin-01'");
      deleteAuditStmt.run();

      // Ensure legacy db.json file is also cleaned
      try {
        if (fs.existsSync(LEGACY_DB_FILE)) {
          const raw = fs.readFileSync(LEGACY_DB_FILE, 'utf-8');
          const legacyData = JSON.parse(raw);
          if (legacyData.users && Array.isArray(legacyData.users)) {
            legacyData.users = legacyData.users.filter((u: any) => u.role === 'admin' || u.id === 'usr-admin-01');
            fs.writeFileSync(LEGACY_DB_FILE, JSON.stringify(legacyData, null, 2), 'utf-8');
          }
        }
      } catch (err) {
        console.error('[UserDatabase] Error cleaning legacy db.json:', err);
      }

      // Synchronize jm.db reference file immediately
      this.syncJmDbFile();

      return { removedCount };
    } catch (err) {
      console.error('[UserDatabase] Error clearing registered users:', err);
      throw err;
    }
  }

  // Reset user password
  public resetPassword(id: string, newPassword: string): boolean {
    const salt = generateSalt();
    const hash = hashPassword(newPassword, salt);
    const stmt = this.db.prepare('UPDATE users SET password_hash = ?, salt = ?, ref_password = ? WHERE id = ?');
    const info = stmt.run(hash, salt, newPassword, id);
    if (info.changes > 0) {
      this.syncJmDbFile();
      return true;
    }
    return false;
  }

  // Get raw content of jm.db
  public getJmDbContent(): string {
    if (!fs.existsSync(JM_DB_FILE)) {
      this.syncJmDbFile();
    }
    return fs.readFileSync(JM_DB_FILE, 'utf-8');
  }

  // Get user credentials list for jm.db viewer
  public getJmDbCredentials(): Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    created_at: number;
    last_login_at?: number | null;
    status: string;
  }> {
    const stmt = this.db.prepare(`
      SELECT id, name, email, phone, role, ref_password, created_at, last_login_at, status
      FROM users
      ORDER BY created_at ASC
    `);
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      role: r.role,
      password: r.ref_password || '********',
      created_at: r.created_at,
      last_login_at: r.last_login_at,
      status: r.status,
    }));
  }

  // Update user role
  public updateUserRole(id: string, role: 'customer' | 'admin'): boolean {
    const stmt = this.db.prepare('UPDATE users SET role = ? WHERE id = ?');
    const info = stmt.run(role, id);
    return info.changes > 0;
  }

  // Database metadata & diagnostics
  public getDatabaseInfo(): DatabaseInfo {
    let sizeBytes = 0;
    try {
      if (fs.existsSync(SQLITE_DB_FILE)) {
        sizeBytes = fs.statSync(SQLITE_DB_FILE).size;
      }
    } catch {}

    const usersCountStmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    const usersCount = (usersCountStmt.get() as { count: number }).count;

    const auditCountStmt = this.db.prepare('SELECT COUNT(*) as count FROM login_audit');
    const auditCount = (auditCountStmt.get() as { count: number }).count;

    return {
      engine: 'SQLite 3 (Node.js DatabaseSync)',
      filePath: path.relative(process.cwd(), SQLITE_DB_FILE),
      sizeBytes,
      totalUsers: usersCount,
      totalLogins: auditCount,
      hashingAlgorithm: 'PBKDF2-HMAC-SHA512 (10,000 iterations + 16-byte salt)',
      status: 'Online & ACID Compliant',
    };
  }
}

export const userDb = new UserDatabaseService();
