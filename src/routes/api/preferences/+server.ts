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
		const user = getSessionUser(cookies);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const prefs = database.preferences.getOrCreate(user.id);
		return json(serializePreferences(prefs));
	} catch (error) {
		console.error('Preferences GET error:', error);
		return json({ error: 'Failed to fetch preferences' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
	try {
		const user = requireUser(cookies);
		const body = await request.json();

		const prefs = database.preferences.update(user.id, {
			weightUnit: body.weightUnit,
			measurementUnit: body.measurementUnit
		});

		return json(serializePreferences(prefs));
	} catch (error) {
		console.error('Preferences PUT error:', error);
		return json({ error: 'Failed to update preferences' }, { status: 400 });
	}
};