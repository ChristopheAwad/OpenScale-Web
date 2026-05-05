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

		describe('failure cases', () => {
			it('should return 400 for negative weight', async () => {
				const { POST } = await import('../../src/routes/api/entries/+server');
				const entryData = {
					weight: -10,
					weightUnit: 'kg',
					date: '2026-05-05'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(entryData)
				});

				const response = await POST({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-entry-negative' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to create entry');
				expect(body.details).toContain('positive number');
			});

			it('should return 400 for zero weight', async () => {
				const { POST } = await import('../../src/routes/api/entries/+server');
				const entryData = {
					weight: 0,
					weightUnit: 'kg',
					date: '2026-05-05'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(entryData)
				});

				const response = await POST({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-entry-zero' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to create entry');
				expect(body.details).toContain('positive number');
			});

			it('should return 400 for non-numeric weight', async () => {
				const { POST } = await import('../../src/routes/api/entries/+server');
				const entryData = {
					weight: 'not-a-number',
					weightUnit: 'kg',
					date: '2026-05-05'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(entryData)
				});

				const response = await POST({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-entry-nan' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to create entry');
				expect(body.details).toContain('positive number');
			});

			it('should return 400 for missing weight', async () => {
				const { POST } = await import('../../src/routes/api/entries/+server');
				const entryData = {
					weightUnit: 'kg',
					date: '2026-05-05'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(entryData)
				});

				const response = await POST({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-entry-no-weight' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to create entry');
				expect(body.details).toContain('Weight is required');
			});

			it('should return 400 for missing date', async () => {
				const { POST } = await import('../../src/routes/api/entries/+server');
				const entryData = {
					weight: 75.5,
					weightUnit: 'kg'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(entryData)
				});

				const response = await POST({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-entry-no-date' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to create entry');
				expect(body.details).toContain('Date is required');
			});

			it('should return 400 for invalid date format', async () => {
				const { POST } = await import('../../src/routes/api/entries/+server');
				const entryData = {
					weight: 75.5,
					weightUnit: 'kg',
					date: '05/05/2026'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(entryData)
				});

				const response = await POST({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-entry-bad-date' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to create entry');
				expect(body.details).toContain('YYYY-MM-DD');
			});

			it('should return 400 for invalid weight unit', async () => {
				const { POST } = await import('../../src/routes/api/entries/+server');
				const entryData = {
					weight: 75.5,
					weightUnit: 'grams',
					date: '2026-05-05'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(entryData)
				});

				const response = await POST({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-entry-bad-unit' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to create entry');
				expect(body.details).toContain('Invalid weight unit');
			});
		});
	});

	describe('PUT /api/entries', () => {
		it('should update an existing entry', async () => {
			const db = getDb();
			const entry = createTestEntry(db, testUser.id, { weight: 75, date: '2026-05-05' });

			const { PUT } = await import('../../src/routes/api/entries/+server');
			const updateData = {
				id: entry.id,
				weight: 74.5,
				weightUnit: 'kg',
				date: '2026-05-06',
				notes: 'Updated entry'
			};

			const request = new Request('http://localhost/api/entries', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});

			const response = await PUT({
				request,
				cookies: authCookies,
				locals: { requestId: 'test-put' }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.weight).toBe(74.5);
		});

		it('should return 404 for non-existent entry', async () => {
			const { PUT } = await import('../../src/routes/api/entries/+server');
			const updateData = {
				id: 'non-existent-id',
				weight: 74.5,
				weightUnit: 'kg',
				date: '2026-05-06'
			};

			const request = new Request('http://localhost/api/entries', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});

			const response = await PUT({
				request,
				cookies: authCookies,
				locals: { requestId: 'test-put-notfound' }
			} as any);

			expect(response.status).toBe(404);
		});

		describe('failure cases', () => {
			it('should return 400 for missing entry ID', async () => {
				const { PUT } = await import('../../src/routes/api/entries/+server');
				const updateData = {
					weight: 74.5,
					weightUnit: 'kg',
					date: '2026-05-06'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				});

				const response = await PUT({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-put-no-id' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to update entry');
				expect(body.details).toContain('Entry ID is required');
			});

			it('should return 400 for negative weight on update', async () => {
				const db = getDb();
				const entry = createTestEntry(db, testUser.id, { weight: 75, date: '2026-05-05' });

				const { PUT } = await import('../../src/routes/api/entries/+server');
				const updateData = {
					id: entry.id,
					weight: -10,
					weightUnit: 'kg',
					date: '2026-05-06'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				});

				const response = await PUT({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-put-negative' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to update entry');
				expect(body.details).toContain('positive number');
			});

			it('should return 400 for missing weight on update', async () => {
				const db = getDb();
				const entry = createTestEntry(db, testUser.id, { weight: 75, date: '2026-05-05' });

				const { PUT } = await import('../../src/routes/api/entries/+server');
				const updateData = {
					id: entry.id,
					weightUnit: 'kg',
					date: '2026-05-06'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				});

				const response = await PUT({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-put-no-weight' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to update entry');
				expect(body.details).toContain('Weight is required');
			});

			it('should return 400 for missing date on update', async () => {
				const db = getDb();
				const entry = createTestEntry(db, testUser.id, { weight: 75, date: '2026-05-05' });

				const { PUT } = await import('../../src/routes/api/entries/+server');
				const updateData = {
					id: entry.id,
					weight: 74.5,
					weightUnit: 'kg'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				});

				const response = await PUT({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-put-no-date' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to update entry');
				expect(body.details).toContain('Date is required');
			});

			it('should return 400 for invalid date format on update', async () => {
				const db = getDb();
				const entry = createTestEntry(db, testUser.id, { weight: 75, date: '2026-05-05' });

				const { PUT } = await import('../../src/routes/api/entries/+server');
				const updateData = {
					id: entry.id,
					weight: 74.5,
					weightUnit: 'kg',
					date: '05-06-2026'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				});

				const response = await PUT({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-put-bad-date' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to update entry');
				expect(body.details).toContain('YYYY-MM-DD');
			});

			it('should return 400 for invalid weight unit on update', async () => {
				const db = getDb();
				const entry = createTestEntry(db, testUser.id, { weight: 75, date: '2026-05-05' });

				const { PUT } = await import('../../src/routes/api/entries/+server');
				const updateData = {
					id: entry.id,
					weight: 74.5,
					weightUnit: 'pounds',
					date: '2026-05-06'
				};

				const request = new Request('http://localhost/api/entries', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				});

				const response = await PUT({
					request,
					cookies: authCookies,
					locals: { requestId: 'test-put-bad-unit' }
				} as any);

				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe('Failed to update entry');
				expect(body.details).toContain('Invalid weight unit');
			});
		});
	});
});
