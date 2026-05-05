import type { Cookies } from '@sveltejs/kit';
import { database } from './db';
import { logger } from './logger';

const SESSION_COOKIE = 'session';
const SESSION_EXPIRY_DAYS = 30;

export function createSession(userId: string, cookies: Cookies, requestId?: string): string {
	const token = crypto.randomUUID();
	const expires = new Date();
	expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS);

	// Store session in database with simple token
	database.sessions.create(userId, token, expires.toISOString());

	// Set a simple token as cookie (no JSON, no special chars)
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: false,      // Explicitly disable Secure flag for HTTP
		sameSite: 'lax'     // Explicitly set sameSite
	});

	logger.debug('Session created', { requestId, userId, token: token.slice(0, 8) + '...' });
	return token;
}

export function getSessionUser(cookies: Cookies, requestId?: string): { id: string; username: string } | null {
	const token = cookies.get(SESSION_COOKIE);
	logger.debug('getSessionUser - checking token', { requestId, hasToken: !!token });

	if (!token) {
		logger.debug('getSessionUser - no session cookie found', { requestId });
		return null;
	}

	try {
		const session = database.sessions.getByToken(token);
		logger.debug('getSessionUser - session lookup', { requestId, hasSession: !!session });

		if (!session) {
			logger.debug('getSessionUser - session not found in database', { requestId });
			return null;
		}

		const expires = new Date(session.expires);
		const isExpired = expires < new Date();
		logger.debug('getSessionUser - session expiry check', { requestId, isExpired });

		if (isExpired) {
			logger.info('getSessionUser - session expired, destroying', { requestId, userId: session.user_id });
			database.sessions.deleteByToken(token);
			destroySession(cookies);
			return null;
		}

		const user = database.users.getById(session.user_id);
		logger.debug('getSessionUser - user lookup', { requestId, hasUser: !!user });

		if (!user) {
			logger.debug('getSessionUser - user not found in database', { requestId, userId: session.user_id });
			return null;
		}

		return { id: user.id, username: user.username };
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('getSessionUser - error', err, { requestId });
		return null;
	}
}

export function requireUser(cookies: Cookies, requestId?: string): { id: string; username: string } {
	const user = getSessionUser(cookies, requestId);
	if (!user) {
		logger.warn('requireUser - unauthorized access attempt', { requestId });
		throw new Error('Unauthorized');
	}
	return user;
}

export function destroySession(cookies: Cookies, requestId?: string): void {
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		logger.debug('destroySession - removing session', { requestId });
		database.sessions.deleteByToken(token);
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function registerUser(username: string, password: string, requestId?: string) {
	const existing = database.users.getByUsername(username);
	if (existing) {
		logger.warn('registerUser - username already taken', { requestId, username });
		throw new Error('Username already taken');
	}
	const user = database.users.create(username, password);
	logger.info('User registered', { requestId, userId: user.id, username });
	return user;
}

export function loginUser(username: string, password: string, requestId?: string) {
	const user = database.users.verifyPassword(username, password);
	if (!user) {
		logger.warn('loginUser - invalid credentials', { requestId, username });
	}
	return user;
}