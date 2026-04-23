import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb } from '$lib/server/db';
import { createSession, loginUser } from '$lib/server/auth';

initDb();

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ error: 'Username and password required' }, { status: 400 });
		}

		const user = loginUser(username, password);
		if (!user) {
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		createSession(user.id, cookies);

		return json({ success: true, userId: user.id });
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Login failed' }, { status: 400 });
	}
};