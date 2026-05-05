import { beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { closeDb } from '../src/lib/server/db';

// Setup for all tests
beforeEach(() => {
	// Reset any module state before each test
});

afterEach(() => {
	// Close any open database connections
	try {
		closeDb();
	} catch (e) {
		// Ignore errors if DB wasn't initialized
	}
});
