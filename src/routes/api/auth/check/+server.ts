import { json, type RequestHandler } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const user = getSessionUser(cookies);
	
	if (!user) {
		return json({ loggedIn: false });
	}

	return json({ 
		loggedIn: true, 
		username: user.username 
	});
};
