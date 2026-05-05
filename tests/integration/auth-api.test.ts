import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb, initDb } from '../../src/lib/server/db';
import { createMockCookies } from '../utils/auth-helpers';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Auth API Integration Tests', () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openweight-test-'));
		process.env.DATA_DIR = tempDir;
		try {
			closeDb();
		} catch (e) {
			// Ignore
		}
		initDb();
	});

	afterEach(() => {
		try {
			closeDb();
		} catch (e) {
			// Ignore
		}
		try {
			if (fs.existsSync(tempDir)) {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		} catch (e) {
			// Ignore
		}
		delete process.env.DATA_DIR;
	});

	describe('POST /api/auth/register', () => {
		it('should register a new user successfully', async () => {
			const cookies = createMockCookies();
			const request = new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'newuser', password: 'password123' })
			});

			const { POST } = await import('../../src/routes/api/auth/register/+server');
			const response = await POST({
				request,
				cookies,
				locals: { requestId: 'test-123' }
			} as any);

			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.userId).toBeDefined();
		});

		it('should reject duplicate username', async () => {
			const { POST } = await import('../../src/routes/api/auth/register/+server');
			
			const cookies1 = createMockCookies();
			const request1 = new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'existing', password: 'pass1' })
			});
			await POST({
				request: request1,
				cookies: cookies1,
				locals: { requestId: 'test-1' }
			} as any);

			const cookies2 = createMockCookies();
			const request2 = new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'existing', password: 'pass2' })
			});
			const response = await POST({
				request: request2,
				cookies: cookies2,
				locals: { requestId: 'test-2' }
			} as any);

			expect(response.status).toBe(400);
		});
	});

	describe('POST /api/auth/login', () => {
		it('should login with correct credentials', async () => {
			const { POST: registerPOST } = await import('../../src/routes/api/auth/register/+server');
			const { POST: loginPOST } = await import('../../src/routes/api/auth/login/+server');

			// Register first
			const regReq = new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'testuser', password: 'correctpass' })
			});
			await registerPOST({
				request: regReq,
				cookies: createMockCookies(),
				locals: { requestId: 'test-reg' }
			} as any);

			// Now login
			const loginReq = new Request('http://localhost/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'testuser', password: 'correctpass' })
			});
			const response = await loginPOST({
				request: loginReq,
				cookies: createMockCookies(),
				locals: { requestId: 'test-login' }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
		});

		it('should reject incorrect password', async () => {
			const { POST: registerPOST } = await import('../../src/routes/api/auth/register/+server');
			const { POST: loginPOST } = await import('../../src/routes/api/auth/login/+server');

			// Register first
			const regReq = new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'testuser', password: 'correctpass' })
			});
			await registerPOST({
				request: regReq,
				cookies: createMockCookies(),
				locals: { requestId: 'test-reg' }
			} as any);

			// Login with wrong password
			const loginReq = new Request('http://localhost/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'testuser', password: 'wrongpass' })
			});
			const response = await loginPOST({
				request: loginReq,
				cookies: createMockCookies(),
				locals: { requestId: 'test-login' }
			} as any);

			expect(response.status).toBe(401);
		});
	});

	describe('GET /api/auth/check', () => {
		it('should return unauthenticated without session', async () => {
			const { GET } = await import('../../src/routes/api/auth/check/+server');
			const cookies = createMockCookies();
			
			const response = await GET({
				cookies,
				locals: { requestId: 'test-check' }
			} as any);

			const body = await response.json();
			expect(body.loggedIn).toBe(false);
		});
	});
});
