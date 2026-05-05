import { json, type RequestHandler } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ cookies, locals }) => {
	logger.debug('Auth check', { requestId: locals.requestId, hasCookies: !!cookies.get('session') });
	
	const user = getSessionUser(cookies);
	
	if (!user) {
		logger.debug('Auth check - no valid session', { requestId: locals.requestId });
		return json({ loggedIn: false });
	}

	logger.debug('Auth check - authenticated', { requestId: locals.requestId, userId: user.id, username: user.username });
	return json({ 
		loggedIn: true, 
		username: user.username 
	});
};
