import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser, getSessionUser } from '$lib/server/auth';

initDb();

function serializePreferences(row: any) {
	return {
		weightUnit: row.weight_unit,
		measurementUnit: row.measurement_unit
	};
}

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		console.log('[openweight] GET /api/preferences - checking session');
		const user = getSessionUser(cookies);
		if (!user) {
			console.log('[openweight] GET /api/preferences - unauthorized: no valid session');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('[openweight] GET /api/preferences - user:', user.username);
		const prefs = database.preferences.getOrCreate(user.id);
		return json(serializePreferences(prefs));
	} catch (error) {
		console.error('[openweight] Preferences GET error:', error);
		return json({ error: 'Failed to fetch preferences' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
	try {
		console.log('[openweight] PUT /api/preferences - checking session');
		const user = requireUser(cookies);
		console.log('[openweight] PUT /api/preferences - user:', user.username);
		
		const body = await request.json();
		console.log('[openweight] PUT /api/preferences - body:', body);

		const prefs = database.preferences.update(user.id, {
			weightUnit: body.weightUnit,
			measurementUnit: body.measurementUnit
		});

		console.log('[openweight] PUT /api/preferences - success');
		return json(serializePreferences(prefs));
	} catch (error) {
		console.error('[openweight] Preferences PUT error:', error);
		return json({ error: 'Failed to update preferences' }, { status: 400 });
	}
};