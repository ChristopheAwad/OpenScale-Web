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
		sameSite: 'none',
		secure: false,
		expires
	});

	return sessionId;
}

export function getSessionUser(cookies: Cookies): { id: string; username: string } | null {
	const cookieValue = cookies.get(SESSION_COOKIE);
	console.log('[openweight] getSessionUser - cookie present:', !!cookieValue);
	
	if (!cookieValue) {
		console.log('[openweight] getSessionUser - no session cookie found');
		return null;
	}

	try {
		const data: SessionData = JSON.parse(cookieValue);
		console.log('[openweight] getSessionUser - session data:', { userId: data.userId, expires: data.expires });
		
		const expires = new Date(data.expires);
		console.log('[openweight] getSessionUser - session expired:', expires < new Date());
		
		if (expires < new Date()) {
			console.log('[openweight] getSessionUser - session expired, destroying');
			destroySession(cookies);
			return null;
		}

		const user = database.users.getById(data.userId);
		console.log('[openweight] getSessionUser - user found:', !!user);
		
		if (!user) {
			console.log('[openweight] getSessionUser - user not found in database');
			return null;
		}

		return { id: user.id, username: user.username };
	} catch (error) {
		console.error('[openweight] getSessionUser - error parsing session:', error);
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