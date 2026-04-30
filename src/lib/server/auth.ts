import type { Cookies } from '@sveltejs/kit';
import { database } from './db';

const SESSION_COOKIE = 'session';
const SESSION_EXPIRY_DAYS = 30;

export function createSession(userId: string, cookies: Cookies): string {
	const token = crypto.randomUUID();
	const expires = new Date();
	expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS);

	// Store session in database with simple token
	database.sessions.create(userId, token, expires.toISOString());

	// Set a simple token as cookie (no JSON, no special chars)
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true
	});

	console.log('[openweight] createSession - token created:', token.slice(0, 8) + '...');
	return token;
}

export function getSessionUser(cookies: Cookies): { id: string; username: string } | null {
	const token = cookies.get(SESSION_COOKIE);
	console.log('[openweight] getSessionUser - token present:', !!token);

	if (!token) {
		console.log('[openweight] getSessionUser - no session cookie found');
		return null;
	}

	try {
		const session = database.sessions.getByToken(token);
		console.log('[openweight] getSessionUser - session found:', !!session);

		if (!session) {
			console.log('[openweight] getSessionUser - session not found in database');
			return null;
		}

		const expires = new Date(session.expires);
		console.log('[openweight] getSessionUser - session expired:', expires < new Date());

		if (expires < new Date()) {
			console.log('[openweight] getSessionUser - session expired, destroying');
			database.sessions.deleteByToken(token);
			destroySession(cookies);
			return null;
		}

		const user = database.users.getById(session.user_id);
		console.log('[openweight] getSessionUser - user found:', !!user);

		if (!user) {
			console.log('[openweight] getSessionUser - user not found in database');
			return null;
		}

		return { id: user.id, username: user.username };
	} catch (error) {
		console.error('[openweight] getSessionUser - error:', error);
		return null;
	}
}

export function requireUser(cookies: Cookies): { id: string; username: string } {
	const user = getSessionUser(cookies);
	if (!user) {
		throw new Error('Unauthorized');
	}
	return user;
}

export function destroySession(cookies: Cookies): void {
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		database.sessions.deleteByToken(token);
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function registerUser(username: string, password: string) {
	const existing = database.users.getByUsername(username);
	if (existing) {
		throw new Error('Username already taken');
	}
	return database.users.create(username, password);
}

export function loginUser(username: string, password: string) {
	return database.users.verifyPassword(username, password);
}