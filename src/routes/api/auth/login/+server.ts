import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb } from '$lib/server/db';
import { createSession, loginUser } from '$lib/server/auth';
import { logger } from '$lib/server/logger';

initDb();

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		const { username, password } = await request.json();
		
		logger.debug('Login attempt', { requestId: locals.requestId, username });

		if (!username || !password) {
			return json({ error: 'Username and password required' }, { status: 400 });
		}

		const user = loginUser(username, password);
		if (!user) {
			logger.warn('Invalid credentials', { requestId: locals.requestId, username });
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		logger.info('Login successful', { requestId: locals.requestId, userId: user.id, username: user.username });
		createSession(user.id, cookies);

		return json({ success: true, userId: user.id });
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Login error', err, { requestId: locals?.requestId });
		return json({ error: 'Login failed' }, { status: 400 });
	}
};