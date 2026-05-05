import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSession, getSessionUser, requireUser, destroySession, registerUser, loginUser } from '../../src/lib/server/auth';
import { getDb, closeDb, initDb } from '../../src/lib/server/db';
import { createMockCookies } from '../utils/auth-helpers';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Auth Utilities', () => {
	let tempDir: string;

	beforeEach(() => {
		// Create unique temp directory for this test
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openweight-test-'));
		
		// Close any existing database connection
		try {
			closeDb();
		} catch (e) {
			// Ignore
		}
		
		// Set DATA_DIR to our temp directory BEFORE requiring the module
		process.env.DATA_DIR = tempDir;
		
		// Re-import the module to get fresh state with new DATA_DIR
		// Since we can't re-import easily, we'll use the initDb which should pick up the new path
		initDb();
	});

	afterEach(() => {
		// Close database connection
		try {
			closeDb();
		} catch (e) {
			// Ignore
		}
		
		// Clean up temp directory
		try {
			if (fs.existsSync(tempDir)) {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		} catch (e) {
			// Ignore
		}
		
		delete process.env.DATA_DIR;
	});

	describe('createSession', () => {
		it('should create a session and set cookie', () => {
			const user = registerUser('testuser', 'password123');
			const cookies = createMockCookies();
			
			const token = createSession(user.id, cookies);
			
			expect(token).toBeDefined();
			expect(cookies.set).toHaveBeenCalledWith(
				'session',
				token,
				expect.objectContaining({
					path: '/',
					httpOnly: true,
					secure: false,
					sameSite: 'lax'
				})
			);
		});

		it('should store session in database', () => {
			const user = registerUser('testuser', 'password123');
			const cookies = createMockCookies();
			
			const token = createSession(user.id, cookies);
			
			const db = getDb();
			const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
			expect(session).toBeDefined();
			expect(session.user_id).toBe(user.id);
		});
	});

	describe('getSessionUser', () => {
		it('should return user when valid session exists', () => {
			const user = registerUser('testuser', 'password123');
			const token = createSession(user.id, createMockCookies());
			const cookies = createMockCookies(token);
			
			const result = getSessionUser(cookies);
			
			expect(result).toBeDefined();
			expect(result?.id).toBe(user.id);
			expect(result?.username).toBe('testuser');
		});

		it('should return null when no session cookie', () => {
			const cookies = createMockCookies();
			
			const result = getSessionUser(cookies);
			
			expect(result).toBeNull();
		});

		it('should return null when session token not in database', () => {
			const cookies = createMockCookies('nonexistent-token');
			
			const result = getSessionUser(cookies);
			
			expect(result).toBeNull();
		});

		it('should return null and destroy session when expired', () => {
			const user = registerUser('testuser', 'password123');
			const token = createSession(user.id, createMockCookies());
			
			// Manually expire the session
			const db = getDb();
			db.prepare('UPDATE sessions SET expires = ? WHERE token = ?')
				.run(new Date('2020-01-01').toISOString(), token);
			
			const cookies = createMockCookies(token);
			
			const result = getSessionUser(cookies);
			
			expect(result).toBeNull();
		});
	});

	describe('requireUser', () => {
		it('should return user when authenticated', () => {
			const user = registerUser('testuser', 'password123');
			const token = createSession(user.id, createMockCookies());
			const cookies = createMockCookies(token);
			
			const result = requireUser(cookies);
			
			expect(result).toBeDefined();
			expect(result.id).toBe(user.id);
		});

		it('should throw error when not authenticated', () => {
			const cookies = createMockCookies();
			
			expect(() => requireUser(cookies)).toThrow('Unauthorized');
		});
	});

	describe('destroySession', () => {
		it('should delete session from database and clear cookie', () => {
			const user = registerUser('testuser', 'password123');
			const token = createSession(user.id, createMockCookies());
			const cookies = createMockCookies(token);
			
			destroySession(cookies);
			
			const db = getDb();
			const dbSession = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
			expect(dbSession).toBeUndefined();
			expect(cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
		});
	});

	describe('registerUser', () => {
		it('should create a new user', () => {
			const user = registerUser('newuser', 'password123');
			
			expect(user).toBeDefined();
			expect(user.username).toBe('newuser');
			
			const db = getDb();
			const dbUser = db.prepare('SELECT * FROM users WHERE username = ?').get('newuser') as any;
			expect(dbUser).toBeDefined();
		});

		it('should throw error for duplicate username', () => {
			registerUser('existinguser', 'password123');
			
			expect(() => {
				registerUser('existinguser', 'differentpass');
			}).toThrow('Username already taken');
		});
	});

	describe('loginUser', () => {
		it('should return user with correct credentials', () => {
			registerUser('testuser', 'correctpass');
			
			const user = loginUser('testuser', 'correctpass');
			
			expect(user).toBeDefined();
			expect(user?.username).toBe('testuser');
		});

		it('should return undefined with incorrect password', () => {
			registerUser('testuser', 'correctpass');
			
			const user = loginUser('testuser', 'wrongpass');
			
			expect(user).toBeUndefined();
		});

		it('should return undefined for nonexistent user', () => {
			const user = loginUser('nonexistent', 'password');
			
			expect(user).toBeUndefined();
		});
	});
});
