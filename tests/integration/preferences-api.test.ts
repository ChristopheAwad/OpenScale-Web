import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb, initDb } from '../../src/lib/server/db';
import { createMockCookies } from '../utils/auth-helpers';
import { createTestUser, createTestSession } from '../utils/db-helpers';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Preferences API Integration Tests', () => {
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

	describe('GET /api/preferences', () => {
		it('should return preferences for authenticated user', async () => {
			const db = getDb();
			// Create default preferences
			db.prepare(`
				INSERT INTO preferences (id, user_id, weight_unit, measurement_unit)
				VALUES (?, ?, ?, ?)
			`).run('pref-id', testUser.id, 'kg', 'cm');

			const { GET } = await import('../../src/routes/api/preferences/+server');
			const request = new Request('http://localhost/api/preferences');
			const response = await GET({
				request,
				cookies: authCookies,
				locals: { requestId: 'test-pref-get' }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.weightUnit).toBe('kg');
		});

		it('should return 401 for unauthenticated user', async () => {
			const { GET } = await import('../../src/routes/api/preferences/+server');
			const unauthCookies = createMockCookies();
			
			const request = new Request('http://localhost/api/preferences');
			const response = await GET({
				request,
				cookies: unauthCookies,
				locals: { requestId: 'test-unauth' }
			} as any);

			expect(response.status).toBe(401);
		});
	});

	describe('PUT /api/preferences', () => {
		it('should update preferences', async () => {
			const db = getDb();
			// Create initial preferences
			db.prepare(`
				INSERT INTO preferences (id, user_id, weight_unit, measurement_unit)
				VALUES (?, ?, ?, ?)
			`).run('pref-id', testUser.id, 'kg', 'cm');

			const { PUT } = await import('../../src/routes/api/preferences/+server');
			const updateData = {
				weightUnit: 'lbs',
				measurementUnit: 'in'
			};

			const request = new Request('http://localhost/api/preferences', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});

			const response = await PUT({
				request,
				cookies: authCookies,
				locals: { requestId: 'test-pref-put' }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.weightUnit).toBe('lbs');
		});
	});
});
