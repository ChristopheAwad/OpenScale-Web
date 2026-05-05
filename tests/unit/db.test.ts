import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTestDb, createTestUser, createTestEntry, createTestGoal, cleanupTestDb } from '../utils/db-helpers';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

describe('Database Operations', () => {
	let db: Database.Database;

	beforeEach(() => {
		db = createTestDb();
	});

	afterEach(() => {
		cleanupTestDb(db);
	});

	describe('Users', () => {
		it('should create a user with hashed password', () => {
			const user = createTestUser(db, 'testuser', 'password123');
			
			expect(user.id).toBeDefined();
			expect(user.username).toBe('testuser');
			
			// Verify password is hashed
			const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as any;
			expect(row.password_hash).not.toBe('password123');
			expect(bcrypt.compareSync('password123', row.password_hash)).toBe(true);
		});

		it('should get user by id', () => {
			const user = createTestUser(db, 'testuser');
			
			const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as any;
			expect(row).toBeDefined();
			expect(row.username).toBe('testuser');
		});

		it('should get user by username', () => {
			createTestUser(db, 'testuser');
			
			const row = db.prepare('SELECT * FROM users WHERE username = ?').get('testuser') as any;
			expect(row).toBeDefined();
			expect(row.id).toBeDefined();
		});

		it('should verify password correctly', () => {
			createTestUser(db, 'testuser', 'correctpass');
			
			const row = db.prepare('SELECT * FROM users WHERE username = ?').get('testuser') as any;
			expect(bcrypt.compareSync('correctpass', row.password_hash)).toBe(true);
			expect(bcrypt.compareSync('wrongpass', row.password_hash)).toBe(false);
		});

		it('should delete user', () => {
			const user = createTestUser(db, 'testuser');
			
			db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
			
			const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
			expect(row).toBeUndefined();
		});
	});

	describe('Weight Entries', () => {
		it('should create a weight entry', () => {
			const user = createTestUser(db, 'testuser');
			const entry = createTestEntry(db, user.id, { weight: 75.5, date: '2026-05-05' });
			
			expect(entry.id).toBeDefined();
			expect(entry.weight).toBe(75.5);
			expect(entry.date).toBe('2026-05-05');
			expect(entry.user_id).toBe(user.id);
		});

		it('should get all entries for user ordered by date DESC', () => {
			const user = createTestUser(db, 'testuser');
			
			createTestEntry(db, user.id, { date: '2026-05-01', weight: 76 });
			createTestEntry(db, user.id, { date: '2026-05-05', weight: 75 });
			createTestEntry(db, user.id, { date: '2026-05-03', weight: 75.5 });
			
			const entries = db.prepare('SELECT * FROM weight_entries WHERE user_id = ? ORDER BY date DESC')
				.all(user.id) as any[];
			
			expect(entries.length).toBe(3);
			expect(entries[0].date).toBe('2026-05-05');
			expect(entries[1].date).toBe('2026-05-03');
			expect(entries[2].date).toBe('2026-05-01');
		});

		it('should get entry by id and user_id', () => {
			const user = createTestUser(db, 'testuser');
			const entry = createTestEntry(db, user.id);
			
			const row = db.prepare('SELECT * FROM weight_entries WHERE id = ? AND user_id = ?')
				.get(entry.id, user.id) as any;
			
			expect(row).toBeDefined();
			expect(row.id).toBe(entry.id);
		});

		it('should update a weight entry', () => {
			const user = createTestUser(db, 'testuser');
			const entry = createTestEntry(db, user.id, { weight: 75 });
			
			db.prepare(`
				UPDATE weight_entries 
				SET weight = ?, weight_unit = ?, date = ?, notes = ?, measurements = ?, photo_path = ?
				WHERE id = ? AND user_id = ?
			`).run(74, 'kg', '2026-05-06', 'Updated notes', null, null, entry.id, user.id);
			
			const updated = db.prepare('SELECT * FROM weight_entries WHERE id = ?').get(entry.id) as any;
			expect(updated.weight).toBe(74);
			expect(updated.date).toBe('2026-05-06');
			expect(updated.notes).toBe('Updated notes');
		});

		it('should delete a weight entry', () => {
			const user = createTestUser(db, 'testuser');
			const entry = createTestEntry(db, user.id);
			
			db.prepare('DELETE FROM weight_entries WHERE id = ? AND user_id = ?').run(entry.id, user.id);
			
			const row = db.prepare('SELECT * FROM weight_entries WHERE id = ?').get(entry.id);
			expect(row).toBeUndefined();
		});

		it('should clear all entries for user', () => {
			const user = createTestUser(db, 'testuser');
			createTestEntry(db, user.id);
			createTestEntry(db, user.id);
			
			db.prepare('DELETE FROM weight_entries WHERE user_id = ?').run(user.id);
			
			const entries = db.prepare('SELECT * FROM weight_entries WHERE user_id = ?').all(user.id);
			expect(entries.length).toBe(0);
		});
	});

	describe('Goals', () => {
		it('should create a goal', () => {
			const user = createTestUser(db, 'testuser');
			const goal = createTestGoal(db, user.id, { target_weight: 70 });
			
			expect(goal.id).toBeDefined();
			expect(goal.target_weight).toBe(70);
			expect(goal.user_id).toBe(user.id);
		});

		it('should get all goals for user', () => {
			const user = createTestUser(db, 'testuser');
			createTestGoal(db, user.id);
			createTestGoal(db, user.id, { target_weight: 65 });
			
			const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(user.id) as any[];
			expect(goals.length).toBe(2);
		});

		it('should get active goal', () => {
			const user = createTestUser(db, 'testuser');
			createTestGoal(db, user.id, { is_active: 0 });
			const activeGoal = createTestGoal(db, user.id, { is_active: 1, target_weight: 68 });
			
			const row = db.prepare('SELECT * FROM goals WHERE user_id = ? AND is_active = 1').get(user.id) as any;
			expect(row).toBeDefined();
			expect(row.id).toBe(activeGoal.id);
		});

		it('should set active goal using transaction', () => {
			const user = createTestUser(db, 'testuser');
			const goal1 = createTestGoal(db, user.id, { is_active: 1 });
			const goal2 = createTestGoal(db, user.id, { is_active: 0 });
			
			// Simulate setActive transaction
			const tx = db.transaction(() => {
				db.prepare('UPDATE goals SET is_active = 0 WHERE user_id = ?').run(user.id);
				db.prepare('UPDATE goals SET is_active = 1 WHERE id = ? AND user_id = ?').run(goal2.id, user.id);
			});
			tx();
			
			const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(user.id) as any[];
			const activeGoals = goals.filter(g => g.is_active === 1);
			expect(activeGoals.length).toBe(1);
			expect(activeGoals[0].id).toBe(goal2.id);
		});

		it('should delete a goal', () => {
			const user = createTestUser(db, 'testuser');
			const goal = createTestGoal(db, user.id);
			
			db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(goal.id, user.id);
			
			const row = db.prepare('SELECT * FROM goals WHERE id = ?').get(goal.id);
			expect(row).toBeUndefined();
		});
	});

	describe('Preferences', () => {
		it('should create default preferences for user', () => {
			const user = createTestUser(db, 'testuser');
			
			db.prepare(`
				INSERT INTO preferences (id, user_id, weight_unit, measurement_unit)
				VALUES (?, ?, ?, ?)
			`).run(uuidv4(), user.id, 'kg', 'cm');
			
			const prefs = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(user.id) as any;
			expect(prefs).toBeDefined();
			expect(prefs.weight_unit).toBe('kg');
			expect(prefs.measurement_unit).toBe('cm');
		});

		it('should update preferences', () => {
			const user = createTestUser(db, 'testuser');
			
			db.prepare(`
				INSERT INTO preferences (id, user_id, weight_unit, measurement_unit)
				VALUES (?, ?, ?, ?)
			`).run(uuidv4(), user.id, 'kg', 'cm');
			
			db.prepare('UPDATE preferences SET weight_unit = ?, measurement_unit = ? WHERE user_id = ?')
				.run('lbs', 'in', user.id);
			
			const prefs = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(user.id) as any;
			expect(prefs.weight_unit).toBe('lbs');
			expect(prefs.measurement_unit).toBe('in');
		});

		it('should enforce unique user_id constraint', () => {
			const user = createTestUser(db, 'testuser');
			
			db.prepare(`
				INSERT INTO preferences (id, user_id, weight_unit, measurement_unit)
				VALUES (?, ?, ?, ?)
			`).run(uuidv4(), user.id, 'kg', 'cm');
			
			expect(() => {
				db.prepare(`
					INSERT INTO preferences (id, user_id, weight_unit, measurement_unit)
					VALUES (?, ?, ?, ?)
				`).run(uuidv4(), user.id, 'lbs', 'in');
			}).toThrow();
		});
	});

	describe('Sessions', () => {
		it('should create a session', () => {
			const user = createTestUser(db, 'testuser');
			const token = crypto.randomUUID();
			const expires = new Date();
			expires.setDate(expires.getDate() + 30);
			
			db.prepare(`
				INSERT INTO sessions (id, user_id, token, expires)
				VALUES (?, ?, ?, ?)
			`).run(uuidv4(), user.id, token, expires.toISOString());
			
			const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
			expect(session).toBeDefined();
			expect(session.user_id).toBe(user.id);
		});

		it('should get session by token', () => {
			const user = createTestUser(db, 'testuser');
			const token = crypto.randomUUID();
			const expires = new Date();
			expires.setDate(expires.getDate() + 30);
			
			db.prepare(`
				INSERT INTO sessions (id, user_id, token, expires)
				VALUES (?, ?, ?, ?)
			`).run(uuidv4(), user.id, token, expires.toISOString());
			
			const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
			expect(session).toBeDefined();
			expect(session.token).toBe(token);
		});

		it('should delete session by token', () => {
			const user = createTestUser(db, 'testuser');
			const token = crypto.randomUUID();
			const expires = new Date();
			expires.setDate(expires.getDate() + 30);
			
			db.prepare(`
				INSERT INTO sessions (id, user_id, token, expires)
				VALUES (?, ?, ?, ?)
			`).run(uuidv4(), user.id, token, expires.toISOString());
			
			db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
			
			const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
			expect(session).toBeUndefined();
		});

		it('should delete all sessions for user', () => {
			const user = createTestUser(db, 'testuser');
			
			// Create multiple sessions
			for (let i = 0; i < 3; i++) {
				const token = crypto.randomUUID();
				const expires = new Date();
				expires.setDate(expires.getDate() + 30);
				db.prepare(`
					INSERT INTO sessions (id, user_id, token, expires)
					VALUES (?, ?, ?, ?)
				`).run(uuidv4(), user.id, token, expires.toISOString());
			}
			
			db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
			
			const sessions = db.prepare('SELECT * FROM sessions WHERE user_id = ?').all(user.id);
			expect(sessions.length).toBe(0);
		});
	});
});
