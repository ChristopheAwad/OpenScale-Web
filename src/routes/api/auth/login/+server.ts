import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb } from '$lib/server/db';
import { createSession, loginUser } from '$lib/server/auth';

initDb();

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, password } = await request.json();
		
		console.log('[openweight] POST /api/auth/login - attempt for user:', username);

		if (!username || !password) {
			return json({ error: 'Username and password required' }, { status: 400 });
		}

		const user = loginUser(username, password);
		if (!user) {
			console.log('[openweight] POST /api/auth/login - invalid credentials for:', username);
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		console.log('[openweight] POST /api/auth/login - login successful, creating session for:', user.username);
		createSession(user.id, cookies);
		console.log('[openweight] POST /api/auth/login - session cookie set');

		return json({ success: true, userId: user.id });
	} catch (error) {
		console.error('[openweight] Login error:', error);
		return json({ error: 'Login failed' }, { status: 400 });
	}
};