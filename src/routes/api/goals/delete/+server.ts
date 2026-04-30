import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';

initDb();

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	try {
		console.log('[openweight] DELETE /api/goals/delete - checking session');
		const user = requireUser(cookies);
		console.log('[openweight] DELETE /api/goals/delete - user:', user.username);
		
		const id = url.searchParams.get('id');
		console.log('[openweight] DELETE /api/goals/delete - id:', id);

		if (!id) {
			return json({ error: 'Goal ID required' }, { status: 400 });
		}

		database.goals.delete(id, user.id);
		console.log('[openweight] DELETE /api/goals/delete - success');
		return json({ success: true });
	} catch (error) {
		console.error('[openweight] Goals DELETE error:', error);
		return json({ error: 'Failed to delete goal' }, { status: 400 });
	}
};