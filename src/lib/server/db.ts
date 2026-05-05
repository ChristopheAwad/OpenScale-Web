import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

function getDbPath() {
	const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
	return path.join(DATA_DIR, 'openweight.db');
}

function ensureDataDir() {
	const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
}

let _db: Database.Database;

export function initDb() {
	ensureDataDir();
	_db = new Database(getDbPath());
	_db.pragma('journal_mode = WAL');

	_db.exec(`
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

	migrateDb();

	return _db;
}

function migrateDb() {
	// Check if sessions table exists and has the right schema
	try {
		const tableInfo = getDb().prepare("PRAGMA table_info(sessions)").all();
		const hasToken = tableInfo.some((col: any) => col.name === 'token');
		const hasExpires = tableInfo.some((col: any) => col.name === 'expires');
		
		logger.debug('DB migration check - sessions columns', { hasToken, hasExpires });
		
		if (!hasToken || !hasExpires) {
			logger.info('DB migration - adding token and expires columns to sessions');
			getDb().exec(`
				ALTER TABLE sessions ADD COLUMN token TEXT;
				ALTER TABLE sessions ADD COLUMN expires TEXT;
			`);
		}
	} catch (error) {
		// sessions table doesn't exist yet, which is fine (CREATE TABLE IF NOT EXISTS will handle it)
		logger.debug('DB migration - sessions table not found, will be created');
	}
}

export function getDb() {
	if (!_db) {
		initDb();
	}
	return _db;
}

export function closeDb() {
	if (_db) {
		_db.close();
		_db = null!;
	}
}

export interface User {
	id: string;
	username: string;
	password_hash: string;
	created_at: string;
}

export interface WeightEntryRow {
	id: string;
	user_id: string;
	weight: number;
	weight_unit: string;
	date: string;
	notes: string | null;
	measurements: string | null;
	photo_path: string | null;
	created_at: string;
}

export interface GoalRow {
	id: string;
	user_id: string;
	target_weight: number;
	weight_unit: string;
	target_date: string | null;
	is_active: number;
	created_at: string;
}

export interface PreferencesRow {
	id: string;
	user_id: string;
	weight_unit: string;
	measurement_unit: string;
}

export interface SessionRow {
	id: string;
	user_id: string;
	token: string;
	expires: string;
}

export const database = {
	users: {
		create(username: string, password: string): User {
			const id = uuidv4();
			const password_hash = bcrypt.hashSync(password, 10);
			const stmt = getDb().prepare(
				'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)'
			);
			stmt.run(id, username, password_hash);
			return this.getById(id)!;
		},

		getById(id: string): User | undefined {
			const stmt = getDb().prepare('SELECT * FROM users WHERE id = ?');
			return stmt.get(id) as User | undefined;
		},

		getByUsername(username: string): User | undefined {
			const stmt = getDb().prepare('SELECT * FROM users WHERE username = ?');
			return stmt.get(username) as User | undefined;
		},

		verifyPassword(username: string, password: string): User | undefined {
			const user = this.getByUsername(username);
			if (user && bcrypt.compareSync(password, user.password_hash)) {
				return user;
			}
			return undefined;
		},

		delete(id: string): void {
			const stmt = getDb().prepare('DELETE FROM users WHERE id = ?');
			stmt.run(id);
		}
	},

	entries: {
		getAll(userId: string): WeightEntryRow[] {
			const stmt = getDb().prepare(
				'SELECT * FROM weight_entries WHERE user_id = ? ORDER BY date DESC'
			);
			return stmt.all(userId) as WeightEntryRow[];
		},

		getById(id: string, userId: string): WeightEntryRow | undefined {
			const stmt = getDb().prepare(
				'SELECT * FROM weight_entries WHERE id = ? AND user_id = ?'
			);
			return stmt.get(id, userId) as WeightEntryRow | undefined;
		},

		create(entry: {
			userId: string;
			weight: number;
			weightUnit: string;
			date: string;
			notes?: string;
			measurements?: string;
			photoPath?: string;
		}): WeightEntryRow {
			const id = uuidv4();
			logger.debug('DB - Creating entry', { 
				userId: entry.userId, 
				weight: entry.weight, 
				hasNotes: !!entry.notes,
				hasMeasurements: !!entry.measurements,
				hasPhoto: !!entry.photoPath
			});
			
			const stmt = getDb().prepare(`
				INSERT INTO weight_entries 
				(id, user_id, weight, weight_unit, date, notes, measurements, photo_path) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`);
			
			logger.debug('DB - Running INSERT', {
				id,
				userId: entry.userId,
				weight: entry.weight,
				weightUnit: entry.weightUnit,
				date: entry.date
			});
			
			stmt.run(
				id,
				entry.userId,
				entry.weight,
				entry.weightUnit,
				entry.date,
				entry.notes || null,
				entry.measurements || null,
				entry.photoPath || null
			);
			
			logger.debug('DB - Entry created successfully', { id });
			return this.getById(id, entry.userId)!;
		},

		update(entry: {
			id: string;
			userId: string;
			weight: number;
			weightUnit: string;
			date: string;
			notes?: string;
			measurements?: string;
			photoPath?: string;
		}): WeightEntryRow | undefined {
			const stmt = getDb().prepare(`
				UPDATE weight_entries 
				SET weight = ?, weight_unit = ?, date = ?, notes = ?, measurements = ?, photo_path = ?
				WHERE id = ? AND user_id = ?
			`);
			stmt.run(
				entry.weight,
				entry.weightUnit,
				entry.date,
				entry.notes || null,
				entry.measurements || null,
				entry.photoPath || null,
				entry.id,
				entry.userId
			);
			return this.getById(entry.id, entry.userId);
		},

		delete(id: string, userId: string): void {
			const stmt = getDb().prepare('DELETE FROM weight_entries WHERE id = ? AND user_id = ?');
			stmt.run(id, userId);
		},

		clear(userId: string): void {
			const stmt = getDb().prepare('DELETE FROM weight_entries WHERE user_id = ?');
			stmt.run(userId);
		}
	},

	goals: {
		getAll(userId: string): GoalRow[] {
			const stmt = getDb().prepare(
				'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC'
			);
			return stmt.all(userId) as GoalRow[];
		},

		getActive(userId: string): GoalRow | undefined {
			const stmt = getDb().prepare(
				'SELECT * FROM goals WHERE user_id = ? AND is_active = 1'
			);
			return stmt.get(userId) as GoalRow | undefined;
		},

		create(goal: {
			userId: string;
			targetWeight: number;
			weightUnit: string;
			targetDate?: string;
		}): GoalRow {
			const id = uuidv4();
			const stmt = getDb().prepare(`
				INSERT INTO goals (id, user_id, target_weight, weight_unit, target_date)
				VALUES (?, ?, ?, ?, ?)
			`);
			stmt.run(id, goal.userId, goal.targetWeight, goal.weightUnit, goal.targetDate || null);
			const result = getDb().prepare('SELECT * FROM goals WHERE id = ?').get(id) as GoalRow;
			return result;
		},

		update(goal: {
			id: string;
			userId: string;
			targetWeight: number;
			weightUnit: string;
			targetDate?: string;
			isActive: boolean;
		}): GoalRow | undefined {
			const stmt = getDb().prepare(`
				UPDATE goals 
				SET target_weight = ?, weight_unit = ?, target_date = ?, is_active = ?
				WHERE id = ? AND user_id = ?
			`);
			stmt.run(
				goal.targetWeight,
				goal.weightUnit,
				goal.targetDate || null,
				goal.isActive ? 1 : 0,
				goal.id,
				goal.userId
			);
			return getDb().prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(
				goal.id,
				goal.userId
			) as GoalRow | undefined;
		},

		setActive(goalId: string, userId: string): void {
			const tx = getDb().transaction(() => {
				getDb().prepare('UPDATE goals SET is_active = 0 WHERE user_id = ?').run(userId);
				getDb().prepare('UPDATE goals SET is_active = 1 WHERE id = ? AND user_id = ?').run(
					goalId,
					userId
				);
			});
			tx();
		},

		delete(id: string, userId: string): void {
			const stmt = getDb().prepare('DELETE FROM goals WHERE id = ? AND user_id = ?');
			stmt.run(id, userId);
		},

		clear(userId: string): void {
			const stmt = getDb().prepare('DELETE FROM goals WHERE user_id = ?');
			stmt.run(userId);
		}
	},

	preferences: {
		get(userId: string): PreferencesRow | undefined {
			const stmt = getDb().prepare('SELECT * FROM preferences WHERE user_id = ?');
			return stmt.get(userId) as PreferencesRow | undefined;
		},

		getOrCreate(userId: string): PreferencesRow {
			let prefs = this.get(userId);
			if (!prefs) {
				const id = uuidv4();
				getDb()
					.prepare(
						'INSERT INTO preferences (id, user_id, weight_unit, measurement_unit) VALUES (?, ?, ?, ?)'
					)
					.run(id, userId, 'kg', 'cm');
				prefs = this.get(userId)!;
			}
			return prefs;
		},

		set(prefs: {
			userId: string;
			weightUnit: string;
			measurementUnit: string;
		}): PreferencesRow {
			const existing = this.get(prefs.userId);
			if (existing) {
				getDb()
					.prepare(
						'UPDATE preferences SET weight_unit = ?, measurement_unit = ? WHERE user_id = ?'
					)
					.run(prefs.weightUnit, prefs.measurementUnit, prefs.userId);
			} else {
				const id = uuidv4();
				getDb()
					.prepare(
						'INSERT INTO preferences (id, user_id, weight_unit, measurement_unit) VALUES (?, ?, ?, ?)'
					)
					.run(id, prefs.userId, prefs.weightUnit, prefs.measurementUnit);
			}
			return this.get(prefs.userId)!;
		},

		update(
			userId: string,
			partial: { weightUnit?: string; measurementUnit?: string }
		): PreferencesRow {
			const current = this.getOrCreate(userId);
			const weightUnit = partial.weightUnit ?? current.weight_unit;
			const measurementUnit = partial.measurementUnit ?? current.measurement_unit;
			getDb()
				.prepare('UPDATE preferences SET weight_unit = ?, measurement_unit = ? WHERE user_id = ?')
				.run(weightUnit, measurementUnit, userId);
			return this.get(userId)!;
		},

		reset(userId: string): void {
			this.set({ userId, weightUnit: 'kg', measurementUnit: 'cm' });
		}
	},

	sessions: {
		create(userId: string, token: string, expires: string): SessionRow {
			const id = uuidv4();
			getDb().prepare(
				'INSERT INTO sessions (id, user_id, token, expires) VALUES (?, ?, ?, ?)'
			).run(id, userId, token, expires);
			return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow;
		},

		getByToken(token: string): SessionRow | undefined {
			return getDb().prepare('SELECT * FROM sessions WHERE token = ?').get(token) as SessionRow | undefined;
		},

		deleteByUserId(userId: string): void {
			getDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
		},

		deleteByToken(token: string): void {
			getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
		}
	}
};