import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser, getSessionUser } from '$lib/server/auth';
import { logger } from '$lib/server/logger';

initDb();

function serializePreferences(row: any) {
	return {
		weightUnit: row.weight_unit,
		measurementUnit: row.measurement_unit
	};
}

export const GET: RequestHandler = async ({ cookies, locals }) => {
	try {
		logger.debug('GET /api/preferences - checking session', { requestId: locals.requestId });
		const user = getSessionUser(cookies);
		if (!user) {
			logger.debug('GET /api/preferences - unauthorized', { requestId: locals.requestId });
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		logger.debug('GET /api/preferences - user', { requestId: locals.requestId, userId: user.id });
		const prefs = database.preferences.getOrCreate(user.id);
		return json(serializePreferences(prefs));
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Preferences GET error', err, { requestId: locals?.requestId });
		return json({ error: 'Failed to fetch preferences' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		logger.debug('PUT /api/preferences - checking session', { requestId: locals.requestId });
		
		const user = requireUser(cookies);
		logger.debug('PUT /api/preferences - authenticated', { requestId: locals.requestId, userId: user.id });
		
		const body = await request.json();

		const weightUnit = body.weightUnit;
		const measurementUnit = body.measurementUnit;

		if (!weightUnit || !['kg', 'lbs'].includes(weightUnit)) {
			return json({ 
				error: 'Failed to update preferences', 
				details: 'Invalid weight unit. Must be "kg" or "lbs"' 
			}, { status: 400 });
		}

		if (!measurementUnit || !['cm', 'in'].includes(measurementUnit)) {
			return json({ 
				error: 'Failed to update preferences', 
				details: 'Invalid measurement unit. Must be "cm" or "in"' 
			}, { status: 400 });
		}

		const prefs = database.preferences.update(user.id, {
			weightUnit,
			measurementUnit
		});

		logger.info('Preferences updated', { requestId: locals.requestId, userId: user.id });
		return json(serializePreferences(prefs));
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Preferences PUT error', err, { requestId: locals?.requestId });
		return json({ error: 'Failed to update preferences', details: err.message }, { status: 400 });
	}
};