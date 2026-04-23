import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { createSession, registerUser } from '$lib/server/auth';

initDb();

export const POST: RequestHandler = async ({ request, cookies }) => {
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
		createSession(user.id, cookies);

		return json({ success: true, userId: user.id });
	} catch (error) {
		console.error('Register error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Registration failed' },
			{ status: 400 }
		);
	}
};