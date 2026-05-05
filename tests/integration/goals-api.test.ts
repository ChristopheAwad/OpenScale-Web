import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb, initDb } from '../../src/lib/server/db';
import { createMockCookies } from '../utils/auth-helpers';
import { createTestUser, createTestGoal, createTestSession } from '../utils/db-helpers';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Goals API Integration Tests', () => {
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
		const db = getDb();
		testUser = createTestUser(db, 'testuser', 'password123');
		const session = createTestSession(db, testUser.id);
		authCookies = createMockCookies(session.token);
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

	describe('GET /api/goals', () => {
		it('should return all goals for authenticated user', async () => {
			const db = getDb();
			createTestGoal(db, testUser.id, { target_weight: 70 });
			createTestGoal(db, testUser.id, { target_weight: 65 });

			const { GET } = await import('../../src/routes/api/goals/+server');
			const request = new Request('http://localhost/api/goals');
			const response = await GET({
				request,
				cookies: authCookies,
				locals: { requestId: 'test-goals-get' }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.length).toBe(2);
		});

		it('should return 401 for unauthenticated user', async () => {
			const { GET } = await import('../../src/routes/api/goals/+server');
			const unauthCookies = createMockCookies();
			
			const request = new Request('http://localhost/api/goals');
			const response = await GET({
				request,
				cookies: unauthCookies,
				locals: { requestId: 'test-unauth' }
			} as any);

			expect(response.status).toBe(401);
		});
	});

	describe('POST /api/goals', () => {
		it('should create a new goal', async () => {
			const { POST } = await import('../../src/routes/api/goals/+server');
			const goalData = {
				targetWeight: 70,
				weightUnit: 'kg',
				targetDate: '2026-12-31'
			};

			const request = new Request('http://localhost/api/goals', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(goalData)
			});

			const response = await POST({
				request,
				cookies: authCookies,
				locals: { requestId: 'test-goal-post' }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.targetWeight).toBe(70);
		});
	});
});
