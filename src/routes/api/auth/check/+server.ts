import { json, type RequestHandler } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	console.log('[openweight] Auth check - cookies present:', !!cookies.get('session'));
	
	const user = getSessionUser(cookies);
	
	if (!user) {
		console.log('[openweight] Auth check - no valid session');
		return json({ loggedIn: false });
	}

	console.log('[openweight] Auth check - user authenticated:', user.username);
	return json({ 
		loggedIn: true, 
		username: user.username 
	});
};
