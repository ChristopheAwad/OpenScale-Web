import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { createSession, registerUser } from '$lib/server/auth';
import { logger } from '$lib/server/logger';

initDb();

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ error: 'Username and password required' }, { status: 400 });
		}

		if (username.length < 3) {
			return json({ error: 'Username must be at least 3 characters' }, { status: 400 });
		}

		if (password.length < 4) {
			return json({ error: 'Password must be at least 4 characters' }, { status: 400 });
		}

		const user = registerUser(username, password);
		logger.info('User registered', { requestId: locals.requestId, userId: user.id, username });
		
		createSession(user.id, cookies);

		return json({ success: true, userId: user.id });
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Registration error', err, { requestId: locals?.requestId });
		return json(
			{ error: err.message },
			{ status: 400 }
		);
	}
};