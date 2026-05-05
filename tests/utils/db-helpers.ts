import Database from 'better-sqlite3';
import { vi } from 'vitest';
import { getDb, initDb, closeDb, database } from '../../src/lib/server/db';

// Create a fresh in-memory database for testing
export function createTestDb(): Database.Database {
	const db = new Database(':memory:');
	
	// Initialize schema (same as initDb but for in-memory DB)
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS weight_entries (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			weight REAL NOT NULL,
			weight_unit TEXT NOT NULL DEFAULT 'kg',
			date TEXT NOT NULL,
			notes TEXT,
			measurements TEXT,
			photo_path TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS goals (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			target_weight REAL NOT NULL,
			weight_unit TEXT NOT NULL DEFAULT 'kg',
			target_date TEXT,
			is_active INTEGER NOT NULL DEFAULT 1,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS preferences (
			id TEXT PRIMARY KEY,
			user_id TEXT UNIQUE NOT NULL,
			weight_unit TEXT NOT NULL DEFAULT 'kg',
			measurement_unit TEXT NOT NULL DEFAULT 'cm',
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			token TEXT UNIQUE NOT NULL,
			expires TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);

		CREATE INDEX IF NOT EXISTS idx_entries_user ON weight_entries(user_id);
		CREATE INDEX IF NOT EXISTS idx_entries_date ON weight_entries(date);
		CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
	`);
	
	return db;
}

// Mock getDb to return test database
export function setupTestDb(): Database.Database {
	const testDb = createTestDb();
	
	// Mock the getDb function to return our test database
	vi.doMock('../../src/lib/server/db', async () => {
		const actual = await vi.importActual('../../src/lib/server/db');
		return {
			...actual,
			getDb: () => testDb
		};
	});
	
	return testDb;
}

// Helper to create a test user and return user data
export function createTestUser(db: Database.Database, username = 'testuser', password = 'testpass123') {
	const bcrypt = require('bcryptjs');
	const { v4: uuidv4 } = require('uuid');
	
	const id = uuidv4();
	const password_hash = bcrypt.hashSync(password, 10);
	
	db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)')
		.run(id, username, password_hash);
	
	return { id, username, password, password_hash };
}

// Helper to create a test session
export function createTestSession(db: Database.Database, userId: string, token?: string) {
	const { v4: uuidv4 } = require('uuid');
	const sessionId = uuidv4();
	const sessionToken = token || crypto.randomUUID();
	const expires = new Date();
	expires.setDate(expires.getDate() + 30);
	
	db.prepare('INSERT INTO sessions (id, user_id, token, expires) VALUES (?, ?, ?, ?)')
		.run(sessionId, userId, sessionToken, expires.toISOString());
	
	return { id: sessionId, token: sessionToken, expires: expires.toISOString() };
}

// Helper to create a test weight entry
export function createTestEntry(db: Database.Database, userId: string, overrides: any = {}) {
	const { v4: uuidv4 } = require('uuid');
	const id = uuidv4();
	
	const entry = {
		id,
		user_id: userId,
		weight: 75.5,
		weight_unit: 'kg',
		date: '2026-05-05',
		notes: null,
		measurements: null,
		photo_path: null,
		...overrides
	};
	
	db.prepare(`
		INSERT INTO weight_entries (id, user_id, weight, weight_unit, date, notes, measurements, photo_path)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		entry.id,
		entry.user_id,
		entry.weight,
		entry.weight_unit,
		entry.date,
		entry.notes,
		entry.measurements,
		entry.photo_path
	);
	
	return entry;
}

// Helper to create a test goal
export function createTestGoal(db: Database.Database, userId: string, overrides: any = {}) {
	const { v4: uuidv4 } = require('uuid');
	const id = uuidv4();
	
	const goal = {
		id,
		user_id: userId,
		target_weight: 70,
		weight_unit: 'kg',
		target_date: null,
		is_active: 1,
		...overrides
	};
	
	db.prepare(`
		INSERT INTO goals (id, user_id, target_weight, weight_unit, target_date, is_active)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(
		goal.id,
		goal.user_id,
		goal.target_weight,
		goal.weight_unit,
		goal.target_date,
		goal.is_active
	);
	
	return goal;
}

// Clean up test database
export function cleanupTestDb(db: Database.Database) {
	db.close();
}
