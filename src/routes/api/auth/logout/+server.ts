import { json, type RequestHandler } from '@sveltejs/kit';
import { destroySession, getSessionUser } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
	destroySession(cookies);
	return json({ success: true });
};

export const GET: RequestHandler = async ({ cookies }) => {
	const user = getSessionUser(cookies);
	if (user) {
		return json({ loggedIn: true, username: user.username });
	}
	return json({ loggedIn: false });
};