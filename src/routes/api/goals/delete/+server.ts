import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';

initDb();

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	try {
		const user = requireUser(cookies);
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Goal ID required' }, { status: 400 });
		}

		database.goals.delete(id, user.id);
		return json({ success: true });
	} catch (error) {
		console.error('Goals DELETE error:', error);
		return json({ error: 'Failed to delete goal' }, { status: 400 });
	}
};