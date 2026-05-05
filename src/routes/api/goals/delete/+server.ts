import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';
import { logger } from '$lib/server/logger';

initDb();

export const DELETE: RequestHandler = async ({ url, cookies, locals }) => {
	try {
		logger.debug('DELETE /api/goals/delete - checking session', { requestId: locals.requestId });
		const user = requireUser(cookies);

		const id = url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Goal ID required' }, { status: 400 });
		}

		database.goals.delete(id, user.id);
		logger.info('Goal deleted', { requestId: locals.requestId, userId: user.id, goalId: id });
		return json({ success: true });
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Goals DELETE error', err, { requestId: locals?.requestId });
		return json({ error: 'Failed to delete goal' }, { status: 400 });
	}
};