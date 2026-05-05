import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb, initDb } from '../../src/lib/server/db';
import { createMockCookies } from '../utils/auth-helpers';
import { createTestUser, createTestEntry, createTestSession } from '../utils/db-helpers';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Entries API Integration Tests', () => {
	let tempDir: string;
	let testUser: any;
	let authCookies: any;

	beforeEach(async () => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openweight-test-'));
		process.env.DATA_DIR = tempDir;
		try {
			closeDb();
		} catch (e) {
			// Ignore
		}
		initDb();
		
		// Create test user and session
		const { POST: registerPOST } = await import('../../src/routes/api/auth/register/+server');
		const cookies = createMockCookies();
		const request = new Request('http://localhost/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: 'testuser', password: 'password123' })
		});
		const response = await registerPOST({
			request,
			cookies,
			locals: { requestId: 'test-reg' }
		} as any);
		const body = await response.json();
		
		testUser = { id: body.userId, username: 'testuser' };
		
		// Create session
		const { createSession } = await import('../../src/lib/server/auth');
		const token = createSession(testUser.id, cookies);
		authCookies = createMockCookies(token);
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

	describe('GET /api/entries', () => {
		it('should return all entries for authenticated user', async () => {
			// Create test entries
			const db = getDb();
			createTestEntry(db, testUser.id, { weight: 75, date: '2026-05-01' });
			createTestEntry(db, testUser.id, { weight: 74, date: '2026-05-05' });

			const { GET } = await import('../../src/routes/api/entries/+server');
			const request = new Request('http://localhost/api/entries');
			const response = await GET({
				request,
				cookies: authCookies,
				locals: { requestId: 'test-get' }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.length).toBe(2);
		});

		it('should return 401 for unauthenticated user', async () => {
			const { GET } = await import('../../src/routes/api/entries/+server');
			const unauthCookies = createMockCookies();
			
			const request = new Request('http://localhost/api/entries');
			const response = await GET({
				request,
				cookies: unauthCookies,
				locals: { requestId: 'test-unauth' }
			} as any);

			expect(response.status).toBe(401);
		});
	});

	describe('POST /api/entries', () => {
		it('should create a new entry', async () => {
			const { POST } = await import('../../src/routes/api/entries/+server');
			const entryData = {
				weight: 75.5,
				weightUnit: 'kg',
				date: '2026-05-05',
				notes: 'Test entry'
			};

			const request = new Request('http://localhost/api/entries', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(entryData)
			});

			const response = await POST({
				request,
				cookies: authCookies,
				locals: { requestId: 'test-post' }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.weight).toBe(75.5);
		});
	});
});
