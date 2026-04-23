import type { Cookies } from '@sveltejs/kit';
import { database } from './db';

const SESSION_COOKIE = 'session';
const SESSION_EXPIRY_DAYS = 30;

interface SessionData {
	userId: string;
	expires: string;
}

export function createSession(userId: string, cookies: Cookies): string {
	const sessionId = crypto.randomUUID();
	const expires = new Date();
	expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS);

	const cookieValue = JSON.stringify({ userId, expires: expires.toISOString() } as SessionData);

	cookies.set(SESSION_COOKIE, cookieValue, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		expires
	});

	return sessionId;
}

export function getSessionUser(cookies: Cookies): { id: string; username: string } | null {
	const cookieValue = cookies.get(SESSION_COOKIE);
	if (!cookieValue) return null;

	try {
		const data: SessionData = JSON.parse(cookieValue);
		const expires = new Date(data.expires);
		
		if (expires < new Date()) {
			destroySession(cookies);
			return null;
		}

		const user = database.users.getById(data.userId);
		if (!user) return null;

		return { id: user.id, username: user.username };
	} catch {
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