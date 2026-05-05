import { json, type RequestHandler } from '@sveltejs/kit';
import { destroySession, getSessionUser } from '$lib/server/auth';
import { logger } from '$lib/server/logger';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	const user = getSessionUser(cookies);
	if (user) {
		logger.info('User logged out', { requestId: locals.requestId, userId: user.id, username: user.username });
	}
	destroySession(cookies);
	return json({ success: true });
};

export const GET: RequestHandler = async ({ cookies, locals }) => {
	const user = getSessionUser(cookies);
	if (user) {
		logger.debug('Logout check - authenticated', { requestId: locals.requestId, userId: user.id });
		return json({ loggedIn: true, username: user.username });
	}
	logger.debug('Logout check - not authenticated', { requestId: locals.requestId });
	return json({ loggedIn: false });
};